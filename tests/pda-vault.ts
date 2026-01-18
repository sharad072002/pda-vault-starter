import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PdaVault } from "../target/types/pda_vault";
import { expect } from "chai";

describe("pda-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PdaVault as Program<PdaVault>;
  const user = provider.wallet;

  it("Initializes a vault", async () => {
    // TODO: Test vault initialization
    // 1. Derive PDA for vault
    // 2. Call initialize
    // 3. Verify vault was created
  });

  it("Deposits SOL into vault", async () => {
    // TODO: Test deposit functionality
    // 1. Get initial balances
    // 2. Deposit SOL
    // 3. Verify balances changed correctly
  });

  it("Withdraws SOL from vault", async () => {
    // TODO: Test withdrawal functionality
    // 1. Get initial balances
    // 2. Withdraw SOL
    // 3. Verify balances changed correctly
  });

  it("Prevents unauthorized withdrawal", async () => {
    // TODO: Test that non-owners cannot withdraw
    // 1. Create a different user
    // 2. Try to withdraw from first user's vault
    // 3. Expect error
  });
});
