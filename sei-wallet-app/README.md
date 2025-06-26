# Sei Global Wallet Demo App

A Next.js application demonstrating Sei Global Wallet integration with smart contract interaction capabilities.

## Features

- 🚀 **Sei Global Wallet Integration**: Connect using social logins (Google, X, Telegram, email)
- 💰 **Wallet Information Display**: Shows your wallet address, network info, and SEI balance
- 🔗 **Smart Contract Interaction**: Read and write to ERC20 contracts
- 🎨 **Modern UI**: Built with Tailwind CSS and a responsive design
- ⚡ **Fast Development**: Next.js with TypeScript and hot reloading

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Wallet Integration**: Sei Global Wallet + Wagmi + ConnectKit
- **Smart Contracts**: Viem for Ethereum interactions
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A browser that supports modern web standards

### Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd sei-wallet-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Connecting Your Wallet

1. Click the "Connect Wallet" button
2. Choose "Sei Global Wallet" from the wallet options
3. Sign in using your preferred method (Google, X, Telegram, or email)
4. Approve the connection

### Viewing Wallet Information

Once connected, you'll see:
- Your wallet address
- Current network (Sei Mainnet or Testnet)
- SEI token balance

### Interacting with Smart Contracts

The app includes an ERC20 token interaction interface:

1. **Reading Contract Data**:
   - Enter an ERC20 contract address
   - View token name and your token balance

2. **Transferring Tokens**:
   - Enter the recipient address
   - Specify the amount to transfer
   - Click "Transfer Tokens" to execute the transaction

## Supported Networks

- **Sei Mainnet** (Chain ID: 1329)
- **Sei Testnet** (Chain ID: 1328)

## Configuration

### WalletConnect (Optional)

For additional wallet support, you can add a WalletConnect Project ID:

1. Get a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a `.env.local` file:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## Key Files

- `src/app/providers.tsx` - Web3 providers configuration
- `src/app/components/WalletInfo.tsx` - Main wallet interface component
- `src/app/page.tsx` - Home page
- `src/app/layout.tsx` - App layout with providers

## How It Works

### Sei Global Wallet Integration

The app uses the `@sei-js/sei-global-wallet` package which implements EIP-6963 wallet discovery:

```typescript
// Import enables EIP-6963 discovery
import '@sei-js/sei-global-wallet/eip6963';
```

This automatically makes the Sei Global Wallet available to standard wallet connection libraries like ConnectKit.

### Smart Contract Interaction

The app demonstrates both read and write operations:

- **Read Operations**: Get token information without gas fees
- **Write Operations**: Execute transactions that modify blockchain state

Example ERC20 functions used:
- `name()` - Get token name
- `balanceOf(address)` - Get token balance
- `transfer(address, uint256)` - Transfer tokens

## Learn More

- [Sei Global Wallet Documentation](https://docs.sei.io/evm/sei-global-wallet)
- [Sei Network Documentation](https://docs.sei.io/)
- [Wagmi Documentation](https://wagmi.sh/)
- [ConnectKit Documentation](https://docs.family.co/connectkit)
- [Next.js Documentation](https://nextjs.org/docs)

## License

This project is open source and available under the [MIT License](LICENSE).
