'use client';

import { useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useAccount, useBalance, useReadContract, useWriteContract, useSendTransaction, useSwitchChain } from 'wagmi';
import { formatEther, parseEther } from 'viem';

// Sei Network Configuration
const SEI_CHAIN_ID = 1329; // Sei Pacific mainnet

// Example ERC20 ABI for smart contract interaction
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

function AccountInfo() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });

  if (!isConnected) {
    return <p className="text-gray-400">Connect your wallet to see account details</p>;
  }

  return (
    <div className="account-info bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-white">Account Information</h3>
      <div className="space-y-4">
        <div>
          <p className="text-gray-100">
            <strong className="text-gray-300">Address:</strong> {address}
          </p>
        </div>
        <div>
          <p className="text-gray-100">
            <strong className="text-gray-300">Network:</strong> {chain?.name}
          </p>
        </div>
        <div>
          <p className="text-gray-100">
            <strong className="text-gray-300">Balance:</strong> {balance?.formatted} {balance?.symbol}
          </p>
        </div>
      </div>
    </div>
  );
}

function NetworkCheck() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return null;
  }

  const isOnSeiNetwork = chain?.id === SEI_CHAIN_ID;

  if (isOnSeiNetwork) {
    return null;
  }

  const handleSwitchToSei = () => {
    switchChain({ chainId: SEI_CHAIN_ID });
  };

  return (
    <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 p-6 rounded-xl border-2 border-red-700 shadow-lg">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            Wrong Network Detected
          </h3>
          <p className="text-red-200 mb-4">
            You&apos;re currently connected to <strong>{chain?.name}</strong>. 
            This app requires the Sei network to function properly.
          </p>
          <button
            onClick={handleSwitchToSei}
            disabled={isPending}
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 px-4 rounded-lg hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-lg"
          >
            {isPending ? 'Switching...' : 'Switch to Sei Network'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WalletInfo() {
  const { address, isConnected, chain } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [seiTransferTo, setSeiTransferTo] = useState('');
  const [seiTransferAmount, setSeiTransferAmount] = useState('');

  // Check if user is on the correct network
  const isOnSeiNetwork = chain?.id === SEI_CHAIN_ID;

  // Contract reads
  const { data: tokenName } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'name',
    query: {
      enabled: !!contractAddress && contractAddress.length === 42,
    },
  });

  const { data: tokenSymbol } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!contractAddress && contractAddress.length === 42,
    },
  });

  const { data: tokenBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!contractAddress && !!address && contractAddress.length === 42,
    },
  });

  // Contract write - token transfer
  const { writeContract: writeTokenContract, isPending: isTokenTransferPending } = useWriteContract();

  // Native SEI transfer
  const { sendTransaction, isPending: isSeiTransferPending } = useSendTransaction();

  const handleTokenTransfer = () => {
    if (!contractAddress || !transferTo || !transferAmount) return;
    
    writeTokenContract({
      address: contractAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [transferTo as `0x${string}`, parseEther(transferAmount)],
    });
  };

  const handleSeiTransfer = () => {
    if (!seiTransferTo || !seiTransferAmount) return;

    sendTransaction({
      to: seiTransferTo as `0x${string}`,
      value: parseEther(seiTransferAmount),
    });
  };

  return (
    <div className="space-y-6">
      {/* Connect Wallet Button */}
      <div className="text-center">
        <ConnectKitButton />
      </div>

      {/* Network Check */}
      <NetworkCheck />

      {/* Account Info Component */}
      <AccountInfo />

      {/* Native SEI Transfer */}
      {isConnected && (
        <div className={`bg-gradient-to-r from-blue-900/50 to-indigo-900/50 p-6 rounded-xl border border-blue-700 shadow-lg ${!isOnSeiNetwork ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Send SEI Tokens</h2>
            {!isOnSeiNetwork && (
              <span className="text-sm text-red-300 font-medium bg-red-900/50 px-2 py-1 rounded">
                Requires Sei Network
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address:
              </label>
              <input
                type="text"
                value={seiTransferTo}
                onChange={(e) => setSeiTransferTo(e.target.value)}
                placeholder="0x..."
                disabled={!isOnSeiNetwork}
                className="w-full p-3 border border-gray-600 bg-gray-800 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-700 disabled:cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (SEI):
              </label>
              <input
                type="text"
                value={seiTransferAmount}
                onChange={(e) => setSeiTransferAmount(e.target.value)}
                placeholder="0.0"
                disabled={!isOnSeiNetwork}
                className="w-full p-3 border border-gray-600 bg-gray-800 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-700 disabled:cursor-not-allowed"
              />
            </div>
            
            <button
              onClick={handleSeiTransfer}
              disabled={!isOnSeiNetwork || !seiTransferTo || !seiTransferAmount || isSeiTransferPending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-lg"
            >
              {isSeiTransferPending ? 'Sending SEI...' : 'Send SEI'}
            </button>
          </div>
        </div>
      )}

      {/* ERC20 Token Interaction */}
      {isConnected && (
        <div className={`bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-xl ${!isOnSeiNetwork ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">ERC20 Token Interaction</h2>
            {!isOnSeiNetwork && (
              <span className="text-sm text-red-300 font-medium bg-red-900/50 px-2 py-1 rounded">
                Requires Sei Network
              </span>
            )}
          </div>
          
          {/* Contract Address Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ERC20 Contract Address:
            </label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x... (Enter ERC20 token contract address)"
              disabled={!isOnSeiNetwork}
              className="w-full p-3 border border-gray-600 bg-gray-800 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          {/* Contract Information */}
          {contractAddress && contractAddress.length === 42 && (
            <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="font-medium text-white mb-3">Token Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-300">Name:</span>
                  <span className="text-gray-100">{tokenName || 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-300">Symbol:</span>
                  <span className="text-gray-100">{tokenSymbol || 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-300">Your Balance:</span>
                  <span className="text-gray-100 font-medium">
                    {tokenBalance ? formatEther(tokenBalance) : 'Loading...'} {tokenSymbol || ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Transfer Tokens</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Transfer To:
              </label>
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="0x..."
                disabled={!isOnSeiNetwork}
                className="w-full p-3 border border-gray-600 bg-gray-800 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-700 disabled:cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount:
              </label>
              <input
                type="text"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.0"
                disabled={!isOnSeiNetwork}
                className="w-full p-3 border border-gray-600 bg-gray-800 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-700 disabled:cursor-not-allowed"
              />
            </div>
            
            <button
              onClick={handleTokenTransfer}
              disabled={!isOnSeiNetwork || !contractAddress || !transferTo || !transferAmount || isTokenTransferPending}
              className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-lg"
            >
              {isTokenTransferPending ? 'Transferring...' : 'Transfer Tokens'}
            </button>
          </div>
        </div>
      )}

      {/* Information Panel */}
      {!isConnected && (
        <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 p-6 rounded-xl border border-amber-700">
          <h3 className="text-lg font-semibold text-amber-300 mb-2">
            Welcome to Sei Global Wallet Demo
          </h3>
          <p className="text-amber-200 mb-4">
            Connect your wallet using familiar login methods like Google, Twitter, or Telegram. 
            No browser extension required!
          </p>
          <div className="text-sm text-amber-200">
            <p className="mb-1">🌟 <strong>Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Social login integration</li>
              <li>Cross-app wallet persistence</li>
              <li>Native SEI transfers</li>
              <li>ERC20 token interactions</li>
              <li>Self-custodial security</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 