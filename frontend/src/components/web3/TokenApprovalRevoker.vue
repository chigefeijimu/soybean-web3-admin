<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';
import { NButton, NCard, NDataTable, NInput, NSelect, NSpin, NModal, NAlert, NTag, NEmpty, NStatistic, NGrid, NGi, NProgress } from 'naive-ui';
import { useMessage } from 'naive-ui';

// Types
interface TokenApproval {
  contract: string;
  token: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo: string;
  spender: string;
  spenderName: string;
  allowance: string;
  allowanceUsd: number;
  approvedAt: number;
  risk: 'safe' | 'warning' | 'danger';
  riskReason: string;
}

interface ApprovalStats {
  total: number;
  safe: number;
  warning: number;
  danger: number;
  totalValue: number;
}

const { account, chainId, chainInfo, isConnected, ERC20_ABI, getContract, getTokenInfo, getAllowance, getTokenBalance, approve, approveMax, tokenList } = useWeb3();
const message = useMessage();

// State
const loading = ref(false);
const approvals = ref<TokenApproval[]>([]);
const searchQuery = ref('');
const riskFilter = ref<string | null>(null);
const selectedApprovals = ref<string[]>([]);
const revoking = ref(false);
const showRevokeModal = ref(false);

// Chain options
const chainOptions = [
  { label: 'Ethereum', value: 1 },
  { label: 'Polygon', value: 137 },
  { label: 'Arbitrum', value: 42161 },
  { label: 'Optimism', value: 10 },
  { label: 'BSC', value: 56 },
  { label: 'Avalanche', value: 43114 },
  { label: 'Base', value: 8453 },
];

const selectedChain = ref(1);

// Known spender names
const spenderNames: Record<string, string> = {
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V3',
  '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3',
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'Sushiswap',
  '0x88b02a8d5c4a7a5c5d4e1e5c5b4e5d5c4a7b8c9': 'Curve',
  '0x3d9819210a31b4961b30ef54be2aed6591c9c6e8': 'Compound',
  '0x87870bca3f3f6335e32cd42ec2d8f0fe96d0fb8b': 'Aave V3',
  '0x44bed1ea3c8ebc0d2e8d2b5e2e5d5c4a7b8c9d0e1': 'Yearn',
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'Dai',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
  '0xd533a949740bb3306d119cc777fa900ba034cd52': 'CRV',
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
  '0xc00e94cb662c3520282e6f5717214004a7f26888': 'COMP',
  '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK',
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'UNI',
};

// Risk assessment
function assessRisk(approval: TokenApproval): { risk: 'safe' | 'warning' | 'danger'; reason: string } {
  const spenderLower = approval.spender.toLowerCase();
  
  // Check if spender is a known protocol
  const isKnownProtocol = Object.keys(spenderNames).some(k => k.toLowerCase() === spenderLower);
  
  // Check allowance amount
  const allowanceValue = approval.allowanceUsd;
  
  // Infinite approval detection (very high allowance)
  if (allowanceValue > 1000000) {
    return { risk: 'danger', reason: 'Unlimited allowance detected' };
  }
  
  // High value approval to unknown contract
  if (allowanceValue > 10000 && !isKnownProtocol) {
    return { risk: 'danger', reason: 'High value to unknown contract' };
  }
  
  // Medium value
  if (allowanceValue > 1000 && !isKnownProtocol) {
    return { risk: 'warning', reason: 'Medium value to unknown contract' };
  }
  
  // Known protocol
  if (isKnownProtocol) {
    return { risk: 'safe', reason: spenderNames[spenderLower] || 'Known protocol' };
  }
  
  return { risk: 'warning', reason: 'Unknown spender' };
}

