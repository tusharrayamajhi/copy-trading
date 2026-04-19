use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use pyth_sdk_solana::load_price_feed_from_account_info;

declare_id!("2FApMPHXrWvHpmtbvcKbPciKBqJwFFQ6Rg7eUdhQRapj");

// ─────────────────────────────────────────────
//  Devnet Constants
// ─────────────────────────────────────────────
const USDC_MINT_PUBKEY: &str = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
const WSOL_MINT_PUBKEY: &str = "So11111111111111111111111111111111111111112";
const JUPITER_V6_PROGRAM_ID: &str = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

#[program]
pub mod defi_copy_trade {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        platform_fee_percentage: u16,
        platform_fee_recipient: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        config.admin = ctx.accounts.admin.key();
        config.platform_fee_percentage = platform_fee_percentage;
        config.platform_fee_recipient = platform_fee_recipient;
        config.bump = ctx.bumps.platform_config;
        Ok(())
    }

    pub fn create_trader(ctx: Context<CreateTrader>, commission_percentage: u16) -> Result<()> {
        require!(
            commission_percentage <= 10000,
            ErrorCode::InvalidCommissionPercentage
        );

        let trader_account = &mut ctx.accounts.trader_account;
        trader_account.trader_wallet = ctx.accounts.trader.key();
        trader_account.commission_percentage = commission_percentage;
        trader_account.trader_vault_token_sol = ctx.accounts.trader_vault_token_sol.key();
        trader_account.trader_vault_token_usdc = ctx.accounts.trader_vault_token_usdc.key();
        trader_account.trader_vault_shares_mint = ctx.accounts.trader_vault_shares_mint.key();
        trader_account.current_asset = AssetType::Sol;
        trader_account.total_shares_value_usd = 0;

        // INITIALIZE STATS
        trader_account.total_trades = 0;
        trader_account.lifetime_profit_usd = 0;
        trader_account.lifetime_loss_usd = 0;

        trader_account.bump = ctx.bumps.trader_account;
        trader_account.vault_bump = ctx.bumps.trader_vault;

        Ok(())
    }

    pub fn deposit_funds(ctx: Context<DepositFunds>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::DepositAmountZero);

        let price_feed = load_price_feed_from_account_info(&ctx.accounts.pyth_sol_usd_price_feed)
            .map_err(|_| ErrorCode::InvalidPythPriceFeed)?;
        let current_time = Clock::get()?.unix_timestamp;
        let price_data = price_feed
            .get_price_no_older_than(current_time, 60)
            .ok_or(ErrorCode::PythPriceStale)?;

        let deposit_usd_value =
            calculate_usd_value(amount, price_data.price as u64, price_data.expo)?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.investor_sol_ata.to_account_info(),
                    to: ctx.accounts.trader_vault_token_sol.to_account_info(),
                    authority: ctx.accounts.investor.to_account_info(),
                },
            ),
            amount,
        )?;

        let trader_account = &mut ctx.accounts.trader_account;
        let shares_to_mint = if trader_account.total_shares_value_usd == 0 {
            deposit_usd_value
        } else {
            let total_supply = ctx.accounts.trader_vault_shares_mint.supply;
            (deposit_usd_value as u128)
                .checked_mul(total_supply as u128)
                .ok_or(ErrorCode::Overflow)?
                .checked_div(trader_account.total_shares_value_usd as u128)
                .ok_or(ErrorCode::Underflow)? as u64
        };

        let vault_seeds: &[&[u8]] = &[
            trader_account.trader_wallet.as_ref(),
            b"trader_vault",
            &[trader_account.vault_bump],
        ];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.trader_vault_shares_mint.to_account_info(),
                    to: ctx.accounts.investor_shares_ata.to_account_info(),
                    authority: ctx.accounts.trader_vault.to_account_info(),
                },
                &[vault_seeds],
            ),
            shares_to_mint,
        )?;

        let investor_acc = &mut ctx.accounts.investor_account;
        investor_acc.investor_wallet = ctx.accounts.investor.key();
        investor_acc.linked_trader = trader_account.key();
        investor_acc.initial_deposit_usd_value = deposit_usd_value;
        investor_acc.bump = ctx.bumps.investor_account;

        trader_account.total_shares_value_usd = trader_account
            .total_shares_value_usd
            .checked_add(deposit_usd_value)
            .ok_or(ErrorCode::Overflow)?;

        Ok(())
    }

    pub fn signal_swap(
        ctx: Context<SignalSwap>,
        target_asset: AssetType,
        _amount_in: u64,
        data: Vec<u8>,
    ) -> Result<()> {
        let trader_account = &mut ctx.accounts.trader_account;

        let mut ix_accounts: Vec<AccountMeta> = Vec::new();
        for acc in ctx.remaining_accounts.iter() {
            ix_accounts.push(AccountMeta {
                pubkey: *acc.key,
                is_signer: if *acc.key == ctx.accounts.trader_vault.key() {
                    true
                } else {
                    acc.is_signer
                },
                is_writable: acc.is_writable,
            });
        }

        let jupiter_ix = Instruction {
            program_id: ctx.accounts.jupiter_program.key(),
            accounts: ix_accounts,
            data,
        };

        let seeds: &[&[u8]] = &[
            trader_account.trader_wallet.as_ref(),
            b"trader_vault",
            &[trader_account.vault_bump],
        ];

        invoke_signed(&jupiter_ix, ctx.remaining_accounts, &[seeds])?;

        // UPDATE TRADER STATS
        trader_account.total_trades = trader_account
            .total_trades
            .checked_add(1)
            .ok_or(ErrorCode::Overflow)?;
        trader_account.current_asset = target_asset;

        Ok(())
    }

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>) -> Result<()> {
        let investor_shares = ctx.accounts.investor_shares_ata.amount;
        require!(investor_shares > 0, ErrorCode::NoSharesToWithdraw);

        // 1. Get Prices from Pyth
        let sol_feed = load_price_feed_from_account_info(&ctx.accounts.pyth_sol_usd_price_feed)
            .map_err(|_| ErrorCode::InvalidPythPriceFeed)?;
        let usdc_feed = load_price_feed_from_account_info(&ctx.accounts.pyth_usdc_usd_price_feed)
            .map_err(|_| ErrorCode::InvalidPythPriceFeed)?;
        let time = Clock::get()?.unix_timestamp;
        let sol_p = sol_feed
            .get_price_no_older_than(time, 60)
            .ok_or(ErrorCode::PythPriceStale)?;
        let usdc_p = usdc_feed
            .get_price_no_older_than(time, 60)
            .ok_or(ErrorCode::PythPriceStale)?;

        // 2. Calculate Pool Value
        let sol_usd = calculate_usd_value(
            ctx.accounts.trader_vault_token_sol.amount,
            sol_p.price as u64,
            sol_p.expo,
        )?;
        let usdc_usd = calculate_usd_value(
            ctx.accounts.trader_vault_token_usdc.amount,
            usdc_p.price as u64,
            usdc_p.expo,
        )?;
        let total_pool_usd = sol_usd.checked_add(usdc_usd).ok_or(ErrorCode::Overflow)?;

        // 3. Investor Proportional Equity
        let total_supply = ctx.accounts.trader_vault_shares_mint.supply;
        let investor_equity_usd = (investor_shares as u128)
            .checked_mul(total_pool_usd as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(total_supply as u128)
            .ok_or(ErrorCode::Underflow)? as u64;

        let initial_usd = ctx.accounts.investor_account.initial_deposit_usd_value;

        // 4. Update Trader Performance Stats
        if investor_equity_usd > initial_usd {
            let profit = investor_equity_usd - initial_usd;
            ctx.accounts.trader_account.lifetime_profit_usd += profit;
        } else {
            let loss = initial_usd - investor_equity_usd;
            ctx.accounts.trader_account.lifetime_loss_usd += loss;
        }

        // 5. Calculate Fees (Platform % and Trader %)
        let profit = if investor_equity_usd > initial_usd {
            investor_equity_usd - initial_usd
        } else {
            0
        };
        let plat_fee_usd = (profit as u128
            * ctx.accounts.platform_config.platform_fee_percentage as u128
            / 10000) as u64;
        let trader_fee_usd = (profit.saturating_sub(plat_fee_usd) as u128
            * ctx.accounts.trader_account.commission_percentage as u128
            / 10000) as u64;
        let investor_net_usd = investor_equity_usd
            .saturating_sub(plat_fee_usd)
            .saturating_sub(trader_fee_usd);

        // 6. Execution Seeds for Vault PDA
        let vault_seeds: &[&[u8]] = &[
            ctx.accounts.trader_account.trader_wallet.as_ref(),
            b"trader_vault",
            &[ctx.accounts.trader_account.vault_bump],
        ];

        // 7. Token Conversion & Transfer logic
        let (price, expo, vault_ata) = match ctx.accounts.trader_account.current_asset {
            AssetType::Sol => (
                sol_p.price as u64,
                sol_p.expo,
                &ctx.accounts.trader_vault_token_sol,
            ),
            AssetType::Usdc => (
                usdc_p.price as u64,
                usdc_p.expo,
                &ctx.accounts.trader_vault_token_usdc,
            ),
        };

        // --- A. TRANSFER PLATFORM FEE ---
        if plat_fee_usd > 0 {
            let plat_tokens = usd_to_tokens(plat_fee_usd, price, expo)?;
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: vault_ata.to_account_info(),
                        to: ctx.accounts.platform_fee_recipient_ata.to_account_info(),
                        authority: ctx.accounts.trader_vault.to_account_info(),
                    },
                    &[vault_seeds],
                ),
                plat_tokens,
            )?;
        }

        // --- B. TRANSFER TRADER COMMISSION ---
        if trader_fee_usd > 0 {
            let trader_tokens = usd_to_tokens(trader_fee_usd, price, expo)?;
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: vault_ata.to_account_info(),
                        to: ctx.accounts.trader_fee_recipient_ata.to_account_info(),
                        authority: ctx.accounts.trader_vault.to_account_info(),
                    },
                    &[vault_seeds],
                ),
                trader_tokens,
            )?;
        }

        // --- C. TRANSFER INVESTOR WITHDRAWAL ---
        let investor_tokens = usd_to_tokens(investor_net_usd, price, expo)?;
        let investor_receive_ata = if ctx.accounts.trader_account.current_asset == AssetType::Sol {
            ctx.accounts.investor_receive_sol_ata.to_account_info()
        } else {
            ctx.accounts.investor_receive_usdc_ata.to_account_info()
        };

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: vault_ata.to_account_info(),
                    to: investor_receive_ata,
                    authority: ctx.accounts.trader_vault.to_account_info(),
                },
                &[vault_seeds],
            ),
            investor_tokens,
        )?;

        // 8. Finalize: Burn shares and update internal accounting
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.trader_vault_shares_mint.to_account_info(),
                    from: ctx.accounts.investor_shares_ata.to_account_info(),
                    authority: ctx.accounts.investor.to_account_info(),
                },
            ),
            investor_shares,
        )?;

        ctx.accounts.trader_account.total_shares_value_usd = ctx
            .accounts
            .trader_account
            .total_shares_value_usd
            .saturating_sub(investor_equity_usd);

        Ok(())
    }
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

