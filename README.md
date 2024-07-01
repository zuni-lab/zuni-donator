ZUNI SMART VAULT - Fundraising Evolved - Control, Transparency, and Real-World Results

# Overview

ZUNI tackles the limitations of traditional fundraising platforms by offering a decentralized solution with a unique twist: real-world credential verification.

Here's how ZUNI makes fundraising easier and more impactful:

Control who gets rewarded: Define clear criteria for who can claim tokens from your "smart vault." This ensures funds go towards your specific goals.
Verified contributions: Integrate with Ethereum Attestation Service to ensure contributions and rewards are based on verifiable credentials like licenses, certificates, or even proof of identity.
Transparency and efficiency: Track all contributions and rewards securely on the ZUNI vault. This builds trust and simplifies the process for both organizers and participants.

# Table of contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Deployment](#deployment)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [UI](#ui)
  - [Project commands](#project-commands)
- [Contract](#contract)
  - [Development](#development)
  - [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

# Project Structure

```
zuni-smart-vault/
│
├── contract/
│   ├── src/
│   │   ├── interfaces/
│   │   │   ├── ISmartVault.sol
│   │   ├── libraries/
│   │   │   ├── Parser.sol
│   │   ├── Common.sol
│   │   ├── SmartVault.sol
│   │   ├── VaultResolver.sol
│   ├── scripts/
│   ├── test/
│   ├── foundry.toml
│   ├── package.json
│   ├── ...
│
├── ui/
│   ├── app/
│   ├── components/
│   │   ├── account
│   │   ├── vault
│   │   ├── shadcn
│   │   ├── ...
│   │
│   ├── constants/
│   ├── hooks/
│   ├── public/
│   ├── stats/
│   ├── types
│   ├── utils/
│   ├── package.json
│   ├── tsconfig.json
│   ├── ...
│
├── README.md
└── package.json
```

# Features

## UI Features

- User Dashboard: View all of vaults.
- Create Vault: Easily create new vaults with customizable parameters.
- Contribute to Vaults: Make contributions to existing vaults.
- Claim Rewards: Claim rewards from vaults.

## Smart Contract Features

- Vault Management: Create and manage vaults on the Ethereum blockchain.
- Contribution Tracking: Track contributions and balances for each vault.

## Deployment

### Website

- [zuni.tech](https://www.zuni.tech)

### Smart contract addresses

- Network: `Base`, `Base Sepolia`
  |Contract|Address|
  |---|---|
  |SmartVault|`0x365be3e45B591423E5b867A7dE04ccEA67ca67e7`|
  |VaultResolver|`0x0B4034DdCBfF142c7479591a571A11379114ad9e`|

# Getting Started

## Prerequisites

- Node.js v18
- Bun
- Foundry

## Installation

1. Clone the repo
   ```sh
   git clone git@github.com:zuni-lab/zuni-smart-vault.git
   ```

# UI

## Project commands

- Run: `bun install` for install all packages
- Run: `bun dev` for start dev environment
- Run: `bun build` for build your project
- Run: `bun start` for start your built project
- Run: `bun lint` for checking error and fix it

# Contract

## Installation

```sh
cd contract
bun install
```

## Development

- Copy `.env.example` to `.env`:

  ```sh
  cp .env.example .env
  ```

- Add `.env` file with the following content:

  - `BASE_MAINNET_RPC`: Base Mainnet RPC URL
  - `BASE_SEPOLIA_RPC`: Base Sepolia RPC URL
  - `API_KEY_BASESCAN`: Basescan API key for verifying contracts
  - `ETH_FROM`: Deployer address

- Run commands:

  ```sh
  source .env

  forge script script/Deploy.s.sol --rpc-url $BASE_MAINNET_RPC --account <deployer_account> --broadcast --verify
  ```

## Testing

- Lint contracts:

  ```sh
  bun run lint
  ```

- Run tests:

  ```sh
  bun run test
  ```

# Contributing

We welcome contributions! Please follow these steps to contribute:

- Fork the repository
- Create a new branch (`git checkout -b feature-branch`)
- Make your changes
- Commit your changes (`git commit -m 'Add some feature'`)
- Push to the branch (git push origin feature-branch)
- Create a new Pull Request

# License

The primary license for ZUNI - Smart Vault contracts is the MIT License, see [`LICENSE`](./LICENSE). However, there are exceptions:

- Many files in `contracts/test/` and `contracts/scripts/` remain unlicensed (as indicated in their SPDX headers).
