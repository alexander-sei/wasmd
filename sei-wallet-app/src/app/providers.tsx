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
    // Your app info
    appName: 'Sei Wallet App',
    appDescription: 'A Next.js app with Sei Global Wallet integration',
    appUrl: 'https://family.co', // your app's url
    appIcon: 'https://family.co/logo.png', // your app's icon, no bigger than 1024x1024px (max. 1MB)

    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',

    // Required API Keys
    chains: [sei, seiTestnet],
    transports: {
      [sei.id]: http(),
      [seiTestnet.id]: http(),
    },

    // Required
    ssr: true,
  }),
);

interface Web3ProvidersProps {
  children: ReactNode;
}

export function Web3Providers({ children }: Web3ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 