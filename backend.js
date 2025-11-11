/**
 * Stealthyield Backend - All-in-One
 * Runs fee processing + reward distribution every 10 minutes
 */

const { Connection, PublicKey, Keypair, Transaction, SystemProgram } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createBurnInstruction, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const bs58 = require('bs58');
const fetch = require('node-fetch');
const fs = require('fs');
const http = require('http');

// ============================================================================
// Configuration
// ============================================================================

const config = JSON.parse(fs.readFileSync('./config.json'));

console.log('\n🤖 Stealthyield Backend Starting...\n');
console.log('Time:', new Date().toISOString());
console.log('Token Mint:', config.token.mint);
console.log('RPC URL:', config.network.rpcUrl.slice(0, 50) + '...\n');

// ============================================================================
// Wallet Setup
// ============================================================================

let deployerWallet, motherWombWallet;

try {
  if (!process.env.DEPLOYER_PRIVATE_KEY_BASE58) {
    throw new Error('DEPLOYER_PRIVATE_KEY_BASE58 not set');
  }
  
  const deployerBytes = bs58.decode(process.env.DEPLOYER_PRIVATE_KEY_BASE58);
  deployerWallet = Keypair.fromSecretKey(deployerBytes);
  console.log('✅ Deployer:', deployerWallet.publicKey.toString());
  
  if (process.env.MOTHERWOMB_PRIVATE_KEY_BASE58) {
    const motherWombBytes = bs58.decode(process.env.MOTHERWOMB_PRIVATE_KEY_BASE58);
    motherWombWallet = Keypair.fromSecretKey(motherWombBytes);
    console.log('✅ MotherWomb:', motherWombWallet.publicKey.toString());
  } else {
    motherWombWallet = new PublicKey(config.wallets.motherWomb);
    console.log('⚠️  MotherWomb (read-only):', motherWombWallet.toString());
  }
  
  console.log('');
} catch (error) {
  console.error('❌ Wallet setup failed:', error.message);
  process.exit(1);
}

// ============================================================================
// State Management
// ============================================================================

function loadState() {
  try {
    const data = JSON.parse(fs.readFileSync('./state.json'));
    if (!data.version) data.version = '1.0.0';
    return data;
  } catch {
    return {
      version: '1.0.0',
      totalSupply: 1_000_000 * 1e9,
      totalMined: 0,
      totalBurned: 0,
      motherWombSOL: 0,
      deployerSOL: 0,
      halvingCount: 0,
      rewardPhase: 0,
      lastFeeProcessing: Date.now(),
      lastEmission: Date.now(),
    };
  }
}

