# Candy Machine V3 Minting UI

A simple, clean Next.js application for minting NFTs using Solana's Candy Machine V3 on mainnet.

## Features

- 🔗 Wallet connection with popular Solana wallets (Phantom, Solflare, etc.)
- 💰 Real-time balance checking and validation
- 🎨 Clean, responsive UI with Tailwind CSS
- 🚀 Optimized for Vercel deployment
- 🔒 Mainnet-ready with proper error handling
- 📱 Mobile-friendly design

## Environment Variables for Vercel

Set these environment variables in your Vercel dashboard:

```env
NEXT_PUBLIC_CANDY_MACHINE_PROGRAM_ID=your_candy_machine_program_id_here
NEXT_PUBLIC_SOLANA_RPC_URL=your_mainnet_rpc_url_here
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_CANDY_MACHINE_PROGRAM_ID` - Your Candy Machine Program ID
   - `NEXT_PUBLIC_SOLANA_RPC_URL` - Your mainnet RPC endpoint
4. Deploy!

## Candy Machine Setup

To create your Candy Machine V3:

1. Install Sugar CLI:
```bash
npm install -g @metaplex-foundation/sugar
```

2. Create your collection assets and metadata
3. Configure your `config.json`
4. Deploy with Sugar:
```bash
sugar deploy
```

5. Update your environment variables with the Candy Machine Program ID

## Configuration

Edit `src/lib/config.ts` to customize:
- Collection name and description
- Mint price
- Total supply
- Preview images
- Go-live date

## Wallet Support

- Phantom
- Solflare
- Torus
- Ledger
- And more via Solana Wallet Adapter

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Solana Web3.js
- Metaplex Candy Machine V3
- Solana Wallet Adapter
- Radix UI Components

## License

MIT