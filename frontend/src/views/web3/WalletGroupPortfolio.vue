<template>
  <div class="wallet-group-portfolio">
    <div class="header">
      <h1>👥 Wallet Group Portfolio</h1>
      <p class="subtitle">Manage and analyze multiple wallet portfolios as a group</p>
    </div>

    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- Groups List Tab -->
    <div v-if="activeTab === 'groups'" class="tab-content">
      <div class="section-header">
        <h2>My Wallet Groups</h2>
        <button class="btn-primary" @click="showCreateModal = true">
          + New Group
        </button>
      </div>

      <div class="groups-grid">
        <div v-for="group in groups" :key="group.id" class="group-card">
          <div class="group-header">
            <h3>{{ group.name }}</h3>
            <span class="wallet-count">{{ group.wallets?.length || 0 }} wallets</span>
          </div>
          <p v-if="group.description" class="description">{{ group.description }}</p>
          
          <div class="group-wallets" v-if="group.wallets?.length">
            <div v-for="(wallet, idx) in group.wallets.slice(0, 3)" :key="idx" class="wallet-tag">
              {{ formatAddress(wallet) }}
            </div>
            <span v-if="group.wallets.length > 3" class="more-wallets">
              +{{ group.wallets.length - 3 }} more
            </span>
          </div>

          <div class="group-actions">
            <button class="btn-secondary" @click="viewGroupPortfolio(group)">
              📊 Portfolio
            </button>
            <button class="btn-secondary" @click="viewGroupAnalysis(group)">
              🔍 Analysis
            </button>
            <button class="btn-danger" @click="deleteGroup(group.id)">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div v-if="groups.length === 0" class="empty-state">
        <p>No wallet groups yet. Create your first group!</p>
      </div>
    </div>

    <!-- Portfolio Tab -->
    <div v-if="activeTab === 'portfolio'" class="tab-content">
      <div v-if="selectedGroup" class="portfolio-view">
        <div class="section-header">
          <h2>{{ selectedGroup.name }} - Portfolio Overview</h2>
          <button class="btn-secondary" @click="activeTab = 'groups'">
            ← Back
          </button>
        </div>

        <div class="portfolio-summary">
          <div class="summary-card total-value">
            <span class="label">Total Value</span>
            <span class="value">${{ formatNumber(portfolio?.totalValueUSD || 0) }}</span>
          </div>
          <div class="summary-card">
            <span class="label">24h Change</span>
            <span :class="['value', portfolio?.change24h >= 0 ? 'success' : 'danger']">
              {{ portfolio?.change24h >= 0 ? '+' : '' }}{{ portfolio?.change24h?.toFixed(2) || 0 }}%
            </span>
          </div>
          <div class="summary-card">
            <span class="label">7d Change</span>
            <span :class="['value', portfolio?.change7d >= 0 ? 'success' : 'danger']">
              {{ portfolio?.change7d >= 0 ? '+' : '' }}{{ portfolio?.change7d?.toFixed(2) || 0 }}%
            </span>
          </div>
          <div class="summary-card">
            <span class="label">Token Count</span>
            <span class="value">{{ portfolio?.tokenCount || 0 }}</span>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-card">
            <h3>Chain Distribution</h3>
            <div class="distribution-bars">
              <div v-for="(pct, chain) in portfolio?.chainDistribution" :key="chain" class="distribution-item">
                <span class="chain-name">{{ chain }}</span>
                <div class="bar-container">
                  <div class="bar" :style="{ width: pct + '%' }"></div>
                </div>
                <span class="pct">{{ pct.toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <h3>Category Distribution</h3>
            <div class="distribution-bars">
              <div v-for="(pct, cat) in portfolio?.categoryDistribution" :key="cat" class="distribution-item">
                <span class="chain-name">{{ cat }}</span>
                <div class="bar-container">
                  <div class="bar category" :style="{ width: pct + '%' }"></div>
                </div>
                <span class="pct">{{ pct.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="top-holdings">
          <h3>Top Holdings</h3>
          <table class="holdings-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Chain</th>
                <th>Balance</th>
                <th>Value</th>
                <th>Allocation</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="holding in portfolio?.topHoldings" :key="holding.symbol">
                <td>
                  <div class="token-info">
                    <span class="symbol">{{ holding.symbol }}</span>
                    <span class="name">{{ holding.name }}</span>
                  </div>
                </td>
                <td><span class="chain-badge">{{ holding.chain }}</span></td>
                <td>{{ holding.balance }}</td>
                <td>${{ formatNumber(holding.valueUSD) }}</td>
                <td>
                  <div class="allocation-bar">
                    <div class="fill" :style="{ width: holding.percentage + '%' }"></div>
                    <span>{{ holding.percentage.toFixed(2) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>Select a group to view its portfolio</p>
      </div>
    </div>

    <!-- Analysis Tab -->
    <div v-if="activeTab === 'analysis'" class="tab-content">
      <div v-if="selectedGroup && analysis" class="analysis-view">
        <div class="section-header">
          <h2>{{ selectedGroup.name }} - Wallet Analysis</h2>
          <button class="btn-secondary" @click="activeTab = 'groups'">
            ← Back
          </button>
        </div>

        <div class="analysis-summary">
          <div class="summary-card">
            <span class="label">Total Wallets</span>
            <span class="value">{{ analysis.walletCount }}</span>
          </div>
          <div class="summary-card">
            <span class="label">Total Value</span>
            <span class="value">${{ formatNumber(analysis.summary?.totalValue || 0) }}</span>
          </div>
          <div class="summary-card">
            <span class="label">Avg Value per Wallet</span>
            <span class="value">${{ formatNumber(analysis.summary?.avgValue || 0) }}</span>
          </div>
        </div>

        <div class="wallet-analysis-list">
          <h3>Individual Wallet Performance</h3>
          <table class="holdings-table">
            <thead>
              <tr>
                <th>Wallet</th>
                <th>Value</th>
                <th>24h</th>
                <th>7d</th>
                <th>Tokens</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="wallet in analysis.wallets" :key="wallet.address">
                <td class="wallet-address">{{ formatAddress(wallet.address) }}</td>
                <td>${{ formatNumber(wallet.valueUSD) }}</td>
                <td :class="wallet.change24h >= 0 ? 'success' : 'danger'">
                  {{ wallet.change24h >= 0 ? '+' : '' }}{{ wallet.change24h.toFixed(2) }}%
                </td>
                <td :class="wallet.change7d >= 0 ? 'success' : 'danger'">
                  {{ wallet.change7d >= 0 ? '+' : '' }}{{ wallet.change7d.toFixed(2) }}%
                </td>
                <td>{{ wallet.tokenCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>Select a group to view analysis</p>
      </div>
    </div>

    <!-- Compare Tab -->
    <div v-if="activeTab === 'compare'" class="tab-content">
      <h2>Compare Groups</h2>
      <div class="compare-selector">
        <select v-model="compareGroup1">
          <option value="">Select Group 1</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <span class="vs">VS</span>
        <select v-model="compareGroup2">
          <option value="">Select Group 2</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <button class="btn-primary" @click="compareGroups">Compare</button>
      </div>

      <div v-if="comparison" class="comparison-result">
        <div class="compare-grid">
          <div class="compare-card">
            <h3>{{ comparison.group1?.id }}</h3>
            <div class="compare-stat">
              <span>Total Value:</span>
              <span>${{ formatNumber(comparison.group1?.totalValueUSD || 0) }}</span>
            </div>
            <div class="compare-stat">
              <span>24h:</span>
              <span :class="comparison.group1?.change24h >= 0 ? 'success' : 'danger'">
                {{ comparison.group1?.change24h?.toFixed(2) || 0 }}%
              </span>
            </div>
            <div class="compare-stat">
              <span>7d:</span>
              <span :class="comparison.group1?.change7d >= 0 ? 'success' : 'danger'">
                {{ comparison.group1?.change7d?.toFixed(2) || 0 }}%
              </span>
            </div>
          </div>
          <div class="compare-card">
            <h3>{{ comparison.group2?.id }}</h3>
            <div class="compare-stat">
              <span>Total Value:</span>
              <span>${{ formatNumber(comparison.group2?.totalValueUSD || 0) }}</span>
            </div>
            <div class="compare-stat">
              <span>24h:</span>
              <span :class="comparison.group2?.change24h >= 0 ? 'success' : 'danger'">
                {{ comparison.group2?.change24h?.toFixed(2) || 0 }}%
              </span>
            </div>
            <div class="compare-stat">
              <span>7d:</span>
              <span :class="comparison.group2?.change7d >= 0 ? 'success' : 'danger'">
                {{ comparison.group2?.change7d?.toFixed(2) || 0 }}%
              </span>
            </div>
          </div>
        </div>
        <div class="comparison-summary">
          <h4>Comparison Summary</h4>
          <p>Value Difference: <strong>${{ formatNumber(comparison.comparison?.valueDiff || 0) }}</strong></p>
          <p>Value Diff %: <strong>{{ comparison.comparison?.valueDiffPercent?.toFixed(2) || 0 }}%</strong></p>
          <p>Performance 24h Diff: <strong>{{ comparison.comparison?.performanceDiff24h?.toFixed(2) || 0 }}%</strong></p>
          <p>Performance 7d Diff: <strong>{{ comparison.comparison?.performanceDiff7d?.toFixed(2) || 0 }}%</strong></p>
        </div>
      </div>
    </div>

    <!-- Create Group Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <h2>Create Wallet Group</h2>
        <div class="form-group">
          <label>Group Name</label>
          <input v-model="newGroup.name" type="text" placeholder="e.g., My DeFi Portfolio" />
        </div>
        <div class="form-group">
          <label>Description (optional)</label>
          <textarea v-model="newGroup.description" placeholder="Describe this group..."></textarea>
        </div>
        <div class="form-group">
          <label>Wallets (one per line)</label>
          <textarea v-model="newGroup.walletsText" placeholder="0x123...&#10;0x456..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreateModal = false">Cancel</button>
          <button class="btn-primary" @click="createGroup">Create</button>
        </div>
      </div>
    </div>

    <!-- Add Wallet Modal -->
    <div v-if="showAddWalletModal" class="modal-overlay" @click.self="showAddWalletModal = false">
      <div class="modal">
        <h2>Add Wallet to Group</h2>
        <div class="form-group">
          <label>Wallet Address</label>
          <input v-model="newWallet" type="text" placeholder="0x..." />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showAddWalletModal = false">Cancel</button>
          <button class="btn-primary" @click="addWallet">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const tabs = [
  { id: 'groups', name: 'Groups', icon: '📁' },
  { id: 'portfolio', name: 'Portfolio', icon: '💼' },
  { id: 'analysis', name: 'Analysis', icon: '📊' },
  { id: 'compare', name: 'Compare', icon: '⚖️' },
];

const activeTab = ref('groups');
const groups = ref([]);
const selectedGroup = ref(null);
const portfolio = ref(null);
const analysis = ref(null);
const comparison = ref(null);
const compareGroup1 = ref('');
const compareGroup2 = ref('');

const showCreateModal = ref(false);
const showAddWalletModal = ref(false);
const newGroup = ref({
  name: '',
  description: '',
  walletsText: '',
});
const newWallet = ref('');

// Mock API base URL
const API_BASE = 'http://localhost:3000';

const formatAddress = (addr) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const loadGroups = async () => {
  try {
    const res = await fetch(`${API_BASE}/web3/wallet-group`);
    groups.value = await res.json();
  } catch (e) {
    // Use mock data for demo
    groups.value = [
      {
        id: 'group_1',
        name: 'DeFi Portfolio',
        description: 'My main DeFi positions',
        wallets: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab12', '0x8ba1f109551bD432803012645Ac136ddd64DBA72'],
      },
      {
        id: 'group_2',
        name: 'NFT Trading',
        description: 'Wallets used for NFT flips',
        wallets: ['0x1234567890abcdef1234567890abcdef12345678'],
      },
    ];
  }
};

const createGroup = async () => {
  const wallets = newGroup.value.walletsText
    .split('\n')
    .map(w => w.trim())
    .filter(w => w);
  
  try {
    const res = await fetch(`${API_BASE}/web3/wallet-group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newGroup.value.name,
        description: newGroup.value.description,
        wallets,
      }),
    });
    const created = await res.json();
    groups.value.push(created);
  } catch (e) {
    // Mock
    groups.value.push({
      id: `group_${Date.now()}`,
      name: newGroup.value.name,
      description: newGroup.value.description,
      wallets,
    });
  }
  
  showCreateModal.value = false;
  newGroup.value = { name: '', description: '', walletsText: '' };
};

const deleteGroup = async (id) => {
  try {
    await fetch(`${API_BASE}/web3/wallet-group/${id}`, { method: 'DELETE' });
  } catch (e) {}
  groups.value = groups.value.filter(g => g.id !== id);
};

const viewGroupPortfolio = async (group) => {
  selectedGroup.value = group;
  activeTab.value = 'portfolio';
  
  try {
    const res = await fetch(`${API_BASE}/web3/wallet-group/${group.id}/portfolio`);
    portfolio.value = await res.json();
  } catch (e) {
    // Mock data
    portfolio.value = {
      totalValueUSD: 125000 + Math.random() * 50000,
      tokenCount: 15,
      change24h: (Math.random() - 0.4) * 10,
      change7d: (Math.random() - 0.3) * 20,
      chainDistribution: {
        Ethereum: 45,
        Arbitrum: 25,
        Optimism: 15,
        Polygon: 10,
        Avalanche: 5,
      },
      categoryDistribution: {
        DeFi: 40,
        Stablecoins: 30,
        Layer1: 20,
        Other: 10,
      },
      topHoldings: [
        { symbol: 'ETH', name: 'Ethereum', chain: 'Ethereum', balance: '25.5', valueUSD: 62475, percentage: 50 },
        { symbol: 'USDC', name: 'USD Coin', chain: 'Ethereum', balance: '30000', valueUSD: 30000, percentage: 24 },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', chain: 'Ethereum', balance: '0.8', valueUSD: 54000, percentage: 43 },
        { symbol: 'UNI', name: 'Uniswap', chain: 'Ethereum', balance: '2500', valueUSD: 18000, percentage: 14.4 },
        { symbol: 'ARB', name: 'Arbitrum', chain: 'Arbitrum', balance: '10000', valueUSD: 10500, percentage: 8.4 },
      ],
    };
  }
};

const viewGroupAnalysis = async (group) => {
  selectedGroup.value = group;
  activeTab.value = 'analysis';
  
  try {
    const res = await fetch(`${API_BASE}/web3/wallet-group/${group.id}/analysis`);
    analysis.value = await res.json();
  } catch (e) {
    // Mock data
    analysis.value = {
      groupId: group.id,
      groupName: group.name,
      walletCount: group.wallets.length,
      wallets: group.wallets.map(w => ({
        address: w,
        valueUSD: Math.random() * 100000,
        change24h: (Math.random() - 0.4) * 10,
        change7d: (Math.random() - 0.3) * 20,
        tokenCount: Math.floor(Math.random() * 15) + 5,
        topTokens: ['ETH', 'USDC', 'UNI'],
        lastActivity: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      })),
      summary: {
        totalValue: group.wallets.length * 50000,
        avgValue: 50000,
        change24h: 2.5,
        change7d: 5.8,
      },
    };
  }
};

const compareGroups = async () => {
  if (!compareGroup1.value || !compareGroup2.value) return;
  
  try {
    const res = await fetch(`${API_BASE}/web3/wallet-group/compare/${compareGroup1.value}/${compareGroup2.value}`);
    comparison.value = await res.json();
  } catch (e) {
    // Mock
    comparison.value = {
      group1: { id: compareGroup1.value, totalValueUSD: 150000, change24h: 2.5, change7d: 5.2 },
      group2: { id: compareGroup2.value, totalValueUSD: 80000, change24h: -1.2, change7d: 3.8 },
      comparison: {
        valueDiff: 70000,
        valueDiffPercent: 87.5,
        performanceDiff24h: 3.7,
        performanceDiff7d: 1.4,
      },
    };
  }
};

const addWallet = async () => {
  if (!selectedGroup.value || !newWallet.value) return;
  
  try {
    await fetch(`${API_BASE}/web3/wallet-group/${selectedGroup.value.id}/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: newWallet.value }),
    });
  } catch (e) {}
  
  selectedGroup.value.wallets.push(newWallet.value);
  showAddWalletModal.value = false;
  newWallet.value = '';
};

onMounted(() => {
  loadGroups();
});
</script>

<style scoped>
.wallet-group-portfolio {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.tab {
  padding: 10px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
}

.tab.active {
  background: #e0f2fe;
  color: #0284c7;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-primary {
  background: #0284c7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary {
  background: #f1f5f9;
  color: #334155;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-danger {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.group-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  background: white;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.wallet-count {
  color: #64748b;
  font-size: 14px;
}

.description {
  color: #64748b;
  margin-bottom: 15px;
}

.group-wallets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.wallet-tag {
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

.more-wallets {
  color: #64748b;
  font-size: 12px;
}

.group-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.summary-card .label {
  display: block;
  color: #64748b;
  font-size: 14px;
  margin-bottom: 8px;
}

.summary-card .value {
  font-size: 24px;
  font-weight: 600;
}

.summary-card .value.success {
  color: #16a34a;
}

.summary-card .value.danger {
  color: #dc2626;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.chain-name {
  width: 80px;
  font-size: 14px;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
}

.bar {
  height: 100%;
  background: #3b82f6;
  border-radius: 4px;
}

.bar.category {
  background: #8b5cf6;
}

.pct {
  width: 50px;
  text-align: right;
  font-size: 14px;
  color: #64748b;
}

.top-holdings {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.holdings-table {
  width: 100%;
  border-collapse: collapse;
}

.holdings-table th,
.holdings-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.holdings-table th {
  font-weight: 600;
  color: #64748b;
  font-size: 14px;
}

.token-info {
  display: flex;
  flex-direction: column;
}

.symbol {
  font-weight: 600;
}

.name {
  font-size: 12px;
  color: #64748b;
}

.chain-badge {
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.allocation-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.allocation-bar .fill {
  height: 6px;
  background: #10b981;
  border-radius: 3px;
}

.compare-selector {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

.compare-selector select {
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  min-width: 200px;
}

.vs {
  font-weight: 600;
  color: #64748b;
}

.comparison-result {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.compare-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.compare-stat {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.compare-stat .success {
  color: #16a34a;
}

.compare-stat .danger {
  color: #dc2626;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 30px;
  width: 500px;
  max-width: 90%;
}

.modal h2 {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: inherit;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
  font-family: monospace;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
