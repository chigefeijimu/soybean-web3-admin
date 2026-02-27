# Soybean Admin Frontend - Web3 模块技术文档

## 概述

本文档描述了 soybean-admin 前端项目中 Web3 功能的实现。

**注意**: 当前前端代码尚未完全实现,本文档描述的是设计结构和预期实现。

## 目录结构 (预期)

```
frontend/src/
├── components/web3/
│   ├── WalletConnect.vue      # 钱包连接组件
│   ├── ContractCall.vue       # 合约调用组件
│   └── TransactionHistory.vue  # 交易历史组件
├── views/
│   ├── web3/
│   │   ├── Dashboard.vue      # Web3仪表盘
│   │   └── ContractMgr.vue    # 合约管理
├── stores/
│   └── web3.ts                # Web3状态管理
├── hooks/
│   ├── useChain.ts            # 链切换Hook
│   └── useContract.ts         # 合约交互Hook
├── services/
│   └── web3.ts                # API调用服务
├── constants/
│   ├── tokens.ts              # ERC20代币列表
│   └── nfts.ts                # NFT ABI定义
├── typings/
│   └── web3.d.ts              # TypeScript类型定义
└── utils/
    └── web3-error.ts           # 错误处理工具
```

## 核心概念

### 1. 钱包连接 (wagmi + viem)

使用 wagmi 和 viem 实现钱包连接:

```typescript
import { createConfig, http, createConnector } from 'wagmi'
import { mainnet, sepolia, polygon } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// 配置
export const config = createConfig({
  chains: [mainnet, sepolia, polygon],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
  },
  connectors: [injected()],
})
```

### 2. 链配置

```typescript
// constants/chains.ts
export const CHAIN_CONFIG = {
  1: {
    name: 'Ethereum Mainnet',
    explorer: 'https://etherscan.io',
    rpc: 'https://eth.llamarpc.com',
  },
  11155111: {
    name: 'Sepolia Testnet',
    explorer: 'https://sepolia.etherscan.io',
    rpc: 'https://sepolia.infura.io',
  },
  137: {
    name: 'Polygon',
    explorer: 'https://polygonscan.com',
    rpc: 'https://polygon.llamarpc.com',
  },
}
```

### 3. 代币ABI

```typescript
// ERC20 ABI
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
]

// ERC721 ABI
export const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]

// ERC1155 ABI
export const ERC1155_ABI = [
  'function uri(uint256 id) view returns (string)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
]
```

### 4. 常用代币

```typescript
// constants/tokens.ts
export const POPULAR_TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    chainId: 1,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    chainId: 1,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    chainId: 1,
  },
]
```

## API 调用服务

```typescript
// services/web3.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

// 钱包API
export const walletApi = {
  verify: (data: WalletVerifyInput) => 
    api.post('/web3/wallet/verify', data),
  
  list: (params?: { userId?: string }) => 
    api.get('/web3/wallet/list', { params }),
  
  delete: (id: string) => 
    api.delete(`/web3/wallet/${id}`),
  
  getBalance: (data: WalletBalanceInput) => 
    api.post('/web3/wallet/balance', data),
}

// 合约API
export const contractApi = {
  create: (data: ContractCreateInput) => 
    api.post('/web3/contract', data),
  
  list: () => 
    api.get('/web3/contract/list'),
  
  get: (id: string) => 
    api.get(`/web3/contract/${id}`),
  
  update: (id: string, data: Partial<ContractUpdateInput>) => 
    api.put(`/web3/contract/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/web3/contract/${id}`),
  
  call: (id: string, data: ContractCallInput) => 
    api.post(`/web3/contract/${id}/call`, data),
}

// 交易API
export const transactionApi = {
  list: (params?: { userId?: string }) => 
    api.get('/web3/transaction/list', { params }),
}
```

## 类型定义

```typescript
// typings/web3.d.ts

// 钱包相关
interface WalletInfo {
  id: string
  walletAddress: string
  walletType: string
  chainId: number
}

interface WalletBalance {
  address: string
  balance: string
  chainId: number
  chainName: string
}

interface WalletVerifyInput {
  walletAddress: string
  signature: string
  message: string
  walletType?: string
  chainId?: number
}

interface WalletBalanceInput {
  address: string
  chainId?: number
}

// 合约相关
interface ContractInfo {
  id: string
  name: string
  contractAddress: string
  chainId: number
  abi?: string
  description?: string
  createdAt: string
}

interface ContractCreateInput {
  name: string
  contractAddress: string
  chainId: number
  abi?: string
  description?: string
}

interface ContractCallInput {
  contractId: string
  methodName: string
  params?: string
  fromAddress?: string
  value?: string
}

interface ContractCallOutput {
  success: boolean
  txHash?: string
  result?: string
  error?: string
}

// 交易相关
interface TransactionInfo {
  id: string
  contractId?: string
  methodName: string
  params?: string
  txHash?: string
  status: 'pending' | 'completed' | 'failed'
  fromAddress?: string
  errorMessage?: string
  createdAt: string
}
```

## Hooks

### useChain - 链管理

```typescript
// hooks/useChain.ts
import { useChainId, useSwitchChain, useNetworks } from 'wagmi'

export function useChain() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const chains = [
    { id: 1, name: 'Ethereum' },
    { id: 11155111, name: 'Sepolia' },
    { id: 137, name: 'Polygon' },
  ]
  
  const currentChain = chains.find(c => c.id === chainId)
  
  return {
    chainId,
    currentChain,
    chains,
    switchChain: (id: number) => switchChain({ chainId: id }),
  }
}
```