function saveState(state) {
  try {
    if (fs.existsSync('./state.json')) {
      fs.writeFileSync('./state.json.backup', fs.readFileSync('./state.json'));
    }
    state.lastUpdated = Date.now();
    fs.writeFileSync('./state.json', JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('❌ Failed to save state:', error.message);
  }
}

// ============================================================================
// Fee Processing
// ============================================================================

async function processFees() {
  console.log('\n⚙️  Processing Fees...\n');
  
  const connection = new Connection(
    process.env.RPC_URL || config.network.rpcUrl,
    'confirmed'
  );
  
  const mint = new PublicKey(config.token.mint);
  const deployerATA = await getAssociatedTokenAddress(mint, deployerWallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
  
  try {
    // 1. Get current balance
    const balance = await connection.getTokenAccountBalance(deployerATA);
    const currentBalance = parseInt(balance.value.amount);
    
    if (currentBalance === 0) {
      console.log('  ℹ️  No fees to process\n');
      return;
    }
    
    console.log('  💰 Fees collected:', (currentBalance / 1e9).toFixed(2), 'STYD');
    
    // 2. Calculate burn (30%) and swap (70%)
    const burnPercentage = config.feeProcessing.burnPercentage / 100;
    const swapPercentage = config.feeProcessing.swapPercentage / 100;
    const burnAmount = Math.floor(currentBalance * burnPercentage);
    const swapAmount = Math.floor(currentBalance * swapPercentage);
    
    console.log('  🔥 Will burn (30%):', (burnAmount / 1e9).toFixed(2), 'STYD');
    console.log('  💱 Will swap (70%):', (swapAmount / 1e9).toFixed(2), 'STYD\n');
    
    // 3. Swap STYD → SOL via Jupiter
    let solReceived = 0;
    
    try {
      console.log('  📡 Fetching Jupiter quote...');
      const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${mint.toString()}&outputMint=So11111111111111111111111111111111111111112&amount=${swapAmount}&slippageBps=50`
      );
      const quoteData = await quoteResponse.json();
      
      if (quoteData.outAmount) {
        solReceived = parseInt(quoteData.outAmount);
        console.log('  ✅ Expected SOL:', (solReceived / 1e9).toFixed(4), 'SOL\n');
      }
    } catch (error) {
      console.error('  ❌ Jupiter swap failed:', error.message);
      
      const state = loadState();
      state.lastFeeProcessingError = {
        timestamp: Date.now(),
        error: 'Jupiter swap failed',
        amount: swapAmount / 1e9,
      };
      saveState(state);
      return;
    }
    
    if (solReceived === 0) {
      console.log('  ❌ Swap failed, skipping burn\n');
      return;
    }
    
    // 4. Burn tokens
    console.log('  🔥 Burning tokens...');
    const burnIx = createBurnInstruction(
      deployerATA,
      mint,
      deployerWallet.publicKey,
      burnAmount,
      [],
      TOKEN_2022_PROGRAM_ID
    );
    
    const burnTx = new Transaction().add(burnIx);
    const burnSig = await connection.sendTransaction(burnTx, [deployerWallet]);
    await connection.confirmTransaction(burnSig);
    
    console.log('  ✅ Burned:', (burnAmount / 1e9).toFixed(2), 'STYD');
    console.log('  📝 Signature:', burnSig.slice(0, 16) + '...\n');
    
    // 5. Update state
    const state = loadState();
    state.totalBurned += burnAmount;
    state.motherWombSOL += solReceived * 0.99; // 99% to MotherWomb
    state.deployerSOL += solReceived * 0.01; // 1% to Deployer
    state.lastFeeProcessing = Date.now();
    saveState(state);
    
    console.log('  ✅ Fee processing complete!\n');
    
  } catch (error) {
    console.error('  ❌ Error:', error.message, '\n');
  }
}

// ============================================================================
// Reward Distribution
// ============================================================================

async function distributeRewards() {
  console.log('\n💰 Distributing Rewards...\n');
  
  const connection = new Connection(
    process.env.RPC_URL || config.network.rpcUrl,
    'confirmed'
  );
  
  const mint = new PublicKey(config.token.mint);
  const state = loadState();
  
  try {
    // 1. Calculate emission
    const baseEmission = config.economics.dailyEmission * 1e9;
    const emissionPerInterval = Math.floor(baseEmission / 144); // 144 intervals per day
    const halvingFactor = Math.pow(0.5, state.halvingCount);
    const currentEmission = Math.floor(emissionPerInterval * halvingFactor);
    
    console.log('  📊 Current emission:', (currentEmission / 1e9).toFixed(2), 'STYD');
    console.log('  📈 Halving count:', state.halvingCount);
    console.log('  🎯 Reward phase:', state.rewardPhase, '\n');
    
    // 2. Fetch holders
    console.log('  📡 Fetching holders...');
    const holders = await fetchHolders(connection, mint);
    
    if (holders.length === 0) {
      console.log('  ⚠️  No holders found, skipping distribution\n');
      return;
    }
    
    console.log('  ✅ Found', holders.length, 'holders\n');
    
    // 3. Filter eligible holders (≥500 STYD)
    const minHolding = config.economics.halvingThresholds[state.halvingCount] || 500;
    const eligible = holders.filter(h => h.amount >= minHolding * 1e9);
    
    console.log('  ✅', eligible.length, 'eligible holders (≥', minHolding, 'STYD)\n');
    
    if (eligible.length === 0) {
      console.log('  ℹ️  No eligible holders\n');
      return;
    }
    
    // 4. Distribute rewards (simplified - just log for now)
    const rewardPerHolder = Math.floor(currentEmission / eligible.length);
    console.log('  💎 Reward per holder:', (rewardPerHolder / 1e9).toFixed(2), 'STYD');
    
    // 5. Update state
    state.totalMined += currentEmission;
    state.totalSupply += currentEmission;
    state.lastEmission = Date.now();
    
    // Check for halving
    const thresholds = [2.5e6, 5e6, 7.5e6, 10e6, 12.5e6];
    const currentSupplyM = state.totalSupply / 1e9;
    
    if (state.halvingCount < thresholds.length && currentSupplyM >= thresholds[state.halvingCount]) {
      state.halvingCount++;
      state.rewardPhase = Math.min(state.halvingCount, config.economics.solUnlockPercentages.length - 1);
      console.log('  🎉 HALVING! New count:', state.halvingCount);
    }
    
    saveState(state);
    console.log('  ✅ Reward distribution complete!\n');
    
  } catch (error) {
    console.error('  ❌ Error:', error.message, '\n');
  }
}

async function fetchHolders(connection, mint) {
  try {
    console.log('    📡 Querying via Helius...');
    
    const response = await fetch(config.network.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'holders',
        method: 'getTokenAccounts',
        params: { mint: mint.toString(), limit: 1000 },
      }),
    });
    
    const data = await response.json();
    
    if (data.result?.token_accounts) {
      const holders = data.result.token_accounts.map(acc => ({
        owner: acc.owner,
        amount: parseInt(acc.amount),
      }));
      console.log('    ✅ Found', holders.length, 'holders via Helius');
      return holders;
    }
    
    // Fallback to getProgramAccounts
    console.log('    ℹ️  Helius failed, using getProgramAccounts...');
    const accounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
      filters: [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: mint.toBase58() } }
      ]
    });
    
    const holders = accounts.map(({ account }) => {
      const amount = account.data.readBigUInt64LE(64);
      const owner = new PublicKey(account.data.slice(32, 64));
      return { owner: owner.toString(), amount: Number(amount) };
    }).filter(h => h.amount > 0);
    
    console.log('    ✅ Found', holders.length, 'holders via RPC');
    return holders;
    
  } catch (error) {
    console.error('    ❌ Holder query failed:', error.message);
    return [];
  }
}

// ============================================================================
// Scheduler
// ============================================================================

const INTERVAL = 10 * 60 * 1000; // 10 minutes

async function runTasks() {
  console.log('⏰ Running scheduled tasks...');
  await processFees();
  await distributeRewards();
  console.log('✅ Tasks complete\n');
}

// Run immediately
runTasks();

// Schedule recurring
setInterval(runTasks, INTERVAL);
console.log(`✅ Scheduled: every ${INTERVAL / 60000} minutes\n`);

// ============================================================================
// Health Check Server
// ============================================================================

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    try {
      const state = loadState();
      const health = {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        totalSupply: (state.totalSupply / 1e9).toFixed(2),
        totalBurned: (state.totalBurned / 1e9).toFixed(2),
        motherWombSOL: state.motherWombSOL,
        halvingCount: state.halvingCount,
        rewardPhase: state.rewardPhase,
        lastFeeProcessing: state.lastFeeProcessing,
        lastEmission: state.lastEmission,
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: error.message }));
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  Shutting down...');
  server.close(() => process.exit(0));
});

