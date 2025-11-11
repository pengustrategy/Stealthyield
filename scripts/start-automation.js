/**
 * Automation Starter for Railway Deployment
 * Runs auto-process-fees and distribute-rewards on schedule
 */

const { exec } = require('child_process');
const fs = require('fs');
const bs58 = require('bs58');

console.log('\n🤖 Stealthyield Automation Starting...\n');
console.log('Time:', new Date().toISOString());
console.log('Environment: Railway\n');

// Ensure wallets directory exists
if (!fs.existsSync('./wallets')) {
  fs.mkdirSync('./wallets', { recursive: true });
}

// Handle Base58 private key (Solana standard format) - Recommended
if (process.env.DEPLOYER_PRIVATE_KEY_BASE58) {
  console.log('📦 Converting Base58 private key to keypair...');
  
  try {
    const privateKeyBytes = bs58.decode(process.env.DEPLOYER_PRIVATE_KEY_BASE58);
    const keypairArray = Array.from(privateKeyBytes);
    
    fs.writeFileSync('./wallets/deployer-wallet.json', JSON.stringify(keypairArray));
    fs.chmodSync('./wallets/deployer-wallet.json', 0o600);
    
    process.env.DEPLOYER_WALLET_PATH = './wallets/deployer-wallet.json';
    console.log('✅ Deployer wallet created from Base58');
  } catch (error) {
    console.error('❌ Failed to decode Base58 private key:', error.message);
    process.exit(1);
  }
}

if (process.env.MOTHERWOMB_PRIVATE_KEY_BASE58) {
  try {
    const privateKeyBytes = bs58.decode(process.env.MOTHERWOMB_PRIVATE_KEY_BASE58);
    const keypairArray = Array.from(privateKeyBytes);
    
    fs.writeFileSync('./wallets/motherwomb-wallet.json', JSON.stringify(keypairArray));
    fs.chmodSync('./wallets/motherwomb-wallet.json', 0o600);
    
    process.env.MOTHERWOMB_WALLET_PATH = './wallets/motherwomb-wallet.json';
    console.log('✅ MotherWomb wallet created from Base58');
  } catch (error) {
    console.error('❌ Failed to decode MotherWomb Base58:', error.message);
  }
}

// Fallback: Handle Base64 encoded JSON array (alternative method)
if (!process.env.DEPLOYER_WALLET_PATH && process.env.DEPLOYER_WALLET_BASE64) {
  console.log('📦 Using Base64 JSON array fallback...');
  const walletData = Buffer.from(process.env.DEPLOYER_WALLET_BASE64, 'base64').toString('utf-8');
  
  fs.writeFileSync('./wallets/deployer-wallet.json', walletData);
  fs.chmodSync('./wallets/deployer-wallet.json', 0o600);
  
  process.env.DEPLOYER_WALLET_PATH = './wallets/deployer-wallet.json';
  console.log('✅ Deployer wallet decoded from Base64');
}

// Verify configuration
if (!process.env.DEPLOYER_WALLET_PATH) {
  console.error('❌ DEPLOYER_WALLET_PATH or DEPLOYER_WALLET_BASE64 not set!');
  process.exit(1);
}

if (!fs.existsSync(process.env.DEPLOYER_WALLET_PATH)) {
  console.error('❌ Deployer wallet file not found!');
  process.exit(1);
}

console.log('✅ Configuration verified\n');

// Run every 10 minutes
const INTERVAL = 10 * 60 * 1000; // 10 minutes

async function runAutoFees() {
  console.log('\n⚙️  Running auto-process-fees...');
  
  exec('node scripts/auto-process-fees.js', (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error.message);
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
}

async function runDistribute() {
  console.log('\n💰 Running distribute-rewards...');
  
  exec('node scripts/distribute-rewards.js', (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error.message);
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
}

// Run immediately on start
console.log('Running initial tasks...\n');
runAutoFees();
setTimeout(runDistribute, 5000); // Offset by 5 seconds

// Schedule recurring tasks
setInterval(runAutoFees, INTERVAL);
setInterval(runDistribute, INTERVAL);

console.log(`✅ Automation scheduled: every ${INTERVAL / 60000} minutes\n`);

// Keep process alive
process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Health check endpoint with detailed status
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    try {
      let state = { status: 'initializing' };

      if (fs.existsSync('./state.json')) {
        state = JSON.parse(fs.readFileSync('./state.json'));
      }

      const healthData = {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        lastFeeProcessing: state.lastFeeProcessing || null,
        lastEmission: state.lastEmission || null,
        totalSupply: state.totalSupply ? (state.totalSupply / 1e9).toFixed(2) : '0',
        totalBurned: state.totalBurned ? (state.totalBurned / 1e9).toFixed(2) : '0',
        motherWombSOL: state.motherWombSOL || 0,
        halvingCount: state.halvingCount || 0,
        rewardPhase: state.rewardPhase || 0,
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthData, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: error.message }));
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
});

