<template>
  <div class="anomaly-detector">
    <div class="header">
      <h2>🔍 DeFi Protocol Anomaly Detector</h2>
      <p class="subtitle">Monitor DeFi protocols for unusual activity and potential risks</p>
    </div>

    <!-- Dashboard Overview -->
    <div v-if="dashboard" class="dashboard-grid">
      <!-- Health Status Card -->
      <div class="card health-card">
        <h3>📊 Protocol Health Overview</h3>
        <div class="health-stats">
          <div class="stat-item">
            <span class="stat-value healthy">{{ dashboard.healthStatus.healthy }}</span>
            <span class="stat-label">Healthy</span>
          </div>
          <div class="stat-item">
            <span class="stat-value warning">{{ dashboard.healthStatus.warning }}</span>
            <span class="stat-label">Warning</span>
          </div>
          <div class="stat-item">
            <span class="stat-value critical">{{ dashboard.healthStatus.critical }}</span>
            <span class="stat-label">Critical</span>
          </div>
        </div>
        <div class="avg-score">
          <span class="label">Avg Health Score:</span>
          <span class="score">{{ dashboard.healthStatus.avgHealthScore }}</span>
        </div>
      </div>

      <!-- Category Distribution -->
      <div class="card">
        <h3>📂 By Category</h3>
        <div class="distribution-list">
          <div v-for="(count, category) in dashboard.byCategory" :key="category" class="distribution-item">
            <span class="label">{{ category }}</span>
            <span class="value">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Chain Distribution -->
      <div class="card">
        <h3>⛓️ By Chain</h3>
        <div class="distribution-list">
          <div v-for="(count, chain) in dashboard.byChain" :key="chain" class="distribution-item">
            <span class="label">{{ chain }}</span>
            <span class="value">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Critical Protocols -->
      <div class="card critical-card">
        <h3>⚠️ Critical Protocols</h3>
        <div v-if="dashboard.criticalProtocols.length === 0" class="empty-state">
          No critical protocols
        </div>
        <div v-else class="protocol-list">
          <div v-for="protocol in dashboard.criticalProtocols" :key="protocol.id" class="protocol-item">
            <div class="protocol-info">
              <span class="name">{{ protocol.name }}</span>
              <span class="chain">{{ protocol.chain }}</span>
            </div>
            <div class="health-score" :class="protocol.status">
              {{ protocol.healthScore }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id" 
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Protocols Tab -->
    <div v-if="activeTab === 'protocols'" class="tab-content">
      <div class="card">
        <h3>� Protocols Monitored</h3>
        <div class="filter-bar">
          <select v-model="filterChain">
            <option value="">All Chains</option>
            <option v-for="chain in chains" :key="chain" :value="chain">{{ chain }}</option>
          </select>
          <select v-model="filterStatus">
            <option value="">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div class="protocols-grid">
          <div 
            v-for="protocol in filteredProtocols" 
            :key="protocol.id" 
            class="protocol-card"
            :class="protocol.status"
            @click="selectProtocol(protocol)"
          >
            <div class="protocol-header">
              <span class="name">{{ protocol.name }}</span>
              <span class="status-badge" :class="protocol.status">{{ protocol.status }}</span>
            </div>
            <div class="protocol-meta">
              <span class="chain">{{ protocol.chain }}</span>
              <span class="category">{{ protocol.category }}</span>
            </div>
            <div class="health-bar">
              <div class="bar-fill" :style="{ width: protocol.healthScore + '%' }"></div>
            </div>
            <div class="health-score">{{ protocol.healthScore }}</div>
            <div v-if="protocol.anomalyCount > 0" class="anomaly-badge">
              {{ protocol.anomalyCount }} anomalies
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Anomalies Tab -->
    <div v-if="activeTab === 'anomalies'" class="tab-content">
      <div class="card">
        <h3>🚨 Recent Anomalies</h3>
        <div class="filter-bar">
          <select v-model="filterSeverity">
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div class="anomalies-list">
          <div 
            v-for="anomaly in filteredAnomalies" 
            :key="anomaly.id" 
            class="anomaly-item"
            :class="anomaly.severity"
          >
            <div class="anomaly-header">
              <span class="protocol-name">{{ anomaly.protocolName }}</span>
              <span class="severity-badge" :class="anomaly.severity">{{ anomaly.severity }}</span>
            </div>
            <div class="anomaly-message">{{ anomaly.message }}</div>
            <div class="anomaly-details">
              <span>Value: {{ formatNumber(anomaly.value) }}</span>
              <span>Expected: {{ formatNumber(anomaly.expectedValue) }}</span>
              <span :class="anomaly.deviation > 0 ? 'positive' : 'negative'">
                Deviation: {{ anomaly.deviation > 0 ? '+' : '' }}{{ anomaly.deviation.toFixed(1) }}%
              </span>
            </div>
            <div class="anomaly-time">{{ formatTime(anomaly.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Protocol Details -->
    <div v-if="activeTab === 'details' && selectedProtocolData" class="tab-content">
      <div class="card">
        <div class="details-header">
          <h3>{{ selectedProtocolData.name }}</h3>
          <button class="btn-secondary" @click="activeTab = 'protocols'">Back</button>
        </div>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">TVL</div>
            <div class="metric-value">${{ formatNumber(selectedProtocolData.metrics.tvl) }}</div>
            <div class="metric-change" :class="getChangeClass(selectedProtocolData.metrics.tvlChange24h)">
              {{ selectedProtocolData.metrics.tvlChange24h > 0 ? '+' : '' }}{{ selectedProtocolData.metrics.tvlChange24h.toFixed(1) }}%
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">24h Volume</div>
            <div class="metric-value">${{ formatNumber(selectedProtocolData.metrics.volume24h) }}</div>
            <div class="metric-change" :class="getChangeClass(selectedProtocolData.metrics.volumeChange24h)">
              {{ selectedProtocolData.metrics.volumeChange24h > 0 ? '+' : '' }}{{ selectedProtocolData.metrics.volumeChange24h.toFixed(1) }}%
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Users (24h)</div>
            <div class="metric-value">{{ formatNumber(selectedProtocolData.metrics.users24h) }}</div>
            <div class="metric-change" :class="getChangeClass(selectedProtocolData.metrics.usersChange24h)">
              {{ selectedProtocolData.metrics.usersChange24h > 0 ? '+' : '' }}{{ selectedProtocolData.metrics.usersChange24h.toFixed(1) }}%
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Revenue (24h)</div>
            <div class="metric-value">${{ formatNumber(selectedProtocolData.metrics.revenue24h) }}</div>
            <div class="metric-change" :class="getChangeClass(selectedProtocolData.metrics.revenueChange24h)">
              {{ selectedProtocolData.metrics.revenueChange24h > 0 ? '+' : '' }}{{ selectedProtocolData.metrics.revenueChange24h.toFixed(1) }}%
            </div>
          </div>
        </div>

        <div class="anomalies-section" v-if="selectedProtocolData.anomalies.length > 0">
          <h4>Protocol Anomalies</h4>
          <div class="anomalies-list compact">
            <div v-for="anomaly in selectedProtocolData.anomalies" :key="anomaly.id" class="anomaly-item" :class="anomaly.severity">
              <span class="severity-badge" :class="anomaly.severity">{{ anomaly.severity }}</span>
              <span>{{ anomaly.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Protocol {
  id: string;
  name: string;
  chain: string;
  category: string;
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  anomalyCount: number;
  lastUpdate: number;
  metrics?: any;
  anomalies?: any[];
}

interface Anomaly {
  id: string;
  protocolId: string;
  protocolName: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  expectedValue: number;
  deviation: number;
  timestamp: number;
}

const activeTab = ref('dashboard');
const loading = ref(false);
const dashboard = ref<any>(null);
const protocols = ref<Protocol[]>([]);
const anomalies = ref<Anomaly[]>([]);
const selectedProtocolData = ref<any>(null);

const filterChain = ref('');
const filterStatus = ref('');
const filterSeverity = ref('');

const tabs = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'protocols', label: '� Protocols' },
  { id: 'anomalies', label: '🚨 Anomalies' },
  { id: 'details', label: '🔎 Details' },
];

const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche', 'gnosis'];

const filteredProtocols = computed(() => {
  return protocols.value.filter(p => {
    if (filterChain.value && p.chain !== filterChain.value) return false;
    if (filterStatus.value && p.status !== filterStatus.value) return false;
    return true;
  });
});

const filteredAnomalies = computed(() => {
  return anomalies.value.filter(a => {
    if (filterSeverity.value && a.severity !== filterSeverity.value) return false;
    return true;
  });
});

const loadDashboard = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/defi-anomaly-detector/dashboard');
    const data = await res.json();
    dashboard.value = data;
  } catch (error) {
    console.error('Error loading dashboard:', error);
  } finally {
    loading.value = false;
  }
};

const loadProtocols = async () => {
  try {
    const res = await fetch('/api/defi-anomaly-detector/protocols');
    const data = await res.json();
    protocols.value = data;
  } catch (error) {
    console.error('Error loading protocols:', error);
  }
};

const loadAnomalies = async () => {
  try {
    const res = await fetch('/api/defi-anomaly-detector/anomalies?limit=50');
    const data = await res.json();
    anomalies.value = data;
  } catch (error) {
    console.error('Error loading anomalies:', error);
  }
};

const selectProtocol = async (protocol: Protocol) => {
  try {
    const res = await fetch(`/api/defi-anomaly-detector/protocol/${protocol.id}`);
    const data = await res.json();
    selectedProtocolData.value = data;
    activeTab.value = 'details';
  } catch (error) {
    console.error('Error loading protocol details:', error);
  }
};

const formatNumber = (num: number): string => {
  if (!num) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};

const getChangeClass = (value: number): string => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
};

onMounted(() => {
  loadDashboard();
  loadProtocols();
  loadAnomalies();
});
</script>

<style scoped>
.anomaly-detector {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 5px 0;
  color: #1a1a2e;
}

.subtitle {
  color: #666;
  margin: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #1a1a2e;
}

.health-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.health-card h3 {
  color: white;
}

.health-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: bold;
}

