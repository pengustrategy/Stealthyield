/**
 * Fullstack Starter for Railway
 * Runs automation scripts + Next.js frontend
 */

const { spawn } = require('child_process');
const fs = require('fs');
const bs58 = require('bs58').default || require('bs58');

console.log('\n🚀 Stealthyield Fullstack Starting...\n');
console.log('Time:', new Date().toISOString());
console.log('Environment: Railway\n');

// Ensure wallets directory exists
if (!fs.existsSync('./wallets')) {
  fs.mkdirSync('./wallets', { recursive: true });
}

// Handle Base58 private key
if (process.env.DEPLOYER_PRIVATE_KEY_BASE58) {
  console.log('📦 Converting Deployer Base58...');
  try {
    const privateKeyBytes = bs58.decode(process.env.DEPLOYER_PRIVATE_KEY_BASE58);
    const keypairArray = Array.from(privateKeyBytes);
    fs.writeFileSync('./wallets/deployer-wallet.json', JSON.stringify(keypairArray));
    fs.chmodSync('./wallets/deployer-wallet.json', 0o600);
    process.env.DEPLOYER_WALLET_PATH = './wallets/deployer-wallet.json';
    console.log('✅ Deployer wallet created');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

// MotherWomb address (no private key needed - only for receiving SOL)
if (!process.env.MOTHERWOMB_ADDRESS) {
  // Use default from config
  process.env.MOTHERWOMB_ADDRESS = '5kegRGctwKkdvytig8CeCAzuBQWivTvEtgyePtyVcgtk';
  console.log('✅ Using default MotherWomb address');
}

console.log('MotherWomb Address:', process.env.MOTHERWOMB_ADDRESS);

// Verify
if (!fs.existsSync(process.env.DEPLOYER_WALLET_PATH || './wallets/deployer-wallet.json')) {
  console.error('❌ Deployer wallet not found!');
  process.exit(1);
}

console.log('✅ Configuration verified\n');

// Start automation scripts
console.log('🤖 Starting automation...\n');

const INTERVAL = 10 * 60 * 1000; // 10 minutes

function runScript(script, name) {
  const proc = spawn('node', [script], {
    stdio: 'inherit',
    env: process.env
  });
  
  proc.on('error', (error) => {
    console.error(`❌ ${name} error:`, error.message);
  });
}

// Run initially
runScript('scripts/auto-process-fees.js', 'Auto Fees');
setTimeout(() => runScript('scripts/distribute-rewards.js', 'Distribute'), 5000);

// Schedule recurring
setInterval(() => runScript('scripts/auto-process-fees.js', 'Auto Fees'), INTERVAL);
setInterval(() => runScript('scripts/distribute-rewards.js', 'Distribute'), INTERVAL);

console.log(`✅ Automation scheduled: every ${INTERVAL / 60000} minutes\n`);

// Start Next.js frontend
console.log('🎨 Starting Next.js frontend...\n');

// Railway provides PORT environment variable
const PORT = process.env.PORT || 3000;
console.log(`Frontend will run on port: ${PORT}\n`);

const nextjs = spawn('npm', ['run', 'start', '--prefix', 'frontend'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: PORT,
  }
});

nextjs.on('error', (error) => {
  console.error('❌ Frontend error:', error.message);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM, shutting down...');
  nextjs.kill();
  process.exit(0);
});

console.log('✅ Fullstack ready!\n');
console.log(`🌐 Frontend: http://localhost:${process.env.PORT || 3000}`);
console.log('🤖 Automation: Running every 10 minutes');
console.log('─────────────────────────────────────────\n');

