'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
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
}

export default function MintingSection() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [candyMachineData, setCandyMachineData] = useState<CandyMachineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintedNft, setMintedNft] = useState<string | null>(null);

  // Load Candy Machine data
  useEffect(() => {
    const loadCandyMachineData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID) {
          throw new Error('Candy Machine ID not configured');
        }

        // Create a simple RPC call to get account info
        const candyMachineId = new PublicKey(CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID);
        const accountInfo = await connection.getAccountInfo(candyMachineId);
        
        if (!accountInfo) {
          throw new Error('Candy Machine not found on devnet');
        }

        // For now, set mock data since we need the actual Candy Machine V3 program to parse the data
        // In a real implementation, you'd use @metaplex-foundation/mpl-candy-machine
        const mockData: CandyMachineData = {
          itemsRedeemed: 0,
          itemsAvailable: 1000,
          price: 0.1, // 0.1 SOL
          isActive: true,
          isPresale: false,
          isWhitelistOnly: false,
          goLiveDate: new Date(),
        };

        setCandyMachineData(mockData);
      } catch (err) {
        console.error('Error loading Candy Machine:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Candy Machine data');
      } finally {
        setLoading(false);
      }
    };

    loadCandyMachineData();
  }, [connection]);

  const handleMint = async () => {
    if (!connected || !publicKey || !candyMachineData) {
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
      const balance = await connection.getBalance(publicKey);
      const balanceInSol = balance / 1e9;
      
      if (balanceInSol < candyMachineData.price) {
        throw new Error(`Insufficient SOL balance. Need ${candyMachineData.price} SOL, have ${balanceInSol.toFixed(4)} SOL`);
      }

      // For devnet testing, we'll simulate a mint transaction
      // In production, you'd use @metaplex-foundation/mpl-candy-machine to create the actual mint transaction
      
      toast({
        title: "Minting NFT...",
        description: "Please confirm the transaction in your wallet",
      });

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful mint
      const mockTxId = 'mock_transaction_' + Date.now();
      setMintedNft(mockTxId);
      
      toast({
        title: "NFT Minted Successfully!",
        description: "Your NFT has been minted to your wallet",
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
          <p className="text-gray-600">Loading Candy Machine data...</p>
        </div>
      </div>
    );
  }

  if (error && !candyMachineData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Candy Machine</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="text-sm text-gray-500">
              <p><strong>Candy Machine ID:</strong> {CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID}</p>
              <p><strong>Network:</strong> {CANDY_MACHINE_CONFIG.NETWORK}</p>
              <p><strong>RPC:</strong> {CANDY_MACHINE_CONFIG.RPC_URL}</p>
            </div>
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
            {CANDY_MACHINE_CONFIG.COLLECTION_NAME}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {CANDY_MACHINE_CONFIG.COLLECTION_DESCRIPTION}
          </p>
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
                          Minting...
                        </>
                      ) : (
                        `Mint NFT for ${candyMachineData?.price || 0} SOL`
                      )}
                    </Button>
                    
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}
                    
                    {mintedNft && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-semibold mb-2">🎉 NFT Minted Successfully!</p>
                        <p className="text-green-600 text-sm mb-2">Transaction ID: {mintedNft}</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`https://explorer.solana.com/tx/${mintedNft}?cluster=devnet`, '_blank')}
                        >
                          View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debug Info */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">Debug Info</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p><strong>Candy Machine:</strong> {CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID}</p>
                <p><strong>Network:</strong> {CANDY_MACHINE_CONFIG.NETWORK}</p>
                <p><strong>RPC:</strong> {CANDY_MACHINE_CONFIG.RPC_URL}</p>
                {connected && <p><strong>Wallet:</strong> {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}