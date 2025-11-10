# Stealthyield (STYD)

> Automated Yield Protocol on Solana | Token 2022 + Dual Rewards

**Token Mint**: `4spgGcQcHrAXEZfLs5hWJgYNmXcA7mjjiYRMoob1Wz9b`  
**Website**: http://stealthyield.fun  
**Twitter**: https://x.com/Stealthyield

---

## 🌟 Overview

Stealthyield is an automated yield protocol on Solana featuring:
- **Passive Income**: Hold ≥500 STYD, receive automatic emissions
- **Dual Rewards**: LP providers get STYD + SOL rewards
- **Auto-Deflationary**: 5% transfer fee with 30% auto-burn
- **Progressive Unlock**: SOL rewards increase from 0% → 50% over time

**Architecture**: Token 2022 + Offchain automation (like SORE)

---

## 📊 Token Economics

### Core Parameters
- **Initial Supply**: 1,000,000 STYD
- **Daily Emission**: 500,000 STYD (starts)
- **Emission Interval**: Every 10 minutes (3,472 STYD)
- **Transfer Fee**: 5% automatic (30% burn + 70% → SOL)
- **Max Supply**: 12,500,000 STYD (hard cap at Day ~153)

### Dynamic Thresholds (Double Each Halving)

| Phase | Supply | Holder Min | LP Min | Emission | SOL Rewards |
|-------|--------|------------|--------|----------|-------------|
| 0 | 1M-2.5M | 500 | 1,000 | 500K/day | 0% |
| 1 | 2.5M-5M | 1,000 | 2,000 | 250K/day | 5% |
| 2 | 5M-7.5M | 2,000 | 4,000 | 125K/day | 15% |
| 3 | 7.5M+ | 4,000 | 8,000 | 62.5K/day | 50% |

---

## 🏗️ Architecture

### Token Layer (Onchain - Token 2022)
- Automatic 5% transfer fee on all transfers
- Built-in metadata (name, symbol, logo)
- Mint Authority: Project wallet

### Automation Layer (Offchain - Node.js Scripts)
- **auto-process-fees.js**: Harvest fees → Burn 30% → Swap 70% to SOL
- **distribute-rewards.js**: Mint STYD to holders/LPs + Transfer SOL to LPs
- **start-automation.js**: Railway deployment runner

### Frontend (Next.js DApp)
- Real-time dashboard with live transactions
- Top 100 holders/LP providers rankings
- Supply growth charts
- All data from blockchain

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Solana CLI
- 2 wallets with private keys

### Deployment

#### 1. Token (Already Deployed ✅)
```
Mint: 4spgGcQcHrAXEZfLs5hWJgYNmXcA7mjjiYRMoob1Wz9b
Name: STYD
Symbol: STYD
Logo: ✅ On IPFS
Transfer Fee: ✅ 5%
```

#### 2. LP Pool (Already Created ✅)
- Raydium CPMM
- Initial: 0.3 SOL + 1M STYD

#### 3. Deploy Automation to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up

# Set environment variables in Railway dashboard:
DEPLOYER_WALLET_PATH=./wallets/deployer-wallet.json
MOTHERWOMB_WALLET_PATH=./wallets/motherwomb-wallet.json
```

#### 4. Deploy Frontend to Vercel

```bash
cd frontend
vercel --prod
```

---

## 💰 Wallets

### Deployer (Operations)
```
Address: GzV4DVTaZJuPXjJS5o57m85PEJRKDaFubFw2pYCPqWPY

Roles:
  - Mint Authority
  - withdrawWithheldAuthority (receives Transfer Fee)
  - STYD distribution
```

### MotherWomb (SOL Reward Pool)
```
Address: 5kegRGctwKkdvytig8CeCAzuBQWivTvEtgyePtyVcgtk

Roles:
  - SOL storage
  - LP provider rewards
```

---

## 🤖 Automation

### auto-process-fees.js (Every 10 min)
```
1. Harvest withheld Transfer Fees
2. Swap 70% STYD → SOL (Jupiter V6)
3. Burn 30% STYD
4. Transfer 99% SOL to MotherWomb
5. Update state.json
```

### distribute-rewards.js (Every 10 min)
```
1. Query all holders (≥500 STYD)
2. Query all LP providers (≥1000 STYD + LP)
3. Calculate rewards (proportional)
4. Mint STYD to holders/LPs
5. Transfer SOL to LPs (Progressive: 0%→5%→15%→50%)
```

---

## 📁 Project Structure

```
Stealthyield/
├── scripts/
│   ├── deploy-styd.sh              ⭐ Token deployment
│   ├── auto-process-fees.js        🔄 Fee processing
│   ├── distribute-rewards.js       💰 Reward distribution
│   ├── start-automation.js         🤖 Railway runner
│   └── check-transfer-fees.js      🔍 Fee monitoring
├── frontend/                        🎨 Next.js DApp
├── wallets/                         🔐 Private keys (git ignored)
├── config.json                      ⚙️  Project config
├── styd-token-info.json             📄 Token info
├── metadata.json                    📝 Token metadata
├── railway.json                     🚂 Railway config
├── .gitignore                       🔒 Security
├── README.md                        📖 This file
├── DEPLOY_TO_RAILWAY.md            🚂 Railway guide
├── SECURITY.md                      🔐 Security guide
└── QUICKSTART.md                    🚀 Quick start
```

---

## 🎨 Frontend Features

**Live Dashboard**:
- 8 real-time stats
- Supply growth chart (180 days)
- Emissions transactions (100 latest)
- Deflation transactions (100 latest)

**Holders Page**:
- Top 100 holders rankings
- Real-time balances
- Daily earnings calculator
- Transaction links

**Liquidity Providers Page**:
- Top 100 LP rankings
- MotherWomb balance display
- Dual rewards (STYD + SOL)
- Add LP button

**Features**:
- ✅ Real-time data (30s-2min refresh)
- ✅ All links clickable
- ✅ Crimson Text font
- ✅ Silver theme
- ✅ Mobile responsive

---

## 🔐 Security

### Private Key Protection
- ✅ Environment variables
- ✅ .gitignore configured
- ✅ File permissions (600)
- ✅ Never commit keys

### Best Practices
- ✅ Separate operation/reward wallets
- ✅ Encrypted backups
- ✅ Railway secure storage

---

## 📊 Current Status

### Token
- ✅ Deployed to mainnet
- ✅ Name/Symbol: STYD ✅
- ✅ Logo: Visible on DEX ✅
- ✅ Transfer Fee: Working ✅
- ✅ Supply: ~974K (burn in action)

### Automation
- ✅ Scripts ready
- ✅ Logic verified
- ⏳ Awaiting Railway deployment (to fix Jupiter connection)

### Frontend
- ✅ All pages complete
- ✅ Real-time data
- ✅ Responsive design

---

## 🚀 Next Steps

1. ✅ Token deployed
2. ✅ LP pool created
3. ⏳ Deploy automation to Railway
4. ⏳ Deploy frontend to Vercel
5. ⏳ Announce to community

---

## 📝 Links

- Token: https://solscan.io/token/4spgGcQcHrAXEZfLs5hWJgYNmXcA7mjjiYRMoob1Wz9b
- Website: http://stealthyield.fun
- Twitter: https://x.com/Stealthyield
- Raydium Pool: (Add after creation)

---

**Stealthyield - Automated. Efficient. Sustainable.** ⚡✨
