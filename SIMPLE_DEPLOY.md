# 🚀 超简单部署方案

**最简单、最稳定的部署方式！**

---

## 📋 部署架构

```
Railway (后端)          Vercel (前端)
    ↓                       ↓
自动化脚本              Next.js 网站
每10分钟运行            用户访问界面
```

**优势**：
- ✅ 简单 - 各自独立，互不干扰
- ✅ 稳定 - Railway 专注后端，Vercel 专注前端
- ✅ 免费 - 两个平台都有免费额度
- ✅ 快速 - 部署时间短，不容易出错

---

## 🔧 第一步：Railway 部署后端（自动化）

### 1. 确认环境变量

在 Railway Dashboard → Variables 中设置：

```bash
DEPLOYER_PRIVATE_KEY_BASE58=<你的 Base58 私钥>
MOTHERWOMB_PRIVATE_KEY_BASE58=<你的 Base58 私钥>
```

**如何获取 Base58 私钥？**

在本地运行：
```bash
npm run convert-keys
```

复制输出的 Base58 私钥。

### 2. 推送代码

```bash
git add .
git commit -m "simplify: Railway backend only"
git push origin main
```

### 3. 验证部署

访问健康检查：
```
https://stealthyield-production.up.railway.app/health
```

应该返回：
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "totalSupply": "1000000.00",
  ...
}
```

**✅ Railway 后端部署完成！**

---

## 🎨 第二步：Vercel 部署前端

### 方法 A：通过 Vercel Dashboard（最简单）

1. **访问 Vercel**
   ```
   https://vercel.com/
   ```

2. **导入项目**
   - 点击 "Add New" → "Project"
   - 选择你的 GitHub 仓库 `Stealthyield`
   - 点击 "Import"

3. **配置项目**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **设置环境变量**（可选）
   ```
   NEXT_PUBLIC_TOKEN_MINT=4spgGcQcHrAXEZfLs5hWJgYNmXcA7mjjiYRMoob1Wz9b
   NEXT_PUBLIC_RAYDIUM_POOL=BeNW14fnU2uJKkvCmtKDRejmFFHM66kW65oAkaUwKYbK
   ```

5. **点击 Deploy**

等待 2-3 分钟，Vercel 会给你一个 URL：
```
https://stealthyield.vercel.app
```

**✅ 前端部署完成！**

---

### 方法 B：通过 Vercel CLI（快速）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 进入前端目录
cd frontend

# 登录 Vercel
vercel login

# 部署
vercel --prod
```

按照提示操作，几分钟后就部署好了！

---

## 📊 验证部署

### 后端（Railway）

访问：`https://stealthyield-production.up.railway.app/health`

应该看到：
```json
{
  "status": "healthy",
  "lastFeeProcessing": 1699000000000,
  "lastEmission": 1699000000000,
  "totalSupply": "1000000.00"
}
```

### 前端（Vercel）

访问：`https://stealthyield.vercel.app`

应该看到：
- 📊 Dashboard 页面
- 🥛 Milker 页面
- 🐣 Breeder 页面

---

## 🔄 连接前后端

前端需要从后端获取数据。有两个选择：

### 选项 1：前端直接读取链上数据（推荐）

前端已经配置好了，会自动从 Solana 链上读取数据。

**无需额外配置！**

### 选项 2：前端调用 Railway API

如果你想让前端从 Railway 获取数据：

1. **在 Railway 中暴露 API**（已经有了 `/health`）

2. **在前端配置 API URL**

在 Vercel 环境变量中添加：
```
NEXT_PUBLIC_API_URL=https://stealthyield-production.up.railway.app
```

3. **前端调用 API**
```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
const data = await response.json();
```

---

## ✅ 部署完成检查清单

### Railway 后端
- [ ] 部署状态为绿色
- [ ] `/health` 端点返回正常
- [ ] 日志显示每 10 分钟运行任务
- [ ] 持有者查询成功
- [ ] 没有错误日志

### Vercel 前端
- [ ] 部署状态为 "Ready"
- [ ] 可以访问前端 URL
- [ ] Dashboard 页面正常显示
- [ ] Milker 页面正常显示
- [ ] Breeder 页面正常显示

---

## 🎯 为什么这个方案最简单？

| 方案 | 复杂度 | 稳定性 | 成本 |
|------|--------|--------|------|
| **分离部署** | ⭐ 简单 | ⭐⭐⭐ 很稳定 | 免费 |
| 全栈 Railway | ⭐⭐⭐ 复杂 | ⭐ 不稳定 | $5-20/月 |
| 全栈 Vercel | ⭐⭐ 中等 | ⭐⭐ 一般 | 免费 |

**分离部署的优势**：
1. ✅ Railway 专注后端 - 不需要构建前端
2. ✅ Vercel 专注前端 - 自动优化 Next.js
3. ✅ 互不干扰 - 一个挂了不影响另一个
4. ✅ 易于调试 - 问题容易定位
5. ✅ 免费额度 - 两个平台都有免费计划

---

## 🚨 常见问题

### Q1: Railway 还是报错怎么办？

**A**: 检查环境变量是否正确设置：
```bash
DEPLOYER_PRIVATE_KEY_BASE58=<你的私钥>
MOTHERWOMB_PRIVATE_KEY_BASE58=<你的私钥>
```

在本地运行 `npm run convert-keys` 获取正确的 Base58 私钥。

### Q2: Vercel 部署失败怎么办？

**A**: 确认 Root Directory 设置为 `frontend`：
```
Root Directory: frontend
```

### Q3: 前端显示但没有数据？

**A**: 前端会自动从链上读取数据，等待几分钟让自动化运行。

或者检查 `state.json` 是否在 Railway 中创建。

### Q4: 需要更新代码怎么办？

**A**: 
```bash
git add .
git commit -m "update"
git push origin main
```

Railway 和 Vercel 都会自动重新部署！

---

## 💰 成本

### Railway（后端）
- **免费额度**: $5/月
- **实际使用**: ~$0-2/月（后端很轻量）

### Vercel（前端）
- **Hobby Plan**: 完全免费
- **无限制**: 带宽、部署次数

**总成本**: 基本免费！

---

## 🎉 快速开始

### 1 分钟部署后端

```bash
# 1. 获取私钥
npm run convert-keys

# 2. 在 Railway 设置环境变量
# DEPLOYER_PRIVATE_KEY_BASE58=<复制的私钥>

# 3. 推送代码
git add .
git commit -m "simplify deployment"
git push origin main

# 4. 等待 Railway 自动部署
```

### 2 分钟部署前端

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 进入前端目录
cd frontend

# 3. 部署
vercel --prod

# 4. 按照提示操作
```

**完成！** 🎉

---

## 📞 需要帮助？

1. **Railway 问题** → 查看 Railway 日志
2. **Vercel 问题** → 查看 Vercel 部署日志
3. **前端问题** → 查看浏览器控制台

---

**这是最简单、最稳定的部署方案！** 🚀

现在就开始部署吧！

