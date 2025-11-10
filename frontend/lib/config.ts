// Stealthyield Configuration
// Architecture: Token 2022 + Offchain Distribution (like SORE)
export const config = {
  // Solana Network
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet',
  rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://mainnet.helius-rpc.com/?api-key=ffddb707-229a-42ff-b334-42e983de9db8',
  
  // Wallets (Dual-wallet mode)
  deployerAddress: 'GzV4DVTaZJuPXjJS5o57m85PEJRKDaFubFw2pYCPqWPY', // Operations
  motherWombAddress: '5kegRGctwKkdvytig8CeCAzuBQWivTvEtgyePtyVcgtk', // SOL reward pool
  
  // Token (update after creation)
  tokenMint: process.env.NEXT_PUBLIC_TOKEN_MINT || '',
  raydiumPool: process.env.NEXT_PUBLIC_RAYDIUM_POOL || '',
  
  // Note: No custom program needed! Using Token 2022 only
  
  // Economic Parameters
  dailyEmission: 500_000, // 500K STYD per day
  emissionPerInterval: 3_472, // Per 10 minutes
  milkerThreshold: 500, // 500 STYD minimum
  breederThreshold: 1_000, // 1000 STYD minimum
  tariffRate: 5, // 5% transaction tax
  burnRate: 30, // 30% of tariff burned
  seedRate: 70, // 70% of tariff to SOL
  
  // Halving Thresholds
  halvingThresholds: [
    2_500_000,
    5_000_000,
    7_500_000,
    10_000_000,
    12_500_000,
  ],
} as const;

