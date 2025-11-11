/**
 * Auto Process Transfer Fees (模仿SORE)
 * 
 * 高频运行，自动处理:
 * 1. Harvest withheld tokens
 * 2. Burn 30%
 * 3. Swap 70% to SOL via Jupiter
 * 
 * Run every 1-10 minutes
 */

const { 
  Connection, 
  Keypair, 
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');

const {
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  createBurnInstruction,
  harvestWithheldTokensToMint,
  withdrawWithheldTokensFromAccounts,
  getAssociatedTokenAddress,
} = require('@solana/spl-token');

const fs = require('fs');
const fetch = require('node-fetch');

// Load config
const config = JSON.parse(fs.readFileSync('./config.json'));

async function autoProcessFees() {
  console.log('\n⚙️  Auto Processing Transfer Fees...');
  console.log('Time:', new Date().toISOString());
  
  // Load deployer wallet from environment variable
  const walletPath = process.env.DEPLOYER_WALLET_PATH || config.wallets.deployer.path;
  
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Deployer wallet not found: ${walletPath}`);
  }
  
  const deployerKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath)))
  );
  
  console.log('Deployer:', deployerKeypair.publicKey.toString());
  
  const connection = new Connection(config.network.rpcUrl, 'confirmed');
  const mint = new PublicKey(config.token.mint);
  
  // Step 0: Harvest withheld fees from all accounts
  console.log('\n0️⃣ Harvesting withheld fees...');
  
  try {
    // Get all token accounts for this mint
    const accounts = await connection.getProgramAccounts(
      TOKEN_2022_PROGRAM_ID,
      {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: mint.toBase58() } }
        ]
      }
    );
    
    console.log(`Found ${accounts.length} token accounts`);
    
    if (accounts.length > 0) {
      const accountAddresses = accounts.map(a => a.pubkey);
      
      // Harvest withheld tokens to mint (they go to withdrawWithheldAuthority)
      const harvestTx = await harvestWithheldTokensToMint(
        connection,
        deployerKeypair,
        mint,
        accountAddresses.slice(0, 10), // Process first 10 accounts
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      
      console.log('  ✅ Harvested fees from', accountAddresses.length, 'accounts');
      console.log('  Tx:', harvestTx.slice(0, 20) + '...');
    } else {
      console.log('  No accounts to harvest from yet');
    }
  } catch (error) {
    console.log('  ⚠️  Harvest:', error.message);
    console.log('  (May be no fees to collect yet)');
  }
  
  // Step 1: Check if there are withheld fees to harvest
  console.log('\n1️⃣ Checking collected fees...');
  
  // Get deployer's token account
  const deployerATA = await getAssociatedTokenAddress(
    mint,
    deployerKeypair.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  
  let accountInfo;
  try {
    accountInfo = await getAccount(
      connection,
      deployerATA,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );
  } catch (error) {
    console.log('⚠️  Deployer has no STYD account yet (all in LP pool)');
    console.log('   Waiting for Transfer Fees to accumulate...\n');
    return;
  }
  
  const currentBalance = Number(accountInfo.amount);
  console.log('Current STYD in wallet:', (currentBalance / 1e9).toFixed(2), 'STYD');
  
  if (currentBalance < 100 * 1e9) {
    console.log('⚠️  Not enough fees collected yet. Waiting...\n');
    return;
  }
  
  // Step 2: Calculate 30% burn and 70% swap (using config values)
  const burnPercentage = config.feeProcessing.burnPercentage / 100;
  const swapPercentage = config.feeProcessing.swapPercentage / 100;

  const burnAmount = Math.floor(currentBalance * burnPercentage);
  const swapAmount = Math.floor(currentBalance * swapPercentage);

  console.log('\n2️⃣ Planning:');
  console.log('  Total:', (currentBalance / 1e9).toFixed(2), 'STYD');
  console.log('  Will Burn (30%):', (burnAmount / 1e9).toFixed(2), 'STYD');
  console.log('  Will Swap (70%):', (swapAmount / 1e9).toFixed(2), 'STYD');
  
  // Step 3: Swap FIRST (70% to SOL via Jupiter)
  console.log('\n3️⃣ Swapping 70% to SOL first...');
  
  const solReceived = await swapViaJupiter(
    connection,
    deployerKeypair,
    mint,
    swapAmount
  );
  
  if (solReceived === 0) {
    console.log('\n❌ Swap failed! Skipping burn to preserve funds.');
    console.log('💡 Fix Jupiter connection and run again.\n');

    // Log failure to state
    const state = loadState();
    state.lastFeeProcessingError = {
      timestamp: Date.now(),
      error: 'Jupiter swap failed',
      amount: swapAmount / 1e9,
    };
    saveState(state);

    return;
  }
  
  console.log('  ✅ Swapped:', (swapAmount / 1e9).toFixed(2), 'STYD → ', solReceived.toFixed(4), 'SOL');
  
  // Step 4: ONLY Burn if swap succeeded
  console.log('\n4️⃣ Burning 30%...');
  
  const burnTx = new Transaction().add(
    createBurnInstruction(
      deployerATA,
      mint,
      deployerKeypair.publicKey,
      burnAmount,
      [],
      TOKEN_2022_PROGRAM_ID
    )
  );
  
  const burnSig = await sendAndConfirmTransaction(connection, burnTx, [deployerKeypair]);
  console.log('  ✅ Burned:', (burnAmount / 1e9).toFixed(2), 'STYD');
  console.log('  Tx:', burnSig.slice(0, 20) + '...');
  
  // Step 5: Transfer 99% SOL to MotherWomb
  console.log('\n5️⃣ Transferring SOL to MotherWomb...');
  
  const motherWombAddress = new PublicKey(config.wallets.motherwomb.address);
  const deployerBalance = await connection.getBalance(deployerKeypair.publicKey);
  const deployerSOL = deployerBalance / LAMPORTS_PER_SOL;
  
  // Calculate 99% to transfer (keep 1% for gas fees)
  const toTransfer = Math.floor(solReceived * 0.99 * LAMPORTS_PER_SOL);
  const keepForGas = solReceived - (toTransfer / LAMPORTS_PER_SOL);
  
  if (toTransfer > 0) {
    const transferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: deployerKeypair.publicKey,
        toPubkey: motherWombAddress,
        lamports: toTransfer,
      })
    );
    
    const transferSig = await sendAndConfirmTransaction(connection, transferTx, [deployerKeypair]);
    
    console.log('  ✅ Transferred:', (toTransfer / LAMPORTS_PER_SOL).toFixed(4), 'SOL to MotherWomb');
    console.log('  ✅ Kept for gas:', keepForGas.toFixed(4), 'SOL in Deployer');
    console.log('  Tx:', transferSig.slice(0, 20) + '...');
  }
  
  // Step 6: Update state
  const state = loadState();
  state.totalBurned += burnAmount;
  state.motherWombSOL = await connection.getBalance(motherWombAddress) / LAMPORTS_PER_SOL;
  state.deployerSOL = await connection.getBalance(deployerKeypair.publicKey) / LAMPORTS_PER_SOL;
  state.lastFeeProcessing = Date.now();
  saveState(state);
  
  console.log('\n✅ Fee processing complete!');
  console.log('MotherWomb Balance:', state.motherWombSOL.toFixed(4), 'SOL');
  console.log('Deployer Balance:', state.deployerSOL.toFixed(4), 'SOL\n');
}

async function swapViaJupiter(connection, wallet, inputMint, amount) {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`  ⏳ Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      console.log('  📡 Step 1: Getting quote from Jupiter V6...');
      
      // Step 1: Get Quote with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toString()}&outputMint=So11111111111111111111111111111111111111112&amount=${amount}&slippageBps=100`;
      
      const quoteResponse = await fetch(quoteUrl, {
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!quoteResponse.ok) {
        throw new Error(`Quote failed: ${quoteResponse.status}`);
      }
      
      const quoteData = await quoteResponse.json();
      
      console.log(`  💱 Quote: ${amount / 1e9} STYD → ${(quoteData.outAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
      
      // Step 2: Get Swap Transaction with timeout
      console.log('  📡 Step 2: Getting swap transaction...');
      
      const swapController = new AbortController();
      const swapTimeout = setTimeout(() => swapController.abort(), 10000);
      
      const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quoteData,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
          prioritizationFeeLamports: 'auto',
        }),
        signal: swapController.signal,
      });
      
      clearTimeout(swapTimeout);
      
      if (!swapResponse.ok) {
        throw new Error(`Swap request failed: ${swapResponse.status}`);
      }
      
      const swapData = await swapResponse.json();
      
      // Step 3: Deserialize and send transaction
      console.log('  📤 Step 3: Executing swap...');
      
      const swapTx = Transaction.from(Buffer.from(swapData.swapTransaction, 'base64'));
      
      const signature = await sendAndConfirmTransaction(
        connection,
        swapTx,
        [wallet],
        {
          skipPreflight: false,
          commitment: 'confirmed',
          maxRetries: 3,
        }
      );
      
      console.log(`  ✅ Swap successful!`);
      console.log(`  Tx: ${signature.slice(0, 20)}...`);
      
      // Return SOL received
      return quoteData.outAmount / LAMPORTS_PER_SOL;
      
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error(`  ❌ Jupiter V6 failed after ${maxRetries} attempts:`, error.message);
        console.log('  💡 Manual swap: https://jup.ag/');
        return 0;
      }
      console.log(`  ⚠️  Attempt ${attempt + 1} failed:`, error.message);
    }
  }
  
  return 0;
}

function loadState() {
  try {
    const data = JSON.parse(fs.readFileSync('./state.json'));
    // Add version if not exists
    if (!data.version) {
      data.version = '1.0.0';
    }
    return data;
  } catch {
    return {
      version: '1.0.0',
      totalSupply: 1_000_000 * 1e9,
      totalMined: 0,
      totalBurned: 0,
      motherWombSOL: 0,
      deployerSOL: 0,
      lastFeeProcessing: Date.now(),
      halvingCount: 0,
      rewardPhase: 0,
    };
  }
}

function saveState(state) {
  try {
    // Backup existing state
    if (fs.existsSync('./state.json')) {
      const backup = fs.readFileSync('./state.json');
      fs.writeFileSync('./state.json.backup', backup);
    }

    // Save new state
    state.lastUpdated = Date.now();
    fs.writeFileSync('./state.json', JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('❌ Failed to save state:', error.message);
    throw error;
  }
}

// Run
if (require.main === module) {
  autoProcessFees()
    .then(() => {
      console.log('✅ Process complete. Run again in 10 minutes.');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { autoProcessFees };

