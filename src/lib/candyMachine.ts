import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { 
  fetchCandyMachine, 
  mintV1,
  CandyMachine,
  safeFetchCandyGuard,
  DefaultGuardSetMintArgs,
  some,
  none,
} from '@metaplex-foundation/mpl-candy-machine-core';
import { 
  generateSigner, 
  transactionBuilder, 
  publicKey as umiPublicKey,
  sol,
  lamports,
  Umi,
  PublicKey as UmiPublicKey,
  TransactionBuilder,
} from '@metaplex-foundation/umi';
import { 
  fetchDigitalAsset, 
  mplTokenMetadata 
} from '@metaplex-foundation/mpl-token-metadata';
import { WalletAdapter } from '@solana/wallet-adapter-base';
import { CANDY_MACHINE_CONFIG } from './config';

export interface CandyMachineData {
  address: string;
  itemsRedeemed: bigint;
  itemsAvailable: bigint;
  itemsLoaded: bigint;
  isFullyLoaded: boolean;
  authority: string;
  mintAuthority: string;
  collectionMint: string;
  symbol: string;
  maxEditionSupply: bigint;
  isMutable: boolean;
  creators: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
  configLineSettings?: {
    prefixName: string;
    nameLength: number;
    prefixUri: string;
    uriLength: number;
    isSequential: boolean;
  };
  hiddenSettings?: {
    name: string;
    uri: string;
    hash: Uint8Array;
  };
}

export interface CandyGuardData {
  address: string;
  base: string;
  bump: number;
  authority: string;
  guards: any; // This will contain the specific guard configurations
}

export interface MintResult {
  success: boolean;
  signature?: string;
  mint?: string;
  error?: string;
}

// Initialize UMI instance
export function createUmiInstance(wallet?: WalletAdapter): Umi {
  const umi = createUmi(CANDY_MACHINE_CONFIG.RPC_URL)
    .use(mplTokenMetadata());

  if (wallet) {
    umi.use(walletAdapterIdentity(wallet));
  }

  return umi;
}

