use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};
use std::str::FromStr;

declare_id!("AGNFafmkeBehcYJvKBzG1VYRzXEbfHeLYmKP7atSGB57");

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
        config.platform_fee_recipient = admin_pubkey;
        config.bump = ctx.bumps.platform_config;
        Ok(())
    }

    pub fn create_trader(ctx: Context<CreateTrader>, commission_percentage: u16) -> Result<()> {
        require!(commission_percentage <= 10000, ErrorCode::InvalidCommission);

        let trader_account = &mut ctx.accounts.trader_account;
        trader_account.trader_wallet = ctx.accounts.trader.key();
        trader_account.commission_percentage = commission_percentage;
        trader_account.current_asset = AssetType::Sol;
        trader_account.total_shares_value_usd = 0;
        trader_account.total_trades = 0;
        trader_account.lifetime_profit_usd = 0;
        trader_account.lifetime_loss_usd = 0;
        trader_account.bump = ctx.bumps.trader_account;
        trader_account.vault_bump = ctx.bumps.trader_vault;

        trader_account.trader_vault_token_sol = ctx.accounts.trader_vault_token_sol.key();
        trader_account.trader_vault_token_usdc = ctx.accounts.trader_vault_token_usdc.key();
        trader_account.trader_vault_shares_mint = ctx.accounts.trader_vault_shares_mint.key();

        Ok(())
    }

    pub fn deposit_funds(ctx: Context<DepositFunds>, amount: u64, price: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::AmountZero);
        let deposit_usd_value = (amount as u128 * price as u128 / 1_000_000_000) as u64;

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
                MintTo {
                    mint: ctx.accounts.trader_vault_shares_mint.to_account_info(),
                    to: ctx.accounts.investor_shares_ata.to_account_info(),
                    authority: ctx.accounts.trader_vault.to_account_info(),
                },
                &[vault_seeds],
            ),
            shares_to_mint,
        )?;

        ctx.accounts.investor_account.initial_deposit_usd_value = deposit_usd_value;
        trader_account.total_shares_value_usd += deposit_usd_value;

        Ok(())
    }

    pub fn signal_swap(
        ctx: Context<SignalSwap>,
        target_asset: AssetType,
        amount_in: u64,
        price: u64,
    ) -> Result<()> {
        require!(price > 0, ErrorCode::InvalidPrice);
        let trader_account = &mut ctx.accounts.trader_account;
        let vault_seeds: &[&[u8]] = &[
            trader_account.trader_wallet.as_ref(),
            b"trader_vault",
            &[trader_account.vault_bump],
        ];
        // ✅ FIXED SEED TO v2
        let config_seeds: &[&[u8]] = &[b"platform_config_v2", &[ctx.accounts.platform_config.bump]];

        if target_asset == AssetType::Usdc {
            let usdc_out = (amount_in as u128 * price as u128 / 1_000_000_000) as u64;
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
            let sol_out = (amount_in as u128 * 1_000_000_000 / price as u128) as u64;
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

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, current_price: u64) -> Result<()> {
        let investor_shares = ctx.accounts.investor_shares_ata.amount;
        require!(investor_shares > 0, ErrorCode::AmountZero);
        
        let total_supply = ctx.accounts.trader_vault_shares_mint.supply;
        require!(total_supply > 0, ErrorCode::VaultEmpty);

        let vault_sol = ctx.accounts.trader_vault_token_sol.amount;
        let vault_usdc = ctx.accounts.trader_vault_token_usdc.amount;
        
        // Ensure price is not zero to avoid division by zero later
        require!(current_price > 0, ErrorCode::InvalidPrice);

        let total_pool_usd = ((vault_sol as u128 * current_price as u128 / 1_000_000_000)
            + vault_usdc as u128) as u64;

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

        let amount_to_send = if ctx.accounts.trader_account.current_asset == AssetType::Sol {
            (investor_equity_usd as u128 * 1_000_000_000 / current_price as u128) as u64
        } else {
            investor_equity_usd
        };

        let vault_ata = if ctx.accounts.trader_account.current_asset == AssetType::Sol {
            ctx.accounts.trader_vault_token_sol.to_account_info()
        } else {
            ctx.accounts.trader_vault_token_usdc.to_account_info()
        };

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: vault_ata,
                    to: ctx.accounts.investor_receive_ata.to_account_info(),
                    authority: ctx.accounts.trader_vault.to_account_info(),
                },
                &[vault_seeds],
            ),
            amount_to_send,
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

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init, 
        payer = admin, 
        space = 8 + PlatformConfig::INIT_SPACE, 
        seeds = [b"platform_config_v2"], // ✅ FIXED SEED TO v2
        bump
    )]
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
    pub investor_account: Box<Account<'info, InvestorAccount>>,
    #[account(mut)]
    pub trader_account: Box<Account<'info, TraderAccount>>,
    /// CHECK: Vault PDA
    #[account(seeds = [trader_account.trader_wallet.as_ref(), b"trader_vault"], bump = trader_account.vault_bump)]
    pub trader_vault: AccountInfo<'info>,
    #[account(mut)]
    pub investor_sol_ata: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, payer = investor, associated_token::mint = trader_vault_shares_mint, associated_token::authority = investor)]
    pub investor_shares_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub trader_vault_token_sol: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub trader_vault_shares_mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SignalSwap<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,
    #[account(mut)]
    pub trader_account: Box<Account<'info, TraderAccount>>,
    /// CHECK: Vault PDA
    #[account(seeds = [trader.key().as_ref(), b"trader_vault"], bump = trader_account.vault_bump)]
    pub trader_vault: AccountInfo<'info>,
    #[account(mut)]
    pub trader_vault_token_sol: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub trader_vault_token_usdc: Box<Account<'info, TokenAccount>>,
    #[account(seeds = [b"platform_config_v2"], bump = platform_config.bump)]
    // ✅ FIXED SEED TO v2
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    #[account(mut)]
    pub platform_bank_sol: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub platform_bank_usdc: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut, close = investor, seeds = [investor.key().as_ref(), trader_account.key().as_ref(), b"investor_account"], bump)]
    pub investor_account: Box<Account<'info, InvestorAccount>>,
    #[account(mut)]
    pub trader_account: Box<Account<'info, TraderAccount>>,
    /// CHECK: Vault PDA
    #[account(seeds = [trader_account.trader_wallet.as_ref(), b"trader_vault"], bump = trader_account.vault_bump)]
    pub trader_vault: AccountInfo<'info>,
    #[account(mut)]
    pub investor_shares_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub trader_vault_shares_mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub trader_vault_token_sol: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub trader_vault_token_usdc: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub investor_receive_ata: Box<Account<'info, TokenAccount>>,
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
    pub current_asset: AssetType,
    pub total_shares_value_usd: u64,
    pub total_trades: u64,
    pub lifetime_profit_usd: u64,
    pub lifetime_loss_usd: u64,
    pub bump: u8,
    pub vault_bump: u8,
    pub trader_vault_token_sol: Pubkey,
    pub trader_vault_token_usdc: Pubkey,
    pub trader_vault_shares_mint: Pubkey,
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
    InvalidCommission,
    #[msg("Amount Zero")]
    AmountZero,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Vault is empty")]
    VaultEmpty,
    #[msg("Invalid price provided")]
    InvalidPrice,
}
