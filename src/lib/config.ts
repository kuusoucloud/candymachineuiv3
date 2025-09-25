// Candy Machine V3 Configuration for Devnet
export const CANDY_MACHINE_CONFIG = {
  CANDY_MACHINE_ID: 'DAkeJ58KaDE64QxgXxe2Kc4hCQuzYSF8oNuuWVhgQfBS',
  RPC_URL: 'https://solana-devnet.g.alchemy.com/v2/aqcGGlkD3YbzV_epKoRtQ',
  NETWORK: 'devnet' as const,
  // Collection metadata defaults
  COLLECTION_NAME: 'KUUSOU Cloud Gang',
  COLLECTION_DESCRIPTION: 'A unique NFT collection featuring adorable cloud characters on Solana',
  PREVIEW_IMAGE: '/kuusou-nft.png',
};

// Helper function to validate configuration
export const validateConfig = () => {
  const errors = [];
  
  if (!CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID) {
    errors.push("CANDY_MACHINE_ID is required.");
  }
  
  if (!CANDY_MACHINE_CONFIG.RPC_URL) {
    errors.push("RPC_URL is required.");
  }
  
  return errors;
};

// Helper function to check if we're in production mode
export const isProductionMode = () => {
  return !!CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID && CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID.length > 0;
};