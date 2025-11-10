#!/bin/bash
# STYD Token Complete Deployment Script
# One-shot deployment with Transfer Fee + Metadata

set -e

echo ""
echo "🚀 STYD Token 2022 Deployment"
echo "================================"
echo ""

cd /Users/tt/Desktop/tst/2511/Stealthyield

# Configure Solana CLI
export DEPLOYER_WALLET=wallets/deployer-wallet.json
solana config set --keypair $DEPLOYER_WALLET --url https://api.mainnet-beta.solana.com > /dev/null

echo "Deployer: $(solana address)"
echo "Balance: $(solana balance) SOL"
echo ""

# Token Configuration
NAME="STYD"
SYMBOL="STYD"
DECIMALS=9
TRANSFER_FEE_BPS=500
MAX_FEE=1000000000000
LOGO_CID="bafybeiccyccmz42omboii4jfyesxwqzddfrdeg6gu5hpf2r55tugkcxe5a"
METADATA_CID="bafkreifae6czz6olfosp5os3ppo7rloof5mvnkyrc6itdh3li2lqeqx5ve"

echo "Configuration:"
echo "  Name: $NAME"
echo "  Symbol: $SYMBOL"
echo "  Transfer Fee: $(($TRANSFER_FEE_BPS / 100))%"
echo ""

# Step 1: Create Token with extensions
echo "Step 1/4: Creating Token with extensions..."
TOKEN_MINT=$(spl-token create-token \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --decimals $DECIMALS \
  --enable-metadata \
  --transfer-fee-basis-points $TRANSFER_FEE_BPS \
  --transfer-fee-maximum-fee $MAX_FEE \
  2>&1 | grep "Creating token" | awk '{print $3}')

if [ -z "$TOKEN_MINT" ]; then
  echo "❌ Failed to create token"
  exit 1
fi

echo "✅ Token: $TOKEN_MINT"
sleep 2

# Step 2: Initialize Metadata  
echo ""
echo "Step 2/4: Initializing metadata..."
spl-token initialize-metadata $TOKEN_MINT \
  "$NAME" \
  "$SYMBOL" \
  "https://gateway.pinata.cloud/ipfs/$METADATA_CID" \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  > /dev/null 2>&1

echo "✅ Metadata initialized"
sleep 2

# Step 3: Create Account
echo ""
echo "Step 3/4: Creating token account..."
TOKEN_ACCOUNT=$(spl-token create-account $TOKEN_MINT \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  2>&1 | grep "Creating account" | awk '{print $3}')

echo "✅ Account: $TOKEN_ACCOUNT"
sleep 2

# Step 4: Mint Supply
echo ""
echo "Step 4/4: Minting 1,000,000 STYD..."
spl-token mint $TOKEN_MINT 1000000 \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  > /dev/null 2>&1

echo "✅ Minted 1M STYD"

# Verify
echo ""
echo "🔍 Verifying..."
spl-token display $TOKEN_MINT --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb | grep -E "Name|Symbol|URI|Transfer"

# Save info
cat > styd-token-info.json << EOF
{
  "mint": "$TOKEN_MINT",
  "name": "$NAME",
  "symbol": "$SYMBOL",
  "logoURI": "https://gateway.pinata.cloud/ipfs/$LOGO_CID",
  "metadataURI": "https://gateway.pinata.cloud/ipfs/$METADATA_CID",
  "decimals": $DECIMALS,
  "authority": "$(solana address)",
  "tokenAccount": "$TOKEN_ACCOUNT",
  "initialSupply": 1000000,
  "transferFee": $TRANSFER_FEE_BPS,
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "website": "http://stealthyield.fun",
  "twitter": "https://x.com/Stealthyield"
}
EOF

# Update frontend env
echo "NEXT_PUBLIC_TOKEN_MINT=$TOKEN_MINT" > frontend/.env.local

echo ""
echo "═══════════════════════════════════════════════"
echo "🎉 STYD Token Deployed Successfully!"
echo "═══════════════════════════════════════════════"
echo "Mint: $TOKEN_MINT"
echo "Account: $TOKEN_ACCOUNT"
echo "Supply: 1,000,000 STYD"
echo ""
echo "🔗 https://solscan.io/token/$TOKEN_MINT"
echo "═══════════════════════════════════════════════"
echo ""

