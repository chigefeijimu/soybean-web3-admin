<template>
  <div class="protocol-health-monitor">
    <div class="header">
      <h2>🛡️ Protocol Health Monitor</h2>
      <div class="actions">
        <button @click="loadOverview" :disabled="loading" class="btn-secondary">
          🔄 Refresh
        </button>
        <button @click="checkAll" :disabled="loading" class="btn-primary">
          {{ checking ? 'Checking...' : 'Check All Protocols' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading protocol health data...</p>
    </div>

    <div v-else-if="overview" class="dashboard-content">
      <!-- Overview Cards -->
      <div class="overview-grid">
        <div class="overview-card total">
          <div class="card-icon">📊</div>
          <div class="card-content">
            <span class="card-label">Total Protocols</span>
            <span class="card-value">{{ overview.totalProtocols }}</span>
          </div>
        </div>

        <div class="overview-card healthy">
          <div class="card-icon">✅</div>
          <div class="card-content">
            <span class="card-label">Healthy</span>
            <span class="card-value">{{ overview.healthyCount }}</span>
          </div>
        </div>

        <div class="overview-card warning">
          <div class="card-icon">⚠️</div>
          <div class="card-content">
            <span class="card-label">Warning</span>
            <span class="card-value">{{ overview.warningCount }}</span>
          </div>
        </div>

        <div class="overview-card critical">
          <div class="card-icon">🚨</div>
          <div class="card-content">
            <span class="card-label">Critical</span>
            <span class="card-value">{{ overview.criticalCount }}</span>
          </div>
        </div>

        <div class="overview-card average">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <span class="card-label">Avg. Health Score</span>
            <span class="card-value">{{ overview.averageHealthScore.toFixed(1) }}</span>
          </div>
        </div>
      </div>

      <!-- Chain Status -->
      <div class="section chain-status">
        <h3>⛓️ Chain Status</h3>
        <div class="chain-grid">
          <div 
            v-for="chain in overview.chainsStatus" 
            :key="chain.chain" 
            class="chain-card"
            @click="selectChain(chain.chain)"
          >
            <div class="chain-header">
              <span class="chain-name">{{ formatChainName(chain.chain) }}</span>
              <span class="protocol-count">{{ chain.protocolCount }} protocols</span>
            </div>
            <div class="chain-stats">
              <span class="stat healthy">✓ {{ chain.healthyCount }}</span>
              <span class="stat warning">⚠ {{ chain.warningCount }}</span>
              <span class="stat critical">🚨 {{ chain.criticalCount }}</span>
            </div>
            <div class="chain-score">
              <span>Avg Score: {{ chain.averageScore.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button 
          :class="['tab', { active: activeTab === 'all' }]"
          @click="activeTab = 'all'"
        >
          All Protocols
        </button>
        <button 
          :class="['tab', { active: activeTab === 'healthy' }]"
          @click="activeTab = 'healthy'"
        >
          ✅ Healthy
        </button>
        <button 
          :class="['tab', { active: activeTab === 'warning' }]"
          @click="activeTab = 'warning'"
        >
          ⚠️ Warning
        </button>
        <button 
          :class="['tab', { active: activeTab === 'critical' }]"
          @click="activeTab = 'critical'"
        >
          🚨 Critical
        </button>
      </div>

      <!-- Protocols List -->
      <div class="section protocols-list">
        <div class="list-header">
          <h3>📋 Protocols</h3>
          <input 
            v-model="searchQuery" 
            placeholder="Search protocols..." 
            class="search-input"
          />
        </div>
        
        <div class="protocols-table">
          <table>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Chain</th>
                <th>Status</th>
                <th>Health Score</th>
                <th>TVL</th>
                <th>24h Change</th>
                <th>Issues</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="protocol in filteredProtocols" :key="protocol.protocolId">
                <td class="protocol-name">
                  {{ protocol.protocolName }}
                </td>
                <td>
                  <span class="chain-badge">{{ formatChainName(protocol.chain) }}</span>
                </td>
                <td>
                  <span :class="['status-badge', protocol.status]">
                    {{ formatStatus(protocol.status) }}
                  </span>
                </td>
                <td>
                  <div class="score-bar">
                    <div 
                      class="score-fill"
                      :class="getScoreClass(protocol.healthScore)"
                      :style="{ width: protocol.healthScore + '%' }"
                    ></div>
                    <span class="score-text">{{ protocol.healthScore }}</span>
                  </div>
                </td>
                <td>${{ formatNumber(protocol.metrics.tvl) }}</td>
                <td :class="protocol.metrics.tvlChange24h >= 0 ? 'positive' : 'negative'">
                  {{ protocol.metrics.tvlChange24h >= 0 ? '+' : '' }}{{ protocol.metrics.tvlChange24h.toFixed(1) }}%
                </td>
                <td>
                  <span v-if="protocol.issues.length > 0" class="issues-count">
                    {{ protocol.issues.length }} issue(s)
                  </span>
                  <span v-else class="no-issues">None</span>
                </td>
                <td>
                  <button @click="viewProtocol(protocol)" class="btn-small">
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Alerts Section -->
      <div class="section alerts-section">
        <h3>🔔 Recent Alerts</h3>
        <div v-if="alerts.length > 0" class="alerts-list">
          <div 
            v-for="alert in alerts.slice(0, 10)" 
            :key="alert.id" 
            :class="['alert-card', alert.issue.severity]"
          >
            <div class="alert-header">
              <span class="alert-protocol">{{ alert.protocolName }}</span>
              <span class="alert-chain">{{ formatChainName(alert.chain) }}</span>
            </div>
            <div class="alert-message">{{ alert.issue.message }}</div>
            <div class="alert-footer">
              <span class="alert-time">{{ formatTime(alert.createdAt) }}</span>
              <div class="alert-actions">
                <button 
                  v-if="!alert.acknowledged" 
                  @click="acknowledgeAlert(alert.id)"
                  class="btn-small"
                >
                  Acknowledge
                </button>
                <button 
                  v-if="!alert.resolvedAt" 
                  @click="resolveAlert(alert.id)"
                  class="btn-small"
                >
                  Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-alerts">
          <p>No alerts at this time</p>
        </div>
      </div>
    </div>

    <!-- Protocol Detail Modal -->
    <div v-if="selectedProtocol" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedProtocol.protocol.protocolName }}</h3>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-content">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Status</span>
              <span :class="['status-badge', selectedProtocol.protocol.status]">
                {{ formatStatus(selectedProtocol.protocol.status) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Health Score</span>
              <span class="value">{{ selectedProtocol.protocol.healthScore }}/100</span>
            </div>
            <div class="detail-item">
              <span class="label">Chain</span>
              <span class="value">{{ formatChainName(selectedProtocol.protocol.chain) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Last Check</span>
              <span class="value">{{ formatTime(selectedProtocol.protocol.lastCheck) }}</span>
            </div>
          </div>

          <div class="metrics-section">
            <h4>📊 Metrics</h4>
            <div class="metrics-grid">
              <div class="metric">
                <span class="metric-label">TVL</span>
                <span class="metric-value">${{ formatNumber(selectedProtocol.protocol.metrics.tvl) }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">24h Change</span>
                <span :class="selectedProtocol.protocol.metrics.tvlChange24h >= 0 ? 'positive' : 'negative'">
                  {{ selectedProtocol.protocol.metrics.tvlChange24h >= 0 ? '+' : '' }}{{ selectedProtocol.protocol.metrics.tvlChange24h.toFixed(1) }}%
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">7d Change</span>
                <span :class="selectedProtocol.protocol.metrics.tvlChange7d >= 0 ? 'positive' : 'negative'">
                  {{ selectedProtocol.protocol.metrics.tvlChange7d >= 0 ? '+' : '' }}{{ selectedProtocol.protocol.metrics.tvlChange7d.toFixed(1) }}%
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">24h Volume</span>
                <span class="metric-value">${{ formatNumber(selectedProtocol.protocol.metrics.volume24h) }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Avg APR</span>
                <span class="metric-value">{{ selectedProtocol.protocol.metrics.averageApr.toFixed(2) }}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Users</span>
                <span class="metric-value">{{ formatNumber(selectedProtocol.protocol.metrics.userCount) }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedProtocol.protocol.issues.length > 0" class="issues-section">
            <h4>⚠️ Issues</h4>
            <div class="issues-list">
              <div 
                v-for="(issue, idx) in selectedProtocol.protocol.issues" 
                :key="idx"
                :class="['issue-item', issue.severity]"
              >
                <span class="issue-type">{{ formatIssueType(issue.issueType) }}</span>
                <span class="issue-message">{{ issue.message }}</span>
                <span :class="['issue-severity', issue.severity]">{{ issue.severity }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedProtocol.recommendations.length > 0" class="recommendations-section">
            <h4>💡 Recommendations</h4>
            <ul class="recommendations-list">
              <li v-for="(rec, idx) in selectedProtocol.recommendations" :key="idx">
                {{ rec }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  getHealthOverview, 
  getAllProtocols, 
  checkAllProtocols, 
  getAlerts,
  acknowledgeAlert as ackAlert,
  resolveAlert as resAlert,
  getProtocolHealth
} from '@/service/protocolHealthMonitor';

const loading = ref(false);
const checking = ref(false);
const overview = ref<any>(null);
const protocols = ref<any[]>([]);
const alerts = ref<any[]>([]);
const activeTab = ref('all');
const searchQuery = ref('');
const selectedProtocol = ref<any>(null);

const filteredProtocols = computed(() => {
  let filtered = protocols.value;
  
  // Filter by tab
  if (activeTab.value !== 'all') {
    filtered = filtered.filter(p => p.status === activeTab.value);
  }
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(p => 
      p.protocolName.toLowerCase().includes(query) ||
      p.chain.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

const loadOverview = async () => {
  loading.value = true;
  try {
    const [overviewRes, protocolsRes, alertsRes] = await Promise.all([
      getHealthOverview(),
      getAllProtocols(),
      getAlerts()
    ]);
    
    overview.value = overviewRes.data.data;
    protocols.value = protocolsRes.data.data;
    alerts.value = alertsRes.data.data;
  } catch (error) {
    console.error('Failed to load overview:', error);
  } finally {
    loading.value = false;
  }
};

const checkAll = async () => {
  checking.value = true;
  try {
    const res = await checkAllProtocols();
    protocols.value = res.data.data;
    await loadOverview();
  } catch (error) {
    console.error('Failed to check protocols:', error);
  } finally {
    checking.value = false;
  }
};

const selectChain = async (chain: string) => {
  activeTab.value = 'all';
  searchQuery.value = chain;
};

const viewProtocol = async (protocol: any) => {
  try {
    const res = await getProtocolHealth(protocol.protocolId);
    selectedProtocol.value = res.data.data;
  } catch (error) {
    console.error('Failed to load protocol details:', error);
  }
};

const closeModal = () => {
  selectedProtocol.value = null;
};

const acknowledgeAlert = async (alertId: string) => {
  try {
    await ackAlert(alertId);
    await loadOverview();
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
  }
};

const resolveAlert = async (alertId: string) => {
  try {
    await resAlert(alertId);
    await loadOverview();
  } catch (error) {
    console.error('Failed to resolve alert:', error);
  }
};

const formatChainName = (chain: string) => {
  const names: Record<string, string> = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    bsc: 'BSC',
    base: 'Base',
    avalanche: 'Avalanche'
  };
  return names[chain] || chain;
};

const formatStatus = (status: string) => {
  const labels: Record<string, string> = {
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
    unknown: 'Unknown'
  };
  return labels[status] || status;
};

const formatIssueType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getScoreClass = (score: number) => {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  if (score >= 30) return 'low';
  return 'critical';
};

const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

onMounted(() => {
  loadOverview();
});
</script>

<style scoped>
.protocol-health-monitor {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.actions {
  display: flex;
  gap: 12px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Overview Cards */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.overview-card.total { border-left: 4px solid #3498db; }
.overview-card.healthy { border-left: 4px solid #27ae60; }
.overview-card.warning { border-left: 4px solid #f39c12; }
.overview-card.critical { border-left: 4px solid #e74c3c; }
.overview-card.average { border-left: 4px solid #9b59b6; }

.card-icon {
  font-size: 28px;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 12px;
  color: #666;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
}

/* Sections */
.section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

/* Chain Status */
.chain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.chain-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.chain-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.chain-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.chain-name {
  font-weight: 600;
}

.protocol-count {
  font-size: 12px;
  color: #666;
}

.chain-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.chain-stats .stat {
  font-size: 12px;
}

.chain-stats .healthy { color: #27ae60; }
.chain-stats .warning { color: #f39c12; }
.chain-stats .critical { color: #e74c3c; }

.chain-score {
  font-size: 12px;
  color: #666;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tab {
  padding: 10px 20px;
  border: none;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.tab.active {
  background: #3498db;
  color: white;
}

.tab:hover:not(.active) {
  background: #f0f0f0;
}

/* Protocols Table */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h3 {
  margin: 0;
}

.search-input {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: 250px;
}

.protocols-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 600;
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
}

.protocol-name {
  font-weight: 500;
}

.chain-badge {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.healthy { background: #d4edda; color: #155724; }
.status-badge.warning { background: #fff3cd; color: #856404; }
.status-badge.critical { background: #f8d7da; color: #721c24; }
.status-badge.unknown { background: #e2e3e5; color: #383d41; }

.score-bar {
  position: relative;
  width: 100px;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.score-fill {
  position: absolute;
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s;
}

.score-fill.high { background: #27ae60; }
.score-fill.medium { background: #f39c12; }
.score-fill.low { background: #e67e22; }
.score-fill.critical { background: #e74c3c; }

.score-text {
  position: absolute;
  width: 100%;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
}

.positive { color: #27ae60; }
.negative { color: #e74c3c; }

.issues-count {
  color: #e74c3c;
  font-weight: 500;
}

.no-issues {
  color: #27ae60;
}

/* Alerts */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #ccc;
}

.alert-card.critical { border-left-color: #e74c3c; }
.alert-card.high { border-left-color: #e67e22; }
.alert-card.medium { border-left-color: #f39c12; }
.alert-card.low { border-left-color: #3498db; }

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.alert-protocol {
  font-weight: 600;
}

.alert-chain {
  font-size: 12px;
  color: #666;
}

.alert-message {
  margin-bottom: 8px;
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-time {
  font-size: 12px;
  color: #666;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.no-alerts {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* Buttons */
.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-small {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: #3498db;
  color: white;
}

.btn-small:hover {
  background: #2980b9;
}

.btn-primary:disabled, .btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.modal-content {
  padding: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  font-size: 12px;
  color: #666;
}

.detail-item .value {
  font-size: 16px;
  font-weight: 500;
}

.metrics-section, .issues-section, .recommendations-section {
  margin-bottom: 24px;
}

.metrics-section h4, .issues-section h4, .recommendations-section h4 {
  margin: 0 0 12px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 12px;
  color: #666;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.issue-type {
  font-weight: 600;
  font-size: 12px;
}

.issue-message {
  flex: 1;
}

.issue-severity {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.issue-severity.critical { background: #f8d7da; color: #721c24; }
.issue-severity.high { background: #ffe5d0; color: #8a4b1f; }
.issue-severity.medium { background: #fff3cd; color: #856404; }
.issue-severity.low { background: #d1ecf1; color: #0c5460; }

.recommendations-list {
  padding-left: 20px;
}

.recommendations-list li {
  margin-bottom: 8px;
}
</style>
