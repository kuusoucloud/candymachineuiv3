// Candy Machine V3 Configuration
export const CANDY_MACHINE_CONFIG = {
  // Replace with your actual Candy Machine Program ID from Sugar CLI
  // Example: "7nE1GmnMmDKiycFkpHF7mKtxt356FQzVonwqBTCc6C1o"
  CANDY_MACHINE_ID: process.env.NEXT_PUBLIC_CANDY_MACHINE_ID || "", // Use environment variable for security
  
  // Collection details (these will be overridden by data from the candy machine)
  COLLECTION_NAME: "NFT Collection",
  COLLECTION_DESCRIPTION: "A unique collection of digital art on the Solana blockchain",
  
  // Network settings (mainnet-beta for production)
  NETWORK: "mainnet-beta",
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com",
  
  // UI settings
  PREVIEW_IMAGE: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
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