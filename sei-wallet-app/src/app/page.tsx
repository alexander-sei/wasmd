'use client';

import { ConnectKitButton } from 'connectkit';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Copy, Wallet, Check, Network, Send, Code, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
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

/**
 * Wasmd precompile ABI for query function
 */
const WASMD_PRECOMPILE_QUERY_ABI = [{"inputs":[{"internalType":"string","name":"contractAddress","type":"string"},{"internalType":"bytes","name":"msg","type":"bytes"},{"internalType":"bytes","name":"coins","type":"bytes"}],"name":"execute","outputs":[{"internalType":"bytes","name":"response","type":"bytes"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"string","name":"contractAddress","type":"string"},{"internalType":"bytes","name":"msg","type":"bytes"},{"internalType":"bytes","name":"coins","type":"bytes"}],"internalType":"struct IWasmd.ExecuteMsg[]","name":"executeMsgs","type":"tuple[]"}],"name":"execute_batch","outputs":[{"internalType":"bytes[]","name":"responses","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint64","name":"codeID","type":"uint64"},{"internalType":"string","name":"admin","type":"string"},{"internalType":"bytes","name":"msg","type":"bytes"},{"internalType":"string","name":"label","type":"string"},{"internalType":"bytes","name":"coins","type":"bytes"}],"name":"instantiate","outputs":[{"internalType":"string","name":"contractAddr","type":"string"},{"internalType":"bytes","name":"data","type":"bytes"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"contractAddress","type":"string"},{"internalType":"bytes","name":"req","type":"bytes"}],"name":"query","outputs":[{"internalType":"bytes","name":"response","type":"bytes"}],"stateMutability":"view","type":"function"}] as const;

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
    <button
      className="ml-2 h-8 w-8 bg-gray-800/30 hover:bg-gray-700/50 border border-gray-600/40 hover:border-red-500/60 rounded-lg transition-all duration-300 backdrop-blur-sm group hover:shadow-lg hover:shadow-red-500/20"
      onClick={copyHandler}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={size} className="text-green-400 drop-shadow-sm animate-pulse" />
      ) : (
        <Copy size={size} className="text-gray-300 group-hover:text-red-400 transition-colors duration-300 drop-shadow-sm" />
      )}
    </button>
  );
}

/** ------------------------------------------------------------------------
 *  Address Card
 * --------------------------------------------------------------------- */
