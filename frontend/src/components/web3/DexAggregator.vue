<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  price?: number;
}

interface DexPrice {
  dex: string;
  price: number;
  liquidity: number;
  volume24h: number;
}

interface Pool {
  dex: string;
  tokenA: string;
  tokenB: string;
  reserveA: string;
  reserveB: string;
  liquidity: number;
  volume24h: number;
  apy: number;
}

interface Quote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  priceImpact: string;
  slippage: number;
  dex: string;
  route: string[];
  gasEstimate: string;
  gasUsd: string;
  validUntil: number;
}

// State
const selectedChain = ref('ethereum');
const fromToken = ref('');
const toToken = ref('');
const fromAmount = ref('');
const slippage = ref(0.5);
const isLoading = ref(false);
const error = ref('');
const tokens = ref<Token[]>([]);
const dexPrices = ref<DexPrice[]>([]);
const pools = ref<Pool[]>([]);
const quote = ref<Quote | null>(null);
const activeTab = ref('swap');

// Chains
const chains = [
  { id: 'ethereum', name: 'Ethereum', icon: '🔷' },
  { id: 'polygon', name: 'Polygon', icon: '🟣' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
  { id: 'optimism', name: 'Optimism', icon: '🔴' },
  { id: 'bsc', name: 'BNB Chain', icon: '🟡' },
];

// API Base URL
const API_BASE = '/api/web3/dex';

// Load tokens on mount
onMounted(async () => {
  await loadTokens();
});

// Fetch tokens
async function loadTokens(query = '') {
  try {
    const url = query 
      ? `${API_BASE}/tokens?query=${query}&chain=${selectedChain.value}`
      : `${API_BASE}/tokens?chain=${selectedChain.value}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      tokens.value = data.data;
    }
  } catch (e) {
    console.error('Failed to load tokens:', e);
    // Fallback tokens
    tokens.value = [
      { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, price: 3000 },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, price: 65000 },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1 },
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6, price: 1 },
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, price: 1 },
      { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave Token', decimals: 18, price: 280 },
      { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18, price: 12 },
      { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18, price: 18 },
    ];
  }
}

// Search best price
async function searchBestPrice() {
  if (!fromToken.value || !toToken.value || !fromAmount.value) {
    error.value = 'Please fill in all fields';
    return;
  }
  
  isLoading.value = true;
  error.value = '';
  
  try {
    // Get aggregated prices
    const priceRes = await fetch(
      `${API_BASE}/prices?tokenAddress=${fromToken.value}&chain=${selectedChain.value}`
    );
    const priceData = await priceRes.json();
    if (priceData.success) {
      dexPrices.value = priceData.data;
    }
    
    // Get pools
    const poolRes = await fetch(
      `${API_BASE}/pools?tokenA=${fromToken.value}&tokenB=${toToken.value}&chain=${selectedChain.value}`
    );
    const poolData = await poolRes.json();
    if (poolData.success) {
      pools.value = poolData.data;
    }
    
    // Get quote
    const amountWei = (parseFloat(fromAmount.value) * 1e18).toString();
    const quoteRes = await fetch(
      `${API_BASE}/quote?fromToken=${fromToken.value}&toToken=${toToken.value}&amount=${amountWei}&chain=${selectedChain.value}&slippage=${slippage.value}`
    );
    const quoteData = await quoteRes.json();
    if (quoteData.success) {
      quote.value = quoteData.data;
    }
    
  } catch (e) {
    error.value = 'Failed to fetch prices. Please try again.';
    console.error(e);
    
    // Mock data for demo
    dexPrices.value = [
      { dex: 'Uniswap V3', price: 2500, liquidity: 50000000, volume24h: 20000000 },
      { dex: 'Sushiswap', price: 2498, liquidity: 15000000, volume24h: 5000000 },
      { dex: 'Curve', price: 2501, liquidity: 80000000, volume24h: 15000000 },
    ];
    
    pools.value = [
      { dex: 'Uniswap V3', tokenA: fromToken.value, tokenB: toToken.value, reserveA: '1000', reserveB: '2500000', liquidity: 50000000, volume24h: 20000000, apy: 15 },
      { dex: 'Sushiswap', tokenA: fromToken.value, tokenB: toToken.value, reserveA: '500', reserveB: '1250000', liquidity: 15000000, volume24h: 5000000, apy: 12 },
      { dex: 'Curve', tokenA: fromToken.value, tokenB: toToken.value, reserveA: '2000', reserveB: '5000000', liquidity: 80000000, volume24h: 15000000, apy: 8 },
    ];
    
    const toAmount = (parseFloat(fromAmount.value) * 2500).toFixed(6);
    quote.value = {
      fromToken: fromToken.value,
      toToken: toToken.value,
      fromAmount: (parseFloat(fromAmount.value) * 1e18).toString(),
      toAmount: (parseFloat(toAmount) * 1e6).toString(),
      price: '2500',
      priceImpact: '0.1',
      slippage: slippage.value,
      dex: 'Uniswap V3',
      route: [fromToken.value, toToken.value],
      gasEstimate: '150000',
      gasUsd: '12.50',
      validUntil: Date.now() + 60000,
    };
  } finally {
    isLoading.value = false;
  }
}

// Swap tokens (reverse from/to)
function swapTokens() {
  const temp = fromToken.value;
  fromToken.value = toToken.value;
  toToken.value = temp;
  fromAmount.value = '';
  quote.value = null;
  dexPrices.value = [];
  pools.value = [];
}

// Get token info by address
function getTokenInfo(address: string): Token | undefined {
  return tokens.value.find(t => t.address.toLowerCase() === address.toLowerCase());
}

// Format numbers
function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercent(value: number): string {
  return value.toFixed(2) + '%';
}

// Best price
const bestPrice = computed(() => {
  if (dexPrices.value.length === 0) return null;
  return dexPrices.value.reduce((best, current) => 
    current.price < best.price ? current : best
  );
});

// Savings vs worst price
const savings = computed(() => {
  if (dexPrices.value.length < 2) return 0;
  const best = Math.min(...dexPrices.value.map(p => p.price));
  const worst = Math.max(...dexPrices.value.map(p => p.price));
  return ((worst - best) / worst * 100).toFixed(2);
});
</script>

<template>
  <div class="dex-aggregator">
    <!-- Header -->
    <div class="header">
      <h3>🔄 Dex Aggregator</h3>
      <div class="chain-selector">
        <select v-model="selectedChain" @change="loadTokens()">
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.icon }} {{ chain.name }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="{ active: activeTab === 'swap' }" 
        @click="activeTab = 'swap'"
      >
        ⚡ Swap
      </button>
      <button 
        :class="{ active: activeTab === 'pools' }" 
        @click="activeTab = 'pools'"
      >
        🏊 Pools
      </button>
      <button 
        :class="{ active: activeTab === 'analytics' }" 
        @click="activeTab = 'analytics'"
      >
        📊 Analytics
      </button>
    </div>
    
    <!-- Swap Tab -->
    <div v-if="activeTab === 'swap'" class="swap-panel">
      <!-- From Token -->
      <div class="token-input">
        <label>From</label>
        <div class="input-row">
          <select v-model="fromToken" class="token-select">
            <option value="">Select Token</option>
            <option v-for="token in tokens" :key="token.address" :value="token.address">
              {{ token.symbol }} - {{ token.name }}
            </option>
          </select>
          <input 
            v-model="fromAmount" 
            type="number" 
            placeholder="0.00" 
            class="amount-input"
          />
        </div>
        <div class="usd-value" v-if="fromAmount && getTokenInfo(fromToken)?.price">
          ≈ {{ formatUsd(parseFloat(fromAmount) * (getTokenInfo(fromToken)?.price || 0)) }}
        </div>
      </div>
      
      <!-- Swap Button -->
      <div class="swap-actions">
        <button @click="swapTokens" class="swap-btn">⇅</button>
      </div>
      
      <!-- To Token -->
      <div class="token-input">
        <label>To</label>
        <div class="input-row">
          <select v-model="toToken" class="token-select">
            <option value="">Select Token</option>
            <option v-for="token in tokens" :key="token.address" :value="token.address">
              {{ token.symbol }} - {{ token.name }}
            </option>
          </select>
          <div class="amount-display">
            {{ quote ? (parseFloat(quote.toAmount) / Math.pow(10, getTokenInfo(toToken)?.decimals || 18)).toFixed(6) : '0.00' }}
          </div>
        </div>
      </div>
      
      <!-- Slippage -->
      <div class="slippage-setting">
        <label>Slippage Tolerance</label>
        <div class="slippage-buttons">
          <button :class="{ active: slippage === 0.1 }" @click="slippage = 0.1">0.1%</button>
          <button :class="{ active: slippage === 0.5 }" @click="slippage = 0.5">0.5%</button>
          <button :class="{ active: slippage === 1 }" @click="slippage = 1">1%</button>
          <input v-model="slippage" type="number" step="0.1" min="0" max="50" class="custom-slippage" />
        </div>
      </div>
      
      <!-- Search Button -->
      <button @click="searchBestPrice" :disabled="isLoading" class="search-btn">
        {{ isLoading ? '🔄 Searching...' : '🔍 Find Best Price' }}
      </button>
      
      <!-- Error -->
      <div v-if="error" class="error">{{ error }}</div>
      
      <!-- Quote Result -->
      <div v-if="quote" class="quote-result">
        <div class="quote-header">
          <span class="best-dex">✨ Best: {{ quote.dex }}</span>
          <span class="price-impact">Impact: {{ quote.priceImpact }}%</span>
        </div>
        <div class="quote-details">
          <div class="detail-row">
            <span>Rate</span>
            <span>1 {{ getTokenInfo(fromToken)?.symbol }} = {{ quote.price }} {{ getTokenInfo(toToken)?.symbol }}</span>
          </div>
          <div class="detail-row">
            <span>Gas Est.</span>
            <span>≈ {{ quote.gasUsd }} (Gas: {{ formatNumber(parseInt(quote.gasEstimate)) }})</span>
          </div>
          <div class="detail-row">
            <span>Valid Until</span>
            <span>{{ new Date(quote.validUntil).toLocaleTimeString() }}</span>
          </div>
        </div>
        <button class="swap-submit">Swap Now</button>
      </div>
    </div>
    
    <!-- Pools Tab -->
    <div v-if="activeTab === 'pools'" class="pools-panel">
      <h4>Liquidity Pools</h4>
      <div v-if="pools.length === 0" class="empty-state">
        Search for a token pair to see pools
      </div>
      <div v-else class="pool-list">
        <div v-for="pool in pools" :key="pool.dex" class="pool-card">
          <div class="pool-header">
            <span class="dex-name">{{ pool.dex }}</span>
            <span class="apy">APY: {{ formatPercent(pool.apy) }}</span>
          </div>
          <div class="pool-stats">
            <div class="stat">
              <span class="label">Liquidity</span>
              <span class="value">{{ formatUsd(pool.liquidity) }}</span>
            </div>
            <div class="stat">
              <span class="label">Volume 24h</span>
              <span class="value">{{ formatUsd(pool.volume24h) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Analytics Tab -->
    <div v-if="activeTab === 'analytics'" class="analytics-panel">
      <h4>DEX Price Comparison</h4>
      
      <div v-if="dexPrices.length > 0" class="price-table">
        <div class="price-row header">
          <span>DEX</span>
          <span>Price</span>
          <span>Liquidity</span>
          <span>Volume 24h</span>
        </div>
        <div v-for="price in dexPrices" :key="price.dex" class="price-row">
          <span class="dex">{{ price.dex }}</span>
          <span class="price">{{ formatUsd(price.price) }}</span>
          <span>{{ formatUsd(price.liquidity) }}</span>
          <span>{{ formatUsd(price.volume24h) }}</span>
        </div>
      </div>
      
      <div v-if="bestPrice && parseFloat(savings || '0') > 0" class="savings-card">
        <div class="savings-title">Potential Savings</div>
        <div class="savings-value">{{ savings }}%</div>
        <div class="savings-desc">vs worst price on other DEXs</div>
      </div>
      
      <div v-else class="empty-state">
        Search for a token to see price comparison
      </div>
    </div>
  </div>
</template>

<style scoped>
.dex-aggregator {
  padding: 16px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h3 {
  margin: 0;
  font-size: 18px;
}

.chain-selector select {
  background: #0f3460;
  border: 1px solid #e94560;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tabs button {
  flex: 1;
  padding: 8px;
  background: transparent;
  border: 1px solid #333;
  color: #aaa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tabs button.active {
  background: #e94560;
  border-color: #e94560;
  color: #fff;
}

.swap-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.token-input {
  background: #0f3460;
  padding: 12px;
  border-radius: 8px;
}

.token-input label {
  display: block;
  font-size: 12px;
  color: #aaa;
  margin-bottom: 8px;
}

.input-row {
  display: flex;
  gap: 8px;
}

.token-select {
  flex: 1;
  background: #1a1a2e;
  border: 1px solid #333;
  color: #fff;
  padding: 8px;
  border-radius: 6px;
}

.amount-input {
  flex: 1;
  background: #1a1a2e;
  border: 1px solid #333;
  color: #fff;
  padding: 8px;
  border-radius: 6px;
  text-align: right;
  font-size: 16px;
}

.amount-display {
  flex: 1;
  background: #1a1a2e;
  border: 1px solid #333;
  color: #fff;
  padding: 8px;
  border-radius: 6px;
  text-align: right;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.usd-value {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
  text-align: right;
}

.swap-actions {
  display: flex;
  justify-content: center;
}

.swap-btn {
  background: #e94560;
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
}

.slippage-setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #aaa;
}

.slippage-buttons {
  display: flex;
  gap: 4px;
}

.slippage-buttons button {
  background: #0f3460;
  border: 1px solid #333;
  color: #aaa;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.slippage-buttons button.active {
  background: #e94560;
  border-color: #e94560;
  color: #fff;
}

.custom-slippage {
  width: 50px;
  background: #0f3460;
  border: 1px solid #333;
  color: #fff;
  padding: 4px;
  border-radius: 4px;
  text-align: center;
}

.search-btn {
  background: linear-gradient(90deg, #e94560, #ff6b6b);
  border: none;
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s;
}

.search-btn:hover:not(:disabled) {
  transform: scale(1.02);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  background: #ff4757;
  color: #fff;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
}

.quote-result {
  background: #0f3460;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e94560;
}

.quote-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.best-dex {
  color: #4cd137;
  font-weight: bold;
}

.price-impact {
  color: #f39c12;
  font-size: 12px;
}

.quote-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  color: #aaa;
}

.swap-submit {
  width: 100%;
  margin-top: 12px;
  background: #4cd137;
  border: none;
  color: #fff;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.pools-panel h4,
.analytics-panel h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #aaa;
}

.pool-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pool-card {
  background: #0f3460;
  padding: 12px;
  border-radius: 8px;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dex-name {
  font-weight: bold;
}

.apy {
  color: #4cd137;
}

.pool-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .label {
  color: #aaa;
}

.price-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 8px;
  padding: 8px;
  background: #0f3460;
  border-radius: 6px;
  font-size: 12px;
}

.price-row.header {
  background: transparent;
  color: #aaa;
  font-weight: bold;
}

.price-row .dex {
  font-weight: bold;
}

.price-row .price {
  color: #4cd137;
}

.savings-card {
  background: linear-gradient(135deg, #4cd137, #2ecc71);
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  margin-top: 16px;
}

.savings-title {
  font-size: 12px;
  opacity: 0.9;
}

.savings-value {
  font-size: 32px;
  font-weight: bold;
}

.savings-desc {
  font-size: 11px;
  opacity: 0.8;
}

.empty-state {
  text-align: center;
  color: #aaa;
  padding: 24px;
  font-size: 14px;
}
</style>
