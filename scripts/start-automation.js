/**
 * Automation Starter for Railway Deployment
 * Runs auto-process-fees and distribute-rewards on schedule
 */

const { exec } = require('child_process');
const fs = require('fs');

console.log('\n🤖 Stealthyield Automation Starting...\n');
console.log('Time:', new Date().toISOString());
console.log('Environment: Railway\n');

// Verify configuration
if (!process.env.DEPLOYER_WALLET_PATH) {
  console.error('❌ DEPLOYER_WALLET_PATH not set!');
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

// Health check endpoint (optional)
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
});

