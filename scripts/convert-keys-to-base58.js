/**
 * Convert wallet keypairs from JSON array to Base58 format
 * For Railway deployment
 */

const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

console.log('\n🔑 Converting Wallet Keys to Base58 Format\n');
console.log('This script converts your wallet keypairs to Base58 format');
console.log('for use in Railway environment variables.\n');

// Check if wallets directory exists
const walletsDir = path.join(__dirname, '..', 'wallets');
if (!fs.existsSync(walletsDir)) {
  console.error('❌ Wallets directory not found!');
  console.log('   Expected location: ./wallets/\n');
  process.exit(1);
}

// Convert Deployer wallet
const deployerPath = path.join(walletsDir, 'deployer-wallet.json');
if (fs.existsSync(deployerPath)) {
  try {
    console.log('📦 Converting Deployer wallet...');
    const deployerKeypair = JSON.parse(fs.readFileSync(deployerPath, 'utf-8'));
    const deployerBase58 = bs58.encode(Uint8Array.from(deployerKeypair));
    
    console.log('✅ Deployer wallet converted successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DEPLOYER_PRIVATE_KEY_BASE58=');
    console.log(deployerBase58);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Failed to convert Deployer wallet:', error.message);
  }
} else {
  console.log('⚠️  Deployer wallet not found at:', deployerPath);
}

// Convert MotherWomb wallet
const motherWombPath = path.join(walletsDir, 'motherwomb-wallet.json');
if (fs.existsSync(motherWombPath)) {
  try {
    console.log('📦 Converting MotherWomb wallet...');
    const motherWombKeypair = JSON.parse(fs.readFileSync(motherWombPath, 'utf-8'));
    const motherWombBase58 = bs58.encode(Uint8Array.from(motherWombKeypair));
    
    console.log('✅ MotherWomb wallet converted successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('MOTHERWOMB_PRIVATE_KEY_BASE58=');
    console.log(motherWombBase58);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Failed to convert MotherWomb wallet:', error.message);
  }
} else {
  console.log('⚠️  MotherWomb wallet not found at:', motherWombPath);
}

console.log('📋 Next Steps:\n');
console.log('1. Copy the Base58 keys above');
console.log('2. Go to Railway Dashboard → Variables');
console.log('3. Add the environment variables:');
console.log('   - DEPLOYER_PRIVATE_KEY_BASE58');
console.log('   - MOTHERWOMB_PRIVATE_KEY_BASE58');
console.log('4. Paste the corresponding Base58 keys');
console.log('5. Save and redeploy\n');

console.log('⚠️  SECURITY WARNING:');
console.log('   - Never commit these keys to Git');
console.log('   - Never share them publicly');
console.log('   - Store them securely\n');

console.log('✅ Conversion complete!\n');

