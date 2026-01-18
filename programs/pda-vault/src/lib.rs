use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod pda_vault {
    use super::*;

    /// Initialize a new vault for the user
    /// TODO: Implement vault initialization
    /// - Create a PDA using user's pubkey as seed
    /// - Store the bump and owner in vault account
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        // TODO: Implement this function
        Ok(())
    }

    /// Deposit SOL into the vault
    /// TODO: Implement deposit functionality
    /// - Transfer SOL from user to vault PDA
    /// - Update vault balance tracking
    pub fn deposit(_ctx: Context<Deposit>, _amount: u64) -> Result<()> {
        // TODO: Implement this function
        Ok(())
    }

    /// Withdraw SOL from the vault
    /// TODO: Implement withdrawal functionality
    /// - Verify the caller is the vault owner
    /// - Transfer SOL from vault PDA to user
    pub fn withdraw(_ctx: Context<Withdraw>, _amount: u64) -> Result<()> {
        // TODO: Implement this function
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: Define accounts for initialization
    // Hints:
    // - #[account(mut)] for the payer
    // - #[account(init, pda, ...)] for the vault
    // - system_program for creating accounts
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // TODO: Define accounts for deposit
    // Hints:
    // - User needs to sign and pay
    // - Vault PDA receives the deposit
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    // TODO: Define accounts for withdrawal
    // Hints:
    // - Only vault owner can withdraw
    // - Vault PDA sends lamports
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// TODO: Define the Vault account structure
// #[account]
// pub struct Vault {
//     pub owner: Pubkey,
//     pub bump: u8,
// }

#[error_code]
pub enum VaultError {
    #[msg("Unauthorized: Only the vault owner can perform this action")]
    Unauthorized,
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
}
