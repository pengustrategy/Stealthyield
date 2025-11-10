# Railway环境变量配置

## 🔑 需要的环境变量

### 必需（只需要1个私钥）

```
变量名: DEPLOYER_PRIVATE_KEY_BASE58
变量值: y27nP7A6ypt7uZSFpRiMK2yrKPEyWKqgCS7zESgSq6UrU3rJ1mET62dgvjEwZdJgvmEtfRKQRu29kyu8wad77Lz

用途:
  - 签名所有交易
  - Harvest Transfer Fee
  - Burn STYD
  - Swap STYD → SOL
  - 转SOL到MotherWomb
  - Mint STYD给用户
```

### 可选（地址，不是私钥）

```
变量名: MOTHERWOMB_ADDRESS
变量值: 5kegRGctwKkdvytig8CeCAzuBQWivTvEtgyePtyVcgtk

用途:
  - 接收SOL（从Deployer转入）
  - 前端查询余额显示
  - 不需要私钥！只是地址！
```

### Token配置

```
变量名: NEXT_PUBLIC_TOKEN_MINT
变量值: 4spgGcQcHrAXEZfLs5hWJgYNmXcA7mjjiYRMoob1Wz9b

用途: 前端显示Token信息
```

### 环境

```
变量名: NODE_ENV
变量值: production
```

---

## 💡 关键理解

### MotherWomb不需要私钥！

```
MotherWomb是"只接收"地址:
  
  ✅ Deployer → MotherWomb: 转SOL（Deployer签名）
  ✅ 前端查询MotherWomb余额（只读）
  ❌ 不需要从MotherWomb签名交易
  ❌ 所以不需要MotherWomb私钥
```

### 如果需要从MotherWomb分发SOL

```
当前架构: Deployer持有SOL并分发
  └─ 只需要Deployer私钥

如果改为: MotherWomb持有SOL并分发
  └─ 那时才需要MotherWomb私钥
```

---

## 🎯 Railway环境变量（最终）

### 复制粘贴这些到Railway:

```
DEPLOYER_PRIVATE_KEY_BASE58
y27nP7A6ypt7uZSFpRiMK2yrKPEyWKqgCS7zESgSq6UrU3rJ1mET62dgvjEwZdJgvmEtfRKQRu29kyu8wad77Lz

MOTHERWOMB_ADDRESS
5kegRGctwKkdvytig8CeCAzuBQWivTvEtgyePtyVcgtk

NEXT_PUBLIC_TOKEN_MINT
4spgGcQcHrAXEZfLs5hWJgYNmXcA7mjjiYRMoob1Wz9b

NODE_ENV
production
```

**就这4个！** ✅

---

## 📊 资金流动

```
Transfer Fee收集:
  各Token账户 → Harvest → Deployer钱包

处理:
  Deployer: Burn 30% STYD
  Deployer: Swap 70% STYD → SOL

转账:
  Deployer (签名) → MotherWomb (接收)
  └─ 99% SOL转到MotherWomb

查询:
  前端 → 查询MotherWomb余额（只读）
  └─ 显示"Reward Treasury: X SOL"

分发:
  Deployer (签名) → 用户 (接收)
  └─ 从Deployer的SOL分发（暂时）
  
或改为:
  MotherWomb (签名) → 用户 (接收)
  └─ 那时需要MotherWomb私钥
```

---

## ✅ 总结

**只需要Deployer私钥！**

**MotherWomb只是地址，不需要私钥！**

**已推送到GitHub！** 🚀

