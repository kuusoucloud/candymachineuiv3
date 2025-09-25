'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { 
  fetchCandyMachine, 
  mintV2,
  mplCandyMachine 
} from '@metaplex-foundation/mpl-candy-machine';
import { generateSigner, publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Coins, Users, Clock, CheckCircle, XCircle, ExternalLink, Shield } from 'lucide-react';
import WalletConnection from './WalletConnection';
import { CANDY_MACHINE_CONFIG, validateConfig, isProductionMode } from '@/lib/config';

interface CandyMachineData {
  itemsRedeemed: number;
  itemsAvailable: number;
  itemsLoaded: number;
  price: number;
  guards: any;
}

interface CollectionMetadata {
  name: string;
  description: string;
  image: string;
}

export default function MintingSection() {
  const { publicKey, wallet, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [candyMachineData, setCandyMachineData] = useState<CandyMachineData | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionSignature, setTransactionSignature] = useState<string>('');
  const [tokenGateStatus, setTokenGateStatus] = useState<'checking' | 'eligible' | 'not_eligible' | 'none'>('none');
  const [requiredTokenMint, setRequiredTokenMint] = useState<string | null>(null);
  const [collectionMetadata, setCollectionMetadata] = useState<CollectionMetadata>({
    name: CANDY_MACHINE_CONFIG.COLLECTION_NAME,
    description: CANDY_MACHINE_CONFIG.COLLECTION_DESCRIPTION,
    image: CANDY_MACHINE_CONFIG.PREVIEW_IMAGE,
  });
  const [mintedNft, setMintedNft] = useState<any>(null);

  const candyMachineId = CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID;

  // Check token gate eligibility
  const checkTokenGateEligibility = async (candyMachine: any) => {
    if (!publicKey || !candyMachine.guards) return;

    try {
      // Check for token gate in guards
      const tokenGate = candyMachine.guards.tokenGate;
      if (tokenGate) {
        setTokenGateStatus('checking');
        setRequiredTokenMint(tokenGate.mint.toString());

        // Get the associated token account for the required token
        const tokenAccount = await getAssociatedTokenAddress(
          new PublicKey(tokenGate.mint),
          publicKey
        );

        try {
          // Check if user has the required token
          const account = await getAccount(connection, tokenAccount);
          const hasRequiredAmount = Number(account.amount) >= Number(tokenGate.amount || 1);
          
          setTokenGateStatus(hasRequiredAmount ? 'eligible' : 'not_eligible');
        } catch (error) {
          // Token account doesn't exist = user doesn't have the token
          setTokenGateStatus('not_eligible');
        }
      } else {
        setTokenGateStatus('none');
      }
    } catch (error) {
      console.error('Error checking token gate:', error);
      setTokenGateStatus('none');
    }
  };

  // Fetch wallet balance
  useEffect(() => {
    if (publicKey) {
      const fetchBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      };
      fetchBalance();
    }
  }, [publicKey, connection]);

  // Fetch candy machine data
  useEffect(() => {
    const fetchCandyMachineData = async () => {
      // Validate configuration first
      const configErrors = validateConfig();
      if (configErrors.length > 0) {
        setErrorMessage(`Configuration Error: ${configErrors.join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Validate that we have a proper PublicKey format before proceeding
      try {
        // Test if the candyMachineId is a valid PublicKey format
        umiPublicKey(candyMachineId);
      } catch (error) {
        console.error('Invalid Candy Machine ID format:', error);
        setErrorMessage('Invalid Candy Machine ID format. Please check your configuration.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const umi = createUmi(CANDY_MACHINE_CONFIG.RPC_URL).use(mplCandyMachine());
        
        // Convert string to Umi PublicKey
        const candyMachine = await fetchCandyMachine(umi, umiPublicKey(candyMachineId));
        
        // Extract only the essential data from the candy machine
        const data: CandyMachineData = {
          itemsRedeemed: Number(candyMachine.itemsRedeemed),
          itemsAvailable: Number(candyMachine.data.itemsAvailable),
          itemsLoaded: Number(candyMachine.itemsLoaded),
          price: 0.1, // Default price - will be updated from guards when available
          guards: null, // Will be populated when you configure guards
        };
        
        setCandyMachineData(data);

        // Fetch collection metadata if collection mint exists
        if (candyMachine.collectionMint && collectionMetadata.name === CANDY_MACHINE_CONFIG.COLLECTION_NAME) {
          try {
            const collectionAsset = await fetchDigitalAsset(umi, candyMachine.collectionMint);
            
            if (collectionAsset.metadata.uri) {
              // Fetch metadata JSON from URI
              const response = await fetch(collectionAsset.metadata.uri);
              const metadata = await response.json();
              
              setCollectionMetadata({
                name: metadata.name || collectionAsset.metadata.name || CANDY_MACHINE_CONFIG.COLLECTION_NAME,
                description: metadata.description || CANDY_MACHINE_CONFIG.COLLECTION_DESCRIPTION,
                image: metadata.image || CANDY_MACHINE_CONFIG.PREVIEW_IMAGE,
              });
            } else {
              // Use on-chain metadata if no URI
              setCollectionMetadata({
                name: collectionAsset.metadata.name || CANDY_MACHINE_CONFIG.COLLECTION_NAME,
                description: CANDY_MACHINE_CONFIG.COLLECTION_DESCRIPTION,
                image: CANDY_MACHINE_CONFIG.PREVIEW_IMAGE,
              });
            }
          } catch (metadataError) {
            console.warn('Could not fetch collection metadata, using defaults:', metadataError);
            // Keep default values from config
          }
        }
        
        // Check token gate eligibility if wallet is connected
        if (publicKey) {
          await checkTokenGateEligibility(candyMachine);
        }
      } catch (error) {
        console.error('Error fetching candy machine:', error);
        setErrorMessage('Failed to load Candy Machine data. Please check your Candy Machine ID and network connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandyMachineData();

    // Set up real-time polling for candy machine data updates
    const interval = setInterval(() => {
      if (!isMinting && isProductionMode()) { // Don't poll while minting to avoid conflicts
        fetchCandyMachineData();
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [candyMachineId, publicKey, isMinting, collectionMetadata.name]);

  // Re-check token gate when wallet connects
  useEffect(() => {
    if (publicKey && candyMachineData) {
      checkTokenGateEligibility({ guards: candyMachineData.guards });
    }
  }, [publicKey, candyMachineData]);

  const handleMint = async () => {
    if (!publicKey || !wallet) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    // Validate configuration
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
      setErrorMessage(`Configuration Error: ${configErrors.join(', ')}`);
      return;
    }

    // Validate PublicKey format before proceeding
    try {
      umiPublicKey(candyMachineId);
    } catch (error) {
      setErrorMessage('Invalid Candy Machine ID format');
      return;
    }

    setIsMinting(true);
    setMintStatus('minting');
    setErrorMessage('');

    try {
      const umi = createUmi(CANDY_MACHINE_CONFIG.RPC_URL)
        .use(mplCandyMachine())
        .use(walletAdapterIdentity(wallet.adapter));

      // Fetch the candy machine
      const candyMachine = await fetchCandyMachine(umi, umiPublicKey(candyMachineId));

      // Generate a new mint signer
      const nftMint = generateSigner(umi);

      // Create mint instruction
      const mintBuilder = mintV2(umi, {
        candyMachine: candyMachine.publicKey,
        nftMint,
        collectionMint: candyMachine.collectionMint,
        collectionUpdateAuthority: candyMachine.authority,
      });

      // Send transaction
      const result = await mintBuilder.sendAndConfirm(umi);
      
      setMintStatus('success');
      setTransactionSignature(result.signature);
      setMintedNft({
        name: `${collectionMetadata.name} #${(candyMachineData?.itemsRedeemed || 0) + 1}`,
        image: collectionMetadata.image,
        signature: result.signature,
        mint: nftMint.publicKey,
      });

      // Refresh candy machine data with simplified structure
      const updatedCandyMachine = await fetchCandyMachine(umi, umiPublicKey(candyMachineId));
      setCandyMachineData({
        itemsRedeemed: Number(updatedCandyMachine.itemsRedeemed),
        itemsAvailable: Number(updatedCandyMachine.data.itemsAvailable),
        itemsLoaded: Number(updatedCandyMachine.itemsLoaded),
        price: 0.1, // Update based on your configuration
        guards: null,
      });

    } catch (error) {
      console.error('Minting failed:', error);
      
      // Handle specific Solana errors
      let errorMsg = 'Minting failed. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMsg = 'Transaction was cancelled by user.';
        } else if (error.message.includes('insufficient funds')) {
          errorMsg = 'Insufficient SOL balance for minting.';
        } else if (error.message.includes('blockhash not found')) {
          errorMsg = 'Network congestion. Please try again.';
        } else if (error.message.includes('Transaction simulation failed')) {
          errorMsg = 'Transaction failed. Check your eligibility and balance.';
        } else {
          errorMsg = `Minting failed: ${error.message}`;
        }
      }
      
      setErrorMessage(errorMsg);
      setMintStatus('error');
    } finally {
      setIsMinting(false);
    }
  };

  const getStatusIcon = () => {
    switch (mintStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (mintStatus) {
      case 'minting':
        return 'Minting in progress...';
      case 'success':
        return 'NFT minted successfully! 🎉';
      case 'error':
        return errorMessage || 'Minting failed. Please try again.';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-white/80">Loading Candy Machine data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!candyMachineData) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">Failed to load Candy Machine data</p>
            <p className="text-white/60 text-sm mt-2">Please check your Candy Machine ID and RPC endpoint</p>
          </div>
        </div>
      </div>
    );
  }

  const itemsRemaining = candyMachineData.itemsAvailable - candyMachineData.itemsRedeemed;
  const progress = (candyMachineData.itemsRedeemed / candyMachineData.itemsAvailable) * 100;
  const isLive = true; // Simplified - always live since we removed goLiveDate
  const isSoldOut = itemsRemaining === 0;
  const isTokenGated = tokenGateStatus !== 'none';
  const canMint = !isMinting && !isSoldOut && isLive && 
                  balance >= (candyMachineData.price + 0.01) && 
                  (!isTokenGated || tokenGateStatus === 'eligible');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* NFT Preview */}
        <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="aspect-square rounded-xl overflow-hidden mb-6 shadow-lg">
              <img
                src={collectionMetadata.image}
                alt="NFT Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default image if collection image fails to load
                  (e.target as HTMLImageElement).src = CANDY_MACHINE_CONFIG.PREVIEW_IMAGE;
                }}
              />
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-light text-white mb-3 tracking-wide font-mono">
                {collectionMetadata.name}
              </h3>
              <p className="text-white/60 text-lg font-light leading-relaxed">
                {collectionMetadata.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Minting Interface */}
        <div className="space-y-6">
          {/* Collection Stats */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-400" />
                Collection Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Price</span>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-3 py-1">
                  {candyMachineData.price} SOL
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Minted</span>
                <span className="text-white font-semibold">
                  {candyMachineData.itemsRedeemed.toLocaleString()} / {candyMachineData.itemsAvailable.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Remaining</span>
                <span className="text-white font-semibold">
                  {itemsRemaining.toLocaleString()}
                </span>
              </div>
              {isTokenGated && (
                <div className="flex justify-between items-center">
                  <span className="text-white/70 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Token Gate
                  </span>
                  <Badge className={`border-0 px-3 py-1 ${
                    tokenGateStatus === 'checking' ? 'bg-yellow-500/20 text-yellow-300' :
                    tokenGateStatus === 'eligible' ? 'bg-green-500/20 text-green-300' :
                    tokenGateStatus === 'not_eligible' ? 'bg-red-500/20 text-red-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {tokenGateStatus === 'checking' ? 'Checking...' :
                     tokenGateStatus === 'eligible' ? 'Eligible ✓' :
                     tokenGateStatus === 'not_eligible' ? 'Not Eligible ✗' :
                     'None'}
                  </Badge>
                </div>
              )}
              <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Token Gate Warning */}
          {isTokenGated && tokenGateStatus === 'not_eligible' && (
            <Card className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-red-400 font-medium">Token Gate Required</p>
                    <p className="text-red-300/70 text-sm mt-1">
                      You need to hold the required token to mint from this collection.
                    </p>
                    {requiredTokenMint && (
                      <p className="text-red-300/50 text-xs mt-2 font-mono">
                        Required Token: {requiredTokenMint}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Display */}
          {mintStatus !== 'idle' && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  {mintStatus === 'minting' && <Loader2 className="w-5 h-5 animate-spin text-purple-400" />}
                  {getStatusIcon()}
                  <div className="flex-1">
                    <span className={`font-medium ${
                      mintStatus === 'success' ? 'text-green-400' : 
                      mintStatus === 'error' ? 'text-red-400' :
                      'text-purple-400'
                    }`}>
                      {getStatusMessage()}
                    </span>
                    {mintStatus === 'success' && transactionSignature && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/10 border-purple-400/50 text-purple-300 hover:bg-purple-400/20 hover:text-white backdrop-blur-sm"
                          onClick={() => window.open(`https://solscan.io/tx/${transactionSignature}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Transaction
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mint Button - simplified without goLiveDate check */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
            <CardContent className="p-8">
              {!publicKey ? (
                <div className="text-center">
                  <p className="text-white/70 mb-4">
                    Connect your wallet to start minting
                  </p>
                  <WalletConnection />
                </div>
              ) : (
                <Button
                  onClick={handleMint}
                  disabled={!canMint}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white font-semibold py-6 text-lg rounded-xl shadow-2xl border-0 transition-all duration-300 hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Minting...
                    </>
                  ) : isSoldOut ? (
                    'Sold Out'
                  ) : balance < (candyMachineData.price + 0.01) ? (
                    'Insufficient Balance'
                  ) : tokenGateStatus === 'not_eligible' ? (
                    'Token Required'
                  ) : tokenGateStatus === 'checking' ? (
                    'Checking Eligibility...'
                  ) : (
                    `Mint for ${candyMachineData.price} SOL`
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                How to Mint:
              </h4>
              <ol className="text-white/60 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-semibold">1.</span>
                  Connect your Solana wallet (Phantom, Solflare, etc.)
                </li>
                {isTokenGated && (
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-semibold">2.</span>
                    Ensure you hold the required token in your wallet
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-semibold">{isTokenGated ? '3' : '2'}.</span>
                  Ensure you have enough SOL for minting + gas fees (~0.01 SOL)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-semibold">{isTokenGated ? '4' : '3'}.</span>
                  Click the mint button when live
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-semibold">{isTokenGated ? '5' : '4'}.</span>
                  Approve the transaction in your wallet
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-semibold">{isTokenGated ? '6' : '5'}.</span>
                  Your NFT will appear in your wallet!
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}