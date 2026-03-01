<template>
  <div class="cross-chain-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h2>🌐 Cross-Chain Asset Dashboard</h2>
      <p class="subtitle">View your assets across multiple blockchain networks</p>
    </div>

    <!-- Wallet Input -->
    <div class="wallet-input-section">
      <div class="input-group">
        <input
          v-model="walletAddress"
          type="text"
          placeholder="Enter wallet address (0x...)"
          class="wallet-input"
          @keyup.enter="fetchAssets"
        />
        <select v-model="selectedChains" multiple class="chain-select">
          <option v-for="chain in availableChains" :key="chain.id" :value="chain.id">
            {{ chain.icon }} {{ chain.name }}
          </option>
        </select>
        <button @click="fetchAssets" :disabled="loading" class="fetch-btn">
          {{ loading ? 'Loading...' : '🔍 Fetch Assets' }}
        </button>
      </div>
      <p class="hint">Hold Ctrl/Cmd to select multiple chains</p>
    </div>

    <!-- Total Portfolio Value -->
    <div v-if="totalUsd > 0" class="total-section">
      <div class="total-card">
        <span class="total-label">Total Portfolio Value</span>
        <span class="total-value">${{ formatNumber(totalUsd) }}</span>
      </div>
    </div>

    <!-- Chain Cards Grid -->
    <div v-if="chainAssets.length > 0" class="chains-grid">
      <div
        v-for="chain in chainAssets"
        :key="chain.chainId"
        class="chain-card"
        :class="{ 'has-assets': chain.balanceUsd > 0 }"
      >
        <div class="chain-header">
          <span class="chain-icon">{{ getChainIcon(chain.chainId) }}</span>
          <span class="chain-name">{{ chain.chainName }}</span>
          <span class="chain-id">#{{ chain.chainId }}</span>
        </div>

        <div class="chain-balance">
          <div class="native-balance">
            <span class="symbol">{{ chain.symbol }}</span>
            <span class="amount">{{ chain.balance }}</span>
          </div>
          <div class="usd-value">${{ formatNumber(chain.balanceUsd) }}</div>
        </div>

        <!-- Token List -->
        <div v-if="chain.tokens.length > 0" class="token-list">
          <div v-for="token in chain.tokens" :key="token.address" class="token-item">
            <span class="token-symbol">{{ token.symbol }}</span>
            <span class="token-balance">{{ token.balance }}</span>
            <span class="token-usd">${{ formatNumber(token.balanceUsd) }}</span>
          </div>
        </div>

        <div v-else class="no-tokens">
          <span>No token balances detected</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && !error" class="empty-state">
      <div class="empty-icon">🌉</div>
      <h3>Cross-Chain View</h3>
      <p>Enter a wallet address to view assets across multiple chains</p>
      <div class="supported-chains">
        <span v-for="chain in availableChains" :key="chain.id" class="chain-badge">
          {{ chain.icon }}
        </span>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button @click="error = ''" class="retry-btn">Try Again</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Fetching cross-chain assets...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

interface TokenAsset {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  balanceUsd: number;
  logo?: string;
}

interface ChainAsset {
  chainId: number;
  chainName: string;
  symbol: string;
  balance: string;
  balanceUsd: number;
  tokens: TokenAsset[];
}

const { account } = useWeb3();

const walletAddress = ref('');
const selectedChains = ref<number[]>([1, 137, 56, 10, 42161, 8453]);
const loading = ref(false);
const error = ref('');
const chainAssets = ref<ChainAsset[]>([]);

const availableChains = [
  { id: 1, name: 'Ethereum', icon: '🔷' },
  { id: 5, name: 'Goerli', icon: '🔷' },
  { id: 11155111, name: 'Sepolia', icon: '🔷' },
  { id: 137, name: 'Polygon', icon: '🟣' },
  { id: 80001, name: 'Mumbai', icon: '🟣' },
  { id: 56, name: 'BNB Chain', icon: '🟡' },
  { id: 97, name: 'BSC Testnet', icon: '🟡' },
  { id: 10, name: 'Optimism', icon: '🟠' },
  { id: 42161, name: 'Arbitrum', icon: '🔵' },
  { id: 8453, name: 'Base', icon: '⚫' },
];

