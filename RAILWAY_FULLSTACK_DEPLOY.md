# 🚂 Railway 全栈部署指南

**更新日期**: 2025-11-11  
**部署模式**: 全栈（前端 + 后端自动化）

---

## 🎯 部署架构

Railway 将运行：
1. **Next.js 前端** - 用户界面（端口由 Railway 分配）
2. **自动化后端** - 费用处理 + 奖励分发（每 10 分钟）

---

## ✅ 已完成的修复

### 1. 实现持有者查询功能 ✅
- 使用 Helius DAS API 查询持有者
- 自动降级到 getProgramAccounts（如果 Helius 失败）
- 支持 Token 2022 账户解析

### 2. 配置全栈部署 ✅
- 更新 `nixpacks.toml` - 构建前端
- 更新 `railway.json` - 启动全栈脚本
- 更新 `start-fullstack.js` - 支持 Base58 私钥

---

## 🔑 环境变量设置

在 Railway Dashboard → Variables 中设置：

### 必需变量

```bash
# Deployer 钱包私钥（Base58 格式）
DEPLOYER_PRIVATE_KEY_BASE58=<你的 Base58 私钥>

# MotherWomb 钱包私钥（Base58 格式，可选）
MOTHERWOMB_PRIVATE_KEY_BASE58=<你的 Base58 私钥>
```

### 可选变量

```bash
# RPC URL（已在 config.json 中配置）
RPC_URL=https://mainnet.helius-rpc.com/?api-key=ffddb707-229a-42ff-b334-42e983de9db8

# 端口（Railway 会自动设置）
PORT=3000
```

---

## 🚀 部署步骤

### 1. 推送代码到 GitHub

```bash
# 添加所有修改
git add .

# 提交
git commit -m "feat: implement holder query and fullstack deployment

- Implement holder querying with Helius DAS API
- Add fallback to getProgramAccounts
- Update Railway config for fullstack deployment
- Support Base58 private keys in start-fullstack.js"

# 推送
git push origin main
```

### 2. Railway 自动部署

Railway 会自动：
1. 检测到 GitHub 推送
2. 安装根目录依赖：`npm install`
3. 安装前端依赖：`cd frontend && npm install`
4. 构建前端：`cd frontend && npm run build`
5. 启动全栈：`node scripts/start-fullstack.js`

### 3. 监控部署

访问 Railway Dashboard 查看日志：

**预期日志输出**:
```
🚀 Stealthyield Fullstack Starting...

Time: 2025-11-11T...
Environment: Railway

📦 Converting Base58 private key to keypair...
✅ Deployer wallet created from Base58
   Address: GzV4DVTaZJuPXjJS5o57m85PEJRKDaFubFw2pYCPqWPY
✅ MotherWomb wallet created from Base58
   Address: 5kegRGctwKkdvytig8CeCAzuBQWivTvEtgyePtyVcgtk

✅ Configuration verified

🤖 Starting automation...

✅ Automation scheduled: every 10 minutes

🎨 Starting Next.js frontend...

Frontend will run on port: 3000

✅ Fullstack ready!

🌐 Frontend: http://localhost:3000
🤖 Automation: Running every 10 minutes
```

---

## 🔍 验证部署

### 1. 访问前端

Railway 会提供一个公开 URL，例如：
```
https://stealthyield-production.up.railway.app
```

你应该能看到：
- 📊 Dashboard 页面
- 🥛 Milker 页面（持有者奖励）
- 🐣 Breeder 页面（LP 奖励）

### 2. 检查自动化

在 Railway 日志中，每 10 分钟应该看到：

```
⚙️  Running auto-process-fees...
💰 Running distribute-rewards...

📡 Fetching token holders from Helius...
✅ Found 42 token holders via Helius

✅ Scheduled tasks completed
```

### 3. 验证持有者查询

如果看到以下日志，说明持有者查询正常工作：

```
📡 Fetching token holders from Helius...
✅ Found X token holders via Helius
```

如果 Helius 失败，会自动降级：

```
❌ Helius API error: ...
ℹ️  Falling back to getProgramAccounts...
📡 Fetching holders via getProgramAccounts...
✅ Found X token accounts
✅ Parsed X holders with non-zero balance
```

---

## ⚠️ 常见问题

### 问题 1: "Application failed to respond"

**原因**: 前端构建失败或启动失败

