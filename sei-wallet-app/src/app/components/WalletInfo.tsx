'use client';

import { useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useAccount, useBalance, useReadContract, useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';

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

export function WalletInfo() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const [contractAddress, setContractAddress] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Example contract read - getting token name (you can replace with your contract address)
  const { data: tokenName } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'name',
    query: {
      enabled: !!contractAddress && contractAddress.length === 42, // Only query if valid address
    },
  });

  // Example contract read - getting token balance
  const { data: tokenBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!contractAddress && !!address && contractAddress.length === 42,
    },
  });

  // Example contract write - token transfer
  const { writeContract, isPending } = useWriteContract();

  const handleTransfer = () => {
    if (!contractAddress || !transferTo || !transferAmount) return;
    
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [transferTo as `0x${string}`, parseEther(transferAmount)],
    });
  };

  return (
    <div className="space-y-6">
      {/* Connect Wallet Button */}
      <div className="text-center">
        <ConnectKitButton />
      </div>

      {/* Wallet Information */}
      {isConnected && address && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Wallet Information</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Address:</label>
              <code className="block mt-1 p-2 bg-white border rounded text-sm break-all">
                {address}
              </code>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Network:</label>
              <p className="mt-1">{chain?.name} (Chain ID: {chain?.id})</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">SEI Balance:</label>
              <p className="mt-1">
                {balance ? formatEther(balance.value) : '0'} {balance?.symbol}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Smart Contract Interaction */}
      {isConnected && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Smart Contract Interaction</h2>
          
          {/* Contract Address Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ERC20 Contract Address:
            </label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Contract Information */}
          {contractAddress && contractAddress.length === 42 && (
            <div className="mb-6 space-y-2">
              <div>
                <span className="font-medium">Token Name: </span>
                {tokenName || 'Loading...'}
              </div>
              <div>
                <span className="font-medium">Your Token Balance: </span>
                {tokenBalance ? formatEther(tokenBalance) : 'Loading...'}
              </div>
            </div>
          )}

          {/* Transfer Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Transfer Tokens</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer To:
              </label>
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="0x..."
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount:
              </label>
              <input
                type="text"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.0"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <button
              onClick={handleTransfer}
              disabled={!contractAddress || !transferTo || !transferAmount || isPending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Transferring...' : 'Transfer Tokens'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 