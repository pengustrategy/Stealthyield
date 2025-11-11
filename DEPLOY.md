# 🚀 超简单部署指南

## 📦 架构

```
Railway          Vercel
   ↓               ↓
backend.js     frontend/
(自动化)        (网站)
```

---

## 1️⃣ Railway 部署后端（2 分钟）

### 步骤 1：设置环境变量

在 Railway Dashboard → Variables 添加：

```bash
DEPLOYER_PRIVATE_KEY_BASE58=<你的私钥>
MOTHERWOMB_PRIVATE_KEY_BASE58=<你的私钥>
```

**获取私钥**：
```bash
npm run convert-keys
```

### 步骤 2：推送代码

```bash
git add .
git commit -m "single file backend"
git push origin main
```

### 步骤 3：验证

访问：`https://stealthyield-production.up.railway.app/health`

应该返回：
```json
{
  "status": "healthy",
  "totalSupply": "1000000.00",
  ...
}
```

✅ **后端完成！**

---

## 2️⃣ Vercel 部署前端（1 分钟）

### 方法 A：Vercel Dashboard

1. 访问 https://vercel.com/
2. 点击 "Add New" → "Project"
3. 选择 `Stealthyield` 仓库
4. 设置：
   ```
   Framework: Next.js
   Root Directory: frontend
   ```
5. 点击 "Deploy"

✅ **前端完成！**

### 方法 B：命令行

```bash
npm install -g vercel
cd frontend
vercel --prod
```

---

## ✅ 验证

### 后端
```
https://stealthyield-production.up.railway.app/health
```

### 前端
```
https://stealthyield.vercel.app
```

---

## 🎯 优势

- ✅ **backend.js** - 单文件，超简单
- ✅ Railway - 只需 2 个环境变量
- ✅ Vercel - 自动检测 Next.js
- ✅ 分离部署 - 互不干扰

---

## 📝 文件说明

### 后端（Railway）
- `backend.js` - 所有后端逻辑（300 行）
- `config.json` - 配置文件
- `package.json` - 依赖

### 前端（Vercel）
- `frontend/` - Next.js 应用
- 自动构建和部署

---

## 🆘 问题排查

### Railway 报错？
1. 检查环境变量是否设置
2. 运行 `npm run convert-keys` 获取正确私钥
3. 查看 Railway 日志

### Vercel 报错？
1. 确认 Root Directory = `frontend`
2. 确认 Framework = Next.js
3. 查看 Vercel 构建日志

---

**就这么简单！** 🎉