**解决**:
1. 检查 Railway 构建日志
2. 确认前端依赖正确安装
3. 检查 `frontend/package.json` 中的 `start` 脚本

### 问题 2: "DEPLOYER_PRIVATE_KEY_BASE58 not set"

**原因**: 环境变量未设置

**解决**:
1. 在本地运行：`npm run convert-keys`
2. 复制输出的 Base58 私钥
3. 在 Railway Variables 中添加

### 问题 3: 前端显示但数据为空

**原因**: API 路由或状态文件问题

**解决**:
1. 检查 `state.json` 是否创建
2. 访问 `/api/stats` 查看数据
3. 检查自动化是否正常运行

### 问题 4: "Holder querying not implemented"

**原因**: 旧代码未更新

**解决**:
1. 确认已推送最新代码
2. 在 Railway 中触发重新部署
3. 检查 `scripts/distribute-rewards.js` 是否包含新的 `fetchHolders` 函数

---

## 📊 部署后检查清单

- [ ] Railway 部署状态为绿色
- [ ] 可以访问前端 URL
- [ ] 前端页面正常显示
- [ ] Dashboard 显示数据
- [ ] 日志中没有错误
- [ ] 每 10 分钟运行自动化任务
- [ ] 持有者查询成功（日志中显示持有者数量）
- [ ] state.json 正确更新

---

## 🎯 功能验证

### 前端功能

访问以下页面确认正常：

1. **Dashboard** (`/`)
   - 显示总供应量
   - 显示总销毁量
   - 显示 MotherWomb SOL 余额
   - 显示减半阶段

2. **Milker** (`/milker`)
   - 显示持有者要求
   - 显示奖励信息
   - 显示持有者列表（如果有）

3. **Breeder** (`/breeder`)
   - 显示 LP 要求
   - 显示 STYD + SOL 奖励
   - 显示 LP 提供者列表（如果有）

### 后端功能

检查 Railway 日志确认：

1. **费用处理** (每 10 分钟)
   - 收集转账费用
   - 销毁 30%
   - 交换 70% 为 SOL
   - 转账到 MotherWomb

2. **奖励分发** (每 10 分钟)
   - 查询持有者
   - 计算奖励
   - 铸造并分发 STYD
   - 分发 SOL（如果适用）

---

## 🔧 调试命令

### 本地测试

```bash
# 测试持有者查询
node scripts/distribute-rewards.js

# 测试费用处理
node scripts/auto-process-fees.js

# 测试全栈启动
npm run start
```

### 检查配置

```bash
# 运行部署前检查
npm run pre-deploy-check

# 转换私钥
npm run convert-keys
```

---

## 📈 性能监控

### Railway 指标

在 Railway Dashboard 中监控：
- CPU 使用率
- 内存使用率
- 网络流量
- 部署频率

### 应用指标

通过日志监控：
- 持有者数量变化
- 奖励分发成功率
- 费用处理成功率
- RPC 调用延迟

---

## 💰 成本估算

### Railway 定价

- **Hobby Plan**: $5/月
  - 500 小时运行时间
  - 适合测试

- **Pro Plan**: $20/月
  - 无限运行时间
  - 适合生产环境

### 推荐配置

- **开发/测试**: Hobby Plan
- **生产环境**: Pro Plan

---

## 🎉 成功标志

当你看到以下情况时，说明全栈部署成功：

1. ✅ Railway Dashboard 显示绿色状态
2. ✅ 可以访问前端 URL
3. ✅ 前端页面正常显示数据
4. ✅ 日志显示持有者查询成功
5. ✅ 每 10 分钟自动运行任务
6. ✅ state.json 正确更新
7. ✅ 没有错误日志

---

## 📚 相关文档

- **RAILWAY_NEXT_STEPS.md** - 下一步操作
- **FIXES_APPLIED.md** - 修复详情
- **DEPLOYMENT_READY.md** - 部署就绪报告

---

## 🆘 需要帮助？

1. 检查 Railway 部署日志
2. 查看浏览器控制台错误
3. 验证环境变量设置
4. 确认代码已推送到 GitHub

---

**准备好了吗？开始部署！** 🚀

```bash
git add .
git commit -m "feat: implement holder query and fullstack deployment"
git push origin main
```

然后访问 Railway Dashboard 监控部署进度。

