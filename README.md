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
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [UI](#ui)
  - [Project commands](#project-commands)
- [Contract](#contract)
  - [Development](#development)
  - [Deployment](#deployment)
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

## Development

## Deployment

## Testing

# Contributing

We welcome contributions! Please follow these steps to contribute:
- Fork the repository
- Create a new branch (`git checkout -b feature-branch`)
- Make your changes
- Commit your changes (`git commit -m 'Add some feature'`)
- Push to the branch (git push origin feature-branch)
- Create a new Pull Request
