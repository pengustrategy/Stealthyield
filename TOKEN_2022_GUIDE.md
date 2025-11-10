# Stealthyield Token 2022 部署指南

## 🆕 为什么使用Token 2022？

### 跟随SORE的成功实践
- ✅ SORE使用Token 2022
- ✅ 证明了在DeFi生态中的可行性
- ✅ 现代钱包和DEX全面支持

### Token 2022的优势

1. **内置Transfer Fee Extension**
   - 自动5%税收，无需自定义转账指令
   - 简化用户体验
   - 降低Gas费用

2. **未来扩展性**
   - 可添加更多Extension
   - 支持高级功能（隐私转账等）
   - 长期技术保障

3. **生态支持**
   - Raydium ✅
   - Jupiter ✅
   - Phantom ✅
   - Solflare ✅
   - 主流DEX和钱包都已支持

---

## 🏗️ Token 2022 vs 标准SPL Token

| 特性 | SPL Token | Token 2022 | STYD选择 |
|------|-----------|------------|----------|
| 兼容性 | 100% | 95%+ | ✅ |
| Transfer Fee | ❌ 需自定义 | ✅ 内置 | ✅ |
| Gas费用 | 低 | 略高 | ✅ 可接受 |
| 扩展功能 | 无 | 丰富 | ✅ |
| 开发难度 | 简单 | 中等 | ✅ |

---

## 📦 创建Token 2022步骤

### 1. 使用脚本创建

```bash
cd /Users/tt/Desktop/tst/2511/Stealthyield

# 安装依赖
npm install

# 运行创建脚本
ts-node scripts/create-token2022.ts
```

**脚本会创建**:
- Token 2022 Mint
- Transfer Fee Extension (5%, 500 basis points)
- Max fee: 1,000 STYD per transaction
- 9 decimals

### 2. 手动创建（CLI方式）

```bash
# 创建Token 2022 mint with transfer fee
spl-token create-token \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --decimals 9 \
  --enable-transfer-fee \
  --transfer-fee-basis-points 500 \
  --transfer-fee-max 1000000000000

# 示例输出
# Creating token ...
# Address: AbC...XyZ
# Decimals: 9
# Transfer fee: 5% (max 1000 STYD)
```

### 3. 配置Transfer Fee

```bash
# 设置fee接收者（通常是程序的PDA）
spl-token set-transfer-fee \
  <TOKEN_ADDRESS> \
  --fee-basis-points 500 \
  --max-fee 1000000000000 \
  --owner <YOUR_KEYPAIR>
```

---

## 🔧 Transfer Fee配置

### 5%税收分配

Token 2022的Transfer Fee会自动收取，然后需要：

**方案1: 使用WithheldAmount功能**
```
每笔转账 → 5%费用扣留在Token Account
定期 → 调用harvest指令
提取 → 30%销毁 + 70%转SOL
```

**方案2: 通过Transfer Hook实时处理**
```
每笔转账 → Transfer Hook触发
实时 → 30%销毁 + 70%追踪
累积 → 定期转换为SOL
```

### 我们的实现

使用**Transfer Hook**方式（已实现）:
- `transfer_hook.rs` - 监听所有转账
- 自动统计销毁量和seed量
- 更新MotherNode统计数据

---

## 🎯 Token 2022 特有优势

### 1. 自动税收
```
用户在DEX交易 → 自动扣5%
  ├─ 无需调用transfer_with_tariff
  ├─ 降低用户Gas费
  └─ 简化交易流程
```

### 2. 统一接口
```
所有转账（包括DEX、钱包）都自动税收
  - Raydium swap ✅
  - Jupiter swap ✅
  - 钱包转账 ✅
  - 程序内转账 ✅
```

### 3. 防止逃税
```
用户无法绕过5%税收
  - Transfer Fee在Token层面强制执行
  - 任何转账方式都会被税
```

---

## 📝 部署清单

### A. 创建Token

```bash
# 1. 运行创建脚本
ts-node scripts/create-token2022.ts

# 保存mint地址
export TOKEN_MINT=<MINT_ADDRESS>
```

### B. 配置Mint Authority

```bash
# 2. 计算program的mint_authority PDA
# Seeds: ["mint_authority"], Program ID

# 3. 转移mint authority到PDA
spl-token authorize <TOKEN_MINT> mint <MINT_AUTHORITY_PDA>
```

### C. 铸造初始供应

```bash
# 4. 创建token account
spl-token create-account $TOKEN_MINT \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb

# 5. 铸造1M初始供应
spl-token mint $TOKEN_MINT 1000000 \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

### D. 初始化Transfer Hook

```bash
# 6. 初始化extra account metas
anchor run initialize-hook
```

### E. 部署程序

```bash
# 7. 编译
anchor build

# 8. 部署
anchor deploy --provider.cluster devnet

# 9. 初始化MotherNode和MotherWomb
ts-node scripts/initialize-system.ts
```

---

## 🔍 验证Token 2022

### 查看Token信息

```bash
spl-token display <TOKEN_MINT> \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

**应该显示**:
```
Address: <TOKEN_MINT>
Decimals: 9
Supply: 1000000
Extensions:
  - TransferFeeConfig
    - Fee: 500 basis points (5%)
    - Max fee: 1000000000000 (1000 STYD)
```

### 测试Transfer Fee

```bash
# 创建第二个账户
spl-token create-account $TOKEN_MINT --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb

# 转账测试（会自动扣5%）
spl-token transfer $TOKEN_MINT 100 <RECIPIENT> --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb

# 接收方应该收到: 95 STYD (100 - 5%)
# 5 STYD被扣留为fee
```

---

## 🛠️ 前端集成

### 使用@solana/spl-token支持Token 2022

```typescript
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

// 获取Token账户
const tokenAccount = await getAccount(
  connection,
  userTokenAccountAddress,
  'confirmed',
  TOKEN_2022_PROGRAM_ID  // ← 指定Token 2022
);

// 转账（自动应用5%税收）
await transfer(
  connection,
  payer,
  source,
  destination,
  owner,
  amount,
  [],
  { commitment: 'confirmed' },
  TOKEN_2022_PROGRAM_ID  // ← 指定Token 2022
);
```

---

## 📊 Token 2022 Program ID

```
Token 2022: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
标准SPL Token: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

**⚠️ 重要**: 两个Program ID不同，不要混用！

---

## ✅ Token 2022优势总结

### 对用户
- ✅ 更简单（DEX交易自动税收）
- ✅ 更安全（无法逃税）
- ✅ 更统一（所有交易一致体验）

### 对项目
- ✅ 开发更简单（利用内置功能）
- ✅ 维护更少（Token层面处理）
- ✅ 扩展性更强（可添加更多Extension）

### 对生态
- ✅ 跟随行业标准（Token 2022是未来）
- ✅ SORE验证（已证明可行）
- ✅ 全面兼容（主流平台支持）

---

## 🚀 下一步

1. 运行`scripts/create-token2022.ts`创建Token
2. 按照部署清单配置
3. 测试Transfer Fee功能
4. 部署到Devnet验证
5. 准备主网发布

---

**Token 2022 = 现代化 + 自动化 + 未来保障** 🆕✨