fn calculate_usd_value(amount: u64, price: u64, expo: i32) -> Result<u64> {
    let decimals_adj = (10u128).pow(expo.unsigned_abs());
    Ok(((amount as u128 * price as u128) / decimals_adj) as u64)
}

fn usd_to_tokens(usd_amount: u64, price: u64, expo: i32) -> Result<u64> {
    let decimals_adj = (10u128).pow(expo.unsigned_abs());
    let token_amount = (usd_amount as u128 * decimals_adj) / price as u128;
    Ok(token_amount as u64)
}

// ─────────────────────────────────────────────
//  Contexts
// ─────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(init, payer = admin, space = 8 + PlatformConfig::INIT_SPACE, seeds = [b"platform_config"], bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTrader<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,
    #[account(init, payer = trader, space = 8 + TraderAccount::INIT_SPACE, seeds = [trader.key().as_ref(), b"trader_account"], bump)]
    pub trader_account: Account<'info, TraderAccount>,
    /// CHECK: PDA
    #[account(seeds = [trader.key().as_ref(), b"trader_vault"], bump)]
    pub trader_vault: AccountInfo<'info>,
    #[account(init, payer = trader, associated_token::mint = sol_mint, associated_token::authority = trader_vault)]
    pub trader_vault_token_sol: Account<'info, TokenAccount>,
    #[account(init, payer = trader, associated_token::mint = usdc_mint, associated_token::authority = trader_vault)]
    pub trader_vault_token_usdc: Account<'info, TokenAccount>,
    #[account(init, payer = trader, mint::decimals = 6, mint::authority = trader_vault, seeds = [trader_account.key().as_ref(), b"shares_mint"], bump)]
    pub trader_vault_shares_mint: Account<'info, Mint>,
    #[account(address = WSOL_MINT_PUBKEY.parse::<Pubkey>().unwrap())]
    pub sol_mint: Account<'info, Mint>,
    #[account(address = USDC_MINT_PUBKEY.parse::<Pubkey>().unwrap())]
    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositFunds<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(init, payer = investor, space = 8 + InvestorAccount::INIT_SPACE, seeds = [investor.key().as_ref(), trader_account.key().as_ref(), b"investor_account"], bump)]
    pub investor_account: Account<'info, InvestorAccount>,
    #[account(mut, seeds = [trader_account.trader_wallet.as_ref(), b"trader_account"], bump = trader_account.bump)]
    pub trader_account: Account<'info, TraderAccount>,
    /// CHECK: Vault PDA
    #[account(seeds = [trader_account.trader_wallet.as_ref(), b"trader_vault"], bump = trader_account.vault_bump)]
    pub trader_vault: AccountInfo<'info>,
    #[account(mut, associated_token::mint = sol_mint, associated_token::authority = investor)]
    pub investor_sol_ata: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = investor, associated_token::mint = trader_vault_shares_mint, associated_token::authority = investor)]
    pub investor_shares_ata: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = sol_mint, associated_token::authority = trader_vault)]
    pub trader_vault_token_sol: Account<'info, TokenAccount>,
    #[account(mut, address = trader_account.trader_vault_shares_mint)]
    pub trader_vault_shares_mint: Account<'info, Mint>,
    /// CHECK: Pyth Price Feed
    pub pyth_sol_usd_price_feed: AccountInfo<'info>,
    #[account(address = WSOL_MINT_PUBKEY.parse::<Pubkey>().unwrap())]
    pub sol_mint: Account<'info, Mint>,
    #[account(address = USDC_MINT_PUBKEY.parse::<Pubkey>().unwrap())]
    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct SignalSwap<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,
    #[account(mut, seeds = [trader.key().as_ref(), b"trader_account"], bump = trader_account.bump)]
    pub trader_account: Account<'info, TraderAccount>,
    /// CHECK: Vault signs CPI
    #[account(seeds = [trader.key().as_ref(), b"trader_vault"], bump = trader_account.vault_bump)]
    pub trader_vault: AccountInfo<'info>,
    /// CHECK: Jupiter Program
    #[account(address = JUPITER_V6_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub jupiter_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut, close = investor, seeds = [investor.key().as_ref(), trader_account.key().as_ref(), b"investor_account"], bump = investor_account.bump)]
    pub investor_account: Account<'info, InvestorAccount>,
    #[account(mut, seeds = [trader_account.trader_wallet.as_ref(), b"trader_account"], bump = trader_account.bump)]
    pub trader_account: Account<'info, TraderAccount>,
    /// CHECK: Vault PDA
    #[account(seeds = [trader_account.trader_wallet.as_ref(), b"trader_vault"], bump = trader_account.vault_bump)]
    pub trader_vault: AccountInfo<'info>,
    #[account(mut, address = trader_account.trader_vault_shares_mint)]
    pub trader_vault_shares_mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = trader_vault_shares_mint, associated_token::authority = investor)]
    pub investor_shares_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub trader_vault_token_sol: Account<'info, TokenAccount>,
    #[account(mut)]
    pub trader_vault_token_usdc: Account<'info, TokenAccount>,
    #[account(mut)]
    pub platform_fee_recipient_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub trader_fee_recipient_ata: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = investor, associated_token::mint = sol_mint, associated_token::authority = investor)]
    pub investor_receive_sol_ata: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = investor, associated_token::mint = usdc_mint, associated_token::authority = investor)]
    pub investor_receive_usdc_ata: Account<'info, TokenAccount>,
    #[account(seeds = [b"platform_config"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    /// CHECK: Pyth
    pub pyth_sol_usd_price_feed: AccountInfo<'info>,
    /// CHECK: Pyth
    pub pyth_usdc_usd_price_feed: AccountInfo<'info>,
    #[account(address = WSOL_MINT_PUBKEY.parse::<Pubkey>().unwrap())]
    pub sol_mint: Account<'info, Mint>,
    #[account(address = USDC_MINT_PUBKEY.parse::<Pubkey>().unwrap())]
    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub admin: Pubkey,
    pub platform_fee_percentage: u16,
    pub platform_fee_recipient: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct TraderAccount {
    pub trader_wallet: Pubkey,
    pub commission_percentage: u16,
    pub trader_vault_token_sol: Pubkey,
    pub trader_vault_token_usdc: Pubkey,
    pub trader_vault_shares_mint: Pubkey,
    pub current_asset: AssetType,
    pub total_shares_value_usd: u64,

    // TRADER STATISTICS FIELDS
    pub total_trades: u64,
    pub lifetime_profit_usd: u64,
    pub lifetime_loss_usd: u64,

    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct InvestorAccount {
    pub investor_wallet: Pubkey,
    pub linked_trader: Pubkey,
    pub initial_deposit_usd_value: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum AssetType {
    Sol,
    Usdc,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid Commission")]
    InvalidCommissionPercentage,
    #[msg("Amount Zero")]
    DepositAmountZero,
    #[msg("Pyth Stale")]
    PythPriceStale,
    #[msg("Overflow")]
    Overflow,
    #[msg("Underflow")]
    Underflow,
    #[msg("Invalid Pyth Account")]
    InvalidPythPriceFeed,
    #[msg("No Shares")]
    NoSharesToWithdraw,
}
