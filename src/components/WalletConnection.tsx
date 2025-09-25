'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from './ui/button';
import { Wallet, LogOut } from 'lucide-react';

export default function WalletConnection() {
  const { connected, publicKey, disconnect } = useWallet();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20">
        <div className="flex items-center gap-2 text-white">
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-medium">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </span>
        </div>
        <Button
          onClick={disconnect}
          size="sm"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8"
        >
          <LogOut className="h-3 w-3 mr-1" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="wallet-adapter-button-trigger">
      <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !border-0 !rounded-lg !font-semibold !px-6 !py-3 !text-white !transition-all !duration-200 hover:!scale-105" />
    </div>
  );
}