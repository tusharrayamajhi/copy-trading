use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, Mint, Token, TokenAccount, Transfer},
};
use pyth_sdk_solana::load_price_feed_from_account_info;
use std::str::FromStr;

declare_id!("oMCWAxL94wFKVXRAW7GfQDjCcTV9c4aTX1JSputfxg8");

// ─────────────────────────────────────────────
//  HARDCODED DEFAULTS
// ─────────────────────────────────────────────
const ADMIN_WALLET: &str = "AT5cVfYLu9oBa1xu5FNPw6eQuiNZ99Jj1vjxcjRmpePH";
const WSOL_MINT: &str = "So11111111111111111111111111111111111111112";
const USDC_MINT: &str = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

#[program]
pub mod defi_copy_trade {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        platform_fee_percentage: u16,
    ) -> Result<()> {
        let admin_pubkey = Pubkey::from_str(ADMIN_WALLET).unwrap();
        require_keys_eq!(
            ctx.accounts.admin.key(),
            admin_pubkey,
            ErrorCode::Unauthorized
        );

        let config = &mut ctx.accounts.platform_config;
        config.admin = admin_pubkey;
        config.platform_fee_percentage = platform_fee_percentage;
        config.platform_fee_recipient = admin_pubkey; // Fees go to your wallet
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
        trader_account.total_trades = 0;
        trader_account.lifetime_profit_usd = 0;
        trader_account.lifetime_loss_usd = 0;
        trader_account.bump = ctx.bumps.trader_account;
        trader_account.vault_bump = ctx.bumps.trader_vault;

        Ok(())
    }

    pub fn deposit_funds(ctx: Context<DepositFunds>, amount: u64) -> Result<()> {
        let price_feed = load_price_feed_from_account_info(&ctx.accounts.pyth_sol_usd_price_feed)
            .map_err(|_| ErrorCode::InvalidPythPriceFeed)?;

        let price_data = price_feed.get_price_unchecked();
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
            (deposit_usd_value as u128 * total_supply as u128
                / trader_account.total_shares_value_usd as u128) as u64
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
        investor_acc.initial_deposit_usd_value = deposit_usd_value;
        trader_account.total_shares_value_usd += deposit_usd_value;

        Ok(())
    }

    pub fn signal_swap(
        ctx: Context<SignalSwap>,
        target_asset: AssetType,
        amount_in: u64,
    ) -> Result<()> {
        let trader_account = &mut ctx.accounts.trader_account;
        let price_feed =
            load_price_feed_from_account_info(&ctx.accounts.pyth_sol_usd_price_feed).unwrap();
        let price_data = price_feed.get_price_unchecked();

        let vault_seeds: &[&[u8]] = &[
            trader_account.trader_wallet.as_ref(),
            b"trader_vault",
            &[trader_account.vault_bump],
        ];

        let config_seeds: &[&[u8]] = &[b"platform_config", &[ctx.accounts.platform_config.bump]];

        if target_asset == AssetType::Usdc {
            let usdc_out =
                calculate_usd_value(amount_in, price_data.price as u64, price_data.expo)?;
            // SOL: Vault -> Bank
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.trader_vault_token_sol.to_account_info(),
                        to: ctx.accounts.platform_bank_sol.to_account_info(),
                        authority: ctx.accounts.trader_vault.to_account_info(),
                    },
                    &[vault_seeds],
                ),
                amount_in,
            )?;
            // USDC: Bank -> Vault
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.platform_bank_usdc.to_account_info(),
                        to: ctx.accounts.trader_vault_token_usdc.to_account_info(),
                        authority: ctx.accounts.platform_config.to_account_info(),
                    },
                    &[config_seeds],
                ),
                usdc_out,
            )?;
        } else {
            let sol_out = usd_to_tokens(amount_in, price_data.price as u64, price_data.expo)?;
            // USDC: Vault -> Bank
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.trader_vault_token_usdc.to_account_info(),
                        to: ctx.accounts.platform_bank_usdc.to_account_info(),
                        authority: ctx.accounts.trader_vault.to_account_info(),
                    },
                    &[vault_seeds],
                ),
                amount_in,
            )?;
            // SOL: Bank -> Vault
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.platform_bank_sol.to_account_info(),
                        to: ctx.accounts.trader_vault_token_sol.to_account_info(),
                        authority: ctx.accounts.platform_config.to_account_info(),
                    },
                    &[config_seeds],
                ),
                sol_out,
            )?;
        }

        trader_account.total_trades += 1;
        trader_account.current_asset = target_asset;
        Ok(())
    }

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>) -> Result<()> {
        let investor_shares = ctx.accounts.investor_shares_ata.amount;
        let sol_feed =
            load_price_feed_from_account_info(&ctx.accounts.pyth_sol_usd_price_feed).unwrap();
        let usdc_feed =
            load_price_feed_from_account_info(&ctx.accounts.pyth_usdc_usd_price_feed).unwrap();
        let sol_p = sol_feed.get_price_unchecked();
        let usdc_p = usdc_feed.get_price_unchecked();

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
        let total_pool_usd = sol_usd + usdc_usd;

        let total_supply = ctx.accounts.trader_vault_shares_mint.supply;
        let investor_equity_usd =
            (investor_shares as u128 * total_pool_usd as u128 / total_supply as u128) as u64;
        let initial_usd = ctx.accounts.investor_account.initial_deposit_usd_value;

        if investor_equity_usd > initial_usd {
            ctx.accounts.trader_account.lifetime_profit_usd += investor_equity_usd - initial_usd;
        } else {
            ctx.accounts.trader_account.lifetime_loss_usd += initial_usd - investor_equity_usd;
        }

        let vault_seeds: &[&[u8]] = &[
            ctx.accounts.trader_account.trader_wallet.as_ref(),
            b"trader_vault",
            &[ctx.accounts.trader_account.vault_bump],
        ];

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

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: vault_ata.to_account_info(),
                    to: ctx.accounts.investor_receive_ata.to_account_info(),
                    authority: ctx.accounts.trader_vault.to_account_info(),
                },
                &[vault_seeds],
            ),
            usd_to_tokens(investor_equity_usd, price, expo)?,
        )?;
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
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
//  HELPERS
// ─────────────────────────────────────────────
fn calculate_usd_value(amount: u64, price: u64, expo: i32) -> Result<u64> {
    let decimals_adj = (10u128).pow(expo.unsigned_abs());
    Ok(((amount as u128 * price as u128) / decimals_adj) as u64)
}

