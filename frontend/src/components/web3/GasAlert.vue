<template>
  <div class="gas-alert-container">
    <div class="header">
      <h2>⛽ Gas Price Alert</h2>
      <div class="header-actions">
        <button @click="refreshAlerts" class="btn-refresh" :disabled="loading">
          {{ loading ? '⏳' : '🔄' }} Refresh
        </button>
        <button @click="showCreateModal = true" class="btn-create">
          ➕ Create Alert
        </button>
      </div>
    </div>

    <!-- Status Overview -->
    <div class="status-cards">
      <div class="status-card">
        <span class="label">Total Alerts</span>
        <span class="value">{{ status?.totalAlerts || 0 }}</span>
      </div>
      <div class="status-card active">
        <span class="label">Active</span>
        <span class="value">{{ status?.activeAlerts || 0 }}</span>
      </div>
      <div class="status-card triggered">
        <span class="label">Triggered Today</span>
        <span class="value">{{ status?.triggeredToday || 0 }}</span>
      </div>
    </div>

    <!-- Current Gas Prices -->
    <div class="gas-prices-section">
      <h3>📊 Current Gas Prices (Gwei)</h3>
      <div class="gas-prices-grid">
        <div v-for="gas in gasPrices" :key="gas.chainId" class="gas-price-card">
          <div class="chain-name">{{ getChainName(gas.chainId) }}</div>
          <div class="price-row">
            <span class="speed slow">🐢 {{ gas.slow?.toFixed(1) || '-' }}</span>
            <span class="speed normal">🚶 {{ gas.normal?.toFixed(1) || '-' }}</span>
            <span class="speed fast">🚀 {{ gas.fast?.toFixed(1) || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts List -->
    <div class="alerts-section">
      <h3>🔔 Your Alerts</h3>
      <div v-if="alerts.length === 0" class="empty-state">
        No alerts configured. Create one to get notified when gas prices change!
      </div>
      <div v-else class="alerts-list">
        <div v-for="alert in alerts" :key="alert.id" class="alert-card" :class="{ triggered: alert.triggered, disabled: !alert.enabled }">
          <div class="alert-info">
            <div class="chain-badge">{{ getChainName(alert.chainId) }}</div>
            <div class="alert-condition">
              <span v-if="alert.direction === 'below'">⬇️ Below {{ alert.targetGasPrice }} Gwei</span>
              <span v-else>⬆️ Above {{ alert.targetGasPrice }} Gwei</span>
            </div>
            <div class="alert-time">
              Created: {{ formatDate(alert.createdAt) }}
              <span v-if="alert.triggeredAt" class="triggered-time">
                | Triggered: {{ formatDate(alert.triggeredAt) }}
              </span>
            </div>
          </div>
          <div class="alert-actions">
            <button @click="toggleAlert(alert)" class="btn-toggle" :class="{ active: alert.enabled }">
              {{ alert.enabled ? '✅' : '⏸️' }}
            </button>
            <button @click="deleteAlert(alert.id)" class="btn-delete">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <h3>Create Gas Alert</h3>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="newAlert.chainId">
            <option :value="1">Ethereum</option>
            <option :value="137">Polygon</option>
            <option :value="42161">Arbitrum</option>
            <option :value="10">Optimism</option>
            <option :value="56">BSC</option>
          </select>
        </div>
        <div class="form-group">
          <label>Alert when gas is</label>
          <select v-model="newAlert.direction">
            <option value="below">Below</option>
            <option value="above">Above</option>
          </select>
        </div>
        <div class="form-group">
          <label>Target Gas Price (Gwei)</label>
          <input type="number" v-model="newAlert.targetGasPrice" placeholder="e.g., 30" min="1" />
        </div>
        <div class="suggestions">
          <span>Quick select:</span>
          <button @click="newAlert.targetGasPrice = 20">20</button>
          <button @click="newAlert.targetGasPrice = 30">30</button>
          <button @click="newAlert.targetGasPrice = 50">50</button>
          <button @click="newAlert.targetGasPrice = 100">100</button>
        </div>
        <div class="modal-actions">
          <button @click="showCreateModal = false" class="btn-cancel">Cancel</button>
          <button @click="createAlert" class="btn-submit" :disabled="!newAlert.targetGasPrice">
            Create Alert
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface GasAlert {
  id: string;
  chainId: number;
  targetGasPrice: number;
  direction: 'below' | 'above';
  enabled: boolean;
  triggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

interface GasPrice {
  chainId: number;
  slow?: number;
  normal?: number;
  fast?: number;
  standard?: number;
}

const API_BASE = '/api/web3';

const loading = ref(false);
const alerts = ref<GasAlert[]>([]);
const gasPrices = ref<GasPrice[]>([]);
const status = ref<any>(null);
const showCreateModal = ref(false);
const newAlert = ref({
  chainId: 1,
  direction: 'below' as 'below' | 'above',
  targetGasPrice: 30,
});

let refreshInterval: number;

const chainNames: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  56: 'BSC',
  8453: 'Base',
  43114: 'Avalanche',
};

const getChainName = (chainId: number) => chainNames[chainId] || `Chain ${chainId}`;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

const fetchAlerts = async () => {
  try {
    const res = await fetch(`${API_BASE}/gas-alert/list`);
    alerts.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch alerts:', e);
  }
};

const fetchStatus = async () => {
  try {
    const res = await fetch(`${API_BASE}/gas-alert/status`);
    status.value = await res.json();
    gasPrices.value = status.value?.gasPrices || [];
  } catch (e) {
    console.error('Failed to fetch status:', e);
  }
};

const refreshAlerts = async () => {
  loading.value = true;
  await Promise.all([fetchAlerts(), fetchStatus()]);
  loading.value = false;
};

const createAlert = async () => {
  try {
    const res = await fetch(`${API_BASE}/gas-alert/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAlert.value),
    });
    const created = await res.json();
    alerts.value.push(created);
    showCreateModal.value = false;
    newAlert.value = {
      chainId: 1,
      direction: 'below',
      targetGasPrice: 30,
    };
  } catch (e) {
    console.error('Failed to create alert:', e);
  }
};

const toggleAlert = async (alert: GasAlert) => {
  try {
    const res = await fetch(`${API_BASE}/gas-alert/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: alert.id, enabled: !alert.enabled }),
    });
    const updated = await res.json();
    const idx = alerts.value.findIndex((a) => a.id === alert.id);
    if (idx >= 0) alerts.value[idx] = updated;
  } catch (e) {
    console.error('Failed to toggle alert:', e);
  }
};

