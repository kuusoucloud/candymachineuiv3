'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from './ui/use-toast';
import {
  createUmiInstance,
  fetchCandyMachineData,
  fetchCandyGuardData,
  checkMintEligibility,
  mintNFT,
  getMintedNFTData,
  CandyMachineData,
  CandyGuardData,
  MintResult,
} from '@/lib/candyMachine';
import { CANDY_MACHINE_CONFIG } from '@/lib/config';

export default function MintingSection() {
  const { publicKey: walletPublicKey, connected, wallet } = useWallet();
  const { connection } = useConnection();
  
  const [candyMachineData, setCandyMachineData] = useState<CandyMachineData | null>(null);
  const [candyGuardData, setCandyGuardData] = useState<CandyGuardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [eligibility, setEligibility] = useState<{ canMint: boolean; reason?: string; price?: number } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Load Candy Machine data
  useEffect(() => {
    const loadCandyMachineData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🚀 Loading Candy Machine data...');
        console.log('Candy Machine ID:', CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID);
        console.log('RPC URL:', CANDY_MACHINE_CONFIG.RPC_URL);

        const umi = createUmiInstance(wallet?.adapter || undefined);
        
        // Fetch candy machine data
        const cmData = await fetchCandyMachineData(umi);
        setCandyMachineData(cmData);
        console.log('✅ Candy Machine data loaded:', cmData);

        // Fetch candy guard data
        const cgData = await fetchCandyGuardData(umi);
        setCandyGuardData(cgData);
        console.log('✅ Candy Guard data loaded:', cgData);

        // Check mint eligibility
        const eligibilityCheck = await checkMintEligibility(umi, cmData, cgData);
        setEligibility(eligibilityCheck);
        console.log('✅ Eligibility check:', eligibilityCheck);

      } catch (err) {
        console.error('❌ Error loading Candy Machine:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Candy Machine data';
        setError(errorMessage);
        toast({
          title: "Failed to load Candy Machine",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCandyMachineData();
  }, [wallet]);

  // Load wallet balance
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!connected || !walletPublicKey) {
        setWalletBalance(0);
        return;
      }

      try {
        const balance = await connection.getBalance(walletPublicKey);
        setWalletBalance(balance / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error('Error loading wallet balance:', err);
        setWalletBalance(0);
      }
    };

    loadWalletBalance();
  }, [connected, walletPublicKey, connection]);

  const handleMint = async () => {
    if (!connected || !walletPublicKey || !wallet?.adapter) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint NFTs",
        variant: "destructive",
      });
      return;
    }

    if (!eligibility?.canMint) {
      toast({
        title: "Cannot mint",
        description: eligibility?.reason || "Minting not available",
        variant: "destructive",
      });
      return;
    }

    // Check SOL balance
    if (eligibility.price && walletBalance < eligibility.price) {
      toast({
        title: "Insufficient balance",
        description: `You need ${eligibility.price} SOL but only have ${walletBalance.toFixed(4)} SOL`,
        variant: "destructive",
      });
      return;
    }

    try {
      setMinting(true);
      setError(null);
      setMintResult(null);

      toast({
        title: "Minting NFT...",
        description: "Please confirm the transaction in your wallet",
      });

      const umi = createUmiInstance(wallet.adapter);
      const result = await mintNFT(umi, wallet.adapter);

      setMintResult(result);

      if (result.success) {
        toast({
          title: "🎉 NFT Minted Successfully!",
          description: `Transaction: ${result.signature?.slice(0, 8)}...`,
        });

        // Refresh candy machine data
        const updatedCmData = await fetchCandyMachineData(umi);
        setCandyMachineData(updatedCmData);

        // Refresh wallet balance
        const balance = await connection.getBalance(walletPublicKey);
        setWalletBalance(balance / LAMPORTS_PER_SOL);
      } else {
        toast({
          title: "Minting Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }

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
      <div className="flex items-center justify-center min-h-[400px] bg-white/10 backdrop-blur-lg rounded-xl">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading Candy Machine...</p>
          <p className="text-sm opacity-75 mt-2">Connecting to Solana devnet</p>
        </div>
      </div>
    );
  }

  if (error && !candyMachineData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Failed to Load Candy Machine
            </CardTitle>
          </CardHeader>
          <CardContent className="text-white">
            <p className="mb-4">{error}</p>
            <div className="text-sm opacity-75 space-y-1">
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
    <div className="max-w-6xl mx-auto">
      {/* Success Banner */}
      {candyMachineData && (
        <div className="mb-8 p-4 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-lg">
          <div className="flex items-center gap-2 text-green-300">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">✅ Candy Machine Connected Successfully!</span>
          </div>
          <p className="text-green-200 text-sm mt-1">
            Found {Number(candyMachineData.itemsAvailable)} total items, {Number(candyMachineData.itemsRedeemed)} minted
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* NFT Preview */}
        <div className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                <img 
                  src={CANDY_MACHINE_CONFIG.PREVIEW_IMAGE} 
                  alt="NFT Preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                  }}
                />
              </div>
              <div className="text-center text-white">
                <h3 className="text-xl font-semibold mb-2">{CANDY_MACHINE_CONFIG.COLLECTION_NAME}</h3>
                <p className="opacity-75">{CANDY_MACHINE_CONFIG.COLLECTION_DESCRIPTION}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Minting Interface */}
        <div className="space-y-6">
          {/* Collection Stats */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Collection Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-white">
              {candyMachineData && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="opacity-75">Price</span>
                    <Badge variant="secondary" className="text-lg font-semibold bg-white/20">
                      {eligibility?.price || 0} SOL
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-75">Minted</span>
                    <span className="font-semibold">
                      {Number(candyMachineData.itemsRedeemed)} / {Number(candyMachineData.itemsAvailable)}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(Number(candyMachineData.itemsRedeemed) / Number(candyMachineData.itemsAvailable)) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-75">Status</span>
                    <Badge variant={eligibility?.canMint ? "default" : "secondary"} className="bg-white/20">
                      {eligibility?.canMint ? "Live" : eligibility?.reason || "Not Available"}
                    </Badge>
                  </div>
                  {connected && (
                    <div className="flex justify-between items-center">
                      <span className="opacity-75">Your Balance</span>
                      <span className="font-semibold">{walletBalance.toFixed(4)} SOL</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Mint Button */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              {!connected ? (
                <div className="text-center text-white">
                  <p className="mb-4 opacity-75">Connect your wallet to mint NFTs</p>
                  <Button disabled className="w-full h-12 text-lg">
                    Connect Wallet First
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button 
                    onClick={handleMint}
                    disabled={minting || !eligibility?.canMint}
                    className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {minting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      `Mint NFT for ${eligibility?.price || 0} SOL`
                    )}
                  </Button>
                  
                  {!eligibility?.canMint && eligibility?.reason && (
                    <div className="p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                      <p className="text-yellow-200 text-sm">{eligibility.reason}</p>
                    </div>
                  )}
                  
                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}
                  
                  {mintResult?.success && (
                    <div className="p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
                      <p className="text-green-200 font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        🎉 NFT Minted Successfully!
                      </p>
                      {mintResult.signature && (
                        <div className="space-y-2">
                          <p className="text-green-300 text-sm">
                            <strong>Transaction:</strong> {mintResult.signature.slice(0, 8)}...{mintResult.signature.slice(-8)}
                          </p>
                          <a
                            href={`https://explorer.solana.com/tx/${mintResult.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-green-300 hover:text-green-200 text-sm underline"
                          >
                            View on Solana Explorer <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {mintResult.mint && (
                        <p className="text-green-300 text-sm">
                          <strong>NFT Mint:</strong> {mintResult.mint.slice(0, 8)}...{mintResult.mint.slice(-8)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Info */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-white/75">Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-white/60">
              <p><strong>Candy Machine:</strong> {CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID}</p>
              <p><strong>Network:</strong> {CANDY_MACHINE_CONFIG.NETWORK}</p>
              <p><strong>Program:</strong> Candy Machine Core (Sugar CLI 2.8.1)</p>
              {connected && <p><strong>Wallet:</strong> {walletPublicKey?.toString().slice(0, 8)}...{walletPublicKey?.toString().slice(-8)}</p>}
              {candyMachineData && (
                <>
                  <p><strong>Collection:</strong> {candyMachineData.collectionMint.slice(0, 8)}...{candyMachineData.collectionMint.slice(-8)}</p>
                  <p><strong>Authority:</strong> {candyMachineData.authority.slice(0, 8)}...{candyMachineData.authority.slice(-8)}</p>
                  <p><strong>Fully Loaded:</strong> {candyMachineData.isFullyLoaded ? 'Yes' : 'No'}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}