# 🔧 Railway 部署修复清单

**修复日期**: 2025-11-11  
**修复版本**: 2.0.1

---

## ✅ 已修复的问题

### 🔴 严重问题修复

#### 1. ✅ 修复 SOL 奖励百分比配置错误
**文件**: `config.json`
**修改**: 
```json
// 修改前
"solUnlockPercentages": [5, 25, 50, 100]

// 修改后
"solUnlockPercentages": [0, 5, 15, 50]
```
**影响**: 确保 SOL 奖励按照文档说明正确分配

---

#### 2. ✅ 修复 distribute-rewards.js 中的 config 引用
**文件**: `scripts/distribute-rewards.js`
**修改**: 在文件顶部添加
```javascript
const config = JSON.parse(fs.readFileSync('./config.json'));
```
**影响**: 解决运行时 "config is not defined" 错误

---

#### 3. ✅ 修复 RPC URL 配置
**文件**: `scripts/distribute-rewards.js`
**修改**: 
```javascript
// 修改前
const connection = new Connection(
  process.env.RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

// 修改后
const connection = new Connection(
  process.env.RPC_URL || config.network.rpcUrl,
  'confirmed'
);
```
**影响**: 确保连接到正确的 mainnet 网络

---

#### 4. ✅ 修复前端 tokenMint 配置
**文件**: `frontend/lib/config.ts`
**修改**: 
```typescript
// 修改前
tokenMint: process.env.NEXT_PUBLIC_TOKEN_MINT || '',
raydiumPool: process.env.NEXT_PUBLIC_RAYDIUM_POOL || '',

// 修改后
tokenMint: process.env.NEXT_PUBLIC_TOKEN_MINT || '4spgGcQcHrAXEZfLs5hWJgYNmXcA7mjjiYRMoob1Wz9b',
raydiumPool: process.env.NEXT_PUBLIC_RAYDIUM_POOL || 'BeNW14fnU2uJKkvCmtKDRejmFFHM66kW65oAkaUwKYbK',
```
**影响**: 前端可以正确显示 token 数据

---

### 🟡 中等问题修复

#### 5. ✅ 统一 Railway 启动命令
**文件**: `nixpacks.toml`
**修改**: 
```toml
// 移除了前端构建步骤（Railway 只运行自动化）
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install --production=false"]

[start]
cmd = "node scripts/start-automation.js"
```
**影响**: 与 railway.json 保持一致，避免冲突

---

#### 6. ✅ 改进 Jupiter 交换错误处理
**文件**: `scripts/auto-process-fees.js`
**修改**: 
- 交换失败时记录错误到 state.json
- 保留失败信息用于调试
```javascript
if (solReceived === 0) {
  const state = loadState();
  state.lastFeeProcessingError = {
    timestamp: Date.now(),
    error: 'Jupiter swap failed',
    amount: swapAmount / 1e9,
  };
  saveState(state);
  return;
}
```
**影响**: 更好的错误追踪和调试

---

#### 7. ✅ 添加状态文件备份机制
**文件**: `scripts/auto-process-fees.js`, `scripts/distribute-rewards.js`
**修改**: 
```javascript
function saveState(state) {
  // 备份现有状态
  if (fs.existsSync('./state.json')) {
    const backup = fs.readFileSync('./state.json');
    fs.writeFileSync('./state.json.backup', backup);
  }
  
  // 保存新状态
  state.lastUpdated = Date.now();
  fs.writeFileSync('./state.json', JSON.stringify(state, null, 2));
}
```
**影响**: 防止数据丢失，可以恢复到上一个状态

---

#### 8. ✅ 使用配置常量替代魔法数字
**文件**: `scripts/auto-process-fees.js`
**修改**: 
```javascript
// 修改前
const burnAmount = Math.floor(currentBalance * 0.30);
const swapAmount = Math.floor(currentBalance * 0.70);

// 修改后
const burnPercentage = config.feeProcessing.burnPercentage / 100;
const swapPercentage = config.feeProcessing.swapPercentage / 100;
const burnAmount = Math.floor(currentBalance * burnPercentage);
const swapAmount = Math.floor(currentBalance * swapPercentage);
```
**影响**: 提高代码可维护性

---

### 🟢 轻微问题修复

#### 9. ✅ 改进健康检查端点
**文件**: `scripts/start-automation.js`
**修改**: 
```javascript
// 返回详细的健康状态信息
{
  status: 'healthy',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
  lastFeeProcessing: state.lastFeeProcessing,
  lastEmission: state.lastEmission,
  totalSupply: (state.totalSupply / 1e9).toFixed(2),
  totalBurned: (state.totalBurned / 1e9).toFixed(2),
  motherWombSOL: state.motherWombSOL,
  halvingCount: state.halvingCount,
  rewardPhase: state.rewardPhase,
}
```
**影响**: 更好的监控和调试能力

---

