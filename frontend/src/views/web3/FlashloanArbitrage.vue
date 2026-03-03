<template>
  <div class="flashloan-arbitrage">
    <div class="header">
      <h1>⚡ Flashloan Arbitrage Scanner</h1>
      <p class="subtitle">Detect and exploit cross-DEX arbitrage opportunities using flashloans</p>
    </div>

    <!-- Stats Dashboard -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">${{ stats.totalProfit24h }}</div>
          <div class="stat-label">Total Profit (24h)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalOpportunities }}</div>
          <div class="stat-label">Active Opportunities</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">${{ stats.averageProfit }}</div>
          <div class="stat-label">Avg Profit/Trade</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎖️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.averageConfidence }}%</div>
          <div class="stat-label">Avg Confidence</div>
        </div>
      </div>
    </div>

    <!-- Risk Distribution -->
    <div class="risk-bar">
      <div class="risk-item low">
        <span class="risk-dot"></span>
        <span>Low Risk</span>
        <span class="risk-count">{{ stats.riskDistribution?.low || 0 }}</span>
      </div>
      <div class="risk-item medium">
        <span class="risk-dot"></span>
        <span>Medium Risk</span>
        <span class="risk-count">{{ stats.riskDistribution?.medium || 0 }}</span>
      </div>
      <div class="risk-item high">
        <span class="risk-dot"></span>
        <span>High Risk</span>
        <span class="risk-count">{{ stats.riskDistribution?.high || 0 }}</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="filters.chain" @change="loadOpportunities">
        <option value="">All Chains</option>
        <option value="ethereum">Ethereum</option>
        <option value="arbitrum">Arbitrum</option>
        <option value="optimism">Optimism</option>
        <option value="bsc">BSC</option>
        <option value="polygon">Polygon</option>
        <option value="base">Base</option>
        <option value="avalanche">Avalanche</option>
      </select>
      <input 
        type="number" 
        v-model.number="filters.minProfit" 
        placeholder="Min Profit ($)"
        @change="loadOpportunities"
      />
      <button class="refresh-btn" @click="loadOpportunities" :disabled="loading">
        🔄 Refresh
      </button>
    </div>

    <!-- Opportunities Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Chain</th>
            <th>Token Pair</th>
            <th>Buy DEX</th>
            <th>Sell DEX</th>
            <th>Spread</th>
            <th>Net Profit</th>
            <th>Confidence</th>
            <th>Risk</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="opp in opportunities" :key="opp.id" :class="{ highlighted: opp.netProfit > 500 }">
            <td>
              <span class="chain-badge" :class="opp.chain">{{ opp.chain }}</span>
            </td>
            <td class="token-pair">{{ opp.tokenPair }}</td>
            <td>{{ opp.buyDex }}</td>
            <td>{{ opp.sellDex }}</td>
            <td class="spread">{{ opp.spread.toFixed(2) }}%</td>
            <td class="profit" :class="{ positive: opp.netProfit > 0, negative: opp.netProfit <= 0 }">
              ${{ opp.netProfit.toFixed(2) }}
            </td>
            <td>
              <div class="confidence-bar">
                <div class="confidence-fill" :style="{ width: opp.confidence + '%' }"></div>
                <span>{{ opp.confidence }}%</span>
              </div>
            </td>
            <td>
              <span class="risk-badge" :class="opp.risk">{{ opp.risk }}</span>
            </td>
            <td>
              <button class="detail-btn" @click="showDetail(opp)">Details</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedOpportunity" class="modal-overlay" @click="selectedOpportunity = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Arbitrage Opportunity Details</h2>
          <button class="close-btn" @click="selectedOpportunity = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Chain</label>
              <span class="chain-badge" :class="selectedOpportunity.chain">{{ selectedOpportunity.chain }}</span>
            </div>
            <div class="detail-item">
              <label>Token Pair</label>
              <span>{{ selectedOpportunity.tokenPair }}</span>
            </div>
            <div class="detail-item">
              <label>Buy DEX</label>
              <span>{{ selectedOpportunity.buyDex }}</span>
            </div>
            <div class="detail-item">
              <label>Sell DEX</label>
              <span>{{ selectedOpportunity.sellDex }}</span>
            </div>
            <div class="detail-item">
              <label>Buy Price</label>
              <span>${{ selectedOpportunity.buyPrice.toFixed(4) }}</span>
            </div>
            <div class="detail-item">
              <label>Sell Price</label>
              <span>${{ selectedOpportunity.sellPrice.toFixed(4) }}</span>
            </div>
            <div class="detail-item">
              <label>Spread</label>
              <span>{{ selectedOpportunity.spread.toFixed(2) }}%</span>
            </div>
            <div class="detail-item">
              <label>Gas Cost</label>
              <span>${{ selectedOpportunity.gasCost.toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <label>Estimated Profit</label>
              <span>${{ selectedOpportunity.estimatedProfit.toFixed(2) }}</span>
            </div>
            <div class="detail-item highlight">
              <label>Net Profit</label>
              <span :class="{ positive: selectedOpportunity.netProfit > 0 }">
                ${{ selectedOpportunity.netProfit.toFixed(2) }}
              </span>
            </div>
            <div class="detail-item">
              <label>24h Volume</label>
              <span>${{ (selectedOpportunity.volume24h / 1000000).toFixed(2) }}M</span>
            </div>
            <div class="detail-item">
              <label>Liquidity</label>
              <span>${{ (selectedOpportunity.liquidity / 1000000).toFixed(2) }}M</span>
            </div>
          </div>

          <div class="execution-steps">
            <h3>Execution Steps</h3>
            <ol>
              <li v-for="(step, idx) in selectedOpportunity.executionSteps" :key="idx">
                {{ step }}
              </li>
            </ol>
          </div>

          <div class="flashloan-note">
            <strong>⚠️ Note:</strong> This arbitrage uses Aave flashloans (0.06% fee). 
            Ensure net profit exceeds gas costs after flashloan fees.
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Section -->
    <div class="alert-section">
      <h2>📢 Create Alert</h2>
      <div class="alert-form">
        <input 
          type="text" 
          v-model="alertForm.address" 
          placeholder="Wallet Address (0x...)"
        />
        <input 
          type="number" 
          v-model.number="alertForm.minProfit" 
          placeholder="Min Profit ($)"
        />
        <select v-model="alertForm.chain">
          <option value="">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="bsc">BSC</option>
          <option value="polygon">Polygon</option>
          <option value="base">Base</option>
          <option value="avalanche">Avalanche</option>
        </select>
        <button @click="createAlert" class="create-alert-btn">Create Alert</button>
      </div>
    </div>

    <!-- Recent History -->
    <div class="history-section">
      <h2>📜 Arbitrage History</h2>
      <div class="history-grid">
        <div 
          v-for="item in history" 
          :key="item.id" 
          class="history-card"
          :class="{ profitable: item.netProfit > 0 }"
        >
          <div class="history-header">
            <span class="chain-badge small" :class="item.chain">{{ item.chain }}</span>
            <span class="time">{{ formatTime(item.timestamp) }}</span>
          </div>
          <div class="history-pair">{{ item.tokenPair }}</div>
          <div class="history-profit" :class="{ positive: item.netProfit > 0 }">
            ${{ item.netProfit.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/service/api';

interface Opportunity {
  id: string;
  chain: string;
  tokenPair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  estimatedProfit: number;
  gasCost: number;
  netProfit: number;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  timestamp: number;
  volume24h: number;
  liquidity: number;
  executionSteps: string[];
}

interface Stats {
  totalOpportunities: number;
  averageProfit: string;
  averageConfidence: number;
  totalProfit24h: string;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

const loading = ref(false);
const opportunities = ref<Opportunity[]>([]);
const history = ref<Opportunity[]>([]);
const stats = ref<Stats>({
  totalOpportunities: 0,
  averageProfit: '0',
  averageConfidence: 0,
  totalProfit24h: '0',
  riskDistribution: { low: 0, medium: 0, high: 0 }
});
const selectedOpportunity = ref<Opportunity | null>(null);

const filters = ref({
  chain: '',
  minProfit: null as number | null
});

const alertForm = ref({
  address: '',
  minProfit: 100,
  chain: ''
});

const loadOpportunities = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filters.value.chain) params.chain = filters.value.chain;
    if (filters.value.minProfit) params.minProfit = filters.value.minProfit;
    
    const res = await api.get('/flashloan-arbitrage/opportunities', { params });
    if (res.data?.success) {
      opportunities.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to load opportunities:', error);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const res = await api.get('/flashloan-arbitrage/stats', { 
      params: filters.value.chain ? { chain: filters.value.chain } : {} 
    });
    if (res.data?.success) {
      stats.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const loadHistory = async () => {
  try {
    const res = await api.get('/flashloan-arbitrage/history', { 
      params: { limit: 12 } 
    });
    if (res.data?.success) {
      history.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
};

const showDetail = (opp: Opportunity) => {
  selectedOpportunity.value = opp;
};

const createAlert = async () => {
  if (!alertForm.value.address) {
    alert('Please enter a wallet address');
    return;
  }
  try {
    const res = await api.post('/flashloan-arbitrage/alerts', {
      address: alertForm.value.address,
      minProfit: alertForm.value.minProfit,
      chains: alertForm.value.chain ? [alertForm.value.chain] : [],
      tokens: []
    });
    if (res.data?.success) {
      alert('Alert created successfully!');
      alertForm.value.address = '';
    }
  } catch (error) {
    console.error('Failed to create alert:', error);
  }
};

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};

onMounted(() => {
  loadOpportunities();
  loadStats();
  loadHistory();
});
</script>

<style scoped>
.flashloan-arbitrage {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.risk-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.risk-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.risk-item.low .risk-dot { background: #22c55e; }
.risk-item.medium .risk-dot { background: #f59e0b; }
.risk-item.high .risk-dot { background: #ef4444; }

.risk-count {
  font-weight: 600;
  margin-left: 4px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.filters select,
.filters input {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

.filters input {
  width: 160px;
}

.refresh-btn {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn:hover {
  background: #2563eb;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 32px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  color: #6b7280;
}

tr.highlighted {
  background: #fef3c7;
}

.chain-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.chain-badge.ethereum { background: #627eea; color: white; }
.chain-badge.arbitrum { background: #28a0f0; color: white; }
.chain-badge.optimism { background: #ff0420; color: white; }
.chain-badge.bsc { background: #f3ba2f; color: white; }
.chain-badge.polygon { background: #8247e5; color: white; }
.chain-badge.base { background: #0052ff; color: white; }
.chain-badge.avalanche { background: #e84142; color: white; }
.chain-badge.small { padding: 2px 8px; font-size: 10px; }

.token-pair {
  font-weight: 600;
}

.spread {
  color: #f59e0b;
  font-weight: 600;
}

.profit.positive { color: #22c55e; font-weight: 600; }
.profit.negative { color: #ef4444; }

.confidence-bar {
  position: relative;
  height: 20px;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.confidence-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #84cc16);
  border-radius: 10px;
}

.confidence-bar span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: #1a1a2e;
}

.risk-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.risk-badge.low { background: #dcfce7; color: #166534; }
.risk-badge.medium { background: #fef3c7; color: #92400e; }
.risk-badge.high { background: #fee2e2; color: #991b1b; }

.detail-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.detail-btn:hover {
  background: #e5e7eb;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.detail-item label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.detail-item span {
  font-weight: 600;
  color: #1a1a2e;
}

.detail-item.highlight span {
  font-size: 20px;
}

.detail-item span.positive {
  color: #22c55e;
}

.execution-steps {
  margin-bottom: 24px;
}

.execution-steps h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.execution-steps ol {
  padding-left: 20px;
}

.execution-steps li {
  margin-bottom: 8px;
  color: #374151;
}

.flashloan-note {
  padding: 16px;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 14px;
  color: #92400e;
}

/* Alert Section */
.alert-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.alert-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.alert-form {
  display: flex;
  gap: 12px;
}

.alert-form input,
.alert-form select {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  flex: 1;
}

.create-alert-btn {
  padding: 10px 24px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.create-alert-btn:hover {
  background: #7c3aed;
}

/* History */
.history-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.history-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.history-card.profitable {
  border-color: #86efac;
  background: #f0fdf4;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.time {
  font-size: 11px;
  color: #6b7280;
}

.history-pair {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}

.history-profit {
  font-weight: 700;
  font-size: 14px;
  color: #ef4444;
}

.history-profit.positive {
  color: #22c55e;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .history-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .history-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .filters {
    flex-wrap: wrap;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
