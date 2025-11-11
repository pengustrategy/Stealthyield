# 🚂 Railway 部署完整指南

**更新日期**: 2025-11-11  
**状态**: 已修复所有阻塞问题，准备部署

---

## 📋 部署前检查清单

### ✅ 代码修复状态
- [x] SOL 奖励百分比配置正确
- [x] Config 引用问题已修复
- [x] RPC URL 指向 mainnet
- [x] 前端 tokenMint 已配置
- [x] 错误处理已改进
- [x] 状态备份机制已添加
- [x] 健康检查端点已完善
- [ ] 持有者查询功能（需要实现）

### 📦 准备工作
- [ ] 有 Deployer 钱包私钥（Base58 格式）
- [ ] 有 MotherWomb 钱包私钥（Base58 格式）
- [ ] 有 Railway 账号
- [ ] 代码已推送到 GitHub

---

## 🔑 获取私钥 Base58 格式

如果你的私钥是 JSON 数组格式，需要转换为 Base58：

### 方法 1: 使用 Node.js 脚本
创建 `convert-key.js`:
```javascript
const bs58 = require('bs58');
const fs = require('fs');

// 读取 JSON 格式的私钥
const keypair = JSON.parse(fs.readFileSync('./wallets/deployer-wallet.json'));
const privateKeyBytes = Uint8Array.from(keypair);

// 转换为 Base58
const base58Key = bs58.encode(privateKeyBytes);

console.log('Base58 Private Key:');
console.log(base58Key);
```

运行：
```bash
npm install bs58
node convert-key.js
```

### 方法 2: 使用 Solana CLI
```bash
solana-keygen pubkey ./wallets/deployer-wallet.json --outfile /dev/null
# 然后使用 solana-keygen recover 导出 Base58
```

---

## 🚀 Railway 部署步骤

### Step 1: 创建 Railway 项目

1. 访问 https://railway.app/
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的 Stealthyield 仓库
5. 点击 "Deploy Now"

---

### Step 2: 配置环境变量

在 Railway Dashboard 中，进入 Variables 标签页，添加以下变量：

#### 必需变量

```bash
# Deployer 钱包私钥（Base58 格式）
DEPLOYER_PRIVATE_KEY_BASE58=your_deployer_private_key_base58_here

# MotherWomb 钱包私钥（Base58 格式）
MOTHERWOMB_PRIVATE_KEY_BASE58=your_motherwomb_private_key_base58_here
```

#### 可选变量（使用默认值）

```bash
# RPC URL（已在 config.json 中配置）
RPC_URL=https://mainnet.helius-rpc.com/?api-key=ffddb707-229a-42ff-b334-42e983de9db8

# 端口（Railway 会自动设置）
PORT=3000
```

---

### Step 3: 验证构建配置

确认 Railway 使用了正确的配置文件：

**railway.json**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node scripts/start-automation.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**nixpacks.toml**:
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install --production=false"]

[start]
cmd = "node scripts/start-automation.js"
```

---

### Step 4: 触发部署

1. 推送代码到 GitHub:
```bash
git add .
git commit -m "fix: Railway deployment ready"
git push origin main
```

2. Railway 会自动检测到推送并开始部署

3. 查看部署日志：
   - 在 Railway Dashboard 中点击 "Deployments"
   - 查看实时日志输出

---

### Step 5: 验证部署成功

#### 检查日志输出

应该看到类似的日志：

```
🤖 Stealthyield Automation Starting...

Time: 2025-11-11T...
Environment: Railway

📦 Converting Base58 private key to keypair...
✅ Deployer wallet created from Base58
✅ MotherWomb wallet created from Base58
✅ Configuration verified

Running initial tasks...

⚙️  Running auto-process-fees...
💰 Running distribute-rewards...

✅ Automation scheduled: every 10 minutes

🏥 Health check: http://localhost:3000/health
```

#### 访问健康检查端点

Railway 会提供一个公开 URL，例如：
```
https://stealthyield-production.up.railway.app
```

访问健康检查：
```
https://stealthyield-production.up.railway.app/health
```

应该返回：
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-11-11T12:00:00.000Z",
  "lastFeeProcessing": 1699000000000,
  "lastEmission": 1699000000000,
  "totalSupply": "1000000.00",
  "totalBurned": "0.00",
  "motherWombSOL": 0.05,
  "halvingCount": 0,
  "rewardPhase": 0
}
```

