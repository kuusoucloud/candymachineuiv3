'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { CANDY_MACHINE_CONFIG } from '@/lib/config';

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  // Use devnet since your Candy Machine is on devnet
  const network = WalletAdapterNetwork.Devnet;
  
  const endpoint = useMemo(() => {
    // Use the RPC URL from config or fallback to devnet
    return CANDY_MACHINE_CONFIG.RPC_URL || clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  console.log('=== WALLET PROVIDER CONFIG ===');
  console.log('Network:', network);
  console.log('RPC Endpoint:', endpoint);
  console.log('Available wallets:', wallets.map(w => w.name));
  console.log('==============================');

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={true}>
        {children}
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}