import { WalletInfo } from './components/WalletInfo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sei Global Wallet Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect your Sei Global Wallet and interact with smart contracts on the Sei network.
            This demo shows your wallet address, balance, and provides an interface for ERC20 token interactions.
          </p>
        </header>
        
        <main>
          <WalletInfo />
        </main>
        
        <footer className="mt-16 text-center text-gray-500">
          <p>
            Built with{' '}
            <a 
              href="https://docs.sei.io/evm/sei-global-wallet" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Sei Global Wallet
            </a>
            , Next.js, and Wagmi
          </p>
        </footer>
      </div>
    </div>
  );
}
