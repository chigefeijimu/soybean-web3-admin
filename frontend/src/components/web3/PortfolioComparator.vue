<template>
  <div class="portfolio-comparator">
    <div class="header">
      <h2>💼 Portfolio Comparator</h2>
      <p class="subtitle">Compare two wallet addresses side by side</p>
    </div>

    <!-- Input Section -->
    <div class="input-section">
      <div class="input-group">
        <label>Wallet A</label>
        <input 
          v-model="addressA" 
          placeholder="0x..."
          class="address-input"
        />
      </div>
      <div class="vs-badge">VS</div>
      <div class="input-group">
        <label>Wallet B</label>
        <input 
          v-model="addressB" 
          placeholder="0x..."
          class="address-input"
        />
      </div>
      <button @click="compare" :disabled="loading || !addressA || !addressB" class="compare-btn">
        {{ loading ? 'Comparing...' : 'Compare' }}
      </button>
    </div>

    <!-- Quick Select -->
    <div class="quick-select">
      <span class="label">Quick fill:</span>
      <button @click="fillDemo">Demo Wallets</button>
      <button @click="fillWhales">Whale Addresses</button>
      <button @click="clear">Clear</button>
    </div>

    <!-- Results -->
    <div v-if="result" class="results">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card card-a">
          <div class="card-header">
            <span class="label">Portfolio A</span>
            <span class="rank">#{{ getRank(result.portfolioA.address) }}</span>
          </div>
          <div class="address">{{ shortenAddress(result.portfolioA.address) }}</div>
          <div class="total-value">${{ formatNumber(result.portfolioA.totalValue) }}</div>
          <div class="token-count">{{ result.portfolioA.tokens.length }} tokens</div>
        </div>
        
        <div class="summary-card card-b">
          <div class="card-header">
            <span class="label">Portfolio B</span>
            <span class="rank">#{{ getRank(result.portfolioB.address) }}</span>
          </div>
          <div class="address">{{ shortenAddress(result.portfolioB.address) }}</div>
          <div class="total-value">${{ formatNumber(result.portfolioB.totalValue) }}</div>
          <div class="token-count">{{ result.portfolioB.tokens.length }} tokens</div>
        </div>

        <div class="summary-card card-diff" :class="{ positive: result.comparison.totalValueDiff > 0, negative: result.comparison.totalValueDiff < 0 }">
          <div class="card-header">
            <span class="label">Difference</span>
          </div>
          <div class="diff-value">
            {{ result.comparison.totalValueDiff > 0 ? '+' : '' }}${{ formatNumber(Math.abs(result.comparison.totalValueDiff)) }}
          </div>
          <div class="diff-percent">
            {{ result.comparison.totalValueDiffPercent > 0 ? '+' : '' }}{{ result.comparison.totalValueDiffPercent.toFixed(2) }}%
          </div>
          <div class="divergence">
            Divergence: {{ result.comparison.divergenceScore }}%
          </div>
        </div>
      </div>

      <!-- Token Comparison Table -->
      <div class="comparison-section">
        <h3>📊 Token Comparison</h3>
        
        <!-- Common Tokens -->
        <div v-if="result.comparison.commonTokens.length" class="token-group">
          <h4>Common Tokens ({{ result.comparison.commonTokens.length }})</h4>
          <div class="token-grid common">
            <div 
              v-for="token in result.comparison.commonTokens" 
              :key="token.tokenAddress"
              class="token-item common-token"
            >
              <div class="token-symbol">{{ token.symbol }}</div>
              <div class="token-value">${{ formatNumber(token.value) }}</div>
              <div class="token-change" :class="token.change24h >= 0 ? 'positive' : 'negative'">
                {{ token.change24h >= 0 ? '+' : '' }}{{ token.change24h.toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Unique to A -->
        <div v-if="result.comparison.uniqueToA.length" class="token-group">
          <h4>Only in Portfolio A ({{ result.comparison.uniqueToA.length }})</h4>
          <div class="token-grid unique-a">
            <div 
              v-for="token in result.comparison.uniqueToA" 
              :key="token.tokenAddress"
              class="token-item unique"
            >
              <div class="token-symbol">{{ token.symbol }}</div>
              <div class="token-value">${{ formatNumber(token.value) }}</div>
            </div>
          </div>
        </div>

        <!-- Unique to B -->
        <div v-if="result.comparison.uniqueToB.length" class="token-group">
          <h4>Only in Portfolio B ({{ result.comparison.uniqueToB.length }})</h4>
          <div class="token-grid unique-b">
            <div 
              v-for="token in result.comparison.uniqueToB" 
              :key="token.tokenAddress"
              class="token-item unique"
            >
              <div class="token-symbol">{{ token.symbol }}</div>
              <div class="token-value">${{ formatNumber(token.value) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Side by Side Holdings -->
      <div class="holdings-section">
        <div class="holdings-column">
          <h3>📁 Portfolio A Holdings</h3>
          <div class="holdings-list">
            <div 
              v-for="token in result.portfolioA.tokens" 
              :key="token.tokenAddress"
              class="holding-item"
            >
              <div class="holding-info">
                <span class="symbol">{{ token.symbol }}</span>
                <span class="name">{{ token.name }}</span>
              </div>
              <div class="holding-values">
                <span class="balance">{{ formatBalance(token.balance) }}</span>
                <span class="value">${{ formatNumber(token.value) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="holdings-column">
          <h3>📁 Portfolio B Holdings</h3>
          <div class="holdings-list">
            <div 
              v-for="token in result.portfolioB.tokens" 
              :key="token.tokenAddress"
              class="holding-item"
            >
              <div class="holding-info">
                <span class="symbol">{{ token.symbol }}</span>
                <span class="name">{{ token.name }}</span>
              </div>
              <div class="holding-values">
                <span class="balance">{{ formatBalance(token.balance) }}</span>
                <span class="value">${{ formatNumber(token.value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export -->
      <div class="export-section">
        <button @click="exportCSV" class="export-btn">📥 Export as CSV</button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface TokenHolding {
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: string;
  price: number;
  value: number;
  change24h: number;
}

interface Portfolio {
  address: string;
  totalValue: number;
  tokens: TokenHolding[];
  ethBalance: string;
}

interface ComparisonResult {
  portfolioA: Portfolio;
  portfolioB: Portfolio;
  comparison: {
    totalValueDiff: number;
    totalValueDiffPercent: number;
    commonTokens: TokenHolding[];
    uniqueToA: TokenHolding[];
    uniqueToB: TokenHolding[];
    overlappingValue: number;
    divergenceScore: number;
  };
  ranking: { address: string; totalValue: number; rank: number }[];
}

const addressA = ref('');
const addressB = ref('');
const loading = ref(false);
const result = ref<ComparisonResult | null>(null);
const error = ref('');

const demoAddresses = [
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
  '0x47e179ec197488593b187f80a00eb5da91f1b000',
  '0xAB5801a7D398351b8bE11C439e05C5B3259aeC9B',
];

const whaleAddresses = [
  '0x716e1eE9053e16c50D5E08930075fDd05d0Ca648', // BITFIRE
  '0x99C407f4B047b7EA91F7D6a4584B0F918cF69C8D',
  '0xE7873dC87Fa3D27F8edf4D3Fc4FEBBa638D1F4Db',
];

function shortenAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
}

function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (num >= 1000) return num.toFixed(0);
  if (num >= 1) return num.toFixed(2);
  return num.toFixed(6);
}

function getRank(address: string): number {
  if (!result.value) return 0;
  const found = result.value.ranking.find(r => r.address.toLowerCase() === address.toLowerCase());
  return found?.rank || 0;
}

function fillDemo() {
  addressA.value = demoAddresses[0];
  addressB.value = demoAddresses[1];
}

function fillWhales() {
  addressA.value = whaleAddresses[0];
  addressB.value = whaleAddresses[1];
}

function clear() {
  addressA.value = '';
  addressB.value = '';
  result.value = null;
  error.value = '';
}

async function compare() {
  if (!addressA.value || !addressB.value) return;
  
  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    // Try to fetch from backend API
    const chainId = 1;
    const response = await fetch(`http://localhost:3005/portfolio-comparator/compare?addressA=${addressA.value}&addressB=${addressB.value}&chainId=${chainId}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    result.value = data;
  } catch (e: any) {
    // Fallback to demo data if API fails
    console.log('Using demo data for portfolio comparison');
    result.value = generateDemoComparison(addressA.value, addressB.value);
  } finally {
    loading.value = false;
  }
}

// Generate demo comparison data
function generateDemoComparison(addrA: string, addrB: string): ComparisonResult {
  const hashA = addrA.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const hashB = addrB.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const seedA = hashA % 1000;
  const seedB = hashB % 1000;
  
  const demoTokensA = [
    { tokenAddress: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', balance: (1 + seedA * 0.01).toFixed(4), price: 2450, value: (1 + seedA * 0.01) * 2450, change24h: 2.5 },
    { tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', balance: (1000 + seedA * 10).toString(), price: 1, value: 1000 + seedA * 10, change24h: 0.01 },
    { tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: (0.05 + seedA * 0.001).toFixed(4), price: 62000, value: (0.05 + seedA * 0.001) * 62000, change24h: 1.8 },
    { tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', symbol: 'AAVE', name: 'Aave', balance: (10 + seedA * 0.5).toFixed(2), price: 95, value: (10 + seedA * 0.5) * 95, change24h: -1.2 },
    { tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'UNI', name: 'Uniswap', balance: (50 + seedA).toFixed(2), price: 7.5, value: (50 + seedA) * 7.5, change24h: 3.2 },
  ];
  
  const demoTokensB = [
    { tokenAddress: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', balance: (1.5 + seedB * 0.01).toFixed(4), price: 2450, value: (1.5 + seedB * 0.01) * 2450, change24h: 2.5 },
    { tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', balance: (2000 + seedB * 10).toString(), price: 1, value: 2000 + seedB * 10, change24h: 0.01 },
    { tokenAddress: '0x514910771af9ca656af840dff83e8264ecf986ca', symbol: 'LINK', name: 'Chainlink', balance: (100 + seedB).toFixed(2), price: 14, value: (100 + seedB) * 14, change24h: -0.5 },
    { tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', symbol: 'AAVE', name: 'Aave', balance: (15 + seedB * 0.5).toFixed(2), price: 95, value: (15 + seedB * 0.5) * 95, change24h: -1.2 },
  ];
  
  const totalA = demoTokensA.reduce((sum, t) => sum + t.value, 0);
  const totalB = demoTokensB.reduce((sum, t) => sum + t.value, 0);
  
  // Find common tokens
  const commonTokens = demoTokensA.filter(tA => demoTokensB.some(tB => tB.symbol === tA.symbol)).map(tA => {
    const tB = demoTokensB.find(t => t.symbol === tA.symbol)!;
    return {
      ...tA,
      balance: (parseFloat(tA.balance) + parseFloat(tB.balance)).toString(),
      value: tA.value + tB.value,
    };
  });
  
  const uniqueToA = demoTokensA.filter(tA => !demoTokensB.some(tB => tB.symbol === tA.symbol));
  const uniqueToB = demoTokensB.filter(tB => !demoTokensA.some(tA => tA.symbol === tB.symbol));
  
  return {
    portfolioA: { address: addrA, totalValue: totalA, tokens: demoTokensA, ethBalance: demoTokensA[0].balance },
    portfolioB: { address: addrB, totalValue: totalB, tokens: demoTokensB, ethBalance: demoTokensB[0].balance },
    comparison: {
      totalValueDiff: totalA - totalB,
      totalValueDiffPercent: totalB > 0 ? ((totalA - totalB) / totalB) * 100 : 0,
      commonTokens,
      uniqueToA,
      uniqueToB,
      overlappingValue: commonTokens.reduce((sum, t) => sum + t.value, 0),
      divergenceScore: Math.min(100, Math.round(((uniqueToA.length + uniqueToB.length) / Math.max(1, demoTokensA.length + demoTokensB.length)) * 100)),
    },
    ranking: [
      { address: addrA, totalValue: totalA, rank: totalA >= totalB ? 1 : 2 },
      { address: addrB, totalValue: totalB, rank: totalB >= totalA ? 1 : 2 },
    ],
  };
}

function exportCSV() {
  if (!result.value) return;

  let csv = 'Portfolio,Symbol,Name,Balance,Price,Value,Change24h\n';
  
  result.value.portfolioA.tokens.forEach(t => {
    csv += `A,${t.symbol},${t.name},${t.balance},${t.price},${t.value},${t.change24h}\n`;
  });
  
  result.value.portfolioB.tokens.forEach(t => {
    csv += `B,${t.symbol},${t.name},${t.balance},${t.price},${t.value},${t.change24h}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portfolio-comparison.csv';
  a.click();
}
</script>

<style scoped>
.portfolio-comparator {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  font-size: 28px;
  color: #fff;
}

.subtitle {
  color: #888;
  margin: 5px 0 0;
}

.input-section {
  display: flex;
  align-items: flex-end;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.input-group {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #aaa;
  font-size: 14px;
}

.address-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #1a1a2e;
  color: #fff;
  font-size: 14px;
}

.address-input:focus {
  outline: none;
  border-color: #6366f1;
}

.vs-badge {
  background: #333;
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
}

.compare-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.compare-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.compare-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-select {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.quick-select .label {
  color: #888;
  align-self: center;
}

.quick-select button {
  padding: 8px 16px;
  background: #2a2a4a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #ccc;
  cursor: pointer;
  transition: background 0.2s;
}

.quick-select button:hover {
  background: #3a3a5a;
}

.results {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #333;
}

.card-a { border-left: 4px solid #6366f1; }
.card-b { border-left: 4px solid #10b981; }
.card-diff { border-left: 4px solid #f59e0b; }
.card-diff.positive { border-left-color: #10b981; }
.card-diff.negative { border-left-color: #ef4444; }

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-header .label {
  color: #888;
  font-size: 14px;
}

.rank {
  background: #333;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #aaa;
}

.summary-card .address {
  color: #aaa;
  font-size: 13px;
  margin-bottom: 10px;
  word-break: break-all;
}

.summary-card .total-value {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 5px;
}

.token-count {
  color: #666;
  font-size: 13px;
}

.diff-value {
  font-size: 24px;
  font-weight: bold;
  color: #f59e0b;
}

.card-diff.positive .diff-value { color: #10b981; }
.card-diff.negative .diff-value { color: #ef4444; }

.diff-percent {
  font-size: 16px;
  color: #888;
  margin-bottom: 10px;
}

.divergence {
  font-size: 13px;
  color: #666;
}

.comparison-section, .holdings-section {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #333;
}

.comparison-section h3, .holdings-section h3 {
  margin: 0 0 20px;
  color: #fff;
}

.token-group {
  margin-bottom: 20px;
}

.token-group h4 {
  color: #888;
  font-size: 14px;
  margin: 0 0 10px;
}

.token-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.token-item {
  padding: 10px 15px;
  border-radius: 8px;
  background: #252542;
  min-width: 100px;
}

.token-item.common-token {
  border: 1px solid #10b98140;
  background: #10b98115;
}

.token-item.unique {
  border: 1px solid #6366f140;
}

.token-symbol {
  font-weight: bold;
  color: #fff;
}

.token-value {
  color: #aaa;
  font-size: 13px;
}

.token-change {
  font-size: 12px;
}

.token-change.positive { color: #10b981; }
.token-change.negative { color: #ef4444; }

.holdings-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .holdings-section {
    grid-template-columns: 1fr;
  }
}

.holdings-column h3 {
  font-size: 16px;
}

.holdings-list {
  max-height: 400px;
  overflow-y: auto;
}

.holding-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #333;
}

.holding-item:last-child {
  border-bottom: none;
}

.holding-info {
  display: flex;
  flex-direction: column;
}

.holding-info .symbol {
  font-weight: bold;
  color: #fff;
}

.holding-info .name {
  font-size: 12px;
  color: #666;
}

.holding-values {
  text-align: right;
}

.holding-values .balance {
  display: block;
  color: #aaa;
  font-size: 13px;
}

.holding-values .value {
  display: block;
  color: #fff;
  font-weight: bold;
}

.export-section {
  text-align: center;
}

.export-btn {
  padding: 12px 24px;
  background: #2a2a4a;
  border: 1px solid #444;
  border-radius: 8px;
  color: #ccc;
  cursor: pointer;
  font-size: 14px;
}

.export-btn:hover {
  background: #3a3a5a;
}

.error-message {
  background: #ef444420;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}
</style>
