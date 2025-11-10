/**
 * Distribute STYD Rewards - Offchain Script
 * 
 * Simulates MotherNode emission and distributes rewards to Milkers/Breeders
 * Run this script every 10 minutes (or any interval you choose)
 */

const { 
  Connection, 
  Keypair, 
  Transaction,
  PublicKey,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');

const {
  TOKEN_2022_PROGRAM_ID,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
} = require('@solana/spl-token');

const fs = require('fs');

// Configuration
const CONFIG = {
  DAILY_EMISSION: 500_000, // 500K STYD per day
  EMISSION_PER_10MIN: 3_472, // 500K ÷ 144
  MILKER_THRESHOLD: 500, // Dynamic: 500 → 1K → 2K...
  BREEDER_THRESHOLD: 1_000, // Dynamic: 1K → 2K → 4K...
  MILKER_SHARE: 0.5, // 50% to Milkers
  BREEDER_SHARE: 0.5, // 50% to Breeders
  HALVING_THRESHOLDS: [2.5e6, 5e6, 7.5e6, 10e6, 12.5e6],
  PHASE_THRESHOLDS: [2.5e6, 5e6, 7.5e6], // SOL unlock phases
  SOL_PERCENTAGES: [0, 5, 15, 50], // 0% → 5% → 15% → 50%
};

async function distributeRewards() {
  console.log('\n🎯 STYD Reward Distribution\n');
  console.log('Time:', new Date().toISOString());
  
  // Load wallet from environment variable
  const walletPath = process.env.DEPLOYER_WALLET_PATH;
  
  if (!walletPath) {
    throw new Error('DEPLOYER_WALLET_PATH environment variable not set');
  }
  
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet file not found: ${walletPath}`);
  }
  
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath)))
  );
  
  const tokenInfo = JSON.parse(fs.readFileSync('./styd-token-info.json'));
  const mintAddress = new PublicKey(tokenInfo.mint);
  
  console.log('Authority:', walletKeypair.publicKey.toString());
  console.log('Token Mint:', mintAddress.toString());
  
  // Connect
  const connection = new Connection(
    process.env.RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );
  
  // Get current state (load from state file)
  let state = loadState();
  
  // Calculate current emission rate based on supply
  const currentEmissionRate = calculateEmissionRate(state.totalSupply);
  const emissionAmount = currentEmissionRate;
  
  console.log('\n📊 Current State:');
  console.log('  Total Supply:', (state.totalSupply / 1e9).toFixed(2), 'M STYD');
  console.log('  Halving Count:', state.halvingCount);
  console.log('  Reward Phase:', state.rewardPhase);
  console.log('  Emission Rate:', currentEmissionRate, 'STYD per 10min\n');
  
  // Fetch all holders (in production, query from RPC or indexer)
  const holders = await fetchHolders(connection, mintAddress);
  
  // Separate Milkers and Breeders
  const milkers = holders.filter(h => 
    h.balance >= CONFIG.MILKER_THRESHOLD * 1e9 && 
    !h.hasLP
  );
  
  const breeders = holders.filter(h => 
    h.balance >= CONFIG.BREEDER_THRESHOLD * 1e9 && 
    h.hasLP
  );
  
  console.log('👥 Participants:');
  console.log('  Milkers:', milkers.length);
  console.log('  Breeders:', breeders.length, '\n');
  
  // Calculate rewards
  const milkerEmission = emissionAmount * CONFIG.MILKER_SHARE;
  const breederEmission = emissionAmount * CONFIG.BREEDER_SHARE;
  
  console.log('🎁 This Emission:');
  console.log('  To Milkers:', milkerEmission, 'STYD (50%)');
  console.log('  To Breeders:', breederEmission, 'STYD (50%)\n');
  
  // Distribute to Milkers
  const milkerRewards = calculateMilkerRewards(milkers, milkerEmission);
  
  // Distribute to Breeders (STYD + SOL from MotherWomb)
  const breederRewards = calculateBreederRewards(
    breeders, 
    breederEmission,
    state.rewardPhase
  );
  
  // Load MotherWomb wallet for SOL distribution
  const motherWombPath = process.env.MOTHERWOMB_WALLET_PATH || config.wallets.motherwomb.path;
  let motherWombKeypair = null;
  
  if (fs.existsSync(motherWombPath)) {
    motherWombKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(motherWombPath)))
    );
    console.log('MotherWomb:', motherWombKeypair.publicKey.toString());
  }
  
  // Build batch transaction
  console.log('📦 Building transaction...\n');
  const transaction = new Transaction();
  
  // Add rewards for each recipient
  for (const reward of [...milkerRewards, ...breederRewards]) {
    const ata = await getAssociatedTokenAddress(
      mintAddress,
      reward.address,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    
    // Create ATA if needed (will be checked by program)
    transaction.add(
      createAssociatedTokenAccountInstruction(
        walletKeypair.publicKey,
        ata,
        reward.address,
        mintAddress,
        TOKEN_2022_PROGRAM_ID
      )
    );
    
    // Mint tokens to user
    transaction.add(
      createMintToInstruction(
        mintAddress,
        ata,
        walletKeypair.publicKey,
        Math.floor(reward.stydAmount * 1e9),
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );
    
    console.log(`  ✅ ${reward.address.toString().slice(0, 8)}... → ${reward.stydAmount.toFixed(2)} STYD`);
  }
  
  // Send transaction
  console.log('\n📤 Sending transaction...');
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [walletKeypair],
    { commitment: 'confirmed' }
  );
  
  // Update state
  state.totalSupply += emissionAmount * 1e9;
  state.totalMined += emissionAmount * 1e9;
  state.lastEmission = Date.now();
  
  // Check for halving and phase transitions
  checkAndUpdateThresholds(state);
  
  saveState(state);
  
  console.log('\n✅ Distribution Complete!');
  console.log('Transaction:', signature);
  console.log('Total Distributed:', emissionAmount, 'STYD');
  console.log('Gas Cost: ~0.0000065 SOL\n');
}

// Helper functions
function calculateEmissionRate(totalSupply) {
  const base = CONFIG.EMISSION_PER_10MIN;
  const halvingCount = CONFIG.HALVING_THRESHOLDS.filter(t => totalSupply >= t * 1e9).length;
  return halvingCount >= 5 ? 0 : base / Math.pow(2, halvingCount);
}

function calculateMilkerRewards(milkers, totalEmission) {
  const totalBalance = milkers.reduce((sum, m) => sum + m.balance, 0);
  return milkers.map(m => ({
    address: m.address,
    stydAmount: (m.balance / totalBalance) * totalEmission,
  }));
}

function calculateBreederRewards(breeders, totalEmission, phase, motherWombBalance) {
  const totalLP = breeders.reduce((sum, b) => sum + b.lpAmount, 0);
  const solPercentage = CONFIG.SOL_PERCENTAGES[phase] / 100;
  
  // Distribute 1% of MotherWomb balance per distribution
  const solToDistribute = motherWombBalance * 0.01;
  
  return breeders.map(b => ({
    address: b.address,
    stydAmount: (b.lpAmount / totalLP) * totalEmission,
    solAmount: (b.lpAmount / totalLP) * solToDistribute * solPercentage,
  }));
}

function calculateSOLReward(userLP, totalLP, percentage) {
  // Deprecated - now using motherWombBalance directly
  return (userLP / totalLP) * 10 * percentage;
}

async function fetchHolders(connection, mint) {
  // TODO: In production, use getProgramAccounts or indexer
  // For now, return empty array until real implementation
  console.log('  ⚠️  Holder querying not implemented yet');
  console.log('  Skipping distribution (no holders to query)\n');
  return [];
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync('./state.json'));
  } catch {
    return {
      totalSupply: 1_000_000 * 1e9,
      totalMined: 0,
      totalBurned: 0,
      halvingCount: 0,
      rewardPhase: 0,
      lastEmission: Date.now(),
    };
  }
}

function saveState(state) {
  fs.writeFileSync('./state.json', JSON.stringify(state, null, 2));
}

function checkAndUpdateThresholds(state) {
  const supply = state.totalSupply / 1e9;
  
  // Check halving
  const newHalvingCount = CONFIG.HALVING_THRESHOLDS.filter(t => supply >= t).length;
  if (newHalvingCount > state.halvingCount) {
    console.log(`\n🔻 Halving #${newHalvingCount} triggered!`);
    state.halvingCount = newHalvingCount;
  }
  
  // Check phase
  const newPhase = CONFIG.PHASE_THRESHOLDS.filter(t => supply >= t).length;
  if (newPhase > state.rewardPhase) {
    console.log(`\n🎉 Phase ${newPhase} activated! SOL: ${CONFIG.SOL_PERCENTAGES[newPhase]}%`);
    state.rewardPhase = newPhase;
  }
}

// Run if called directly
if (require.main === module) {
  distributeRewards();
}

module.exports = { distributeRewards };

