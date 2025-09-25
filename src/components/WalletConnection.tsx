'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Wallet, RefreshCw, Copy } from 'lucide-react';

export default function WalletConnection() {
  const { publicKey, wallet, disconnect, connecting, connected, wallets, select, connect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);

  const fetchBalance = async () => {
    if (!publicKey || !connection) return;
    
    setLoadingBalance(true);
    try {
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    const checkWalletEnvironment = () => {
      console.log('=== WALLET ENVIRONMENT CHECK ===');
      console.log('Window location:', window.location.href);
      console.log('Is in iframe:', window !== window.top);
      console.log('Phantom available:', !!(window as any).phantom?.solana);
      console.log('Solana available:', !!(window as any).solana);
      console.log('Available wallets:', wallets.map(w => w.adapter.name));
      console.log('================================');
    };
    
    checkWalletEnvironment();
  }, [wallets]);

  useEffect(() => {
    console.log('=== WALLET STATE UPDATE ===');
    console.log('Connected:', connected);
    console.log('Connecting:', connecting);
    console.log('Public Key:', publicKey?.toString());
    console.log('Wallet Name:', wallet?.adapter?.name);
    console.log('Balance:', balance);
    console.log('========================');
    
    if (connected && publicKey) {
      console.log('✅ Wallet is connected, fetching balance...');
      fetchBalance();
    } else {
      console.log('❌ Wallet not connected, clearing balance');
      setBalance(null);
    }
  }, [connected, publicKey, connection]);

  const handleConnect = () => {
    setShowWalletModal(true);
  };

  const handleWalletSelect = async (walletName: string) => {
    try {
      console.log('Selecting wallet:', walletName);
      setShowWalletModal(false);
      
      // Select and connect immediately
      select(walletName as any);
      
      try {
        console.log('Attempting to connect to wallet...');
        
        // Connect immediately without setTimeout
        await connect();
        console.log('Wallet connected successfully!');
        
        // Force a state update
        setTimeout(() => {
          console.log('Connection completed successfully');
        }, 500);
      } catch (connectError) {
        console.error('Connection error:', connectError);
        
        // Check if it's a user rejection
        if (connectError.message?.includes('User rejected') || connectError.code === 4001) {
          console.log('User rejected the connection request');
        } else {
          alert(`Failed to connect to ${walletName}. Error: ${connectError.message || 'Unknown error'}`);
        }
      }
      
    } catch (error) {
      console.error('Error selecting wallet:', error);
      alert(`Failed to select wallet. Error: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!connected) {
    return (
      <>
        <Button 
          onClick={handleConnect}
          disabled={connecting}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          <Wallet className="w-5 h-5 mr-2" />
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>

        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogContent className="sm:max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">Connect Wallet</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {wallets.filter(wallet => wallet.readyState === 'Installed' || wallet.readyState === 'Loadable').map((wallet) => (
                <Button
                  key={wallet.adapter.name}
                  onClick={() => handleWalletSelect(wallet.adapter.name)}
                  variant="outline"
                  className="flex items-center justify-start gap-3 h-12 bg-white/5 backdrop-blur-sm border border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 rounded-xl"
                >
                  <img 
                    src={wallet.adapter.icon} 
                    alt={wallet.adapter.name}
                    className="w-6 h-6"
                  />
                  <span className="font-medium">{wallet.adapter.name}</span>
                  {wallet.readyState === 'Installed' && (
                    <span className="ml-auto text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full">Detected</span>
                  )}
                </Button>
              ))}
              
              {wallets.filter(wallet => wallet.readyState === 'NotDetected').map((wallet) => (
                <Button
                  key={wallet.adapter.name}
                  onClick={() => window.open(wallet.adapter.url, '_blank')}
                  variant="outline"
                  className="flex items-center justify-start gap-3 h-12 bg-white/5 backdrop-blur-sm border border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white/80 transition-all duration-200 rounded-xl"
                >
                  <img 
                    src={wallet.adapter.icon} 
                    alt={wallet.adapter.name}
                    className="w-6 h-6 opacity-60"
                  />
                  <span className="font-medium">{wallet.adapter.name}</span>
                  <span className="ml-auto text-xs text-purple-400 bg-purple-400/20 px-2 py-1 rounded-full">Install</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {wallet?.adapter?.icon && (
              <img 
                src={wallet.adapter.icon} 
                alt={wallet.adapter.name}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="font-semibold text-gray-800">
              {wallet?.adapter?.name || 'Wallet'}
            </span>
          </div>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Disconnect
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Address:</span>
            <div className="flex items-center space-x-1">
              <span className="font-mono text-sm">
                {publicKey ? truncateAddress(publicKey.toString()) : ''}
              </span>
              <Button
                onClick={copyAddress}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Balance:</span>
            <div className="flex items-center space-x-2">
              {loadingBalance ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="font-semibold">
                    {balance !== null ? `${balance.toFixed(4)} SOL` : 'Error'}
                  </span>
                  <Button
                    onClick={fetchBalance}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}