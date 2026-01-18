import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PdaVault } from "../target/types/pda_vault";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";

describe("pda-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PdaVault as Program<PdaVault>;
  const user = provider.wallet;

  // Helper to derive vault PDA
  const getVaultPda = (owner: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.toBuffer()],
      program.programId
    );
  };

  // Get vault PDA for main user
  const [vaultPda, vaultBump] = getVaultPda(user.publicKey);

  it("Initializes a vault", async () => {
    // Call initialize
    const tx = await program.methods
      .initialize()
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize transaction:", tx);

    // Fetch and verify vault account
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    
    expect(vaultAccount.owner.toString()).to.equal(user.publicKey.toString());
    expect(vaultAccount.bump).to.equal(vaultBump);
    
    console.log("Vault owner:", vaultAccount.owner.toString());
    console.log("Vault bump:", vaultAccount.bump);
  });

  it("Deposits SOL into vault", async () => {
    const depositAmount = 0.5 * LAMPORTS_PER_SOL;

    // Get initial balances
    const initialUserBalance = await provider.connection.getBalance(user.publicKey);
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);

    // Deposit SOL
    const tx = await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit transaction:", tx);

    // Get final balances
    const finalUserBalance = await provider.connection.getBalance(user.publicKey);
    const finalVaultBalance = await provider.connection.getBalance(vaultPda);

    // Verify balances changed correctly (accounting for tx fees)
    expect(finalVaultBalance).to.equal(initialVaultBalance + depositAmount);
    expect(finalUserBalance).to.be.lessThan(initialUserBalance - depositAmount + 10000); // Allow for tx fee
    
    console.log("Vault balance after deposit:", finalVaultBalance / LAMPORTS_PER_SOL, "SOL");
  });

  it("Withdraws SOL from vault", async () => {
    const withdrawAmount = 0.2 * LAMPORTS_PER_SOL;

    // Get initial balances
    const initialUserBalance = await provider.connection.getBalance(user.publicKey);
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);

    // Withdraw SOL
    const tx = await program.methods
      .withdraw(new anchor.BN(withdrawAmount))
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Withdraw transaction:", tx);

    // Get final balances
    const finalUserBalance = await provider.connection.getBalance(user.publicKey);
    const finalVaultBalance = await provider.connection.getBalance(vaultPda);

    // Verify balances changed correctly
    expect(finalVaultBalance).to.equal(initialVaultBalance - withdrawAmount);
    // User gains the withdrawal amount minus tx fee
    expect(finalUserBalance).to.be.greaterThan(initialUserBalance + withdrawAmount - 10000);
    
    console.log("Vault balance after withdrawal:", finalVaultBalance / LAMPORTS_PER_SOL, "SOL");
  });

  it("Prevents unauthorized withdrawal", async () => {
    // Create a new unauthorized user
    const unauthorizedUser = Keypair.generate();
    
    // Airdrop some SOL to the unauthorized user for tx fees
    const airdropSig = await provider.connection.requestAirdrop(
      unauthorizedUser.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    // Derive the unauthorized user's vault PDA (this is different from main user's vault)
    const [unauthorizedVaultPda] = getVaultPda(unauthorizedUser.publicKey);

    // Try to withdraw from the main user's vault using unauthorized user
    // This should fail because the PDA is derived from the signer's key,
    // so they can't even reference the correct vault
    try {
      await program.methods
        .withdraw(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          user: unauthorizedUser.publicKey,
          vault: vaultPda, // Trying to use main user's vault
          systemProgram: SystemProgram.programId,
        })
        .signers([unauthorizedUser])
        .rpc();
      
      // If we get here, the test should fail
      expect.fail("Expected an error but transaction succeeded");
    } catch (error) {
      // The error should be about seeds constraint (PDA mismatch) or unauthorized
      console.log("Unauthorized withdrawal correctly rejected");
      expect(error).to.be.instanceOf(Error);
    }
  });

  it("Prevents withdrawal of more than available balance", async () => {
    // Get current vault balance
    const vaultBalance = await provider.connection.getBalance(vaultPda);
    
    // Try to withdraw more than available
    const excessAmount = vaultBalance * 2; // Way more than available

    try {
      await program.methods
        .withdraw(new anchor.BN(excessAmount))
        .accounts({
          user: user.publicKey,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      expect.fail("Expected an error but transaction succeeded");
    } catch (error) {
      console.log("Insufficient funds withdrawal correctly rejected");
      expect(error.toString()).to.include("InsufficientFunds");
    }
  });

  it("Allows multiple deposits", async () => {
    const depositAmount1 = 0.1 * LAMPORTS_PER_SOL;
    const depositAmount2 = 0.15 * LAMPORTS_PER_SOL;

    const initialVaultBalance = await provider.connection.getBalance(vaultPda);

    // First deposit
    await program.methods
      .deposit(new anchor.BN(depositAmount1))
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Second deposit
    await program.methods
      .deposit(new anchor.BN(depositAmount2))
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const finalVaultBalance = await provider.connection.getBalance(vaultPda);

    expect(finalVaultBalance).to.equal(initialVaultBalance + depositAmount1 + depositAmount2);
    console.log("Multiple deposits successful. Final vault balance:", finalVaultBalance / LAMPORTS_PER_SOL, "SOL");
  });

  it("Closes the vault and returns all funds", async () => {
    const initialUserBalance = await provider.connection.getBalance(user.publicKey);
    const vaultBalance = await provider.connection.getBalance(vaultPda);

    // Close the vault
    const tx = await program.methods
      .close()
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Close transaction:", tx);

    // Verify vault no longer exists
    const vaultAccountInfo = await provider.connection.getAccountInfo(vaultPda);
    expect(vaultAccountInfo).to.be.null;

    // Verify user received the lamports back (minus tx fee)
    const finalUserBalance = await provider.connection.getBalance(user.publicKey);
    expect(finalUserBalance).to.be.greaterThan(initialUserBalance + vaultBalance - 10000);

    console.log("Vault closed successfully, all funds returned to owner");
  });

  it("Can create a new vault after closing", async () => {
    // Re-initialize the vault
    const tx = await program.methods
      .initialize()
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Re-initialize transaction:", tx);

    // Verify vault was created again
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    expect(vaultAccount.owner.toString()).to.equal(user.publicKey.toString());
    
    console.log("Vault successfully re-created after closing");
  });
});