// Fetch Candy Machine data
export async function fetchCandyMachineData(umi: Umi): Promise<CandyMachineData> {
  try {
    const candyMachinePublicKey = umiPublicKey(CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID);
    const candyMachine = await fetchCandyMachine(umi, candyMachinePublicKey);

    return {
      address: candyMachine.publicKey,
      itemsRedeemed: candyMachine.itemsRedeemed,
      itemsAvailable: candyMachine.data.itemsAvailable,
      itemsLoaded: candyMachine.itemsLoaded,
      isFullyLoaded: candyMachine.itemsLoaded >= candyMachine.data.itemsAvailable,
      authority: candyMachine.authority,
      mintAuthority: candyMachine.mintAuthority,
      collectionMint: candyMachine.collectionMint,
      symbol: candyMachine.data.symbol,
      maxEditionSupply: candyMachine.data.maxEditionSupply,
      isMutable: candyMachine.data.isMutable,
      creators: candyMachine.data.creators.map(creator => ({
        address: creator.address,
        verified: creator.verified,
        share: creator.percentageShare,
      })),
      configLineSettings: candyMachine.data.configLineSettings ? {
        prefixName: candyMachine.data.configLineSettings.prefixName,
        nameLength: candyMachine.data.configLineSettings.nameLength,
        prefixUri: candyMachine.data.configLineSettings.prefixUri,
        uriLength: candyMachine.data.configLineSettings.uriLength,
        isSequential: candyMachine.data.configLineSettings.isSequential,
      } : undefined,
      hiddenSettings: candyMachine.data.hiddenSettings ? {
        name: candyMachine.data.hiddenSettings.name,
        uri: candyMachine.data.hiddenSettings.uri,
        hash: candyMachine.data.hiddenSettings.hash,
      } : undefined,
    };
  } catch (error) {
    console.error('Error fetching candy machine:', error);
    throw new Error(`Failed to fetch candy machine: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fetch Candy Guard data
export async function fetchCandyGuardData(umi: Umi): Promise<CandyGuardData | null> {
  try {
    const candyMachinePublicKey = umiPublicKey(CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID);
    const candyGuard = await safeFetchCandyGuard(umi, candyMachinePublicKey);
    
    if (!candyGuard) {
      return null;
    }

    return {
      address: candyGuard.publicKey,
      base: candyGuard.base,
      bump: candyGuard.bump,
      authority: candyGuard.authority,
      guards: candyGuard.guards,
    };
  } catch (error) {
    console.error('Error fetching candy guard:', error);
    return null;
  }
}

// Check if minting is allowed
export async function checkMintEligibility(
  umi: Umi, 
  candyMachine: CandyMachineData,
  candyGuard: CandyGuardData | null
): Promise<{ canMint: boolean; reason?: string; price?: number }> {
  try {
    // Check if there are items available
    if (candyMachine.itemsRedeemed >= candyMachine.itemsAvailable) {
      return { canMint: false, reason: 'Sold out' };
    }

    // Check if candy machine is fully loaded
    if (!candyMachine.isFullyLoaded) {
      return { canMint: false, reason: 'Candy machine not fully loaded' };
    }

    let price = 0;

    // Check guards if they exist
    if (candyGuard && candyGuard.guards) {
      const guards = candyGuard.guards;

      // Check SOL payment guard
      if (guards.solPayment && guards.solPayment.__option === 'Some') {
        price = Number(guards.solPayment.value.lamports) / 1e9; // Convert lamports to SOL
      }

      // Check start date guard
      if (guards.startDate && guards.startDate.__option === 'Some') {
        const startDate = new Date(Number(guards.startDate.value.date) * 1000);
        if (Date.now() < startDate.getTime()) {
          return { canMint: false, reason: `Minting starts at ${startDate.toLocaleString()}` };
        }
      }

      // Check end date guard
      if (guards.endDate && guards.endDate.__option === 'Some') {
        const endDate = new Date(Number(guards.endDate.value.date) * 1000);
        if (Date.now() > endDate.getTime()) {
          return { canMint: false, reason: 'Minting period has ended' };
        }
      }

      // Check mint limit guard
      if (guards.mintLimit && guards.mintLimit.__option === 'Some') {
        // This would require checking how many the user has already minted
        // For now, we'll assume they can mint
      }

      // Check allow list guard
      if (guards.allowList && guards.allowList.__option === 'Some') {
        // This would require checking if the user is on the allow list
        // For now, we'll assume they can mint
      }
    }

    return { canMint: true, price };
  } catch (error) {
    console.error('Error checking mint eligibility:', error);
    return { canMint: false, reason: 'Error checking eligibility' };
  }
}

// Mint NFT
export async function mintNFT(umi: Umi, wallet: WalletAdapter): Promise<MintResult> {
  try {
    console.log('Starting mint process...');
    
    // Generate a new mint signer
    const nftMint = generateSigner(umi);
    console.log('Generated NFT mint:', nftMint.publicKey);

    const candyMachinePublicKey = umiPublicKey(CANDY_MACHINE_CONFIG.CANDY_MACHINE_ID);
    
    // Fetch candy machine and guard data
    const candyMachine = await fetchCandyMachineData(umi);
    const candyGuard = await fetchCandyGuardData(umi);
    
    // Check eligibility
    const eligibility = await checkMintEligibility(umi, candyMachine, candyGuard);
    if (!eligibility.canMint) {
      throw new Error(eligibility.reason || 'Cannot mint');
    }

    console.log('Mint eligibility check passed');

    // Prepare mint arguments
    const mintArgs: DefaultGuardSetMintArgs = {};

    // Add SOL payment if required
    if (candyGuard?.guards?.solPayment && candyGuard.guards.solPayment.__option === 'Some') {
      mintArgs.solPayment = some({
        destination: umiPublicKey(candyGuard.guards.solPayment.value.destination),
      });
    }

    // Build the mint transaction
    const mintTx = await transactionBuilder()
      .add(
        mintV1(umi, {
          candyMachine: candyMachinePublicKey,
          nftMint,
          collectionMint: umiPublicKey(candyMachine.collectionMint),
          collectionUpdateAuthority: umiPublicKey(candyMachine.authority),
          mintArgs,
        })
      );

    console.log('Built mint transaction');

    // Send and confirm the transaction
    const result = await mintTx.sendAndConfirm(umi, {
      confirm: { commitment: 'confirmed' },
    });

    console.log('Mint transaction confirmed:', result.signature);

    return {
      success: true,
      signature: result.signature,
      mint: nftMint.publicKey,
    };

  } catch (error) {
    console.error('Mint error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown minting error',
    };
  }
}

// Get minted NFT metadata
export async function getMintedNFTData(umi: Umi, mintAddress: string) {
  try {
    const digitalAsset = await fetchDigitalAsset(umi, umiPublicKey(mintAddress));
    return {
      name: digitalAsset.metadata.name,
      symbol: digitalAsset.metadata.symbol,
      uri: digitalAsset.metadata.uri,
      mint: digitalAsset.publicKey,
      updateAuthority: digitalAsset.metadata.updateAuthority,
    };
  } catch (error) {
    console.error('Error fetching NFT data:', error);
    return null;
  }
}