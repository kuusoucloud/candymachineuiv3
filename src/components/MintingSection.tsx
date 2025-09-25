'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, ExternalLink } from 'lucide-react';
import { CANDY_MACHINE_CONFIG } from '@/lib/config';
import { toast } from './ui/use-toast';

interface CandyMachineData {
  itemsRedeemed: number;
  itemsAvailable: number;
  price: number;
  goLiveDate?: Date;
  endDate?: Date;
  isActive: boolean;
  isPresale: boolean;
  isWhitelistOnly: boolean;
  collectionName?: string;
  symbol?: string;
}

export default function MintingSection() {
  const { publicKey: walletPublicKey, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const [candyMachineData, setCandyMachineData] = useState<CandyMachineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintedNft, setMintedNft] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Load Candy Machine data
  useEffect(() => {
    const loadCandyMachineData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID) {
          throw new Error('Candy Machine ID not configured');
        }

        console.log('=== CANDY MACHINE DEBUG ===');
        console.log('Candy Machine ID:', CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID);
        console.log('RPC URL:', CANDY_MACHINE_CONFIG.RPC_URL);
        console.log('Network:', CANDY_MACHINE_CONFIG.NETWORK);

        // Convert string to PublicKey
        const candyMachineId = new PublicKey(CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID);
        
        console.log('Checking account info...');
        
        // First check if account exists
        const accountInfo = await connection.getAccountInfo(candyMachineId);
        
        if (!accountInfo) {
          throw new Error(`Candy Machine account ${CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID} does not exist on ${CANDY_MACHINE_CONFIG.NETWORK}`);
        }

        console.log('✅ Account exists!');
        console.log('Owner:', accountInfo.owner.toString());
        console.log('Data length:', accountInfo.data.length);
        console.log('Executable:', accountInfo.executable);
        console.log('Lamports:', accountInfo.lamports);

        // Check if it's the correct program
        const CANDY_MACHINE_V2_PROGRAM = 'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ';
        const CANDY_MACHINE_CORE_PROGRAM = 'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR';
        
        const isV2Program = accountInfo.owner.toString() === CANDY_MACHINE_V2_PROGRAM;
        const isCoreProgram = accountInfo.owner.toString() === CANDY_MACHINE_CORE_PROGRAM;
        
        console.log('Is Candy Machine V2 Program:', isV2Program);
        console.log('Is Candy Machine Core Program:', isCoreProgram);

        // Try to parse basic data from the raw account
        let parsedData: CandyMachineData;
        
        if (isV2Program || isCoreProgram) {
          // For now, let's show that we found the account and use some estimated data
          // In a real implementation, you'd need to properly deserialize the account data
          parsedData = {
            itemsRedeemed: 0, // Would need to parse from account data
            itemsAvailable: 1000, // Would need to parse from account data
            price: 0.1, // Would need to parse from account data
            isActive: true,
            isPresale: false,
            isWhitelistOnly: false,
            collectionName: CANDY_MACHINE_CONFIG.COLLECTION_NAME,
            symbol: 'KUUSOU',
          };
        } else {
          throw new Error(`Unknown program owner: ${accountInfo.owner.toString()}`);
        }

        console.log('✅ Successfully parsed basic data:', parsedData);
        setCandyMachineData(parsedData);

        setDebugInfo({
          accountExists: true,
          owner: accountInfo.owner.toString(),
          dataLength: accountInfo.data.length,
          executable: accountInfo.executable,
          lamports: accountInfo.lamports,
          programType: isV2Program ? 'Candy Machine V2' : isCoreProgram ? 'Candy Machine Core' : 'Unknown',
          candyMachineId: CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID,
          rpcUrl: CANDY_MACHINE_CONFIG.RPC_URL,
          network: CANDY_MACHINE_CONFIG.NETWORK,
          rawDataPreview: accountInfo.data.slice(0, 100).toString('hex'), // First 100 bytes as hex
        });

      } catch (err) {
        console.error('❌ Error loading Candy Machine:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Candy Machine data';
        setError(errorMessage);
        
        setDebugInfo({
          error: errorMessage,
          candyMachineId: CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID,
          rpcUrl: CANDY_MACHINE_CONFIG.RPC_URL,
          network: CANDY_MACHINE_CONFIG.NETWORK,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    loadCandyMachineData();
  }, [connection]);

  const handleMint = async () => {
    if (!connected || !walletPublicKey || !candyMachineData) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint NFTs",
        variant: "destructive",
      });
      return;
    }

    try {
      setMinting(true);
      setError(null);

      // Check SOL balance
      const balance = await connection.getBalance(walletPublicKey);
      const balanceInSol = balance / LAMPORTS_PER_SOL;
      
      if (balanceInSol < candyMachineData.price) {
        throw new Error(`Insufficient SOL balance. Need ${candyMachineData.price} SOL, have ${balanceInSol.toFixed(4)} SOL`);
      }

      toast({
        title: "Minting NFT...",
        description: "This is a demo - real minting requires proper SDK integration",
      });

      // Simulate minting for now
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockTxId = 'demo_transaction_' + Date.now();
      setMintedNft(mockTxId);
      
      toast({
        title: "Demo Mint Complete!",
        description: "This was a simulation - integrate proper minting SDK for real functionality",
      });

      // Update candy machine data
      setCandyMachineData(prev => prev ? {
        ...prev,
        itemsRedeemed: prev.itemsRedeemed + 1
      } : null);

    } catch (err) {
      console.error('Minting error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint NFT';
      setError(errorMessage);
      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking Candy Machine account...</p>
          <p className="text-sm text-gray-400 mt-2">ID: {CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID}</p>
          <p className="text-sm text-gray-400">RPC: {CANDY_MACHINE_CONFIG.RPC_URL}</p>
        </div>
      </div>
    );
  }

  if (error && !candyMachineData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-red-600">Candy Machine Account Check</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Candy Machine ID:</strong> {CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID}</p>
              <p><strong>Network:</strong> {CANDY_MACHINE_CONFIG.NETWORK}</p>
              <p><strong>RPC:</strong> {CANDY_MACHINE_CONFIG.RPC_URL}</p>
            </div>
            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <p><strong>Debug Info:</strong></p>
                <pre className="whitespace-pre-wrap overflow-auto max-h-64">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {candyMachineData?.collectionName || CANDY_MACHINE_CONFIG.COLLECTION_NAME}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {CANDY_MACHINE_CONFIG.COLLECTION_DESCRIPTION}
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              ✅ Candy Machine account found: {CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* NFT Preview */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <img 
                    src={CANDY_MACHINE_CONFIG.PREVIEW_IMAGE} 
                    alt="NFT Preview"
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                    }}
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Preview NFT</h3>
                  <p className="text-gray-600">Each NFT is unique and randomly generated</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Minting Interface */}
          <div className="space-y-6">
            {/* Collection Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candyMachineData && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price</span>
                      <Badge variant="secondary" className="text-lg font-semibold">
                        {candyMachineData.price} SOL
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Minted</span>
                      <span className="font-semibold">
                        {candyMachineData.itemsRedeemed} / {candyMachineData.itemsAvailable}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(candyMachineData.itemsRedeemed / candyMachineData.itemsAvailable) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      <Badge variant={candyMachineData.isActive ? "default" : "secondary"}>
                        {candyMachineData.isActive ? "Live" : "Not Active"}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Mint Button */}
            <Card>
              <CardContent className="p-6">
                {!connected ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Connect your wallet to mint NFTs</p>
                    <Button disabled className="w-full">
                      Connect Wallet First
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      onClick={handleMint}
                      disabled={minting || !candyMachineData?.isActive}
                      className="w-full h-12 text-lg"
                    >
                      {minting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Demo Minting...
                        </>
                      ) : (
                        `Demo Mint for ${candyMachineData?.price || 0} SOL`
                      )}
                    </Button>
                    
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ This is currently a demo. Real minting requires proper SDK integration with your specific Candy Machine version.
                      </p>
                    </div>
                    
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}
                    
                    {mintedNft && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-semibold mb-2">🎉 Demo Mint Complete!</p>
                        <p className="text-green-600 text-sm mb-2">Demo Transaction ID: {mintedNft}</p>
                        <p className="text-green-600 text-xs">Note: This was a simulation for UI testing</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debug Info */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">Candy Machine Account Info</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p><strong>Candy Machine:</strong> {CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID}</p>
                <p><strong>Network:</strong> {CANDY_MACHINE_CONFIG.NETWORK}</p>
                <p><strong>RPC:</strong> {CANDY_MACHINE_CONFIG.RPC_URL}</p>
                {connected && <p><strong>Wallet:</strong> {walletPublicKey?.toString().slice(0, 8)}...{walletPublicKey?.toString().slice(-8)}</p>}
                {debugInfo && (
                  <div className="mt-2 p-2 bg-white rounded text-xs">
                    <p><strong>Account Status:</strong></p>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-48">{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}