fn usd_to_tokens(usd_amount: u64, price: u64, expo: i32) -> Result<u64> {
    let decimals_adj = (10u128).pow(expo.unsigned_abs());
    Ok(((usd_amount as u128 * decimals_adj) / price as u128) as u64)
}

// ─────────────────────────────────────────────
//  CONTEXTS
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
    /// CHECK: Vault PDA
    #[account(seeds = [trader.key().as_ref(), b"trader_vault"], bump)]
    pub trader_vault: AccountInfo<'info>,
    #[account(init, payer = trader, associated_token::mint = sol_mint, associated_token::authority = trader_vault)]
    pub trader_vault_token_sol: Account<'info, TokenAccount>,
    #[account(init, payer = trader, associated_token::mint = usdc_mint, associated_token::authority = trader_vault)]
    pub trader_vault_token_usdc: Account<'info, TokenAccount>,
    #[account(init, payer = trader, mint::decimals = 6, mint::authority = trader_vault, seeds = [trader_account.key().as_ref(), b"shares_mint"], bump)]
    pub trader_vault_shares_mint: Account<'info, Mint>,
    #[account(address = WSOL_MINT.parse::<Pubkey>().unwrap())]
    pub sol_mint: Account<'info, Mint>,
    #[account(address = USDC_MINT.parse::<Pubkey>().unwrap())]
    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositFunds<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(init, payer = investor, space = 8 + InvestorAccount::INIT_SPACE, seeds = [investor.key().as_ref(), trader_account.key().as_ref(), b"investor_account"], bump)]
    pub investor_account: Account<'info, InvestorAccount>,
    #[account(mut)]
    pub trader_account: Account<'info, TraderAccount>,
    /// CHECK: PDA
    #[account(seeds = [trader_account.trader_wallet.as_ref(), b"trader_vault"], bump = trader_account.vault_bump)]
    pub trader_vault: AccountInfo<'info>,
    #[account(mut)]
    pub investor_sol_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub investor_shares_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub trader_vault_token_sol: Account<'info, TokenAccount>,
    #[account(mut)]
    pub trader_vault_shares_mint: Account<'info, Mint>,
    /// CHECK: Pyth
    pub pyth_sol_usd_price_feed: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SignalSwap<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,
    #[account(mut)]
    pub trader_account: Account<'info, TraderAccount>,
    /// CHECK: Vault PDA
    #[account(seeds = [trader.key().as_ref(), b"trader_vault"], bump = trader_account.vault_bump)]
    pub trader_vault: AccountInfo<'info>,
    #[account(mut)]
    pub trader_vault_token_sol: Account<'info, TokenAccount>,
    #[account(mut)]
    pub trader_vault_token_usdc: Account<'info, TokenAccount>,
    #[account(seeds = [b"platform_config"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub platform_bank_sol: Account<'info, TokenAccount>,
    #[account(mut)]
    pub platform_bank_usdc: Account<'info, TokenAccount>,
    /// CHECK: Pyth
    pub pyth_sol_usd_price_feed: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut, close = investor)]
    pub investor_account: Account<'info, InvestorAccount>,
    #[account(mut)]
    pub trader_account: Account<'info, TraderAccount>,
    /// CHECK: Vault PDA
    #[account(seeds = [trader_account.trader_wallet.as_ref(), b"trader_vault"], bump = trader_account.vault_bump)]
    pub trader_vault: AccountInfo<'info>,
    #[account(mut)]
    pub investor_shares_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub trader_vault_shares_mint: Account<'info, Mint>,
    #[account(mut)]
    pub trader_vault_token_sol: Account<'info, TokenAccount>,
    #[account(mut)]
    pub trader_vault_token_usdc: Account<'info, TokenAccount>,
    #[account(mut)]
    pub investor_receive_ata: Account<'info, TokenAccount>,
    /// CHECK: Pyth
    pub pyth_sol_usd_price_feed: AccountInfo<'info>,
    /// CHECK: Pyth
    pub pyth_usdc_usd_price_feed: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
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
    pub total_trades: u64,
    pub lifetime_profit_usd: u64,
    pub lifetime_loss_usd: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct InvestorAccount {
    pub initial_deposit_usd_value: u64,
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
    #[msg("Unauthorized")]
    Unauthorized,
}
