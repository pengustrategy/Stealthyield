# Stealthyield Security Guide

## 🔐 Private Key Management

### ⚠️ CRITICAL: Never Expose Private Keys

**Private keys = Full control of your funds**

---

## ✅ Secure Setup

### 1. Environment Variables

**Always use environment variables for sensitive data**:

```bash
# Create .env file (NEVER commit this!)
cp .env.example .env

# Edit .env
nano .env

# Set wallet paths
DEPLOYER_WALLET_PATH=/secure/path/to/deployer-wallet.json
MOTHERWOMB_WALLET_PATH=/secure/path/to/motherwomb-wallet.json
```

### 2. Wallet Storage

**Store wallets outside of project directory**:

```bash
# Bad ❌
./deployer-wallet.json  # In project root
./wallets/deployer-wallet.json  # In project

# Good ✅
~/secure-keys/stealthyield/deployer.json  # Outside project
/mnt/encrypted/wallets/deployer.json  # Encrypted drive
```

### 3. File Permissions

```bash
# Restrict wallet file permissions
chmod 600 ~/secure-keys/stealthyield/deployer.json

# Only you can read/write
ls -la ~/secure-keys/stealthyield/
# -rw------- 1 user user deployer.json
```

---

## 🛡️ .gitignore Protection

**Already configured** (do not modify):

```gitignore
# Private Keys - NEVER COMMIT
wallets/*.json
deployer-wallet.json
motherwomb-wallet.json
*.key
*.pem

# Environment files
.env
.env.local

# State files (may contain sensitive data)
state.json
styd-token-info.json
```

---

## 📋 Security Checklist

### Before Running Scripts

- [ ] Environment variables set
- [ ] Wallet files have 600 permissions
- [ ] Wallets stored outside project (recommended)
- [ ] .gitignore configured
- [ ] .env file NOT committed

### Before Committing Code

- [ ] Check `git status` carefully
- [ ] Ensure no .json wallet files staged
- [ ] Ensure .env not staged
- [ ] Review all files before commit

### Regular Maintenance

- [ ] Backup wallet files to secure location
- [ ] Encrypt backups
- [ ] Test wallet backup recovery
- [ ] Monitor wallet balances
- [ ] Review transaction history

---

## 💾 Backup Strategy

### Encrypted Backup

```bash
# Create encrypted backup
tar -czf stealthyield-wallets.tar.gz wallets/
gpg -c stealthyield-wallets.tar.gz  # Will prompt for password
rm stealthyield-wallets.tar.gz

# Store stealthyield-wallets.tar.gz.gpg securely
```

### Multiple Locations

```
Backup wallets to:
  ✅ External USB drive (encrypted)
  ✅ Cloud storage (encrypted)
  ✅ Paper backup (mnemonic/seed phrase)
  ✅ Hardware wallet (if supported)
```

---

## 🚨 What NOT To Do

### ❌ Never

- Commit private keys to git
- Share private keys in Discord/Telegram
- Store keys in screenshots
- Email keys to yourself
- Store keys in cloud without encryption
- Hardcode keys in scripts
- Copy/paste keys in public channels

### ✅ Always

- Use environment variables
- Encrypt backups
- Limit file permissions
- Store securely
- Test recovery process
- Monitor for unauthorized access

---

## 🔑 Recommended Usage

### For Development (Devnet)

```bash
# Set environment variables
export DEPLOYER_WALLET_PATH=~/stealthyield-dev/deployer.json
export RPC_URL=https://api.devnet.solana.com

# Run scripts
npm run create-token
```

### For Production (Mainnet)

```bash
# Use secure location
export DEPLOYER_WALLET_PATH=/mnt/encrypted/mainnet-deployer.json
export RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Consider using hardware wallet for signing
```

---

## 🔒 Production Security

### Hardware Wallet (Recommended)

For mainnet, consider:
- Ledger
- Trezor
- Multisig wallet

### Access Control

```bash
# Limit who can run scripts
chmod 700 scripts/
chmod 600 scripts/*.js

# Only you can execute
```

---

## ⚡ Quick Security Check

```bash
# Check for exposed keys
git ls-files | grep -E '\.json$|\.key$'
# Should return NOTHING!

# Check .gitignore
cat .gitignore | grep -E 'wallet|key|\.env'
# Should show protection rules

# Check staged files
git status
# Should NOT show any wallet or .env files
```

---

## 🎯 Summary

**Your wallets are protected by**:
- ✅ Environment variables
- ✅ .gitignore rules
- ✅ File permission checks
- ✅ Path validation

**Always remember**:
> If private key leaks = Funds can be stolen
> NEVER share or commit private keys!

---

**Stay Safe! 🔐**

