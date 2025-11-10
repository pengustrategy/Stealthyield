# Railway部署指南

## 🚂 部署Stealthyield自动化到Railway

### 为什么选择Railway

```
✅ 稳定的网络连接（解决Jupiter连接问题）
✅ 24/7运行
✅ 自动重启
✅ 环境变量管理
✅ 简单部署
✅ $5/月起
```

---

## 📋 部署步骤

### Step 1: 准备Railway账户

1. 访问 https://railway.app
2. 注册账户（GitHub登录）
3. 创建新项目

### Step 2: 上传代码

```bash
# 在项目根目录
cd /Users/tt/Desktop/tst/2511/Stealthyield

# 初始化git（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 连接Railway
# (在Railway dashboard选择"Deploy from GitHub repo")
```

### Step 3: 配置环境变量

在Railway Dashboard设置以下变量：

```
DEPLOYER_WALLET_PATH=./wallets/deployer-wallet.json
MOTHERWOMB_WALLET_PATH=./wallets/motherwomb-wallet.json
NODE_ENV=production
```

### Step 4: 上传钱包文件

⚠️ **重要**: 钱包文件需要加密上传

```bash
# 方式1: 使用Railway CLI
railway run bash
# 然后上传加密的钱包文件

# 方式2: 使用环境变量（Base64编码）
cat wallets/deployer-wallet.json | base64
# 复制输出，在Railway设置为DEPLOYER_WALLET_BASE64
```

### Step 5: 部署

```
Railway会自动:
  ✅ 检测package.json
  ✅ 安装依赖
  ✅ 运行start-automation.js
  ✅ 每10分钟执行harvest和分发
```

---

## ⚙️ 已配置文件

| 文件 | 用途 |
|------|------|
| `railway.json` | Railway配置 |
| `scripts/start-automation.js` | 自动化启动器 |
| `.gitignore` | 保护私钥 |

---

## 🔐 安全建议

### 钱包文件处理

**❌ 不要直接commit钱包文件！**

**✅ 使用环境变量**:
```javascript
// 在start-automation.js中
if (process.env.DEPLOYER_WALLET_BASE64) {
  const walletData = Buffer.from(
    process.env.DEPLOYER_WALLET_BASE64,
    'base64'
  ).toString('utf-8');
  fs.writeFileSync('./wallets/deployer-wallet.json', walletData);
}
```

---

## 🎯 部署后的运行

### 自动执行

```
Railway会持续运行:
  
每10分钟:
  ├─ auto-process-fees.js
  │   ├─ Harvest Transfer Fee
  │   ├─ Swap STYD → SOL (Jupiter稳定连接)
  │   ├─ Burn 30%
  │   └─ 转SOL到MotherWomb
  │
  └─ distribute-rewards.js
      ├─ 分发STYD给Holders
      └─ 分发SOL给LP Providers
```

### 监控

```
Railway Dashboard:
  ✅ 查看日志
  ✅ 监控CPU/内存
  ✅ 查看运行状态
```

---

## 💰 成本

```
Railway费用:
  Starter: $5/月
  Developer: $10/月

包含:
  ✅ 512MB RAM
  ✅ 1 vCPU
  ✅ 足够运行Node.js脚本
```

---

## ✅ Railway部署优势

```
vs 本地运行:
  ✅ 不需要电脑24/7开机
  ✅ 稳定网络（Jupiter可连接）
  ✅ 自动重启
  ✅ 日志管理
  
vs VPS:
  ✅ 更简单（无需配置服务器）
  ✅ 更便宜（$5 vs $10+）
  ✅ 自动扩展
```

---

**部署到Railway后Jupiter连接问题会解决！** 🚂✨

