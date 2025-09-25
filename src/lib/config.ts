// Candy Machine Configuration
export const CANDY_MACHINE_ID = process.env.NEXT_PUBLIC_CANDY_MACHINE_ID || '7fUJxMbbXNQCxuevBaibHFPwEVwjLCBYTF3QnXqcb1GU';

// Candy Machine V3 Configuration
export const CANDY_MACHINE_CONFIG = {
  CANDY_MACHINE_ID: process.env.NEXT_PUBLIC_CANDY_MACHINE_ID || '7fUJxMbbXNQCxuevBaibHFPwEVwjLCBYTF3QnXqcb1GU',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
  NETWORK: 'mainnet-beta' as const,
};

// Helper function to validate configuration
export const validateConfig = () => {
  const errors = [];
  
  if (!CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID) {
    errors.push("CANDY_MACHINE_ID is required. Please set NEXT_PUBLIC_CANDY_MACHINE_ID environment variable.");
  }
  
  if (!CANDY_MACHINE_CONFIG.RPC_URL) {
    errors.push("RPC_URL is required. Please set NEXT_PUBLIC_RPC_URL environment variable.");
  }
  
  return errors;
};

// Helper function to check if we're in production mode
export const isProductionMode = () => {
  return !!CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID && CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID.length > 0;
};