.stat-value.healthy { color: #4ade80; }
.stat-value.warning { color: #fbbf24; }
.stat-value.critical { color: #f87171; }

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.avg-score {
  text-align: center;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.avg-score .score {
  font-size: 24px;
  font-weight: bold;
  margin-left: 10px;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.distribution-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.distribution-item .label {
  color: #666;
}

.distribution-item .value {
  font-weight: 600;
}

.critical-card .protocol-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.protocol-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #fef2f2;
  border-radius: 8px;
}

.protocol-info {
  display: flex;
  flex-direction: column;
}

.protocol-info .name {
  font-weight: 600;
}

.protocol-info .chain {
  font-size: 12px;
  color: #666;
}

.health-score {
  font-weight: bold;
  font-size: 18px;
}

.health-score.critical { color: #ef4444; }
.health-score.warning { color: #f59e0b; }

.empty-state {
  text-align: center;
  color: #666;
  padding: 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  border: none;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab:hover {
  background: #f0f0f0;
}

.tab.active {
  background: #667eea;
  color: white;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.filter-bar select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.protocols-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.protocol-card {
  padding: 15px;
  background: #f9fafb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.protocol-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.protocol-card.healthy { border-color: #4ade80; }
.protocol-card.warning { border-color: #fbbf24; }
.protocol-card.critical { border-color: #f87171; }

.protocol-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.protocol-header .name {
  font-weight: 600;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.healthy { background: #dcfce7; color: #166534; }
.status-badge.warning { background: #fef3c7; color: #92400e; }
.status-badge.critical { background: #fee2e2; color: #991b1b; }

.protocol-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.health-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 5px;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.3s;
}

.health-score {
  text-align: center;
  font-weight: bold;
  color: #666;
}

.anomaly-badge {
  text-align: center;
  font-size: 12px;
  color: #ef4444;
  margin-top: 5px;
}

.anomalies-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.anomaly-item {
  padding: 15px;
  background: #f9fafb;
  border-radius: 10px;
  border-left: 4px solid #ccc;
}

.anomaly-item.low { border-left-color: #22c55e; }
.anomaly-item.medium { border-left-color: #fbbf24; }
.anomaly-item.high { border-left-color: #f97316; }
.anomaly-item.critical { border-left-color: #ef4444; }

.anomaly-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.protocol-name {
  font-weight: 600;
}

.severity-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.severity-badge.low { background: #dcfce7; color: #166534; }
.severity-badge.medium { background: #fef3c7; color: #92400e; }
.severity-badge.high { background: #ffedd5; color: #9a3412; }
.severity-badge.critical { background: #fee2e2; color: #991b1b; }

.anomaly-message {
  margin-bottom: 10px;
  color: #374151;
}

.anomaly-details {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #666;
}

.anomaly-details .positive { color: #22c55e; }
.anomaly-details .negative { color: #ef4444; }

.anomaly-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.metric-card {
  padding: 15px;
  background: #f9fafb;
  border-radius: 10px;
  text-align: center;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #1a1a2e;
}

.metric-change {
  font-size: 14px;
  margin-top: 5px;
}

.metric-change.positive { color: #22c55e; }
.metric-change.negative { color: #ef4444; }
.metric-change.neutral { color: #666; }

.btn-secondary {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #f0f0f0;
}

.anomalies-section h4 {
  margin: 0 0 15px 0;
}

.anomalies-list.compact .anomaly-item {
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