function AddressCard({ title, value, loading, error }: { title: string; value?: string; loading?: boolean; error?: boolean }) {
  return (
    <Card className="h-full neo-card">
      <CardHeader className="relative z-10">
        <CardTitle className="text-sm text-gray-300 flex items-center">
          <Wallet className="h-2 w-2 text-red-400 drop-shadow-sm" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {loading ? (
          <div className="flex items-center text-sm text-gray-400">
            <span className="loading-skeleton w-20 2 rounded"></span>
          </div>
        ) : error || !value ? (
          <p className="text-sm text-yellow-400 glow-yellow">Not linked yet</p>
        ) : (
          <div className="flex items-center">
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
      <CardHeader className="relative z-10">
        <CardTitle className="text-sm text-gray-300 flex items-center">
          {label === 'Network' ? (
            <Network className="h-2 w-2 text-red-400 drop-shadow-sm" />
          ) : (
            <Wallet className="h-2 w-2 text-red-400 drop-shadow-sm" />
          )} 
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {loading && !value ? (
          <div className="flex items-center">
            <span className="text-lg  text-gray-400">Loading...</span>
          </div>
        ) : error ? (
          <p className="text-lg  text-yellow-400 glow-yellow">
            Error loading
          </p>
        ) : value ? (
          <p className="text-lg  text-white">
            {value}
          </p>
        ) : (
          <p className="text-lg  text-yellow-400 glow-yellow">—</p>
        )}
      </CardContent>
    </Card>
  );
}

/** ------------------------------------------------------------------------
 *  Wasmd Execute Card
 * --------------------------------------------------------------------- */
function WasmdExecuteCard({ seiAddress }: { seiAddress?: string }) {
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
        <CardTitle className="text-lg  text-gray-300 flex items-center">
          <Code className="h-5 w-5 text-red-400 drop-shadow-sm" />
          CosmWasm Contract Execution
        </CardTitle>
        <CardDescription className="text-gray-400">
          Execute a function on a CosmWasm contract via the wasmd precompile
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div>
          <label className="text-sm font-medium text-gray-300">Contract Address</label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="sei1..."
            className="w-full px-6 py-4 sm:px-8 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 backdrop-blur-sm"
          />
        </div>
        
        <div>
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
          <div className="text-xs text-gray-500">
            <p>Examples:</p>
            <div className="font-mono">
              <button
                type="button"
                onClick={() => validateAndSetMessage(`{"claim": {"address": "${seiAddress ?? 'sei1...'}", "amount": ""}}`)}
                className="block text-left hover:text-gray-300"
              >
                • {`{"claim": {"address": "${seiAddress ?? 'sei1...'}", "amount": ""}}`} 
              </button>
              <button
                type="button"
                onClick={() => validateAndSetMessage('{"initiate_withdraw_unlocked": {}}')}
                className="text-left hover:text-gray-300"
              >
                • {`{"initiate_withdraw_unlocked": {}}`} 
              </button>
              <button
                type="button"
                onClick={() => validateAndSetMessage('{"transfer": {"recipient": "sei1example", "amount": "1000"}}')}
                className="block text-left hover:text-gray-300"
              >
                • {`{"transfer": {"recipient": "sei1example", "amount": "1000"}}`} 
              </button>
            </div>
          </div>
        </div>
          <div>
        <button
          onClick={executeContract}
          disabled={!contractAddress || !message || isPending || isConfirming}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-none shadow-neon-intense flex items-center justify-center gap-6 mx-auto mt-6 px-10 py-6 text-lg rounded-lg"
        >
          {isPending || isConfirming ? (
            <>
              {isPending ? 'Executing...' : 'Confirming...'}
            </>
          ) : (
            <>
              <Send className="h-2 w-2" />
              Execute Contract
            </>
          )}
        </button>
        </div>

        {hash && (
          <div>
            <label className="text-sm font-medium text-gray-300">Transaction Hash</label>
            <div className="flex items-center">
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
                className="inline-flex items-center text-sm text-red-400 hover:text-red-300 underline underline-offset-4 hover:underline-offset-2 transition-all duration-300"
              >
                <ExternalLink className="h-2 w-2 mr-2" />
                <span>View on SeiTrace</span>
              </a>
            </div>
          </div>
        )}

        {writeError && (
          <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400 font-medium">❌ Transaction failed</p>
            <div className="mt-2 p-2 bg-yellow-950/50 border border-yellow-500/50 rounded">
              <p className="text-sm text-yellow-300 font-medium">Error Details:</p>
              <p className="text-sm text-yellow-100 font-mono">{decodeWasmdError(writeError)}</p>
            </div>
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
 *  Wasmd Query Card
 * --------------------------------------------------------------------- */
function WasmdQueryCard() {
  const [contractAddress, setContractAddress] = useState('');
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState<string>('');
  const [decodedResponse, setDecodedResponse] = useState<string>('');
  const [revertReason, setRevertReason] = useState<string>('');

  // Prepare hex-encoded query msg whenever message changes
  const prepareMsgHex = (): `0x${string}` | undefined => {
    if (!message.trim()) return undefined;
    try {
      const parsed = JSON.parse(message);
      const minifiedJson = JSON.stringify(parsed);
      const encoder = new TextEncoder();
      const msgBytes = encoder.encode(minifiedJson);
      const msgHex = '0x' + Array.from(msgBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      return msgHex as `0x${string}`;
    } catch {
      return undefined;
    }
  };

  const msgHex = prepareMsgHex();

  const {
    data: queryData,
    isError: queryError,
    error: queryErrorDetails,
    isLoading: queryLoading,
    refetch: refetchQuery,
  } = useReadContract({
    address: WASMD_PRECOMPILE_ADDRESS,
    abi: WASMD_PRECOMPILE_QUERY_ABI,
    functionName: 'query',
    args: msgHex && contractAddress ? [contractAddress, msgHex] : undefined,
    query: {
      // Start disabled; user triggers manually
      enabled: false,
    },
  });

  // Decode response whenever queryData updates
  useEffect(() => {
    if (queryData && typeof queryData === 'string') {
      try {
        const bytes = new Uint8Array(
          queryData.slice(2).match(/.{2}/g)?.map(b => parseInt(b, 16)) || []
        );
        const decoded = new TextDecoder().decode(bytes);
        setDecodedResponse(decoded);
      } catch {
        setDecodedResponse('Unable to decode response');
      }
    }
  }, [queryData]);

  // When queryErrorDetails changes, attempt to decode revert reason
  useEffect(() => {
    if (queryErrorDetails) {
      const reason = decodeWasmdError(queryErrorDetails);
      setRevertReason(reason);
    } else {
      setRevertReason('');
    }
  }, [queryErrorDetails]);

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

  const queryContract = () => {
    if (!contractAddress || !msgHex) {
      setValidationError('Please provide contract address and valid JSON message');
      return;
    }
    // Reset previous revert reason
    setRevertReason('');
    console.log('Querying contract with:', {
      contractAddress,
      msgHex,
      originalMessage: message
    });
    refetchQuery();
  };

  return (
    <Card className="neo-card">
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg  text-gray-300 flex items-center">
          <Code className="h-5 w-5 text-red-400 drop-shadow-sm" />
          CosmWasm Contract Query
        </CardTitle>
        <CardDescription className="text-gray-400">
          Query contract state via the wasmd precompile
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-300">Contract Address</label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="sei1..."
            className="mt-1 w-full px-6 py-4 sm:px-8 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 backdrop-blur-sm"
          />
        </div>

                <div>
          <label className="text-sm font-medium text-gray-300">Query Message (JSON)</label>
          <textarea
            value={message}
            onChange={(e) => validateAndSetMessage(e.target.value)}
            placeholder='{"balance": {"address": "sei1..."}}'
            className={`w-full px-6 py-4 sm:px-8 bg-gray-800/50 border rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm min-h-[80px] resize-y font-mono text-sm ${
              validationError ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700/50 focus:ring-red-500/50 focus:border-red-500/50'
            }`}
          />
          {validationError && (
            <p className="text-sm text-red-400">{validationError}</p>
          )}
          <div className="text-xs text-gray-500 mt-2">
            <p>Supported queries for this contract:</p>
            <div className="font-mono space-y-1">
              <button
                type="button"
                onClick={() => validateAndSetMessage('{"get_contract_state": {}}')}
                className="block text-left hover:text-gray-300 transition-colors"
              >
                • {`{"get_contract_state": {}}`} - Get contract state
              </button>
              <button
                type="button"
                onClick={() => validateAndSetMessage('{"get_admins": {}}')}
                className="block text-left hover:text-gray-300 transition-colors"
              >
                • {`{"get_admins": {}}`} - Get contract admins
              </button>
              <button
                type="button"
                onClick={() => validateAndSetMessage('{"get_sei_balance": {}}')}
                className="block text-left hover:text-gray-300 transition-colors"
              >
                • {`{"get_sei_balance": {}}`} - Get SEI balance
              </button>
              <button
                type="button" 
                onClick={() => validateAndSetMessage('{"has_address_claimed": {"address": "sei1..."}}')}
                className="block text-left hover:text-gray-300 transition-colors"
              >
                • {`{"has_address_claimed": {"address": "sei1..."}}`} - Check if claimed
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={queryContract}
          disabled={!contractAddress || !msgHex || queryLoading}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-none shadow-neon-intense flex items-center justify-center gap-6 mx-auto mt-6 px-10 py-6 text-lg rounded-lg"
        >
          {queryLoading ? 'Querying...' : 'Query Contract'}
        </button>

        {queryData && (
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-300">Query Response</label>
            <pre className="w-full px-6 py-4 sm:px-8 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-100 font-mono text-xs break-all whitespace-pre-wrap">
              {decodedResponse || queryData}
            </pre>
          </div>
        )}

        {queryError && (
          <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-lg mt-4">
            <p className="text-sm text-red-400 font-medium">❌ Query failed</p>
            {revertReason && (
              <div className="mt-2 p-3 bg-yellow-950/50 border border-yellow-500/50 rounded">
                <p className="text-sm text-yellow-300 font-medium">📋 Decoded Error Message:</p>
                <p className="text-sm text-yellow-100 font-mono whitespace-pre-wrap">{revertReason}</p>
              </div>
            )}
            {(queryErrorDetails as any)?.cause?.raw && (
              <div className="mt-2 p-2 bg-gray-800/50 border border-gray-600/50 rounded">
                <p className="text-xs text-gray-300 font-medium">Raw Error Data:</p>
                <code className="text-xs text-gray-400 font-mono break-all">{(queryErrorDetails as any).cause.raw}</code>
              </div>
            )}
            <details className="mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                Show technical details
              </summary>
              <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                {JSON.stringify(queryErrorDetails, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simple error decoder for wasmd precompile errors - just decode raw hex to text
 */
function decodeWasmdError(error: any): string {
  // Extract hex error data from various possible locations
  let hexData: string | undefined;
  
  // Check for the "raw" field in error.cause (most reliable for contract errors)
  if (error?.cause?.raw && typeof error.cause.raw === 'string' && error.cause.raw.startsWith('0x')) {
    hexData = error.cause.raw;
  }
  // Check direct hex string
  else if (typeof error === 'string' && error.startsWith('0x')) {
    hexData = error;
  }
  // Check error.data
  else if (error?.data && typeof error.data === 'string' && error.data.startsWith('0x')) {
    hexData = error.data;
  }
  // Try to extract hex from error message
  else if (error?.message && typeof error.message === 'string') {
    const hexMatch = error.message.match(/0x[a-fA-F0-9]+/);
    if (hexMatch) {
      hexData = hexMatch[0];
    }
  }
  
  // If we found hex data, decode it directly to text
  if (hexData) {
    try {
      const bytes = hexData.slice(2).match(/.{2}/g)?.map(b => parseInt(b, 16)) || [];
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
      return decoded.replace(/\0/g, '').trim();
    } catch (e) {
      console.warn('Failed to decode hex error data:', e);
    }
  }
  
  // Fallback to original error message
  return error?.message || 'Unknown error';
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
        <Card className="h-500 w-300 max-w-md w-full neo-card gradient-border text-center">
          <CardHeader className="relative z-10">
            <CardTitle className="flex flex-col items-center justify-center">
              <Wallet className="h-10 w-10 text-red-400 drop-shadow-lg glow-red animate-pulse" />
              <span className=" text-xl  text-gray-100 shimmer bg-gradient-to-r from-gray-100 to-red-200 bg-clip-text">
                Wallet not connected
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center relative z-10">
            <ConnectKitButton />
          </CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-col"> 
      <div>
        <Card className="h-full neo-card">
          <CardHeader className="relative z-10">
            <CardTitle className="text-sm text-gray-300 flex items-center">
              <Wallet className="h-2 w-2 text-red-400 drop-shadow-sm" /> Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 flex justify-center">
            <ConnectKitButton />
          </CardContent>
        </Card>
        <AddressCard
          title="Sei Address"
          value={seiAddress as string}
          loading={seiAddressLoading}
          error={seiAddressError}
        />
      </div>

      <div>
        <MetricCard label="Network" value={chain?.name} />
        <MetricCard
          label="Balance"
          value={balance?.formatted ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : undefined}
          loading={balanceFetching}
          error={balanceError}
        />
      </div>

      {/* CosmWasm Contract Query */}
      <div className="mt-24">
        <WasmdQueryCard />
      </div>
      
      {/* CosmWasm Contract Execution */}
      <div className="mt-24">
        <WasmdExecuteCard seiAddress={seiAddress as string} />
      </div>
    </div>
  );
}

/** ------------------------------------------------------------------------
 *  Page Component
 * --------------------------------------------------------------------- */
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex justify-center items-start">
      <div className="w-[60vw]">
        <header className="text-center">
       <h1 className='text-5xl font-bold text-white mb-4'> Sei wasmd precompile tool</h1>
          <p className="text-lg text-gray-400 mx-auto">
            Connect your wallet,view your addresses, and interact with CosmWasm contracts via the wasmd precompile.
          </p>
        </header>


        {/* Account grid */}
        <AccountInfo />


      </div>
    </div>
  );
}