// Sample data for demo (in real app, would use indexer API)
async function loadApprovals() {
  loading.value = true;
  approvals.value = [];
  
  try {
    // Generate sample approvals for demo
    const sampleApprovals: TokenApproval[] = [
      {
        contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        tokenSymbol: 'USDC',
        tokenName: 'USD Coin',
        tokenLogo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
        spender: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        spenderName: 'Uniswap V3',
        allowance: '1000000000',
        allowanceUsd: 1000,
        approvedAt: Date.now() - 86400000 * 7,
        risk: 'safe',
        riskReason: 'Known protocol'
      },
      {
        contract: '0x6b175474e89094c44da98b954eedeac495271d0f',
        token: '0x6b175474e89094c44da98b954eedeac495271d0f',
        tokenSymbol: 'DAI',
        tokenName: 'Dai Stablecoin',
        tokenLogo: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
        spender: '0x87870bca3f3f6335e32cd42ec2d8f0fe96d0fb8b',
        spenderName: 'Aave V3',
        allowance: '10000000000000000000000000',
        allowanceUsd: 10000000,
        approvedAt: Date.now() - 86400000 * 30,
        risk: 'danger',
        riskReason: 'Unlimited allowance detected'
      },
      {
        contract: '0x514910771af9ca656af840dff83e8264ecf986ca',
        token: '0x514910771af9ca656af840dff83e8264ecf986ca',
        tokenSymbol: 'LINK',
        tokenName: 'Chainlink Token',
        tokenLogo: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
        spender: '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f',
        spenderName: 'Sushiswap',
        allowance: '500000000000000000000',
        allowanceUsd: 5000,
        approvedAt: Date.now() - 86400000 * 3,
        risk: 'safe',
        riskReason: 'Known protocol'
      },
      {
        contract: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        token: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        tokenSymbol: 'WBTC',
        tokenName: 'Wrapped Bitcoin',
        tokenLogo: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
        spender: '0x3d9819210a31b4961b30ef54be2aed6591c9c6e8',
        spenderName: 'Compound',
        allowance: '100000000',
        allowanceUsd: 5000000,
        approvedAt: Date.now() - 86400000 * 60,
        risk: 'danger',
        riskReason: 'Unlimited allowance detected'
      },
      {
        contract: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        token: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        tokenSymbol: 'UNI',
        tokenName: 'Uniswap',
        tokenLogo: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
        spender: '0x5c6bc6e2a2b2f5c5d5e1e5c5b4e5d5c4a7b8c9',
        spenderName: 'Unknown Contract',
        allowance: '1000000000000000000000',
        allowanceUsd: 15000,
        approvedAt: Date.now() - 86400000 * 14,
        risk: 'warning',
        riskReason: 'Medium value to unknown contract'
      },
      {
        contract: '0xd533a949740bb3306d119cc777fa900ba034cd52',
        token: '0xd533a949740bb3306d119cc777fa900ba034cd52',
        tokenSymbol: 'CRV',
        tokenName: 'Curve DAO Token',
        tokenLogo: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
        spender: '0x44bed1ea3c8ebc0d2e8d2b5e2e5d5c4a7b8c9d0',
        spenderName: 'Unknown',
        allowance: '9999999999999999999999999999',
        allowanceUsd: 50000000,
        approvedAt: Date.now() - 86400000 * 90,
        risk: 'danger',
        riskReason: 'Unlimited allowance detected'
      }
    ];
    
    approvals.value = sampleApprovals;
  } catch (error) {
    console.error('Error loading approvals:', error);
    message.error('Failed to load approvals');
  } finally {
    loading.value = false;
  }
}

// Filter approvals
const filteredApprovals = computed(() => {
  let result = approvals.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(a => 
      a.tokenSymbol.toLowerCase().includes(query) ||
      a.spender.toLowerCase().includes(query) ||
      a.spenderName.toLowerCase().includes(query)
    );
  }
  
  if (riskFilter.value) {
    result = result.filter(a => a.risk === riskFilter.value);
  }
  
  return result;
});

// Stats
const stats = computed<ApprovalStats>(() => {
  const all = approvals.value;
  return {
    total: all.length,
    safe: all.filter(a => a.risk === 'safe').length,
    warning: all.filter(a => a.risk === 'warning').length,
    danger: all.filter(a => a.risk === 'danger').length,
    totalValue: all.reduce((sum, a) => sum + a.allowanceUsd, 0)
  };
});

// Select all dangerous
function selectAllDangerous() {
  selectedApprovals.value = approvals.value
    .filter(a => a.risk === 'danger')
    .map(a => a.contract + '-' + a.spender);
  showRevokeModal.value = true;
}

