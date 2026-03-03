<template>
  <div class="cross-chain-rebalancer">
    <div class="header">
      <h2>🔄 Cross-chain Portfolio Rebalancer</h2>
      <p>Analyze and rebalance your portfolio across multiple chains</p>
    </div>

    <!-- Wallet Input -->
    <div class="section wallet-input">
      <div class="input-group">
        <input 
          v-model="walletAddress" 
          placeholder="Enter wallet address (e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0)"
          class="address-input"
        />
        <button @click="fetchPortfolio" :disabled="loading" class="btn-primary">
          {{ loading ? 'Loading...' : 'Analyze Portfolio' }}
        </button>
      </div>
    </div>

    <!-- Portfolio Overview -->
    <div v-if="portfolio" class="section portfolio-overview">
      <h3>📊 Current Portfolio Allocation</h3>
      <div class="stats-grid">
        <div class="stat-card total-value">
          <div class="stat-label">Total Value</div>
          <div class="stat-value">${{ formatNumber(portfolio.totalValueUSD) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Chains</div>
          <div class="stat-value">{{ Object.keys(portfolio.chainDistribution).length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Positions</div>
          <div class="stat-value">{{ portfolio.positions.length }}</div>
        </div>
      </div>

      <!-- Chain Distribution -->
      <div class="distribution-section">
        <h4>Chain Distribution</h4>
        <div class="distribution-bars">
          <div 
            v-for="(pct, chain) in portfolio.chainDistribution" 
            :key="chain"
            class="distribution-bar"
          >
            <div class="bar-label">
              <span class="chain-name">{{ formatChainName(chain) }}</span>
              <span class="chain-pct">{{ pct.toFixed(1) }}%</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: pct + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Token Distribution -->
      <div class="distribution-section">
        <h4>Token Distribution</h4>
        <div class="token-grid">
          <div 
            v-for="pos in portfolio.positions" 
            :key="pos.chain + pos.token"
            class="token-card"
          >
            <div class="token-symbol">{{ pos.symbol }}</div>
            <div class="token-chain">{{ formatChainName(pos.chain) }}</div>
            <div class="token-balance">{{ pos.balance.toFixed(4) }}</div>
            <div class="token-value">${{ formatNumber(pos.valueUSD) }}</div>
            <div class="token-pct">{{ pos.percentage.toFixed(1) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Target Allocation -->
    <div v-if="portfolio" class="section target-allocation">
      <h3>🎯 Set Target Allocation</h3>
      <div class="allocation-inputs">
        <div 
          v-for="(alloc, idx) in targetAllocations" 
          :key="idx"
          class="allocation-row"
        >
          <select v-model="alloc.chain" class="chain-select">
            <option value="">Select Chain</option>
            <option v-for="chain in supportedChains" :key="chain" :value="chain">
              {{ formatChainName(chain) }}
            </option>
          </select>
          <input 
            v-model="alloc.token" 
            placeholder="Token (e.g., ETH)"
            class="token-input"
          />
          <input 
            v-model.number="alloc.targetPercentage" 
            type="number"
            min="0"
            max="100"
            placeholder="%"
            class="pct-input"
          />
          <span class="pct-symbol">%</span>
          <button @click="removeAllocation(idx)" class="btn-remove">×</button>
        </div>
        <button @click="addAllocation" class="btn-secondary">+ Add Target</button>
      </div>

      <div class="analysis-actions">
        <button @click="analyzeRebalance" :disabled="analyzing" class="btn-primary">
          {{ analyzing ? 'Analyzing...' : 'Analyze Rebalance' }}
        </button>
        <button @click="generateTransactions" :disabled="!analysis" class="btn-secondary">
          Generate Transactions
        </button>
      </div>
    </div>

    <!-- Analysis Results -->
    <div v-if="analysis" class="section analysis-results">
      <h3>📈 Rebalance Analysis</h3>
      <div class="recommendation">
        <span class="rec-icon">💡</span>
        {{ analysis.recommendation }}
      </div>
      
      <div class="differences-list">
        <div 
          v-for="(diff, idx) in analysis.differences" 
          :key="idx"
          class="diff-card"
          :class="diff.action"
        >
          <div class="diff-action">
            <span class="action-badge" :class="diff.action">
              {{ diff.action.toUpperCase() }}
            </span>
            <span class="diff-token">{{ diff.token }}</span>
            <span class="diff-chain">on {{ formatChainName(diff.chain) }}</span>
          </div>
          <div class="diff-details">
            <span class="current-pct">{{ diff.currentPercent.toFixed(1) }}%</span>
            <span class="arrow">→</span>
            <span class="target-pct">{{ diff.targetPercent.toFixed(1) }}%</span>
            <span class="diff-amount">({{ diff.diff > 0 ? '+' : '' }}{{ diff.diff.toFixed(1) }}%)</span>
          </div>
          <div class="diff-value">
            ~${{ formatNumber(Math.abs(diff.amountUSD)) }}
          </div>
        </div>
      </div>

      <div class="gas-estimate">
        <span class="gas-label">Estimated Gas:</span>
        <span class="gas-value">${{ formatNumber(analysis.estimatedGas) }}</span>
      </div>
    </div>

    <!-- Transactions -->
    <div v-if="transactions.length > 0" class="section transactions">
      <h3>📝 Suggested Transactions</h3>
      <div class="tx-list">
        <div 
          v-for="(tx, idx) in transactions" 
          :key="idx"
          class="tx-card"
        >
          <div class="tx-type">
            <span class="type-badge" :class="tx.type">{{ tx.type }}</span>
          </div>
          <div class="tx-details">
            <div class="tx-route">
              {{ tx.fromToken }} → {{ tx.toToken }}
            </div>
            <div class="tx-chain">Chain: {{ formatChainName(tx.chain) }}</div>
            <div class="tx-amount">Amount: {{ tx.amount.toFixed(4) }}</div>
          </div>
          <div class="tx-gas">
            Gas: ~${{ formatNumber(tx.estimatedGas) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Arbitrage Opportunities -->
    <div class="section arbitrage-opportunities">
      <div class="section-header">
        <h3>⚡ Cross-chain Arbitrage Opportunities</h3>
        <button @click="fetchOpportunities" :disabled="loadingOpps" class="btn-small">
          {{ loadingOpps ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
      <div v-if="opportunities.length > 0" class="opps-list">
        <div 
          v-for="(opp, idx) in opportunities" 
          :key="idx"
          class="opp-card"
          :class="opp.risk"
        >
          <div class="opp-route">{{ opp.route }}</div>
          <div class="opp-token">{{ opp.token }}</div>
          <div class="opp-profit">+${{ formatNumber(opp.profitUSD) }}</div>
          <div class="opp-risk">
            <span class="risk-badge" :class="opp.risk">{{ opp.risk }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        No arbitrage opportunities found
      </div>
    </div>

    <!-- History -->
    <div v-if="history.length > 0" class="section history">
      <h3>📜 Rebalance History</h3>
      <div class="history-list">
        <div 
          v-for="(item, idx) in history" 
          :key="idx"
          class="history-item"
        >
          <div class="history-date">{{ formatDate(item.date) }}</div>
          <div class="history-changes">{{ item.changes }} changes</div>
          <div class="history-gas">Gas: ${{ formatNumber(item.gas) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Portfolio {
  address: string;
  totalValueUSD: number;
  positions: {
    chain: string;
    token: string;
    symbol: string;
    balance: number;
    valueUSD: number;
    percentage: number;
  }[];
  chainDistribution: Record<string, number>;
  tokenDistribution: Record<string, number>;
}

interface Analysis {
  differences: {
    chain: string;
    token: string;
    currentPercent: number;
    targetPercent: number;
    diff: number;
    action: string;
    amountUSD: number;
  }[];
  estimatedGas: number;
  recommendation: string;
}

interface Transaction {
  chain: string;
  type: string;
  fromToken: string;
  toToken: string;
  amount: number;
  estimatedGas: number;
  path?: string[];
}

interface Opportunity {
  sourceChain: string;
  targetChain: string;
  token: string;
  profitUSD: number;
  route: string;
  risk: string;
}

interface HistoryItem {
  date: string;
  changes: number;
  gas: number;
}

const walletAddress = ref('0x742d35Cc6634C0532925a3b844Bc9e7595f0');
const loading = ref(false);
const analyzing = ref(false);
const loadingOpps = ref(false);

const portfolio = ref<Portfolio | null>(null);
const analysis = ref<Analysis | null>(null);
const transactions = ref<Transaction[]>([]);
const opportunities = ref<Opportunity[]>([]);
const history = ref<HistoryItem[]>([]);

const supportedChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];

const targetAllocations = ref([
  { chain: 'ethereum', token: 'ETH', targetPercentage: 40 },
  { chain: 'polygon', token: 'MATIC', targetPercentage: 20 },
  { chain: 'arbitrum', token: 'ETH', targetPercentage: 20 },
  { chain: 'bsc', token: 'BNB', targetPercentage: 20 },
]);

const API_BASE = '/api/cross-chain-rebalancer';

async function fetchPortfolio() {
  if (!walletAddress.value) return;
  
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/portfolio/${walletAddress.value}`);
    const data = await res.json();
    if (data.success) {
      portfolio.value = data.data;
      await fetchHistory();
    }
  } catch (e) {
    console.error('Failed to fetch portfolio:', e);
  } finally {
    loading.value = false;
  }
}

async function analyzeRebalance() {
  if (!walletAddress.value || targetAllocations.value.length === 0) return;
  
  analyzing.value = true;
  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: walletAddress.value,
        targetAllocations: targetAllocations.value,
        threshold: 5,
      }),
    });
    const data = await res.json();
    if (data.success) {
      analysis.value = data.data;
    }
  } catch (e) {
    console.error('Failed to analyze:', e);
  } finally {
    analyzing.value = false;
  }
}

async function generateTransactions() {
  if (!analysis.value) return;
  
  try {
    const res = await fetch(`${API_BASE}/rebalance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: walletAddress.value,
        targetAllocations: targetAllocations.value,
      }),
    });
    const data = await res.json();
    if (data.success) {
      transactions.value = data.data;
    }
  } catch (e) {
    console.error('Failed to generate transactions:', e);
  }
}

async function fetchOpportunities() {
  loadingOpps.value = true;
  try {
    const res = await fetch(`${API_BASE}/opportunities?minProfit=1`);
    const data = await res.json();
    if (data.success) {
      opportunities.value = data.data;
    }
  } catch (e) {
    console.error('Failed to fetch opportunities:', e);
  } finally {
    loadingOpps.value = false;
  }
}

async function fetchHistory() {
  try {
    const res = await fetch(`${API_BASE}/history/${walletAddress.value}?limit=10`);
    const data = await res.json();
    if (data.success) {
      history.value = data.data;
    }
  } catch (e) {
    console.error('Failed to fetch history:', e);
  }
}

function addAllocation() {
  targetAllocations.value.push({ chain: '', token: '', targetPercentage: 0 });
}

function removeAllocation(idx: number) {
  targetAllocations.value.splice(idx, 1);
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChainName(chain: string): string {
  const names: Record<string, string> = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    bsc: 'BNB Chain',
    base: 'Base',
    avalanche: 'Avalanche',
  };
  return names[chain] || chain;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

onMounted(() => {
  fetchPortfolio();
  fetchOpportunities();
});
</script>

<style scoped>
.cross-chain-rebalancer {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #1a1a2e;
}

.header p {
  margin: 0;
  color: #666;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #1a1a2e;
}

.wallet-input {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.wallet-input h3 {
  color: white;
}

.input-group {
  display: flex;
  gap: 12px;
}

.address-input {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
}

.btn-primary {
  padding: 12px 24px;
  background: #1a1a2e;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f0f0f0;
  color: #1a1a2e;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-small {
  padding: 6px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-card.total-value {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-card.total-value .stat-label {
  color: rgba(255, 255, 255, 0.8);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.distribution-section {
  margin-bottom: 20px;
}

.distribution-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.distribution-bar {
  display: flex;
  flex-direction: column;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.chain-name {
  font-weight: 500;
}

.bar-track {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.token-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.token-card {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.token-symbol {
  font-weight: 700;
  font-size: 16px;
}

.token-chain {
  font-size: 11px;
  color: #666;
}

.token-balance {
  font-size: 13px;
  margin: 4px 0;
}

.token-value {
  font-weight: 600;
  color: #667eea;
}

.token-pct {
  font-size: 12px;
  color: #999;
}

.allocation-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.allocation-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chain-select, .token-input, .pct-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.chain-select {
  flex: 1;
}

.token-input {
  width: 80px;
}

.pct-input {
  width: 60px;
}

.pct-symbol {
  color: #666;
}

.btn-remove {
  width: 28px;
  height: 28px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.analysis-actions {
  display: flex;
  gap: 12px;
}

.recommendation {
  background: #fff3cd;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rec-icon {
  font-size: 18px;
}

.differences-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.diff-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ddd;
}

.diff-card.buy {
  border-left-color: #2ed573;
}

.diff-card.sell {
  border-left-color: #ff4757;
}

.action-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.action-badge.buy {
  background: #2ed573;
  color: white;
}

.action-badge.sell {
  background: #ff4757;
  color: white;
}

.diff-token {
  font-weight: 600;
}

.diff-chain {
  color: #666;
  font-size: 13px;
}

.diff-details {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.arrow {
  color: #999;
}

.diff-value {
  font-weight: 600;
  color: #667eea;
}

.gas-estimate {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.gas-label {
  color: #666;
}

.gas-value {
  font-weight: 600;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tx-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.type-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge.swap {
  background: #ffa502;
  color: white;
}

.type-badge.bridge {
  background: #3742fa;
  color: white;
}

.type-badge.transfer {
  background: #a4b0be;
  color: white;
}

.tx-details {
  flex: 1;
}

.tx-route {
  font-weight: 600;
}

.tx-chain, .tx-amount {
  font-size: 12px;
  color: #666;
}

.tx-gas {
  font-size: 13px;
  color: #666;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
}

.opps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.opp-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ddd;
}

.opp-card.low {
  border-left-color: #2ed573;
}

.opp-card.medium {
  border-left-color: #ffa502;
}

.opp-card.high {
  border-left-color: #ff4757;
}

.opp-route {
  flex: 1;
  font-weight: 500;
}

.opp-token {
  color: #666;
}

.opp-profit {
  font-weight: 700;
  color: #2ed573;
}

.risk-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;
}

.risk-badge.low {
  background: #2ed573;
  color: white;
}

.risk-badge.medium {
  background: #ffa502;
  color: white;
}

.risk-badge.high {
  background: #ff4757;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.history-date {
  font-weight: 500;
}

.history-changes, .history-gas {
  color: #666;
  font-size: 13px;
}
</style>
