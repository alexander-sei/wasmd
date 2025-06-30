'use client';

import { ConnectKitButton } from 'connectkit';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Loader2, Wallet, Check, Network, Send, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { stringToHex } from 'viem';

/**
 * Addr precompile ABI for getSeiAddr function
 */
const ADDR_PRECOMPILE_ABI = [
  {
    inputs: [{ name: 'addr', type: 'address' }],
    name: 'getSeiAddr',
    outputs: [{ name: 'response', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Wasmd precompile ABI for execute function
 */
const WASMD_PRECOMPILE_ABI = [
  {
    inputs: [
      { name: 'contractAddress', type: 'string' },
      { name: 'msg', type: 'bytes' },
      { name: 'coins', type: 'bytes' }
    ],
    name: 'execute',
    outputs: [{ name: 'response', type: 'bytes' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

const ADDR_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000001004';
const WASMD_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000001002';

/** ------------------------------------------------------------------------
 *  Helpers
 * --------------------------------------------------------------------- */
function CopyButton({ value, size = 16 }: { value?: string; size?: number }) {
  const [copied, setCopied] = useState(false);

  const copyHandler = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="hover:bg-gray-800/50 hover:shadow-neon transition-all duration-300 backdrop-blur-sm border border-gray-700/50 hover:border-red-500/30"
      onClick={copyHandler}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={size} className="text-green-400 drop-shadow-sm" />
      ) : (
        <Copy size={size} className="text-gray-400 hover:text-red-400 transition-colors duration-300" />
      )}
    </Button>
  );
}

/** ------------------------------------------------------------------------
 *  Address Card
 * --------------------------------------------------------------------- */
function AddressCard({ title, value, loading, error }: { title: string; value?: string; loading?: boolean; error?: boolean }) {
  return (
    <Card className="h-full neo-card">
      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-gray-300 uppercase flex items-center gap-2">
          <Wallet className="h-4 w-4 text-red-400 drop-shadow-sm" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin text-red-400 drop-shadow-sm" /> 
            <span className="loading-skeleton w-20 h-4 rounded"></span>
          </div>
        ) : error || !value ? (
          <p className="text-sm text-yellow-400 glow-yellow">Not linked yet</p>
        ) : (
          <div className="flex items-center gap-2">
            <code className="whitespace-pre-wrap break-all font-mono text-xs rounded-lg p-3 code-block text-gray-100 flex-1 shadow-neon">
              {value}
            </code>
            <CopyButton value={value} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** ------------------------------------------------------------------------
 *  Metric Card (Network, Balance)
 * --------------------------------------------------------------------- */
function MetricCard({ label, value, loading, error }: { label: string; value?: string; loading?: boolean; error?: boolean }) {
  return (
    <Card className="neo-card">
      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-gray-300 uppercase flex items-center gap-2">
          {label === 'Network' ? (
            <Network className="h-4 w-4 text-red-400 drop-shadow-sm" />
          ) : (
            <Wallet className="h-4 w-4 text-red-400 drop-shadow-sm" />
          )} 
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {loading && !value ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-red-400 drop-shadow-sm" />
            <span className="text-lg font-bold text-gray-400">Loading...</span>
          </div>
        ) : error ? (
          <p className="text-lg font-bold text-yellow-400 glow-yellow">
            Error loading
          </p>
        ) : value ? (
          <p className="text-lg font-bold text-white">
            {value}
          </p>
        ) : (
          <p className="text-lg font-bold text-yellow-400 glow-yellow">—</p>
        )}
      </CardContent>
    </Card>
  );
}

/** ------------------------------------------------------------------------
 *  Wasmd Execute Card
 * --------------------------------------------------------------------- */
function WasmdExecuteCard() {
  const [contractAddress, setContractAddress] = useState('');
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState<string>('');

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Validate JSON message - CosmWasm contracts expect raw JSON, not base64
  const validateAndSetMessage = (value: string) => {
    setMessage(value);
    setValidationError('');
    
    if (value.trim()) {
      try {
        JSON.parse(value);
      } catch {
        setValidationError('Invalid JSON format');
      }
    }
  };

  const executeContract = async () => {
    if (!contractAddress || !message) return;

    // Final validation before execution
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch {
      setValidationError('Please provide valid JSON message');
      return;
    }

    try {
      // Convert JSON message to bytes properly
      // Ensure the JSON is minified and properly formatted
      const minifiedJson = JSON.stringify(parsedMessage);
      
      // Debug: log the exact JSON being sent
      console.log('JSON to send:', minifiedJson);
      console.log('JSON length:', minifiedJson.length);
      
      // Convert the JSON string to bytes using proper encoding
      const encoder = new TextEncoder();
      const msgBytes = encoder.encode(minifiedJson);
      
      // Convert bytes to hex string with proper padding
      const msgHex = '0x' + Array.from(msgBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      
      // Empty coins array - proper empty bytes representation
      const coinsHex = stringToHex(JSON.stringify([]));  

      console.log('Executing with:', {
        contractAddress,
        originalMessage: minifiedJson,
        msgBytesLength: msgBytes.length,
        msgHex,
        msgHexLength: msgHex.length,
        coinsHex
      });

      // Verify the hex encoding by decoding it back
      const decodedBytes = new Uint8Array(
        msgHex.slice(2).match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      const decodedString = new TextDecoder().decode(decodedBytes);
      console.log('Decoded verification:', decodedString);
      
      

      writeContract({
        address: WASMD_PRECOMPILE_ADDRESS,
        abi: WASMD_PRECOMPILE_ABI,
        functionName: 'execute',
        args: [contractAddress, msgHex as `0x${string}`, coinsHex as `0x${string}`],
      });
    } catch (error) {
      console.error('Error executing contract:', error);
      setValidationError(`Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="neo-card">
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg font-semibold text-gray-300 flex items-center gap-2">
          <Code className="h-5 w-5 text-red-400 drop-shadow-sm" />
          CosmWasm Contract Execution
        </CardTitle>
        <CardDescription className="text-gray-400">
          Execute a function on a CosmWasm contract via the wasmd precompile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Contract Address</label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="sei1..."
            className="w-full px-6 py-4 sm:px-8 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 backdrop-blur-sm"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Message (JSON)</label>
          <textarea
            value={message}
            onChange={(e) => validateAndSetMessage(e.target.value)}
            placeholder='The contract msg to execute'
            className={`w-full px-6 py-4 sm:px-8 bg-gray-800/50 border rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm min-h-[80px] resize-y font-mono text-sm ${
              validationError ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700/50 focus:ring-red-500/50 focus:border-red-500/50'
            }`}
          />
          {validationError && (
            <p className="text-sm text-red-400">{validationError}</p>
          )}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Examples:</p>
            <div className="space-y-1 font-mono">
              <button
                type="button"
                onClick={() => validateAndSetMessage('{"transfer": {"recipient": "sei1example", "amount": "1000"}}')}
                className="block text-left hover:text-gray-300 transition-colors"
              >
                • {`{"transfer": {"recipient": "sei1example", "amount": "1000"}}`} 
              </button>
              <button
                type="button"
                onClick={() => validateAndSetMessage('{"initiate_withdraw_unlocked": {}}')}
                className="block text-left hover:text-gray-300 transition-colors"
              >
                • {`{"initiate_withdraw_unlocked": {}}`} 
              </button>
            </div>
          </div>
        </div>

        <Button
          onClick={executeContract}
          disabled={!contractAddress || !message || isPending || isConfirming}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-none shadow-neon hover:shadow-neon-intense transition-all duration-300"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isPending ? 'Executing...' : 'Confirming...'}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Execute Contract
            </>
          )}
        </Button>

        {hash && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Transaction Hash</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-6 py-4 sm:px-8 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-100 font-mono text-xs break-all">
                {hash}
              </code>
              <CopyButton value={hash} />
            </div>
            <div className="flex justify-center">
              <a
                href={`https://seitrace.com/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 underline underline-offset-4 hover:underline-offset-2 transition-all duration-300"
              >
                <span>View on SeiTrace</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {writeError && (
          <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400 font-medium">❌ Transaction failed: {writeError.message}</p>
          </div>
        )}

        {isConfirmed && (
          <div className="p-3 bg-green-950/50 border border-green-500/50 rounded-lg">
            <p className="text-sm text-green-400 font-medium">✅ Transaction confirmed!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** ------------------------------------------------------------------------
 *  AccountInfo
 * --------------------------------------------------------------------- */
function AccountInfo() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance, isLoading: balanceLoading, isFetching: balanceFetching, isError: balanceError, error: balanceErrorDetails } = useBalance({ 
    address,
  });

  // Debug logging
  console.log('Balance Debug:', {
    address,
    isConnected,
    balanceLoading,
    balanceFetching,
    balanceError,
    balanceErrorDetails,
    balance: balance?.formatted,
    balanceSymbol: balance?.symbol
  });

  if (balanceError) {
    console.error('Balance error:', balanceError);
  }

  // Query the associated Sei address
  const {
    data: seiAddress,
    isError: seiAddressError,
    isLoading: seiAddressLoading,
  } = useReadContract({
    address: ADDR_PRECOMPILE_ADDRESS,
    abi: ADDR_PRECOMPILE_ABI,
    functionName: 'getSeiAddr',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  if (!isConnected) {
    return (
        <Card className="h-500 w-300 max-w-md w-full neo-card gradient-border hover-lift text-center">
          <CardHeader className="relative z-10">
            <CardTitle className="mb-2 flex flex-col items-center justify-center gap-4">
              <Wallet className="h-10 w-10 text-red-400 drop-shadow-lg glow-red animate-pulse" />
              <span className=" text-xl font-bold text-gray-100 shimmer bg-gradient-to-r from-gray-100 to-red-200 bg-clip-text">
                Wallet not connected
              </span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Connect your wallet to display account metrics &amp; interact with CosmWasm contracts
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center relative z-10">
            <ConnectKitButton />
          </CardContent>
        </Card>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <AddressCard title="EVM Address" value={address} />
        <AddressCard
          title="Sei Address"
          value={seiAddress as string}
          loading={seiAddressLoading}
          error={seiAddressError}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <MetricCard label="Network" value={chain?.name} />
        <MetricCard
          label="Balance"
          value={balance?.formatted ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : undefined}
          loading={balanceFetching}
          error={balanceError}
        />
      </div>

      {/* CosmWasm Contract Execution */}
      <WasmdExecuteCard />


  
    </motion.section>
  );
}

/** ------------------------------------------------------------------------
 *  Page Component
 * --------------------------------------------------------------------- */
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black px-8 sm:px-12 lg:px-16">
      <div className="max-w-4xl mx-auto px-8 sm:px-12 lg:px-16 py-12">
        <header className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-100 mb-4"
          >
            Sei Account Dashboard
          </motion.h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-6">
            Connect your Sei Global Wallet, view your addresses, and interact with CosmWasm contracts.
          </p>
        </header>

        {/* Connect Button is now rendered conditionally inside AccountInfo to avoid duplication */}

        {/* Account grid */}
        <AccountInfo />


      </div>
    </div>
  );
}
