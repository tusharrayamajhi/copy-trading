import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Find the trader and their vault
    const traderUser = await prisma.user.findUnique({
      where: { walletAddress: address },
      include: { traderProfile: { include: { vaults: true } } },
    });

    const vault = traderUser?.traderProfile?.vaults[0];

    if (!vault) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    }

    // Fetch all successful transactions for this vault, ordered by time
    const transactions = await prisma.transaction.findMany({
      where: { 
        vaultId: vault.id,
      },
      orderBy: { timestamp: "asc" },
    });

    let cumulativePnl = 0;
    const history = transactions.map((tx) => {
      // We add the PnL of this transaction to the running total
      // Note: pnlUsd is 0 for deposits/withdrawals, which is correct as they don't change performance %
      cumulativePnl += tx.pnlUsd || 0;
      
      return {
        time: Math.floor(tx.timestamp.getTime() / 1000),
        value: cumulativePnl,
      };
    });

    // If no transactions yet, return an empty starting point
    if (history.length === 0) {
      return NextResponse.json([{ time: Math.floor(Date.now() / 1000), value: 0 }]);
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error("PnL History API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
