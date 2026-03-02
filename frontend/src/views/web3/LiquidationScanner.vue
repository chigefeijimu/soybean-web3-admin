<template>
  <div class="liquidation-scanner">
    <div class="header">
      <h1>🔍 DeFi Liquidation Scanner</h1>
      <p class="subtitle">Monitor DeFi positions for liquidation opportunities</p>
    </div>

    <!-- Stats Overview -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card danger">
        <div class="stat-label">Total Value at Risk</div>
        <div class="stat-value">${{ formatNumber(stats.totalValueAtRisk) }}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">Liquidation Value</div>
        <div class="stat-value">${{ formatNumber(stats.totalLiquidationValue) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Positions</div>
        <div class="stat-value">{{ stats.activePositions }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Health Factor</div>
        <div class="stat-value">{{ stats.avgHealthFactor?.toFixed(2) }}</div>
      </div>
    </div>

    <!-- Chain/Protocol Filters -->
    <div class="filters">
      <select v-model="selectedChain" @change="loadOpportunities">
        <option value="">All Chains</option>
        <option v-for="chain in chains" :key="chain.name" :value="chain.name">
          {{ chain.name.toUpperCase() }}
        </option>
      </select>
      <select v-model="selectedProtocol" @change="loadOpportunities">
        <option value="">All Protocols</option>
        <option v-for="protocol in protocols" :key="protocol.name" :value="protocol.name">
          {{ protocol.name }} ({{ protocol.chain }})
        </option>
      </select>
      <button class="btn-refresh" @click="refresh">🔄 Refresh</button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="['tab', { active: activeTab === 'opportunities' }]"
        @click="activeTab = 'opportunities'"
      >
        💰 Opportunities ({{ opportunities.length }})
      </button>
      <button 
        :class="['tab', { active: activeTab === 'positions' }]"
        @click="activeTab = 'positions'"
      >
        📊 Positions ({{ positions.length }})
      </button>
      <button 
        :class="['tab', { active: activeTab === 'alerts' }]"
        @click="activeTab = 'alerts'"
      >
        🔔 Alerts ({{ alerts.length }})
      </button>
    </div>

    <!-- Opportunities Tab -->
    <div v-if="activeTab === 'opportunities'" class="tab-content">
      <div v-if="opportunities.length === 0" class="empty-state">
        No liquidation opportunities found
      </div>
      <div v-else class="opportunities-grid">
        <div v-for="opp in opportunities" :key="opp.id" class="opportunity-card">
          <div class="opp-header">
            <span class="protocol-badge">{{ opp.protocol }}</span>
            <span class="chain-badge">{{ opp.chain.toUpperCase() }}</span>
          </div>
          <div class="opp-address">
            {{ formatAddress(opp.address) }}
          </div>
          <div class="opp-details">
            <div class="detail-row">
              <span>Collateral:</span>
              <span>${{ formatNumber(opp.collateralValueUsd) }}</span>
            </div>
            <div class="detail-row">
              <span>Debt:</span>
              <span>${{ formatNumber(opp.debtValueUsd) }}</span>
            </div>
            <div class="detail-row">
              <span>Health Factor:</span>
              <span :class="['health-value', getHealthClass(opp.healthFactor)]">
                {{ opp.healthFactor.toFixed(2) }}
              </span>
            </div>
            <div class="detail-row">
              <span>Liquidation Incentive:</span>
              <span class="incentive">{{ opp.liquidationIncentive.toFixed(1) }}%</span>
            </div>
          </div>
          <div class="opp-profit">
            <div class="profit-label">Est. Profit</div>
            <div :class="['profit-value', opp.estimatedProfit > 0 ? 'positive' : 'negative']">
              ${{ formatNumber(opp.estimatedProfit) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Positions Tab -->
    <div v-if="activeTab === 'positions'" class="tab-content">
      <div v-if="positions.length === 0" class="empty-state">
        No positions found
      </div>
      <div v-else class="positions-table">
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Protocol</th>
              <th>Chain</th>
              <th>Health Factor</th>
              <th>Status</th>
              <th>Collateral</th>
              <th>Debt</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pos in positions" :key="pos.address">
              <td class="address-cell">{{ formatAddress(pos.address) }}</td>
              <td>{{ pos.protocol }}</td>
              <td>{{ pos.chain.toUpperCase() }}</td>
              <td :class="['health-cell', getHealthClass(pos.healthFactor)]">
                {{ pos.healthFactor.toFixed(2) }}
              </td>
              <td>
                <span :class="['status-badge', pos.status]">
                  {{ pos.status }}
                </span>
              </td>
              <td>${{ formatNumber(pos.collateral.reduce((s, c) => s + c.valueUsd, 0)) }}</td>
              <td>${{ formatNumber(pos.debt.reduce((s, d) => s + d.valueUsd, 0)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Alerts Tab -->
    <div v-if="activeTab === 'alerts'" class="tab-content">
      <div v-if="alerts.length === 0" class="empty-state">
        No alerts
      </div>
      <div v-else class="alerts-list">
        <div v-for="alert in alerts" :key="alert.id" :class="['alert-item', alert.severity]">
          <div class="alert-header">
            <span :class="['alert-type', alert.type]">{{ formatAlertType(alert.type) }}</span>
            <span :class="['severity-badge', alert.severity]">{{ alert.severity }}</span>
          </div>
          <div class="alert-message">{{ alert.message }}</div>
          <div class="alert-meta">
            <span>{{ alert.protocol }}</span> • 
            <span>{{ alert.chain.toUpperCase() }}</span> • 
            <span>{{ formatTime(alert.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface LiquidationOpportunity {
  id: string;
  address: string;
  protocol: string;
  chain: string;
  collateralValueUsd: number;
  debtValueUsd: number;
  healthFactor: number;
  liquidationIncentive: number;
  estimatedProfit: number;
}

interface PositionHealth {
  address: string;
  protocol: string;
  chain: string;
  healthFactor: number;
  status: string;
  collateral: { token: string; valueUsd: number }[];
  debt: { token: string; valueUsd: number }[];
}

interface LiquidationAlert {
  id: string;
  type: string;
  address: string;
  protocol: string;
  chain: string;
  severity: string;
  message: string;
  timestamp: number;
}

interface Stats {
  totalValueAtRisk: number;
  totalLiquidationValue: number;
  activePositions: number;
  avgHealthFactor: number;
}

const activeTab = ref('opportunities');
const selectedChain = ref('');
const selectedProtocol = ref('');
const opportunities = ref<LiquidationOpportunity[]>([]);
const positions = ref<PositionHealth[]>([]);
const alerts = ref<LiquidationAlert[]>([]);
const stats = ref<Stats | null>(null);
const chains = ref<{ name: string }[]>([]);
const protocols = ref<{ name: string; chain: string }[]>([]);

const API_BASE = '/api/web3';

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/liquidation-scanner/stats`);
    stats.value = await res.json();
  } catch (e) {
    console.error('Failed to load stats', e);
  }
}

async function loadOpportunities() {
  try {
    const params = new URLSearchParams();
    if (selectedChain.value) params.append('chain', selectedChain.value);
    if (selectedProtocol.value) params.append('protocol', selectedProtocol.value);
    const res = await fetch(`${API_BASE}/liquidation-scanner/opportunities?${params}`);
    opportunities.value = await res.json();
  } catch (e) {
    console.error('Failed to load opportunities', e);
  }
}

async function loadPositions() {
  try {
    const res = await fetch(`${API_BASE}/liquidation-scanner/positions`);
    positions.value = await res.json();
  } catch (e) {
    console.error('Failed to load positions', e);
  }
}

async function loadAlerts() {
  try {
    const res = await fetch(`${API_BASE}/liquidation-scanner/alerts?limit=20`);
    alerts.value = await res.json();
  } catch (e) {
    console.error('Failed to load alerts', e);
  }
}

async function loadChains() {
  try {
    const res = await fetch(`${API_BASE}/liquidation-scanner/chains`);
    chains.value = await res.json();
  } catch (e) {
    console.error('Failed to load chains', e);
  }
}

async function loadProtocols() {
  try {
    const res = await fetch(`${API_BASE}/liquidation-scanner/protocols`);
    protocols.value = await res.json();
  } catch (e) {
    console.error('Failed to load protocols', e);
  }
}

async function refresh() {
  await Promise.all([
    loadStats(),
    loadOpportunities(),
    loadPositions(),
    loadAlerts(),
  ]);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
}

function formatAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString();
}

function formatAlertType(type: string): string {
  const types: Record<string, string> = {
    liquidation: '⚠️ Liquidation',
    margin_call: '📉 Margin Call',
    health_warning: '🔔 Health Warning',
    position_closed: '✅ Position Closed',
  };
  return types[type] || type;
}

function getHealthClass(hf: number): string {
  if (hf < 1) return 'critical';
  if (hf < 1.25) return 'danger';
  if (hf < 1.5) return 'warning';
  return 'healthy';
}

onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadOpportunities(),
    loadPositions(),
    loadAlerts(),
    loadChains(),
    loadProtocols(),
  ]);
});
</script>

<style scoped>
.liquidation-scanner {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #1a1a2e;
}

.subtitle {
  color: #666;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-card.danger {
  border-left: 4px solid #ff4757;
}

.stat-card.warning {
  border-left: 4px solid #ffa502;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filters select {
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
}

.btn-refresh {
  padding: 10px 20px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh:hover {
  background: #4338ca;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 12px;
}

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-radius: 8px;
}

.tab.active {
  background: #4f46e5;
  color: #fff;
}

.tab-content {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}

.opportunities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.opportunity-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.opp-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.protocol-badge, .chain-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.protocol-badge {
  background: #e0e7ff;
  color: #4f46e5;
}

.chain-badge {
  background: #f3f4f6;
  color: #666;
}

.opp-address {
  font-family: monospace;
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.opp-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.detail-row span:first-child {
  color: #666;
}

.health-value.critical { color: #ff4757; }
.health-value.danger { color: #ff6b81; }
.health-value.warning { color: #ffa502; }
.health-value.healthy { color: #2ed573; }

.incentive {
  color: #4f46e5;
  font-weight: 600;
}

.opp-profit {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.profit-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.profit-value {
  font-size: 20px;
  font-weight: 600;
}

.profit-value.positive { color: #2ed573; }
.profit-value.negative { color: #ff4757; }

.positions-table table {
  width: 100%;
  border-collapse: collapse;
}

.positions-table th,
.positions-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.positions-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.address-cell {
  font-family: monospace;
  font-size: 12px;
}

.health-cell.critical { color: #ff4757; }
.health-cell.danger { color: #ff6b81; }
.health-cell.warning { color: #ffa502; }
.health-cell.healthy { color: #2ed573; }

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.healthy { background: #d1fae5; color: #065f46; }
.status-badge.warning { background: #fef3c7; color: #92400e; }
.status-badge.danger { background: #fee2e2; color: #991b1b; }
.status-badge.liquidated { background: #f3f4f6; color: #666; }

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.alert-item.critical {
  border-left: 4px solid #ff4757;
}

.alert-item.high {
  border-left: 4px solid #ffa502;
}

.alert-item.medium {
  border-left: 4px solid #ffa502;
}

.alert-item.low {
  border-left: 4px solid #2ed573;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.alert-type {
  font-weight: 600;
}

.severity-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}

.severity-badge.critical { background: #fee2e2; color: #991b1b; }
.severity-badge.high { background: #fef3c7; color: #92400e; }
.severity-badge.medium { background: #fef3c7; color: #92400e; }
.severity-badge.low { background: #d1fae5; color: #065f46; }

.alert-message {
  font-size: 14px;
  margin-bottom: 8px;
}

.alert-meta {
  font-size: 12px;
  color: #999;
}
</style>
