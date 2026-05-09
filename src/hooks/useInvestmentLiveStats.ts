import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "../lib/program";
import { getPlatformConfigPDA, getSharesMintPDA, getTraderVaultPDA } from "../lib/pdas";
import { getATA } from "../lib/ata";
import { WSOL_MINT, USDC_MINT } from "../lib/constants";

export type InvestmentLiveStats = {
    currentValue: number; // Net Value (after all fees)
    grossValue: number;   // Total value of ownership before fees
    pnl: number;
    pnlPercent: number;
    shares: number;
    ownershipPercentage: number;
    // For Breakdown UI
    vaultSol: number;
    vaultUsdc: number;
    totalShares: number;
    initialValue: number;
    traderCommissionUsd: number;
    platformFeeUsd: number;
};

export function useInvestmentLiveStats(investorWallet: PublicKey | null, investments: any[], traders: any[], solPrice: number) {
    const { connection } = useConnection();
    const program = useProgram();
    const [stats, setStats] = useState<Record<string, InvestmentLiveStats>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!connection || !program || !investorWallet || investments.length === 0 || !solPrice) {
            return;
        }

        const fetchLiveStats = async () => {
            if (document.hidden) return;

            try {
                setLoading(true);
                const { AccountLayout, MintLayout } = await import("@solana/spl-token");
                const newStats: Record<string, InvestmentLiveStats> = {};

                // Collect all accounts we need to fetch
                const accountRequests: { pubkey: PublicKey, type: 'token' | 'mint' | 'trader' | 'investor' | 'platform', invKey: string, meta: any }[] = [];

                for (const inv of investments) {
                    const trader = traders.find(t => t.publicKey === inv.linkedTraderPubkey);
                    if (!trader) continue;

                    const traderAccountPubkey = new PublicKey(trader.publicKey);
                    const investorAccountPubkey = new PublicKey(inv.publicKey);

                    // Re-add missing derivations
                    const traderWallet = new PublicKey(trader.account.traderWallet);
                    const [traderVault] = getTraderVaultPDA(traderWallet);
                    const [sharesMint] = getSharesMintPDA(traderAccountPubkey);
                    const vaultSolAta = getATA(WSOL_MINT, traderVault, true);
                    const vaultUsdcAta = getATA(USDC_MINT, traderVault, true);
                    const investorSharesAta = getATA(sharesMint, investorWallet);

                    const [platformConfigPDA] = getPlatformConfigPDA();
                    accountRequests.push(
                        { pubkey: vaultSolAta, type: 'token', invKey: inv.publicKey, meta: 'vaultSol' },
                        { pubkey: vaultUsdcAta, type: 'token', invKey: inv.publicKey, meta: 'vaultUsdc' },
                        { pubkey: sharesMint, type: 'mint', invKey: inv.publicKey, meta: 'sharesMint' },
                        { pubkey: investorSharesAta, type: 'token', invKey: inv.publicKey, meta: 'investorShares' },
                        { pubkey: traderAccountPubkey, type: 'trader', invKey: inv.publicKey, meta: 'traderAcc' },
                        { pubkey: investorAccountPubkey, type: 'investor', invKey: inv.publicKey, meta: 'investorAcc' },
                        { pubkey: platformConfigPDA, type: 'platform', invKey: inv.publicKey, meta: 'platformConfig' }
                    );
                }

                if (accountRequests.length === 0) return;

                // Batch fetch all accounts
                const accountsInfo = await connection.getMultipleAccountsInfo(accountRequests.map(r => r.pubkey));

                // Process results
                const resultsByInv: Record<string, any> = {};

                accountRequests.forEach((req, idx) => {
                    const info = accountsInfo[idx];
                    if (!resultsByInv[req.invKey]) resultsByInv[req.invKey] = {};

                    if (!info) {
                        return;
                    }

                    try {
                        if (req.type === 'token') {
                            const decoded = AccountLayout.decode(info.data);
                            resultsByInv[req.invKey][req.meta] = Number(decoded.amount.toString());
                        } else if (req.type === 'mint') {
                            const decoded = MintLayout.decode(info.data);
                            resultsByInv[req.invKey][req.meta] = Number(decoded.supply.toString());
                        } else if (req.type === 'trader') {
                            const decoded = (program.account.traderAccount as any).coder.accounts.decode("TraderAccount", info.data);
                            resultsByInv[req.invKey][req.meta] = decoded;
                        } else if (req.type === 'investor') {
                            const decoded = (program.account.investorAccount as any).coder.accounts.decode("InvestorAccount", info.data);
                            resultsByInv[req.invKey][req.meta] = decoded;
                        } else if (req.type === 'platform') {
                            const decoded = (program.account.platformConfig as any).coder.accounts.decode("PlatformConfig", info.data);
                            resultsByInv[req.invKey][req.meta] = decoded;
                        }
                    } catch (e) {
                        console.error(`[LiveStats] Decoding error for ${req.type}:`, e);
                    }
                });

                // Final calculation
                for (const inv of investments) {
                    const res = resultsByInv[inv.publicKey];
                    if (!res) continue;

                    const traderData = res.traderAcc;
                    const investorData = res.investorAcc;
                    const platformData = res.platformConfig;

                    if (!traderData || !investorData) continue;

                    const vaultSol = (Number(res.vaultSol) || 0) / 1e9;
                    const vaultUsdc = (Number(res.vaultUsdc) || 0) / 1e6;
                    const totalShares = Number(res.sharesMint) || 0;
                    const myShares = Number(res.investorShares) || 0;

                    const effectivePrice = solPrice || 0;
                    const totalVaultValue = (vaultSol * effectivePrice) + vaultUsdc;

                    let myGrossValue = 0;
                    if (totalShares > 0 && myShares > 0) {
                        myGrossValue = (myShares / totalShares) * totalVaultValue;
                    }

                    const initialValue = investorData.initialDepositUsdValue.toNumber() / 1e6;

                    let traderCommissionUsd = 0;
                    let platformFeeUsd = 0;

                    if (myGrossValue > initialValue) {
                        const grossProfit = myGrossValue - initialValue;

                        // Platform Fee (calculated first from profit)
                        const platformBps = platformData?.platformFeePercentage || 0;
                        platformFeeUsd = (grossProfit * platformBps) / 10000;

                        // Trader Commission (calculated from remaining profit)
                        const remainingProfit = grossProfit - platformFeeUsd;
                        const traderBps = traderData.commissionPercentage || 0;
                        traderCommissionUsd = (remainingProfit * traderBps) / 10000;
                    }

                    const myNetValue = myGrossValue - platformFeeUsd - traderCommissionUsd;
                    const pnl = myNetValue - initialValue;
                    const pnlPercent = initialValue > 0 ? (pnl / initialValue) * 100 : 0;

                    newStats[inv.publicKey] = {
                        currentValue: myNetValue,
                        grossValue: myGrossValue,
                        pnl,
                        pnlPercent,
                        shares: myShares / 1e6,
                        ownershipPercentage: totalShares > 0 ? (myShares / totalShares) * 100 : 0,
                        vaultSol,
                        vaultUsdc,
                        totalShares: totalShares / 1e6,
                        initialValue,
                        traderCommissionUsd,
                        platformFeeUsd
                    };
                }

                setStats(newStats as any);
            } catch (error) {
                console.error("Failed to fetch live investment stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLiveStats();
        const interval = setInterval(fetchLiveStats, 10000);
        return () => clearInterval(interval);
    }, [connection, program, investorWallet?.toBase58(), JSON.stringify(investments.map(i => i.publicKey)), traders.length, solPrice]);

    return { stats, loading };
}
