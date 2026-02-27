# Web3 Module Documentation

## Overview

This module provides Web3 functionality for the Soybean Admin system, including wallet management, smart contract interaction, and transaction tracking.

## Features

### Wallet Management
- Connect/disconnect wallets (MetaMask)
- Multi-chain support (Ethereum, BSC, Polygon, Testnets)
- Wallet verification via signature

### Contract Management
- Add/Edit/Delete smart contracts
- ABI storage and parsing
- Multi-chain contract deployment

### Transaction Tracking
- View transaction history
- Real-time transaction status
- Transaction receipt handling

## Installation

```bash
# Install dependencies
pnpm install
```

## Configuration

### Environment Variables

```env
# Backend (optional - for contract call RPC)
WEB3_RPC_URLS='{"1": "https://eth.llamarpc.com", "56": "https://bsc-dataseed.binance.org"}'
```

### Frontend Config

The Web3 plugin is configured in `src/plugins/web3/index.ts`. Update the project ID:

```typescript
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'
```

## Usage

### Connect Wallet

```vue
<script setup>
import WalletConnect from '@/components/web3/WalletConnect.vue'
</script>

<template>
  <WalletConnect />
</template>
```

### Interact with Contract

```vue
<script setup>
import { useContract } from '@/hooks/useContract'
import { ref } from 'vue'

const { read, write, isConnected } = useContract({
  address: '0x...',
  abi: [...],
  chainId: 1
})

// Read
const result = await read('balanceOf', ['0x...'])

// Write
const txHash = await write('transfer', ['0x...', '1000000'])
</script>
```

### Use Chain Utilities

```typescript
import { getChainConfig, getExplorerTxUrl, formatAddress } from '@/hooks/useChain'

const chain = getChainConfig(1)
const txUrl = getExplorerTxUrl(1, '0x...')
const formatted = formatAddress('0x...') // 0x1234...5678
```

## API Endpoints

### Wallet
- `POST /api/web3/wallet/verify` - Verify wallet ownership
- `GET /api/web3/wallet/list` - List user wallets
- `DELETE /api/web3/wallet/:id` - Remove wallet

### Contract
- `POST /api/web3/contract` - Add contract
- `GET /api/web3/contract/list` - List contracts
- `GET /api/web3/contract/:id` - Get contract details
- `PUT /api/web3/contract/:id` - Update contract
- `DELETE /api/web3/contract/:id` - Delete contract
- `POST /api/web3/contract/:id/call` - Call contract method

### Transaction
- `GET /api/web3/transaction/list` - List transactions

## Supported Chains

| Chain | Chain ID | RPC |
|-------|----------|-----|
| Ethereum Mainnet | 1 | https://eth.llamarpc.com |
| Goerli Testnet | 5 | https://goerli.infura.io/v3/... |
| Sepolia Testnet | 11155111 | https://sepolia.infura.io/v3/... |
| BSC Mainnet | 56 | https://bsc-dataseed.binance.org |
| BSC Testnet | 97 | https://data-seed-prebsc-1-s1.binance.org:8545 |
| Polygon | 137 | https://polygon-rpc.com |
| Mumbai | 80001 | https://rpc-mumbai.maticvigil.com |

## Development

### Add New Chain

1. Update `src/hooks/useChain.ts`:
```typescript
SUPPORTED_CHAINS[chainId] = {
  id: chainId,
  name: 'Chain Name',
  // ...other config
}
```

2. Add RPC URL to backend environment

### Add Token Support

Update `src/constants/tokens.ts`:
```typescript
export const POPULAR_TOKENS = {
  TOKEN: {
    address: '0x...',
    symbol: 'TOKEN',
    decimals: 18,
    chainId: 1
  }
}
```

## License

MIT
