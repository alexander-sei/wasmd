'use client';

// Import the Sei Global Wallet for EIP-6963 discovery
import '@sei-js/sei-global-wallet/eip6963';
import { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sei, seiTestnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

// Create a query client for React Query
const queryClient = new QueryClient();

// Configure Wagmi with Sei chains
const config = createConfig(
  getDefaultConfig({
    chains: [sei, seiTestnet],
    transports: {
      [sei.id]: http('https://evm-rpc.sei-apis.com'),
      [seiTestnet.id]: http('https://evm-rpc-testnet.sei-apis.com')
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    appName: 'My Sei dApp'
  })
);

interface Web3ProvidersProps {
  children: ReactNode;
}

export function Web3Providers({ children }: Web3ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider 
          mode="dark"
          theme="midnight"
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 