#### 10. ✅ 添加状态版本控制
**文件**: `scripts/auto-process-fees.js`, `scripts/distribute-rewards.js`
**修改**: 
```javascript
function loadState() {
  const data = JSON.parse(fs.readFileSync('./state.json'));
  if (!data.version) {
    data.version = '1.0.0';
  }
  return data;
}
```
**影响**: 支持未来的状态迁移

---

#### 11. ✅ 更新 .gitignore
**文件**: `.gitignore`
**修改**: 
```
# State files
state.json
state.json.backup
```
**影响**: 避免提交备份文件

---

## ⚠️ 仍需手动处理的问题

### 🔴 持有者查询功能未实现
**位置**: `scripts/distribute-rewards.js` 第 237 行

**当前状态**: 
```javascript
async function fetchHolders(connection, mint) {
  console.log('  ⚠️  Holder querying not implemented yet');
  return [];
}
```

**需要实现的方案**:

#### 方案 1: 使用 Helius DAS API (推荐)
```javascript
async function fetchHolders(connection, mint) {
  const response = await fetch('https://mainnet.helius-rpc.com/?api-key=YOUR_KEY', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'getTokenAccounts',
      params: {
        mint: mint.toString(),
        limit: 1000,
      },
    }),
  });
  
  const data = await response.json();
  return data.result.token_accounts;
}
```

#### 方案 2: 使用 getProgramAccounts
```javascript
async function fetchHolders(connection, mint) {
  const TOKEN_PROGRAM = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
  
  const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM, {
    filters: [
      { dataSize: 165 },
      { memcmp: { offset: 0, bytes: mint.toBase58() } }
    ]
  });
  
  return accounts.map(({ pubkey, account }) => {
    // Parse account data
    const data = account.data;
    const amount = data.readBigUInt64LE(64);
    const owner = new PublicKey(data.slice(32, 64));
    
    return {
      address: pubkey,
      owner: owner.toString(),
      amount: Number(amount),
    };
  });
}
```

#### 方案 3: 使用 Solscan API
```javascript
async function fetchHolders(connection, mint) {
  const response = await fetch(
    `https://public-api.solscan.io/token/holders?tokenAddress=${mint.toString()}&limit=100`
  );
  
  const data = await response.json();
  return data.data;
}
```

**建议**: 使用 Helius DAS API，因为：
- ✅ 已经在使用 Helius RPC
- ✅ 性能好，不受 RPC 限制
- ✅ 数据准确且实时

---

## 🚀 Railway 部署步骤

### 1. 设置环境变量
在 Railway Dashboard 中设置以下环境变量：

```bash
# 必需的环境变量
DEPLOYER_PRIVATE_KEY_BASE58=<你的 Deployer 私钥 Base58>
MOTHERWOMB_PRIVATE_KEY_BASE58=<你的 MotherWomb 私钥 Base58>

# 可选的环境变量
RPC_URL=https://mainnet.helius-rpc.com/?api-key=ffddb707-229a-42ff-b334-42e983de9db8
PORT=3000
```

### 2. 推送代码到 GitHub
```bash
git add .
git commit -m "fix: Railway deployment issues"
git push origin main
```

### 3. 在 Railway 中部署
- Railway 会自动检测到推送
- 使用 nixpacks.toml 配置构建
- 启动命令: `node scripts/start-automation.js`

### 4. 验证部署
访问健康检查端点：
```
https://your-railway-app.railway.app/health
```

应该返回类似：
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-11-11T...",
  "lastFeeProcessing": 1699000000000,
  "lastEmission": 1699000000000,
  "totalSupply": "1000000.00",
  "totalBurned": "0.00",
  "motherWombSOL": 0,
  "halvingCount": 0,
  "rewardPhase": 0
}
```

---

## 📊 修复前后对比

| 问题 | 修复前 | 修复后 |
|------|--------|--------|
| SOL 奖励 | 错误的百分比 | 正确的 0/5/15/50% |
| Config 引用 | 运行时错误 | ✅ 正常运行 |
| RPC 网络 | Devnet | ✅ Mainnet |
| 前端 Token | 空字符串 | ✅ 正确的 Mint |
| 错误处理 | 丢失信息 | ✅ 记录到状态 |
| 状态备份 | 无备份 | ✅ 自动备份 |
| 健康检查 | 只返回 OK | ✅ 详细状态 |
| 魔法数字 | 硬编码 | ✅ 使用配置 |

---

## ✅ 测试清单

在部署前，请确认：

- [ ] 所有环境变量已设置
- [ ] 私钥格式正确（Base58）
- [ ] RPC URL 可访问
- [ ] Token Mint 地址正确
- [ ] Raydium Pool ID 正确
- [ ] 健康检查端点返回正确数据
- [ ] 日志输出正常
- [ ] 状态文件正确创建

---

## 🎯 下一步

1. **实现持有者查询** - 选择并实现上述三个方案之一
2. **测试自动化** - 在 Railway 上运行并监控
3. **部署前端** - 到 Vercel
4. **监控运行** - 检查日志和健康状态

---

**修复完成！准备部署到 Railway** 🚀

