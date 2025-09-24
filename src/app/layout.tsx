import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SolanaWalletProvider from '@/components/WalletProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KUUSOU Cloud Gang PFP NFT',
  description: 'Mint your KUUSOU Cloud Gang PFP NFT on Solana',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/@solana/wallet-adapter-react-ui@0.9.35/styles.css" 
        />
      </head>
      <body className={inter.className}>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  )
}