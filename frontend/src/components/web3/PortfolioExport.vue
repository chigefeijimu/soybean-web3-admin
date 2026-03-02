<script setup lang="ts">
import { ref, computed } from 'vue';
import { NSelect, NButton, NInput, NCard, NSpin, NAlert, NTag, NStatistic, NGrid, NGridItem, NProgress } from 'naive-ui';

const apiBase = '/api';

const address = ref('');
const isLoading = ref(false);
const portfolioData = ref<any>(null);
const exportSummary = ref<any>(null);
const error = ref('');
const selectedChains = ref(['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'avalanche', 'base']);

const chainOptions = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
  { label: 'BSC', value: 'bsc' },
  { label: 'Avalanche', value: 'avalanche' },
  { label: 'Base', value: 'base' },
];

const fetchPortfolio = async () => {
  if (!address.value) {
    error.value = 'Please enter a wallet address';
    return;
  }
  
  isLoading.value = true;
  error.value = '';
  
  try {
    const chainsParam = selectedChains.value.join(',');
    const response = await fetch(`${apiBase}/portfolio-export/portfolio/${address.value}?chains=${chainsParam}`);
    if (!response.ok) throw new Error('Failed to fetch portfolio');
    portfolioData.value = await response.json();
    
    // Also fetch summary
    const summaryResponse = await fetch(`${apiBase}/portfolio-export/export-summary/${address.value}?chains=${chainsParam}`);
    if (summaryResponse.ok) {
      exportSummary.value = await summaryResponse.json();
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch portfolio data';
  } finally {
    isLoading.value = false;
  }
};

const exportCsv = async () => {
  if (!address.value) return;
  
  isLoading.value = true;
  try {
    const response = await fetch(`${apiBase}/portfolio-export/export/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: address.value, chains: selectedChains.value }),
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${address.value}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e: any) {
    error.value = 'Failed to export CSV';
  } finally {
    isLoading.value = false;
  }
};

const exportPdf = async () => {
  if (!address.value) return;
  
  isLoading.value = true;
  try {
    const response = await fetch(`${apiBase}/portfolio-export/export/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: address.value, chains: selectedChains.value }),
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${address.value}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e: any) {
    error.value = 'Failed to export PDF';
  } finally {
    isLoading.value = false;
  }
};

const formatUsd = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const getChainColor = (chain: string) => {
  const colors: Record<string, string> = {
    ethereum: '#627EEA',
    polygon: '#8247E5',
    arbitrum: '#28A0F0',
    optimism: '#FF0420',
    bsc: '#F3BA2F',
    avalanche: '#E84142',
    base: '#0052FF',
  };
  return colors[chain] || '#888';
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">Portfolio Export</h2>
        <p class="text-slate-400">Export your wallet portfolio to CSV or PDF</p>
      </div>
    </div>

    <!-- Search Form -->
    <NCard class="bg-slate-800/50 border-slate-700">
      <div class="flex flex-col gap-4">
        <NInput
          v-model:value="address"
          placeholder="Enter wallet address (0x...)"
          size="large"
          clearable
          @keyup.enter="fetchPortfolio"
        />
        
        <div class="flex flex-wrap gap-2">
          <span class="text-slate-400 py-2">Chains:</span>
          <NSelect
            v-model:value="selectedChains"
            multiple
            :options="chainOptions"
            placeholder="Select chains"
            class="flex-1 min-w-[300px]"
          />
        </div>
        
        <div class="flex gap-2">
          <NButton type="primary" size="large" :loading="isLoading" @click="fetchPortfolio">
            🔍 Fetch Portfolio
          </NButton>
          <NButton v-if="portfolioData" size="large" @click="exportCsv" :disabled="isLoading">
            📄 Export CSV
          </NButton>
          <NButton v-if="portfolioData" size="large" @click="exportPdf" :disabled="isLoading">
            📑 Export PDF
          </NButton>
        </div>
      </div>
    </NCard>

    <!-- Error -->
    <NAlert v-if="error" type="error" :title="error" closable @close="error = ''" />

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <!-- Portfolio Summary -->
    <div v-if="exportSummary" class="grid gap-4 lg:grid-cols-4">
      <NCard class="bg-slate-800/50 border-slate-700">
        <NStatistic label="Total Value" :value="formatUsd(exportSummary.totalValueUsd)" />
      </NCard>
      <NCard class="bg-slate-800/50 border-slate-700">
        <NStatistic label="Chains" :value="exportSummary.chainCount" />
      </NCard>
      <NCard class="bg-slate-800/50 border-slate-700">
        <NStatistic label="Total Tokens" :value="exportSummary.tokenCount" />
      </NCard>
      <NCard class="bg-slate-800/50 border-slate-700">
        <NStatistic 
          v-if="exportSummary.topToken" 
          label="Top Token" 
          :value="exportSummary.topToken.symbol" 
        />
        <NStatistic v-else label="Top Token" value="-" />
      </NCard>
    </div>

    <!-- Chain Distribution -->
    <NCard v-if="exportSummary?.chainDistribution?.length" title="Chain Distribution" class="bg-slate-800/50 border-slate-700">
      <div class="space-y-3">
        <div v-for="chain in exportSummary.chainDistribution" :key="chain.chain" class="flex items-center gap-3">
          <div 
            class="w-3 h-3 rounded-full" 
            :style="{ backgroundColor: getChainColor(chain.chain) }"
          ></div>
          <span class="w-20 font-medium">{{ chain.chain }}</span>
          <NProgress 
            type="line" 
            :percentage="parseFloat(chain.percentage)" 
            :show-indicator="false"
            class="flex-1"
          />
          <span class="text-slate-400">{{ chain.percentage }}</span>
        </div>
      </div>
    </NCard>

    <!-- Portfolio Details -->
    <NCard v-if="portfolioData" title="Portfolio Details" class="bg-slate-800/50 border-slate-700">
      <div class="space-y-6">
        <div v-for="chain in portfolioData.chains" :key="chain.name" class="border border-slate-700 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <span 
                class="w-3 h-3 rounded-full" 
                :style="{ backgroundColor: getChainColor(chain.name) }"
              ></span>
              {{ chain.name.toUpperCase() }}
            </h3>
            <span class="text-green-400 font-semibold">{{ formatUsd(chain.totalValueUsd) }}</span>
          </div>
          
          <div v-if="chain.tokens.length" class="space-y-2">
            <div class="grid grid-cols-4 gap-2 text-sm text-slate-400 px-2">
              <span>Token</span>
              <span>Balance</span>
              <span>USD Value</span>
              <span>Address</span>
            </div>
            <div 
              v-for="token in chain.tokens" 
              :key="token.address" 
              class="grid grid-cols-4 gap-2 text-sm py-2 px-2 bg-slate-900/50 rounded"
            >
              <span class="font-medium">{{ token.symbol }}</span>
              <span class="text-slate-300">{{ parseFloat(token.balance).toFixed(6) }}</span>
              <span class="text-green-400">{{ formatUsd(token.balanceUsd) }}</span>
              <span class="text-slate-500 text-xs truncate">{{ token.address.slice(0, 10) }}...</span>
            </div>
          </div>
          <div v-else class="text-slate-500 text-sm">No tokens found</div>
        </div>
      </div>
    </NCard>

    <!-- Empty State -->
    <NCard v-if="!portfolioData && !isLoading" class="bg-slate-800/50 border-slate-700 text-center py-12">
      <div class="text-slate-400">
        <p class="text-4xl mb-4">📊</p>
        <p>Enter a wallet address to fetch and export portfolio data</p>
      </div>
    </NCard>
  </div>
</template>
