# PDA-Based Vault Challenge

Build a secure vault program using Program Derived Addresses (PDAs) on Solana.

## 🎯 Objective

Create a Solana program that allows users to:
1. Create personal vaults using PDAs
2. Deposit SOL into their vault
3. Withdraw SOL from their vault (owner only)

## 📋 Requirements

### Core Features
- [ ] Vault initialization with PDA derivation
- [ ] Deposit functionality
- [ ] Withdraw functionality (authorized only)
- [ ] Proper PDA seed structure

### Security Requirements
- [ ] Verify PDA derivation on-chain
- [ ] Validate signer authority
- [ ] Check for account ownership
- [ ] Handle lamport accounting correctly

## 🏗️ Project Structure

```
pda-vault-starter/
├── programs/
│   └── pda-vault/
│       └── src/
│           └── lib.rs          # Your program logic goes here
├── tests/
│   └── pda-vault.ts           # Test file
├── Anchor.toml
├── Cargo.toml
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Rust & Cargo
- Solana CLI
- Anchor Framework

### Installation

```bash
# Install dependencies
npm install

# Build the program
anchor build

# Run tests
anchor test
```

## 📝 Evaluation Criteria

| Criteria | Weight |
|----------|--------|
| **Correctness** | Pass/Fail |
| **PDA Derivation** | 25% |
| **Security** | 40% |
| **Code Quality** | 35% |

### What We Check
- **PDA Derivation:** Correct seed structure and bump handling
- **Security:** Proper signer validation, ownership checks
- **Code Quality:** Clean Rust code, proper error handling

## 📚 Resources

- [Solana PDA Documentation](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)
- [Anchor Framework Guide](https://www.anchor-lang.com/)
- [Solana Cookbook - PDAs](https://solanacookbook.com/core-concepts/pdas.html)

## 🔗 Submission

1. Fork this repository
2. Implement the vault program
3. Ensure all tests pass
4. Submit your repo URL on the platform

Good luck! 🎉
# pda-vault-starter