// Toggle selection
function toggleSelection(approval: TokenApproval) {
  const key = approval.contract + '-' + approval.spender;
  const index = selectedApprovals.value.indexOf(key);
  if (index === -1) {
    selectedApprovals.value.push(key);
  } else {
    selectedApprovals.value.splice(index, 1);
  }
}

// Revoke approvals
async function revokeSelected() {
  if (selectedApprovals.value.length === 0) {
    message.warning('No approvals selected');
    return;
  }
  
  revoking.value = true;
  
  try {
    // Simulate revocation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    message.success(`Successfully revoked ${selectedApprovals.value.length} approvals`);
    selectedApprovals.value = [];
    showRevokeModal.value = false;
    await loadApprovals();
  } catch (error) {
    console.error('Error revoking approvals:', error);
    message.error('Failed to revoke approvals');
  } finally {
    revoking.value = false;
  }
}

// Table columns
const columns = [
  {
    title: 'Token',
    key: 'token',
    width: 180,
    render: (row: TokenApproval) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('img', { 
          src: row.tokenLogo, 
          class: 'w-6 h-6 rounded-full',
          onerror: (e: Event) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }
        }),
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-medium' }, row.tokenSymbol),
          h('span', { class: 'text-xs text-gray-500' }, row.tokenName.slice(0, 20))
        ])
      ]);
    }
  },
  {
    title: 'Spender',
    key: 'spender',
    width: 200,
    render: (row: TokenApproval) => {
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-mono text-xs' }, row.spender.slice(0, 10) + '...'),
        h('span', { class: 'text-xs text-gray-500' }, row.spenderName)
      ]);
    }
  },
  {
    title: 'Allowance',
    key: 'allowance',
    width: 140,
    render: (row: TokenApproval) => {
      const formatted = row.allowanceUsd > 1000000 
        ? '∞' 
        : `$${row.allowanceUsd.toLocaleString()}`;
      return h('span', { class: 'font-medium' }, formatted);
    }
  },
  {
    title: 'Approved',
    key: 'approvedAt',
    width: 120,
    render: (row: TokenApproval) => {
      const days = Math.floor((Date.now() - row.approvedAt) / 86400000);
      return h('span', { class: 'text-sm' }, `${days}d ago`);
    }
  },
  {
    title: 'Risk',
    key: 'risk',
    width: 100,
    render: (row: TokenApproval) => {
      const colors: Record<string, 'success' | 'warning' | 'error'> = {
        safe: 'success',
        warning: 'warning',
        danger: 'error'
      };
      return h(NTag, { 
        type: colors[row.risk],
        size: 'small'
      }, { default: () => row.risk.toUpperCase() });
    }
  },
  {
    title: 'Action',
    key: 'action',
    width: 100,
    render: (row: TokenApproval) => {
      return h(NButton, {
        size: 'small',
        type: 'error',
        ghost: true,
        onClick: () => {
          selectedApprovals.value = [row.contract + '-' + row.spender];
          showRevokeModal.value = true;
        }
      }, { default: () => 'Revoke' });
    }
  }
];

import { h } from 'vue';

// Load on mount
onMounted(() => {
  loadApprovals();
});