### useContract - 合约交互

```typescript
// hooks/useContract.ts
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ERC20_ABI } from '@/constants/tokens'

export function useContract(address: string, abi = ERC20_ABI) {
  // 读取方法
  const { data: name } = useReadContract({
    address,
    abi,
    functionName: 'name',
  })
  
  const { data: balance } = useReadContract({
    address,
    abi,
    functionName: 'balanceOf',
    args: [userAddress],
  })
  
  // 写入方法
  const { 
    writeContract, 
    data: hash,
    isPending 
  } = useWriteContract()
  
  // 等待交易确认
  const { isLoading: isConfirming, isSuccess } = 
    useWaitForTransactionReceipt({ hash })
  
  return {
    // 读取
    name,
    balance,
    // 写入
    write: (fn: string, args: any[]) => 
      writeContract({ address, abi, functionName: fn, args }),
    hash,
    isPending,
    isConfirming,
    isSuccess,
  }
}
```

## 组件示例

### WalletConnect - 钱包连接

```vue
<!-- components/web3/WalletConnect.vue -->
<template>
  <div class="wallet-connect">
    <button 
      v-if="!isConnected" 
      @click="connect"
      class="connect-btn"
    >
      连接钱包
    </button>
    
    <div v-else class="wallet-info">
      <span class="address">{{ shortenAddress(address) }}</span>
      <span class="balance">{{ formatBalance(balance) }} ETH</span>
      <button @click="disconnect">断开</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { injected } from 'wagmi/connectors'

const { address, isConnected } = useAccount()
const { connect } = useConnect({ connector: injected() })
const { disconnect } = useDisconnect()
const { data: balance } = useBalance({ address })

const shortenAddress = (addr: string) => 
  `${addr.slice(0, 6)}...${addr.slice(-4)}`

const formatBalance = (bal: bigint) => 
  bal ? (Number(bal) / 1e18).toFixed(4) : '0'
</script>
```

### ContractCall - 合约调用

```vue
<!-- components/web3/ContractCall.vue -->
<template>
  <div class="contract-call">
    <h3>调用合约</h3>
    
    <select v-model="methodName">
      <option value="balanceOf">查询余额</option>
      <option value="transfer">转账</option>
      <option value="approve">授权</option>
    </select>
    
    <input 
      v-if="needsAddress" 
      v-model="targetAddress" 
      placeholder="目标地址"
    />
    
    <input 
      v-if="needsAmount" 
      v-model="amount" 
      type="number" 
      placeholder="数量"
    />
    
    <button @click="call" :disabled="isPending">
      {{ isPending ? '处理中...' : '执行' }}
    </button>
    
    <div v-if="result" class="result">
      {{ result }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContract } from '@/hooks/useContract'

const props = defineProps<{
  address: string
  abi?: string[]
}>()

const methodName = ref('balanceOf')
const targetAddress = ref('')
const amount = ref('')

const { read, write, hash, isPending, isSuccess } = useContract(props.address, props.abi)

const needsAddress = computed(() => 
  ['balanceOf', 'transfer', 'approve'].includes(methodName.value)
)

const needsAmount = computed(() => 
  ['transfer', 'approve'].includes(methodName.value)
)

const result = ref('')

const call = async () => {
  try {
    if (methodName.value === 'balanceOf') {
      const res = await read(methodName.value, [targetAddress.value])
      result.value = res?.toString() || ''
    } else {
      await write(methodName.value, [targetAddress.value, BigInt(amount.value)])
    }
  } catch (e) {
    result.value = e.message
  }
}
</script>
```

## 路由配置

```typescript
// router/index.ts
const routes = [
  {
    path: '/web3',
    name: 'Web3',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Web3Dashboard',
        component: () => import('@/views/web3/Dashboard.vue'),
      },
      {
        path: 'contracts',
        name: 'ContractManagement',
        component: () => import('@/views/web3/ContractMgr.vue'),
      },
    ],
  },
]
```

## i18n 国际化

```json
// locales/zh-cn.json
{
  "web3": {
    "wallet": {
      "connect": "连接钱包",
      "disconnect": "断开连接",
      "balance": "余额",
      "verify": "验证钱包"
    },
    "contract": {
      "title": "合约管理",
      "create": "创建合约",
      "call": "调用合约",
      "address": "合约地址",
      "abi": "ABI"
    },
    "transaction": {
      "title": "交易记录",
      "status": {
        "pending": "pending",
        "completed": "已完成",
        "failed": "失败"
      }
    }
  }
}
```

## 环境变量

```bash
# .env
VITE_API_BASE_URL=http://localhost:10001
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
```

## 依赖项

```json
// package.json
{
  "dependencies": {
    "wagmi": "^2.x",
    "viem": "^2.x",
    "@tanstack/vue-query": "^5.x",
    "ethers": "^6.x"
  }
}
```

## 注意事项

1. **wagmi v2**: 使用新的配置方式和 Hooks
2. **viem**: 优先使用 viem 而非 ethers.js
3. **TypeScript**: 建议为每个 ABI 方法定义类型
4. **安全性**: 私钥不存储,所有签名在客户端完成
5. **状态管理**: 使用 Pinia 存储钱包状态

## 更新日志

### 2026-02-28
- 初始文档创建
- 定义目录结构和核心概念
- 添加组件和 Hooks 示例
