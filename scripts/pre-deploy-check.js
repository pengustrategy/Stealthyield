/**
 * Pre-deployment Check Script
 * Validates configuration before Railway deployment
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Pre-Deployment Check\n');
console.log('Validating configuration for Railway deployment...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Config file exists and is valid
console.log('1️⃣ Checking config.json...');
try {
  const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
  
  // Check SOL unlock percentages
  const solPercentages = config.economics.solUnlockPercentages;
  if (JSON.stringify(solPercentages) === JSON.stringify([0, 5, 15, 50])) {
    console.log('   ✅ SOL unlock percentages correct: [0, 5, 15, 50]');
  } else {
    console.log('   ❌ SOL unlock percentages incorrect:', solPercentages);
    console.log('      Expected: [0, 5, 15, 50]');
    hasErrors = true;
  }
  
  // Check token mint
  if (config.token.mint && config.token.mint.length > 0) {
    console.log('   ✅ Token mint configured:', config.token.mint.slice(0, 8) + '...');
  } else {
    console.log('   ❌ Token mint not configured');
    hasErrors = true;
  }
  
  // Check RPC URL
  if (config.network.rpcUrl && config.network.rpcUrl.includes('mainnet')) {
    console.log('   ✅ RPC URL points to mainnet');
  } else {
    console.log('   ⚠️  RPC URL may not be mainnet:', config.network.rpcUrl);
    hasWarnings = true;
  }
  
} catch (error) {
  console.log('   ❌ Failed to read config.json:', error.message);
  hasErrors = true;
}

// Check 2: Railway configuration
console.log('\n2️⃣ Checking Railway configuration...');
try {
  const railwayJson = JSON.parse(fs.readFileSync('./railway.json', 'utf-8'));
  const nixpacksToml = fs.readFileSync('./nixpacks.toml', 'utf-8');
  
  if (railwayJson.deploy.startCommand === 'node scripts/start-automation.js') {
    console.log('   ✅ railway.json start command correct');
  } else {
    console.log('   ❌ railway.json start command incorrect');
    hasErrors = true;
  }
  
  if (nixpacksToml.includes('node scripts/start-automation.js')) {
    console.log('   ✅ nixpacks.toml start command correct');
  } else {
    console.log('   ❌ nixpacks.toml start command incorrect');
    hasErrors = true;
  }
  
} catch (error) {
  console.log('   ❌ Failed to read Railway config:', error.message);
  hasErrors = true;
}

// Check 3: Scripts exist
console.log('\n3️⃣ Checking automation scripts...');
const scripts = [
  'scripts/start-automation.js',
  'scripts/auto-process-fees.js',
  'scripts/distribute-rewards.js',
];

scripts.forEach(script => {
  if (fs.existsSync(script)) {
    console.log(`   ✅ ${script} exists`);
  } else {
    console.log(`   ❌ ${script} not found`);
    hasErrors = true;
  }
});

// Check 4: Package.json dependencies
console.log('\n4️⃣ Checking dependencies...');
try {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
  const requiredDeps = [
    '@solana/web3.js',
    '@solana/spl-token',
    'bs58',
    'node-fetch',
  ];
  
  requiredDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      console.log(`   ✅ ${dep} installed`);
    } else {
      console.log(`   ❌ ${dep} missing`);
      hasErrors = true;
    }
  });
  
} catch (error) {
  console.log('   ❌ Failed to read package.json:', error.message);
  hasErrors = true;
}

// Check 5: Frontend configuration
console.log('\n5️⃣ Checking frontend configuration...');
try {
  const frontendConfig = fs.readFileSync('./frontend/lib/config.ts', 'utf-8');
  
  if (frontendConfig.includes('4spgGcQcHrAXEZfLs5hWJgYNmXcA7mjjiYRMoob1Wz9b')) {
    console.log('   ✅ Frontend tokenMint configured');
  } else {
    console.log('   ⚠️  Frontend tokenMint may not be configured');
    hasWarnings = true;
  }
  
  if (frontendConfig.includes('BeNW14fnU2uJKkvCmtKDRejmFFHM66kW65oAkaUwKYbK')) {
    console.log('   ✅ Frontend raydiumPool configured');
  } else {
    console.log('   ⚠️  Frontend raydiumPool may not be configured');
    hasWarnings = true;
  }
  
} catch (error) {
  console.log('   ⚠️  Could not check frontend config:', error.message);
  hasWarnings = true;
}

// Check 6: Wallet files (should NOT be in repo)
console.log('\n6️⃣ Checking wallet security...');
const walletFiles = [
  'wallets/deployer-wallet.json',
  'wallets/motherwomb-wallet.json',
];

let walletsFound = 0;
walletFiles.forEach(wallet => {
  if (fs.existsSync(wallet)) {
    walletsFound++;
  }
});

if (walletsFound === 0) {
  console.log('   ⚠️  No wallet files found locally');
  console.log('      Make sure you have Base58 keys for Railway');
  hasWarnings = true;
} else {
  console.log(`   ✅ Found ${walletsFound} wallet file(s) locally`);
  console.log('      Remember to use Base58 format for Railway!');
}

// Check 7: .gitignore
console.log('\n7️⃣ Checking .gitignore...');
try {
  const gitignore = fs.readFileSync('./.gitignore', 'utf-8');
  
  const requiredIgnores = [
    'wallets/*.json',
    'state.json',
    'node_modules/',
    '.env',
  ];
  
  let allIgnored = true;
  requiredIgnores.forEach(pattern => {
    if (gitignore.includes(pattern)) {
      console.log(`   ✅ ${pattern} ignored`);
    } else {
      console.log(`   ⚠️  ${pattern} not in .gitignore`);
      hasWarnings = true;
      allIgnored = false;
    }
  });
  
} catch (error) {
  console.log('   ⚠️  Could not check .gitignore:', error.message);
  hasWarnings = true;
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('📊 Pre-Deployment Check Summary');
console.log('═'.repeat(60));

if (!hasErrors && !hasWarnings) {
  console.log('\n✅ All checks passed! Ready to deploy to Railway.\n');
  console.log('Next steps:');
  console.log('1. Run: npm run convert-keys (if you haven\'t)');
  console.log('2. Copy Base58 keys to Railway environment variables');
  console.log('3. Push to GitHub: git push origin main');
  console.log('4. Deploy on Railway\n');
  process.exit(0);
} else if (hasErrors) {
  console.log('\n❌ Found critical errors! Please fix before deploying.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Found warnings. Review before deploying.\n');
  console.log('You can proceed, but double-check the warnings above.\n');
  process.exit(0);
}