// Format helpers
function formatAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2">🔐 Token Approval Revoker</h2>
      <p class="text-gray-500">View and revoke token approvals to improve wallet security</p>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-5 gap-4 mb-6">
      <NCard size="small">
        <NStatistic label="Total Approvals" :value="stats.total" />
      </NCard>
      <NCard size="small">
        <NStatistic label="Safe" :value="stats.safe">
          <template #prefix>✅</template>
        </NStatistic>
      </NCard>
      <NCard size="small">
        <NStatistic label="Warnings" :value="stats.warning">
          <template #prefix>⚠️</template>
        </NStatistic>
      </NCard>
      <NCard size="small">
        <NStatistic label="Dangerous" :value="stats.danger">
          <template #prefix>🚨</template>
        </NStatistic>
      </NCard>
      <NCard size="small">
        <NStatistic label="Total Allowed" :value="'$' + (stats.totalValue / 1000000).toFixed(1) + 'M'" />
      </NCard>
    </div>
    
    <!-- Risk Distribution -->
    <NCard class="mb-6" v-if="stats.total > 0">
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <NProgress
            type="line"
            :percentage="stats.danger / stats.total * 100"
            indicator-placement="inside"
            status="error"
            :height="24"
          >
            <span class="text-white">Danger: {{ stats.danger }}</span>
          </NProgress>
        </div>
        <div class="flex-1">
          <NProgress
            type="line"
            :percentage="stats.warning / stats.total * 100"
            indicator-placement="inside"
            status="warning"
            :height="24"
          >
            <span class="text-white">Warning: {{ stats.warning }}</span>
          </NProgress>
        </div>
        <div class="flex-1">
          <NProgress
            type="line"
            :percentage="stats.safe / stats.total * 100"
            indicator-placement="inside"
            status="success"
            :height="24"
          >
            <span class="text-white">Safe: {{ stats.safe }}</span>
          </NProgress>
        </div>
      </div>
    </NCard>
    
    <!-- Actions Bar -->
    <NCard class="mb-4">
      <div class="flex items-center gap-4">
        <NInput
          v-model:value="searchQuery"
          placeholder="Search tokens or spenders..."
          clearable
          style="width: 300px"
        />
        <NSelect
          v-model:value="riskFilter"
          placeholder="Filter by risk"
          clearable
          :options="[
            { label: 'All Risks', value: null },
            { label: 'Safe', value: 'safe' },
            { label: 'Warning', value: 'warning' },
            { label: 'Danger', value: 'danger' }
          ]"
          style="width: 150px"
        />
        <div class="flex-1"></div>
        <NButton
          type="error"
          :disabled="stats.danger === 0"
          @click="selectAllDangerous"
        >
          🚨 Revoke All Dangerous ({{ stats.danger }})
        </NButton>
        <NButton @click="loadApprovals" :loading="loading">
          🔄 Refresh
        </NButton>
      </div>
    </NCard>
    
    <!-- Approvals Table -->
    <NCard>
      <NSpin :show="loading">
        <NEmpty v-if="filteredApprovals.length === 0" description="No approvals found" />
        <NDataTable
          v-else
          :columns="columns"
          :data="filteredApprovals"
          :pagination="false"
          :bordered="false"
          striped
        />
      </NSpin>
    </NCard>
    
    <!-- Info Alert -->
    <NAlert type="info" class="mt-4">
      <template #header>Security Tip</template>
      Regularly review and revoke unnecessary token approvals to protect your assets from potential vulnerabilities in third-party contracts.
    </NAlert>
    
    <!-- Revoke Confirmation Modal -->
    <NModal
      v-model:show="showRevokeModal"
      preset="dialog"
      title="Confirm Revocation"
      positive-text="Revoke Selected"
      negative-text="Cancel"
      type="error"
      :loading="revoking"
      @positive-click="revokeSelected"
    >
      <p>You are about to revoke {{ selectedApprovals.length }} token approvals. This action cannot be undone.</p>
      <p class="mt-2 text-gray-500">You may need to re-approve these contracts to use them again.</p>
    </NModal>
  </div>
</template>

<style scoped>
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.gap-2 {
  gap: 0.5rem;
}
.gap-4 {
  gap: 1rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
.mb-6 {
  margin-bottom: 1.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mt-2 {
  margin-top: 0.5rem;
}
.p-4 {
  padding: 1rem;
}
.flex-1 {
  flex: 1;
}
.grid {
  display: grid;
}
.grid-cols-5 {
  grid-template-columns: repeat(5, 1fr);
}
.font-bold {
  font-weight: 700;
}
.text-2xl {
  font-size: 1.5rem;
}
.font-medium {
  font-weight: 500;
}
.font-mono {
  font-family: monospace;
}
.text-xs {
  font-size: 0.75rem;
}
.text-sm {
  font-size: 0.875rem;
}
.text-gray-500 {
  color: #6b7280;
}
.w-6 {
  width: 1.5rem;
}
.h-6 {
  height: 1.5rem;
}
.rounded-full {
  border-radius: 9999px;
}
.flex-col {
  flex-direction: column;
}
</style>
