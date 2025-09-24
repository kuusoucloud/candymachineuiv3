// Candy Machine V3 Configuration
export const CANDY_MACHINE_CONFIG = {
  // Replace with your actual Candy Machine Program ID from Sugar CLI
  CANDY_MACHINE_ID: "YOUR_CANDY_MACHINE_ID_HERE", // You can hardcode this directly when ready
  
  // Collection details (these will be overridden by data from the candy machine)
  COLLECTION_NAME: "NFT Collection",
  COLLECTION_DESCRIPTION: "A unique collection of digital art on the Solana blockchain",
  
  // Network settings (mainnet-beta for production)
  NETWORK: "mainnet-beta",
  RPC_URL: "https://solana-mainnet.g.alchemy.com/v2/aqcGGlkD3YbzV_epKoRtQ",
  
  // UI settings
  PREVIEW_IMAGE: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
};

// Helper function to validate configuration
export const validateConfig = () => {
  const errors = [];
  
  if (CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID === "YOUR_CANDY_MACHINE_ID_HERE") {
    errors.push("Please update the CANDY_MACHINE_ID in the config file");
  }
  
  return errors;
};