const totalUsd = computed(() => {
  return chainAssets.value.reduce((sum, chain) => sum + chain.balanceUsd, 0);
});

function getChainIcon(chainId: number): string {
  const chain = availableChains.find(c => c.id === chainId);
  return chain?.icon || '🔗';
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

async function fetchAssets() {
  if (!walletAddress.value) {
    // Use connected wallet if available
    if (account.value) {
      walletAddress.value = account.value;
    } else {
      error.value = 'Please enter a wallet address';
      return;
    }
  }

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.value)) {
    error.value = 'Invalid wallet address format';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const chainParam = selectedChains.value.join(',');
    const response = await fetch('/api/web3/cross-chain/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: walletAddress.value,
        chains: chainParam,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cross-chain assets');
    }

    const data = await response.json();
    chainAssets.value = data.chains || [];
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch assets';
    chainAssets.value = [];
  } finally {
    loading.value = false;
  }
}

// Auto-fetch if wallet is connected
if (account.value) {
  walletAddress.value = account.value;
}
</script>

<style scoped>
.cross-chain-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 30px;
}

.dashboard-header h2 {
  font-size: 28px;
  margin: 0;
  color: #fff;
}

.subtitle {
  color: #888;
  margin: 8px 0 0;
}

.wallet-input-section {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.wallet-input {
  flex: 1;
  min-width: 300px;
  padding: 14px 18px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #0f0f1a;
  color: #fff;
  font-size: 14px;
  font-family: monospace;
}

.wallet-input:focus {
  outline: none;
  border-color: #6366f1;
}

.chain-select {
  padding: 12px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #0f0f1a;
  color: #fff;
  min-width: 200px;
  max-height: 100px;
}

.fetch-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.fetch-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.fetch-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint {
  color: #666;
  font-size: 12px;
  margin-top: 8px;
}

.total-section {
  margin-bottom: 24px;
}

.total-card {
  background: linear-gradient(135deg, #1e1e3f, #2d1f4e);
  border-radius: 16px;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #6366f1;
}

.total-label {
  color: #aaa;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.total-value {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  margin-top: 8px;
}

.chains-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.chain-card {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #333;
  transition: transform 0.2s, border-color 0.2s;
}

.chain-card:hover {
  transform: translateY(-4px);
}

.chain-card.has-assets {
  border-color: #22c55e;
}

.chain-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #333;
}

.chain-icon {
  font-size: 24px;
}

.chain-name {
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.chain-id {
  color: #666;
  font-size: 12px;
  font-family: monospace;
}

.chain-balance {
  margin-bottom: 16px;
}

.native-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.native-balance .symbol {
  color: #888;
  font-weight: 600;
}

.native-balance .amount {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.usd-value {
  text-align: right;
  color: #22c55e;
  font-size: 14px;
  margin-top: 4px;
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #0f0f1a;
  border-radius: 8px;
  font-size: 13px;
}

.token-symbol {
  color: #6366f1;
  font-weight: 600;
}

.token-balance {
  color: #fff;
  flex: 1;
  text-align: center;
}

.token-usd {
  color: #888;
}

.no-tokens {
  text-align: center;
  color: #666;
  padding: 16px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #fff;
  margin: 0 0 8px;
}

.supported-chains {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}

.chain-badge {
  font-size: 24px;
  padding: 8px;
  background: #1a1a2e;
  border-radius: 8px;
}

.error-state {
  text-align: center;
  padding: 40px;
  background: #1a1a2e;
  border-radius: 12px;
  border: 1px solid #ef4444;
}

.error-icon {
  font-size: 48px;
}

.error-state p {
  color: #ef4444;
  margin: 16px 0;
}

.retry-btn {
  padding: 10px 20px;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: #888;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #333;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
