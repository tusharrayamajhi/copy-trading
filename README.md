# 🚀 CopyCatt — Non-Custodial Copy Trading on Solana

## 🎥 Pitch Video

[Watch Pitch Video](https://youtu.be/Sb-tT214usQ?utm_source=chatgpt.com)

## 🎥 Product Demo

[Watch Product Demo](https://youtu.be/-GgL6f_B8EU?utm_source=chatgpt.com)

---

## 🌟 Overview

CopyCatt is a non-custodial copy trading protocol built on Solana that connects traders and investors.

Traders can create on-chain trading vaults and manage strategies transparently.
Investors can discover traders, deposit funds, and automatically follow strategies without giving up custody to centralized platforms.

---

# ❌ Problem

Copy trading is a massive market with billions in trading volume, but current platforms are custodial.

Platforms like eToro and Bitget require users to trust centralized exchanges or bots with their funds.

### Current Problems

* Users lose custody of assets
* Platforms become single points of failure
* Strategies are shared manually on X/Telegram
* No transparent on-chain vault ownership
* Investors must trust centralized systems

---

# ✅ Solution

CopyCatt enables fully transparent, non-custodial copy trading on Solana.

With CopyCatt:

* Traders manage on-chain vaults
* Investors own proportional vault shares
* Everything is transparent and verifiable
* No centralized custody risk

---

# ⚡ How CopyCatt Works

## 1. Connect Wallet

Users connect their Solana wallet to the platform.

They can choose between:

* Trader
* Investor

---

## 2. Trader Flow

A trader creates a vault on-chain.

During initialization:

* Commission percentage is set
* Vault PDA is created
* Trading vault becomes publicly discoverable

The trader can then manage assets inside the vault by swapping:

* SOL → USDC
* USDC → SOL
* Other supported assets

All trades happen on-chain.

---

## 3. Investor Flow

Investors browse trader vaults and choose strategies to follow.

When investing:

* Funds are deposited into the trader vault
* Investor PDA account is created
* Ownership percentage is recorded

The protocol stores:

* Deposit amount
* Vault share ownership
* Entry value

Multiple investors can join the same vault while maintaining proportional ownership.

---

## 4. Withdrawals

When investors withdraw:

* Vault ownership percentage is calculated
* Correct proportional assets are transferred
* Investor PDA account is closed

This ensures accurate and transparent accounting.

---

# 🏗️ Architecture

## Core Actors

### Trader

Functions:

* Initialize Vault
* Execute Trades

### Investor

Functions:

* Deposit
* Withdraw

---

## Smart Contract Layer

CopyCatt smart contracts are built using:

* Solana
* Anchor Framework

The program manages:

* Vault PDAs
* Investor PDAs
* Share accounting
* Commission distribution
* Deposit & withdrawal logic

---

## Frontend

Built with:

* Next.js
* TailwindCSS
* Solana Wallet Adapter

Features:

* Wallet connection
* Trader dashboard
* Investor discovery
* Vault analytics

---

## Backend & Database

### Supabase

Used for:

* Authentication
* Realtime updates
* Trader analytics
* Activity feeds

### Prisma

Used for:

* Database ORM
* Query management
* Data indexing

---

# 🛠️ Tech Stack

| Layer              | Technology            |
| ------------------ | --------------------- |
| Blockchain         | Solana                |
| Smart Contracts    | Anchor                |
| Frontend           | Next.js               |
| Styling            | TailwindCSS           |
| Wallet Integration | Solana Wallet Adapter |
| Backend            | Supabase              |
| ORM                | Prisma                |

---

# 🔐 Why Non-Custodial Matters

With CopyCatt:

* Investors keep ownership transparency
* Trades are verifiable on-chain
* No centralized custody risk
* Vault accounting is transparent

---

# 🔮 Vision

CopyCatt aims to become the infrastructure layer for decentralized copy trading on Solana.

A future where:

* Traders monetize skill transparently
* Investors copy strategies trustlessly
* Everything runs fully on-chain

---

# 👥 Team

CopyCatt is building the future of transparent and decentralized copy trading on Solana.
