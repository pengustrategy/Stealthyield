# Stealthyield Quick Start

## 🔐 Security First!

### Step 0: Set Up Environment Variables

```bash
# Copy environment template
cp env.example .env

# Edit .env file
nano .env

# Set wallet paths (use SECURE location outside project!)
DEPLOYER_WALLET_PATH=/secure/location/deployer-wallet.json
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

**⚠️ NEVER commit .env or wallet files!**

---

## 🚀 Quick Deploy

### Step 1: Install Dependencies (1 min)

```bash
npm install
```

### Step 2: Set Environment Variables (2 min)

```bash
# Set wallet path
export DEPLOYER_WALLET_PATH=/path/to/your/deployer-wallet.json

# Set RPC
export RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Verify
echo $DEPLOYER_WALLET_PATH
```

### Step 3: Create Token (2 min)

```bash
npm run create-token
```

**Output**: `styd-token-info.json`
**Cost**: ~0.003 SOL

### Step 4: Create Raydium LP (5 min)

1. Visit https://raydium.io/liquidity/create/
2. Connect wallet
3. Add liquidity
4. Save pool ID to `config.json`

**Cost**: ~0.3 SOL + liquidity

### Step 5: Start Automation (3 min)

```bash
# Set up cron (requires environment variables)
crontab -e

# Add these lines:
DEPLOYER_WALLET_PATH=/your/secure/path/deployer-wallet.json
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

*/10 * * * * cd /path/to/Stealthyield && /usr/local/bin/node scripts/auto-process-fees.js >> logs/fees.log 2>&1
*/10 * * * * cd /path/to/Stealthyield && /usr/local/bin/node scripts/distribute-rewards.js >> logs/distribution.log 2>&1
```

### Step 6: Launch Frontend (1 min)

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

---

## 🔒 Security Reminders

### ✅ Do This
- Store wallets in secure location OUTSIDE project
- Use environment variables
- Set file permissions: `chmod 600 wallet.json`
- Backup encrypted
- Never commit .env

### ❌ Never Do This
- Commit wallet files
- Share private keys
- Store keys in project root
- Push .env to git
- Screenshot private keys

---

## 📋 Environment Variables Reference

```bash
# Required
DEPLOYER_WALLET_PATH=  # Path to deployer wallet
RPC_URL=               # Solana RPC endpoint

# Optional
MOTHERWOMB_WALLET_PATH=  # If using separate wallet
STYD_MINT=               # Token mint (auto-filled)
```

---

## 🚀 Total Time: ~15 minutes

**Total Cost**: ~0.003 SOL + LP liquidity

**Security**: ✅ Protected by environment variables

---

**Read SECURITY.md for complete security guide!** 🔐
