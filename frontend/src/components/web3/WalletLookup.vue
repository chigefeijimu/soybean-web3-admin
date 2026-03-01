<template>
  <div class="wallet-lookup">
    <div class="search-section">
      <h3>🔍 Wallet Portfolio Lookup</h3>
      <p class="subtitle">查询任意钱包地址的代币持仓</p>
      
      <div class="search-form">
        <div class="input-group">
          <label>Select Network</label>
          <select v-model="selectedChain" class="chain-select">
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }} ({{ chain.symbol }})
            </option>
          </select>
        </div>
        
        <div class="input-group">
          <label>Wallet Address</label>
          <input 
            v-model="walletAddress" 
            type="text" 
            placeholder="0x..."
            class="address-input"
            @keyup.enter="lookupPortfolio"
          />
        </div>
        
        <button 
          class="search-btn" 
          @click="lookupPortfolio" 
          :disabled="loading || !walletAddress"
        >
          {{ loading ? 'Searching...' : '🔍 Lookup' }}
        </button>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
    
    <!-- Results -->
    <div v-if="portfolio" class="portfolio-result">
      <div class="portfolio-header">
        <div class="wallet-info">
          <span class="label">Address:</span>
          <span class="address">{{ formatAddress(portfolio.address) }}</span>
          <button class="copy-btn" @click="copyAddress">
            {{ copied ? '✓ Copied' : '📋' }}
          </button>
        </div>
        <div class="total-value">
          <span class="label">Total Value:</span>
          <span class="value">${{ portfolio.totalUsdValue }}</span>
        </div>
      </div>
      
      <!-- ETH Balance -->
      <div class="eth-balance">
        <div class="token-icon">⟐</div>
        <div class="token-info">
          <span class="token-name">Ethereum</span>
          <span class="token-symbol">ETH</span>
        </div>
        <div class="token-balance">
          <span class="balance">{{ formatBalance(portfolio.ethBalance) }}</span>
          <span class="usd">${{ formatUsdValue(portfolio.ethBalance) }}</span>
        </div>
      </div>
      
      <!-- Token List -->
      <div class="token-list">
        <h4>Token Holdings</h4>
        <div v-if="portfolio.tokens.length === 0" class="no-tokens">
          No tokens found
        </div>
        <div 
          v-for="token in portfolio.tokens" 
          :key="token.token.contractAddress"
          class="token-item"
        >
          <div class="token-icon">
            {{ token.token.logo || '🪙' }}
          </div>
          <div class="token-info">
            <span class="token-name">{{ token.token.name }}</span>
            <span class="token-symbol">{{ token.token.symbol }}</span>
          </div>
          <div class="token-balance">
            <span class="balance">{{ formatBalance(token.balance, token.token.decimals) }}</span>
            <span class="usd">${{ token.usdValue }}</span>
          </div>
          <div class="token-price">
            <span class="price">${{ token.price }}</span>
          </div>
        </div>
      </div>
      
      <!-- Export Button -->
      <div class="actions">
        <button class="export-btn" @click="exportToCSV">
          📥 Export to CSV
        </button>
      </div>
    </div>
    
    <!-- Demo Addresses -->
    <div class="demo-section">
      <h4>Try these demo addresses:</h4>
      <div class="demo-list">
        <button 
          v-for="demo in demoAddresses" 
          :key="demo.address"
          class="demo-btn"
          @click="useDemoAddress(demo.address)"
        >
          {{ demo.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { fetchWalletPortfolio, fetchSupportedChains, type WalletPortfolio } from '@/service/api/web3';

const loading = ref(false);
const error = ref('');
const walletAddress = ref('');
const selectedChain = ref(1);
const portfolio = ref<WalletPortfolio | null>(null);
const copied = ref(false);

const chains = ref([
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 56, name: 'BSC', symbol: 'BNB' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' }
]);

const demoAddresses = [
  { 
    label: 'Vitalik.eth', 
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' 
  },
  { 
    label: 'Binance Hot', 
    address: '0xF68C9Df95a18B7A06F1641280B72CDdCD8A3E9A' 
  }
];

// Use demo address
const useDemoAddress = (address: string) => {
  walletAddress.value = address;
  lookupPortfolio();
};

// Lookup portfolio
const lookupPortfolio = async () => {
  if (!walletAddress.value) return;
  
  loading.value = true;
  error.value = '';
  portfolio.value = null;
  
  try {
    const result = await fetchWalletPortfolio(walletAddress.value, selectedChain.value);
    portfolio.value = result;
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch portfolio';
  } finally {
    loading.value = false;
  }
};

// Format address
const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format balance
const formatBalance = (balance: string, decimals = 18) => {
  const value = parseFloat(balance) / Math.pow(10, decimals);
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
};

// Calculate USD value (simplified)
const formatUsdValue = (balance: string) => {
  const ethValue = parseFloat(balance) / Math.pow(10, 18);
  return (ethValue * 3000).toFixed(2); // Simplified price
};

// Copy address
const copyAddress = async () => {
  if (!portfolio.value) return;
  await navigator.clipboard.writeText(portfolio.value.address);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
};

// Export to CSV
const exportToCSV = () => {
  if (!portfolio.value) return;
  
  let csv = 'Token,Symbol,Balance,USD Value,Price\n';
  csv += `Ethereum,ETH,${portfolio.value.ethBalance},${formatUsdValue(portfolio.value.ethBalance)},3000\n`;
  
  portfolio.value.tokens.forEach(token => {
    csv += `${token.token.name},${token.token.symbol},${token.balance},${token.usdValue},${token.price}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio-${portfolio.value.address}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.wallet-lookup {
  padding: 20px;
}

.search-section {
  margin-bottom: 24px;
}

.search-section h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.subtitle {
  color: #666;
  margin-bottom: 16px;
}

.search-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 12px;
  color: #666;
}

.chain-select, .address-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.chain-select {
  min-width: 150px;
}

.address-input {
  min-width: 350px;
}

.search-btn {
  padding: 8px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.search-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
}

.portfolio-result {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
}

.portfolio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.address {
  font-family: monospace;
  background: #e5e7eb;
  padding: 4px 8px;
  border-radius: 4px;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.total-value .value {
  font-size: 24px;
  font-weight: bold;
  color: #10b981;
}

.eth-balance {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
}

.token-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 50%;
}

.token-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.token-name {
  font-weight: 500;
}

.token-symbol {
  font-size: 12px;
  color: #666;
}

.token-balance {
  text-align: right;
}

.balance {
  display: block;
  font-weight: 500;
}

.usd {
  font-size: 12px;
  color: #666;
}

.token-list h4 {
  margin: 0 0 12px 0;
}

.no-tokens {
  text-align: center;
  padding: 20px;
  color: #666;
}

.token-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
}

.token-price {
  min-width: 80px;
  text-align: right;
}

.price {
  font-size: 12px;
  color: #666;
}

.actions {
  margin-top: 20px;
  text-align: center;
}

.export-btn {
  padding: 10px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.demo-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.demo-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.demo-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.demo-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.demo-btn:hover {
  background: #e5e7eb;
}
</style>
