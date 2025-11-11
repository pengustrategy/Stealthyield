/**
 * Fullstack Starter for Railway
 * Runs automation scripts + Next.js frontend
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('\n🚀 Stealthyield Fullstack Starting...\n');
console.log('Time:', new Date().toISOString());
console.log('Environment: Railway\n');

// Ensure wallets directory exists
if (!fs.existsSync('./wallets')) {
  fs.mkdirSync('./wallets', { recursive: true });
}

// Support both Base58 (preferred) and Base64 formats
const bs58 = require('bs58');
const { Keypair } = require('@solana/web3.js');

let deployerWallet, motherWombWallet;

try {
  // Try Base58 format first (preferred for Railway)
  if (process.env.DEPLOYER_PRIVATE_KEY_BASE58) {
    console.log('📦 Converting Base58 private key to keypair...');

    const deployerBytes = bs58.decode(process.env.DEPLOYER_PRIVATE_KEY_BASE58);
    deployerWallet = Keypair.fromSecretKey(deployerBytes);

    // Save to file for scripts
    fs.writeFileSync(
      './wallets/deployer-wallet.json',
      JSON.stringify(Array.from(deployerWallet.secretKey))
    );
    fs.chmodSync('./wallets/deployer-wallet.json', 0o600);

    console.log('✅ Deployer wallet created from Base58');
    console.log('   Address:', deployerWallet.publicKey.toString());

  } else if (process.env.DEPLOYER_WALLET_BASE64) {
    // Fallback to Base64 format
    console.log('📦 Decoding wallet from Base64...');
    const walletJSON = Buffer.from(process.env.DEPLOYER_WALLET_BASE64, 'base64').toString('utf-8');
    fs.writeFileSync('./wallets/deployer-wallet.json', walletJSON);
    fs.chmodSync('./wallets/deployer-wallet.json', 0o600);
    console.log('✅ Deployer wallet created from Base64');

  } else {
    throw new Error('Neither DEPLOYER_PRIVATE_KEY_BASE58 nor DEPLOYER_WALLET_BASE64 is set');
  }

  // MotherWomb wallet (optional)
  if (process.env.MOTHERWOMB_PRIVATE_KEY_BASE58) {
    const motherWombBytes = bs58.decode(process.env.MOTHERWOMB_PRIVATE_KEY_BASE58);
    motherWombWallet = Keypair.fromSecretKey(motherWombBytes);

    fs.writeFileSync(
      './wallets/motherwomb-wallet.json',
      JSON.stringify(Array.from(motherWombWallet.secretKey))
    );
    fs.chmodSync('./wallets/motherwomb-wallet.json', 0o600);

    console.log('✅ MotherWomb wallet created from Base58');
    console.log('   Address:', motherWombWallet.publicKey.toString());
  } else {
    console.log('⚠️  MOTHERWOMB_PRIVATE_KEY_BASE58 not set');
    console.log('   Using default address: 5kegRGctwKkdvytig8CeCAzuBQWivTvEtgyePtyVcgtk');
  }

} catch (error) {
  console.error('❌ Failed to load wallets:', error.message);
  console.log('\nPlease set one of the following in Railway Variables:');
  console.log('  - DEPLOYER_PRIVATE_KEY_BASE58 (recommended)');
  console.log('  - DEPLOYER_WALLET_BASE64 (legacy)');
  process.exit(1);
}

// Verify deployer wallet exists
if (!fs.existsSync('./wallets/deployer-wallet.json')) {
  console.error('❌ Deployer wallet file not created!');
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

