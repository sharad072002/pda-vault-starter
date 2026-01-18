use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod pda_vault {
    use super::*;

    /// Initialize a new vault for the user
    /// Creates a PDA using user's pubkey as seed and stores metadata
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.user.key();
        vault.bump = ctx.bumps.vault;
        
        msg!("Vault initialized for owner: {}", vault.owner);
        msg!("Vault PDA bump: {}", vault.bump);
        
        Ok(())
    }

    /// Deposit SOL into the vault
    /// Transfers SOL from user to the vault PDA
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // Transfer SOL from user to vault PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        
        transfer(cpi_context, amount)?;
        
        msg!("Deposited {} lamports to vault", amount);
        
        Ok(())
    }

    /// Withdraw SOL from the vault
    /// Only the vault owner can withdraw funds
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &ctx.accounts.vault;
        
        // Check if vault has sufficient funds
        // We need to keep the vault account rent-exempt, so we calculate minimum balance
        let rent = Rent::get()?;
        let min_balance = rent.minimum_balance(Vault::INIT_SPACE + 8); // 8 bytes for discriminator
        let available_balance = vault.to_account_info().lamports()
            .checked_sub(min_balance)
            .ok_or(VaultError::InsufficientFunds)?;
        
        require!(amount <= available_balance, VaultError::InsufficientFunds);
        
        // Transfer lamports from vault PDA to user
        // Since vault is a PDA, we need to directly modify lamports
        let vault_account_info = vault.to_account_info();
        let user_account_info = ctx.accounts.user.to_account_info();
        
        **vault_account_info.try_borrow_mut_lamports()? -= amount;
        **user_account_info.try_borrow_mut_lamports()? += amount;
        
        msg!("Withdrew {} lamports from vault", amount);
        
        Ok(())
    }

    /// Close the vault and return all lamports to owner
    pub fn close(_ctx: Context<Close>) -> Result<()> {
        msg!("Vault closed, all funds returned to owner");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump,
        constraint = vault.owner == user.key() @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump,
        constraint = vault.owner == user.key() @ VaultError::Unauthorized,
        close = user
    )]
    pub vault: Account<'info, Vault>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    /// The owner of this vault (who can withdraw)
    pub owner: Pubkey,
    /// The bump seed used for PDA derivation
    pub bump: u8,
}

#[error_code]
pub enum VaultError {
    #[msg("Unauthorized: Only the vault owner can perform this action")]
    Unauthorized,
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
}
