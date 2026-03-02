<template>
  <div class="defi-alerts">
    <div class="header">
      <h3>🚨 DeFi Protocol Alerts</h3>
      <button @click="refresh" :disabled="loading" class="refresh-btn">
        {{ loading ? '⟳' : '🔄' }}
      </button>
    </div>

    <!-- Dashboard Stats -->
    <div class="stats-grid" v-if="dashboard">
      <div class="stat-card">
        <div class="stat-label">Active Alerts</div>
        <div class="stat-value">{{ dashboard.alertStats?.active || 0 }}</div>
      </div>
      <div class="stat-card critical">
        <div class="stat-label">Critical</div>
        <div class="stat-value">{{ dashboard.alertStats?.critical || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monitored Protocols</div>
        <div class="stat-value">{{ dashboard.monitoredProtocols || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Alerts</div>
        <div class="stat-value">{{ dashboard.alertStats?.total || 0 }}</div>
      </div>
    </div>

    <!-- Alert Type Filter -->
    <div class="filters">
      <select v-model="filterType" @change="loadAlerts">
        <option value="">All Types</option>
        <option value="liquidation">Liquidation</option>
        <option value="tvl_change">TVL Change</option>
        <option value="yield_anomaly">Yield Anomaly</option>
        <option value="volatility">Volatility</option>
        <option value="security">Security</option>
      </select>
      <select v-model="filterStatus" @change="loadAlerts">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="acknowledged">Acknowledged</option>
        <option value="resolved">Resolved</option>
      </select>
    </div>

    <!-- Alerts List -->
    <div class="alerts-list">
      <div 
        v-for="alert in alerts" 
        :key="alert.id" 
        class="alert-item"
        :class="[alert.severity, alert.status]"
      >
        <div class="alert-header">
          <span class="severity-badge" :class="alert.severity">{{ alert.severity }}</span>
          <span class="alert-type">{{ formatType(alert.type) }}</span>
          <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
        </div>
        <div class="alert-title">{{ alert.title }}</div>
        <div class="alert-desc">{{ alert.description }}</div>
        <div class="alert-meta">
          <span class="protocol">{{ alert.protocol }}</span>
          <span class="chain">{{ alert.chain }}</span>
          <span v-if="alert.valueChange" class="change" :class="alert.valueChange > 0 ? 'up' : 'down'">
            {{ alert.valueChange > 0 ? '+' : '' }}{{ alert.valueChange.toFixed(2) }}%
          </span>
        </div>
        <div class="alert-actions">
          <button v-if="alert.status === 'active'" @click="acknowledgeAlert(alert.id)" class="btn-ack">
            ✓ Acknowledge
          </button>
          <span class="status-badge" :class="alert.status">{{ alert.status }}</span>
        </div>
      </div>
    </div>

    <!-- Liquidation Events -->
    <div class="section">
      <h4>💥 Recent Liquidation Events</h4>
      <div class="events-table">
        <table>
          <thead>
            <tr>
              <th>Protocol</th>
              <th>Collateral</th>
              <th>Debt Repaid</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in liquidations" :key="event.id">
              <td>{{ event.protocol }}</td>
              <td>{{ event.collateralAmount }} {{ event.collateralType }}</td>
              <td class="amount">${{ Number(event.debtRepaid).toLocaleString() }}</td>
              <td>{{ formatTime(event.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TVL Changes -->
    <div class="section">
      <h4>📊 TVL Changes (>10%)</h4>
      <div class="tvl-changes">
        <div v-for="change in tvlChanges" :key="change.protocol" class="tvl-item" :class="change.direction">
          <span class="protocol-name">{{ change.protocol }}</span>
          <span class="chain">{{ change.chain }}</span>
          <span class="change-value" :class="change.direction">
            {{ change.tvlChange24h > 0 ? '+' : '' }}{{ change.tvlChange24h.toFixed(2) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Yield Anomalies -->
    <div class="section">
      <h4>🌾 Yield Anomalies</h4>
      <div class="yield-anomalies">
        <div v-for="anomaly in yieldAnomalies" :key="anomaly.protocol" class="yield-item">
          <div class="yield-header">
            <span class="protocol-name">{{ anomaly.protocol }}</span>
            <span class="severity-badge" :class="anomaly.severity">{{ anomaly.severity }}</span>
          </div>
          <div class="yield-value" :class="anomaly.direction">
            {{ anomaly.yieldChange24h > 0 ? '+' : '' }}{{ anomaly.yieldChange24h.toFixed(1) }}%
          </div>
          <div class="yield-reasons">
            <span v-for="reason in anomaly.possibleReasons" :key="reason" class="reason-tag">
              {{ reason }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Configuration -->
    <div class="section">
      <h4>⚙️ Alert Configuration</h4>
      <div class="config-form">
        <select v-model="newConfig.alertType">
          <option value="liquidation">Liquidation</option>
          <option value="tvl_change">TVL Change</option>
          <option value="yield_anomaly">Yield Anomaly</option>
          <option value="volatility">Volatility</option>
          <option value="security">Security</option>
        </select>
        <input v-model.number="newConfig.threshold" type="number" placeholder="Threshold" />
        <label>
          <input v-model="newConfig.notifyEmail" type="checkbox" />
          Email
        </label>
        <label>
          <input v-model="newConfig.notifyTelegram" type="checkbox" />
          Telegram
        </label>
        <button @click="createConfig" class="btn-create">Create Alert</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  getAlertsDashboard, 
  getDefiAlerts, 
  acknowledgeAlert as ackAlert,
  createAlertConfig,
  getLiquidationEvents,
  getTVLChanges,
  getYieldAnomalies,
  type DefiAlert,
  type AlertConfig
} from '@/service/api/web3';

const loading = ref(false);
const dashboard = ref<any>(null);
const alerts = ref<DefiAlert[]>([]);
const liquidations = ref<any[]>([]);
const tvlChanges = ref<any[]>([]);
const yieldAnomalies = ref<any[]>([]);
const alertConfigs = ref<AlertConfig[]>([]);

const filterType = ref('');
const filterStatus = ref('');

const newConfig = ref<Partial<AlertConfig>>({
  alertType: 'liquidation',
  threshold: 10000,
  notifyEmail: true,
  notifyTelegram: false
});

onMounted(async () => {
  await loadDashboard();
  await loadAlerts();
  await loadLiquidationEvents();
  await loadTVLChanges();
  await loadYieldAnomalies();
});

async function refresh() {
  await loadDashboard();
  await loadAlerts();
}

async function loadDashboard() {
  try {
    dashboard.value = await getAlertsDashboard();
  } catch (e) {
    console.error('Failed to load dashboard:', e);
  }
}

async function loadAlerts() {
  loading.value = true;
  try {
    alerts.value = await getDefiAlerts({
      type: filterType.value || undefined,
      status: filterStatus.value || undefined
    });
  } catch (e) {
    console.error('Failed to load alerts:', e);
  }
  loading.value = false;
}

async function loadLiquidationEvents() {
  try {
    liquidations.value = await getLiquidationEvents(10000);
  } catch (e) {
    console.error('Failed to load liquidations:', e);
  }
}

async function loadTVLChanges() {
  try {
    tvlChanges.value = await getTVLChanges(10);
  } catch (e) {
    console.error('Failed to load TVL changes:', e);
  }
}

async function loadYieldAnomalies() {
  try {
    yieldAnomalies.value = await getYieldAnomalies();
  } catch (e) {
    console.error('Failed to load yield anomalies:', e);
  }
}

async function acknowledgeAlert(id: string) {
  try {
    await ackAlert(id);
    await loadAlerts();
    await loadDashboard();
  } catch (e) {
    console.error('Failed to acknowledge alert:', e);
  }
}

async function createConfig() {
  try {
    await createAlertConfig(newConfig.value as AlertConfig);
    newConfig.value = {
      alertType: 'liquidation',
      threshold: 10000,
      notifyEmail: true,
      notifyTelegram: false
    };
    alert('Alert config created!');
  } catch (e) {
    console.error('Failed to create config:', e);
  }
}

function formatType(type: string): string {
  const types: Record<string, string> = {
    liquidation: 'Liquidation',
    tvl_change: 'TVL Change',
    yield_anomaly: 'Yield Anomaly',
    volatility: 'Volatility',
    security: 'Security'
  };
  return types[type] || type;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
</script>

<style scoped>
.defi-alerts {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h3 {
  margin: 0;
  font-size: 1.5rem;
}

.refresh-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.refresh-btn:disabled {
  opacity: 0.5;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #1e293b;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-card.critical {
  border: 1px solid #ef4444;
}

.stat-label {
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #f8fafc;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filters select {
  padding: 8px 12px;
  border-radius: 6px;
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #334155;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.alert-item {
  background: #1e293b;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
}

.alert-item.critical { border-left-color: #ef4444; }
.alert-item.high { border-left-color: #f97316; }
.alert-item.medium { border-left-color: #eab308; }
.alert-item.low { border-left-color: #22c55e; }

.alert-item.resolved {
  opacity: 0.6;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.severity-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.severity-badge.critical { background: #ef4444; color: white; }
.severity-badge.high { background: #f97316; color: white; }
.severity-badge.medium { background: #eab308; color: black; }
.severity-badge.low { background: #22c55e; color: white; }

.alert-type {
  color: #94a3b8;
  font-size: 0.875rem;
}

.alert-time {
  margin-left: auto;
  color: #64748b;
  font-size: 0.75rem;
}

.alert-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.alert-desc {
  color: #cbd5e1;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.alert-meta {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: #94a3b8;
}

.change.up { color: #22c55e; }
.change.down { color: #ef4444; }

.alert-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.btn-ack {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.status-badge.active { background: #22c55e; color: white; }
.status-badge.acknowledged { background: #eab308; color: black; }
.status-badge.resolved { background: #64748b; color: white; }

.section {
  margin-bottom: 24px;
}

.section h4 {
  margin-bottom: 12px;
  color: #f8fafc;
}

.events-table {
  overflow-x: auto;
}

.events-table table {
  width: 100%;
  border-collapse: collapse;
}

.events-table th,
.events-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #334155;
}

.events-table th {
  background: #1e293b;
  color: #94a3b8;
}

.amount {
  color: #ef4444;
  font-weight: bold;
}

.tvl-changes,
.yield-anomalies {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tvl-item,
.yield-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1e293b;
  border-radius: 6px;
}

.tvl-item.up { border-left: 3px solid #22c55e; }
.tvl-item.down { border-left: 3px solid #ef4444; }

.protocol-name {
  font-weight: bold;
}

.change-value.up { color: #22c55e; }
.change-value.down { color: #ef4444; }

.yield-value.up { color: #22c55e; font-size: 1.25rem; font-weight: bold; }
.yield-value.down { color: #ef4444; font-size: 1.25rem; font-weight: bold; }

.yield-reasons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.reason-tag {
  background: #334155;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.config-form {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.config-form select,
.config-form input[type="number"] {
  padding: 8px 12px;
  border-radius: 6px;
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #334155;
}

.btn-create {
  background: #22c55e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