---

## 🔍 故障排查

### 问题 1: "DEPLOYER_WALLET_PATH not set"

**原因**: 环境变量未正确设置

**解决**:
1. 检查 Railway Variables 中是否设置了 `DEPLOYER_PRIVATE_KEY_BASE58`
2. 确认变量名拼写正确
3. 重新部署

---

### 问题 2: "Failed to decode Base58 private key"

**原因**: Base58 格式不正确

**解决**:
1. 重新转换私钥为 Base58 格式
2. 确保没有多余的空格或换行符
3. 使用上面提供的转换脚本

---

### 问题 3: "Connection refused" 或 RPC 错误

**原因**: RPC URL 不可访问或配额用尽

**解决**:
1. 检查 Helius API key 是否有效
2. 考虑使用自己的 RPC endpoint
3. 在 Railway Variables 中设置 `RPC_URL`

---

### 问题 4: "Holder querying not implemented"

**原因**: 持有者查询功能尚未实现

**临时解决**:
- 奖励分发会跳过（返回空数组）
- 费用处理仍然正常工作

**永久解决**:
- 实现持有者查询功能（见下一节）

---

## 🔧 实现持有者查询（重要！）

当前奖励分发无法工作，因为 `fetchHolders` 返回空数组。

### 推荐方案: Helius DAS API

在 `scripts/distribute-rewards.js` 中替换 `fetchHolders` 函数：

```javascript
async function fetchHolders(connection, mint) {
  try {
    const response = await fetch(config.network.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'holders-query',
        method: 'getTokenAccounts',
        params: {
          mint: mint.toString(),
          limit: 1000,
        },
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Helius API error:', data.error);
      return [];
    }
    
    const holders = data.result.token_accounts || [];
    
    console.log(`  ✅ Found ${holders.length} token holders`);
    
    return holders.map(account => ({
      owner: account.owner,
      amount: account.amount,
      hasLP: false, // TODO: Check LP holdings
    }));
  } catch (error) {
    console.error('Error fetching holders:', error);
    return [];
  }
}
```

**部署更新**:
```bash
git add scripts/distribute-rewards.js
git commit -m "feat: implement holder querying with Helius DAS"
git push origin main
```

---

## 📊 监控和维护

### 定期检查

每天检查以下内容：

1. **健康状态**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **Railway 日志**
   - 查看是否有错误
   - 确认自动化任务正常运行

3. **链上数据**
   - 检查 MotherWomb 余额
   - 验证销毁交易
   - 确认奖励分发

### 设置告警

在 Railway Dashboard 中：
1. 进入 Settings → Notifications
2. 添加 Webhook 或 Email 通知
3. 配置失败重启告警

---

## 💰 成本估算

Railway 定价（2024）:
- **Hobby Plan**: $5/月（500 小时运行时间）
- **Pro Plan**: $20/月（无限运行时间）

**推荐**: 
- 开发/测试: Hobby Plan
- 生产环境: Pro Plan

---

## 🎯 部署后验证清单

部署成功后，验证以下功能：

- [ ] 健康检查端点返回正确数据
- [ ] 每 10 分钟运行一次费用处理
- [ ] 每 10 分钟运行一次奖励分发
- [ ] state.json 正确更新
- [ ] 日志输出正常
- [ ] 没有错误或警告
- [ ] MotherWomb 余额增加（如果有交易费）
- [ ] 销毁交易出现在链上

---

## 📝 下一步

1. ✅ 部署到 Railway
2. ⏳ 实现持有者查询功能
3. ⏳ 部署前端到 Vercel
4. ⏳ 监控运行状态
5. ⏳ 社区公告

---

## 🆘 需要帮助？

如果遇到问题：

1. 检查 Railway 日志
2. 访问健康检查端点
3. 查看 GitHub Issues
4. 联系开发团队

---

**准备好了吗？开始部署！** 🚀

```bash
# 最后检查
git status

# 推送到 GitHub
git add .
git commit -m "fix: all Railway deployment issues resolved"
git push origin main

# 在 Railway Dashboard 中监控部署
```

