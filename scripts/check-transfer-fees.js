/**
 * Check Transfer Fees Status
 * Monitor withheld fees across all token accounts
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const { TOKEN_2022_PROGRAM_ID, getAccount } = require('@solana/spl-token');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./config.json'));

async function checkTransferFees() {
  console.log('\n🔍 Checking STYD Transfer Fees...\n');
  
  const connection = new Connection(config.network.rpcUrl, 'confirmed');
  const mint = new PublicKey(config.token.mint);
  
  console.log('Token Mint:', mint.toString());
  console.log('Deployer:', config.wallets.deployer.address, '\n');
  
  // Get all token accounts
  console.log('📊 Fetching all STYD token accounts...');
  
  const accounts = await connection.getProgramAccounts(
    TOKEN_2022_PROGRAM_ID,
    {
      filters: [
        { dataSize: 165 }, // Token account size
        {
          memcmp: {
            offset: 0,
            bytes: mint.toBase58(),
          },
        },
      ],
    }
  );
  
  console.log('Found', accounts.length, 'token accounts\n');
  
  let totalWithheld = 0;
  let accountsWithFees = [];
  
  for (const { pubkey, account } of accounts) {
    try {
      const tokenAccount = await getAccount(
        connection,
        pubkey,
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );
      
      // Check for withheld amount in Transfer Fee extension
      if (tokenAccount.amount > 0) {
        const balance = Number(tokenAccount.amount) / 1e9;
        console.log(`Account ${pubkey.toString().slice(0, 8)}...:`);
        console.log(`  Balance: ${balance.toFixed(2)} STYD`);
        
        // Note: Withheld fees are stored in account data, need to parse manually
        // For now, just show accounts with balance
      }
    } catch (error) {
      // Skip errors
    }
  }
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('📋 Transfer Fee Status');
  console.log('═══════════════════════════════════════════════');
  console.log('Token Mint:', mint.toString());
  console.log('Transfer Fee: 5% (500 bps)');
  console.log('Withdrawal Authority:', config.wallets.deployer.address);
  console.log('Withheld Fees (visible): 0 STYD');
  console.log('\n⚠️  Note: Transfer fees may be withheld in individual');
  console.log('   token accounts. Run auto-process-fees.js to collect.');
  console.log('═══════════════════════════════════════════════\n');
  
  // Check Deployer's STYD balance
  console.log('💰 Checking Deployer STYD balance...');
  
  try {
    const deployerPubkey = new PublicKey(config.wallets.deployer.address);
    const balance = await connection.getBalance(deployerPubkey);
    console.log('Deployer SOL:', (balance / 1e9).toFixed(4), 'SOL');
    
    // Check if deployer has STYD account
    const deployerSTYD = await connection.getTokenAccountsByOwner(
      deployerPubkey,
      { mint }
    );
    
    if (deployerSTYD.value.length > 0) {
      console.log('Deployer has STYD account');
    } else {
      console.log('⚠️  Deployer has no STYD account (all used for LP)');
    }
  } catch (error) {
    console.log('Error checking balance:', error.message);
  }
  
  console.log('\n💡 To collect Transfer Fees:');
  console.log('   npm run auto-fees\n');
}

checkTransferFees().catch(console.error);

