# Sei Wallet + Wasmd CosmWasm Demo App

A full-stack Next.js 15 dApp demonstrating:

• Seamless connection with Sei Global Wallet (social logins supported)  
• EVM & CosmWasm smart-contract interaction on the Sei network via the new `wasmd` precompile  
• Modern Tailwind UI, written in TypeScript and powered by Wagmi + ConnectKit

## Features

- 🚀 **Sei Global Wallet Integration** – Connect through Google, X, Telegram or e-mail
- 💰 **Wallet Dashboard** – View your EVM address, corresponding Sei address, network and SEI balance
- ⚙️ **CosmWasm Precompile** –  
  - `query` and `execute` any CosmWasm contract through the `0x0000000000000000000000000000000000001002` precompile  
  - Batch executions supported (function exposed, UI coming soon)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Wallet / EVM**: Wagmi v2 + ConnectKit + Sei Global Wallet (EIP-6963 discovery)
- **CosmWasm**: `wasmd` precompile (`0x…1002`) ABI wrapped with Viem
- **RPC**: `https://evm-rpc.sei-apis.com`
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js ≥18
- pnpm / npm / yarn

### Installation

```bash
git clone <your-repo-url>
cd sei-wallet-app
yarn install         # or pnpm install
yarn run dev
```

Open http://localhost:3000 in your browser.

## Usage

### 1. Connect Wallet
Click **Connect Wallet** → choose **Sei Global Wallet** → sign in with your favourite provider and approve.

### 2. Wallet Dashboard
After connecting the dApp displays:
- EVM address
- Sei bech32 address (queried with `getSeiAddr` from the `0x0000000000000000000000000000000000001004` precompile)
- Network
- SEI balance

### 3. CosmWasm Contract Interaction
The “CosmWasm Contract Execution / Query” cards demonstrate how to call any CW contract from the EVM side:

- **Query**: Calls `query(contract, msg, [])` on the precompile; no gas, view only.
- **Execute**: Calls `execute(contract, msg, [])` and waits for the transaction receipt.

`msg` expects raw JSON (NOT base64-encoded). The component automatically converts it to bytes/hex required by the precompile.


## Supported Networks

| Network | Chain ID | RPC |
| ------- | -------- | --- |
| Sei Mainnet  | 1329 | https://evm-rpc.sei-apis.com |

## Configuration

### WalletConnect (optional)

Create `.env.local` and add:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<project_id>
```

## Key Files

- `src/app/page.tsx` — dashboard, ERC-20 & CosmWasm components  
- `src/app/components/WalletInfo.tsx` — detailed EVM wallet utilities  
- `src/app/providers.tsx` — Wagmi, ConnectKit & chain configuration  
- `contractlist.csv` — sample CW contract addresses for testing purposes

## Learn More

- [Wasmd Precompile Docs](https://docs.sei.io/evm/wasmd-precompile)  
- [Sei Global Wallet](https://docs.sei.io/evm/sei-global-wallet)  
- [Sei Network](https://docs.sei.io/)  
- [Wagmi](https://wagmi.sh/)  
- [ConnectKit](https://family.co/connectkit)  
- [Next.js](https://nextjs.org/docs)

## License

MIT