const deleteAlert = async (id: string) => {
  try {
    await fetch(`${API_BASE}/gas-alert/delete?id=${id}`, { method: 'DELETE' });
    alerts.value = alerts.value.filter((a) => a.id !== id);
  } catch (e) {
    console.error('Failed to delete alert:', e);
  }
};

onMounted(() => {
  refreshAlerts();
  refreshInterval = window.setInterval(refreshAlerts, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.gas-alert-container {
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

.header h2 {
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-refresh, .btn-create {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh {
  background: #f0f0f0;
  color: #333;
}

.btn-create {
  background: #4CAF50;
  color: white;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.status-card {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.status-card.active {
  background: #e8f5e9;
  border: 1px solid #4CAF50;
}

.status-card.triggered {
  background: #fff3e0;
  border: 1px solid #ff9800;
}

.status-card .label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.status-card .value {
  font-size: 24px;
  font-weight: bold;
}

.gas-prices-section {
  margin-bottom: 20px;
}

.gas-prices-section h3 {
  margin-bottom: 10px;
}

.gas-prices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.gas-price-card {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
}

.chain-name {
  font-weight: bold;
  margin-bottom: 8px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.speed.slow { color: #4caf50; }
.speed.normal { color: #ff9800; }
.speed.fast { color: #f44336; }

.alerts-section h3 {
  margin-bottom: 10px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 8px;
}

.alert-card.triggered {
  background: #fff8e1;
  border-color: #ffc107;
}

.alert-card.disabled {
  opacity: 0.6;
}

.alert-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.chain-badge {
  display: inline-block;
  background: #e3f2fd;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  width: fit-content;
}

.alert-condition {
  font-size: 16px;
  font-weight: 500;
}

.alert-time {
  font-size: 12px;
  color: #999;
}

.triggered-time {
  color: #ff9800;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.btn-toggle, .btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
}

.btn-toggle.active {
  background: #e8f5e9;
  border-radius: 4px;
}

/* Modal */
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
  padding: 24px;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
}

.modal h3 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.suggestions {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.suggestions button {
  padding: 4px 12px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.btn-submit {
  padding: 8px 16px;
  border: none;
  background: #4CAF50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
