<template>
  <div class="defi-user-analytics">
    <div class="header">
      <h2>📊 DeFi Protocol User Analytics</h2>
      <p>Track and analyze user metrics for DeFi protocols</p>
    </div>

    <!-- Overview Stats -->
    <div v-if="overview" class="overview-stats">
      <div class="stat-card">
        <div class="stat-label">Total Protocols</div>
        <div class="stat-value">{{ overview.totalProtocols }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Users</div>
        <div class="stat-value">{{ formatNumber(overview.totalUsers) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Users (7d)</div>
        <div class="stat-value">{{ formatNumber(overview.totalActiveUsers) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg. Retention Rate</div>
        <div class="stat-value">{{ overview.averageRetentionRate.toFixed(1) }}%</div>
      </div>
    </div>

    <!-- Chain Distribution -->
    <div v-if="overview" class="section">
      <h3>🌐 Chain Distribution</h3>
      <div class="chain-grid">
        <div v-for="chain in overview.chainDistribution" :key="chain.chain" class="chain-card">
          <div class="chain-name">{{ formatChainName(chain.chain) }}</div>
          <div class="chain-users">{{ formatNumber(chain.userCount) }} users</div>
          <div class="chain-percentage">{{ chain.percentage.toFixed(1) }}%</div>
          <div class="chain-bar">
            <div class="chain-bar-fill" :style="{ width: chain.percentage + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="controls">
      <div class="control-group">
        <label>Chain Filter:</label>
        <select v-model="selectedChain" @change="loadProtocols">
          <option value="">All Chains</option>
          <option v-for="chain in chains" :key="chain" :value="chain">{{ formatChainName(chain) }}</option>
        </select>
      </div>
      <button @click="loadOverview" class="refresh-btn">🔄 Refresh</button>
    </div>

    <!-- Protocols Table -->
    <div class="section">
      <h3>📈 Protocol User Metrics</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Protocol</th>
              <th>Chain</th>
              <th>Total Users</th>
              <th>Active (24h)</th>
              <th>Active (7d)</th>
              <th>Active (30d)</th>
              <th>New (24h)</th>
              <th>Growth (7d)</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="protocol in protocols" :key="protocol.protocolId" @click="selectProtocol(protocol)">
              <td class="protocol-name">{{ protocol.protocolName }}</td>
              <td><span class="chain-badge">{{ formatChainName(protocol.chain) }}</span></td>
              <td>{{ formatNumber(protocol.totalUsers) }}</td>
              <td>{{ formatNumber(protocol.activeUsers24h) }}</td>
              <td>{{ formatNumber(protocol.activeUsers7d) }}</td>
              <td>{{ formatNumber(protocol.activeUsers30d) }}</td>
              <td class="positive">+{{ formatNumber(protocol.newUsers24h) }}</td>
              <td :class="protocol.userGrowthRate7d >= 0 ? 'positive' : 'negative'">
                {{ protocol.userGrowthRate7d >= 0 ? '+' : '' }}{{ protocol.userGrowthRate7d.toFixed(1) }}%
              </td>
              <td>{{ protocol.retentionRate7d.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Protocol Detail Modal -->
    <div v-if="selectedProtocolData" class="modal-overlay" @click="selectedProtocolData = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedProtocolData.protocolName }} - User Analytics</h3>
          <button class="close-btn" @click="selectedProtocolData = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Total Users</div>
              <div class="detail-value">{{ formatNumber(selectedProtocolData.totalUsers) }}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Active Users (24h)</div>
              <div class="detail-value">{{ formatNumber(selectedProtocolData.activeUsers24h) }}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Active Users (7d)</div>
              <div class="detail-value">{{ formatNumber(selectedProtocolData.activeUsers7d) }}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Active Users (30d)</div>
              <div class="detail-value">{{ formatNumber(selectedProtocolData.activeUsers30d) }}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">New Users (24h)</div>
              <div class="detail-value positive">+{{ formatNumber(selectedProtocolData.newUsers24h) }}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">New Users (7d)</div>
              <div class="detail-value positive">+{{ formatNumber(selectedProtocolData.newUsers7d) }}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">User Growth Rate (7d)</div>
              <div class="detail-value" :class="selectedProtocolData.userGrowthRate7d >= 0 ? 'positive' : 'negative'">
                {{ selectedProtocolData.userGrowthRate7d >= 0 ? '+' : '' }}{{ selectedProtocolData.userGrowthRate7d.toFixed(1) }}%
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-label">User Growth Rate (30d)</div>
              <div class="detail-value" :class="selectedProtocolData.userGrowthRate30d >= 0 ? 'positive' : 'negative'">
                {{ selectedProtocolData.userGrowthRate30d >= 0 ? '+' : '' }}{{ selectedProtocolData.userGrowthRate30d.toFixed(1) }}%
              </div>
            </div>
          </div>

          <!-- Activity Distribution -->
          <div v-if="activityDistribution" class="activity-section">
            <h4>📊 User Activity Distribution</h4>
            <div class="activity-bars">
              <div class="activity-item">
                <span class="activity-label">Very Active</span>
                <div class="activity-bar">
                  <div class="activity-fill very-active" :style="{ width: (activityDistribution.veryActive / selectedProtocolData.totalUsers * 100) + '%' }"></div>
                </div>
                <span class="activity-value">{{ formatNumber(activityDistribution.veryActive) }}</span>
              </div>
              <div class="activity-item">
                <span class="activity-label">Active</span>
                <div class="activity-bar">
                  <div class="activity-fill active" :style="{ width: (activityDistribution.active / selectedProtocolData.totalUsers * 100) + '%' }"></div>
                </div>
                <span class="activity-value">{{ formatNumber(activityDistribution.active) }}</span>
              </div>
              <div class="activity-item">
                <span class="activity-label">Casual</span>
                <div class="activity-bar">
                  <div class="activity-fill casual" :style="{ width: (activityDistribution.casual / selectedProtocolData.totalUsers * 100) + '%' }"></div>
                </div>
                <span class="activity-value">{{ formatNumber(activityDistribution.casual) }}</span>
              </div>
              <div class="activity-item">
                <span class="activity-label">Dormant</span>
                <div class="activity-bar">
                  <div class="activity-fill dormant" :style="{ width: (activityDistribution.dormant / selectedProtocolData.totalUsers * 100) + '%' }"></div>
                </div>
                <span class="activity-value">{{ formatNumber(activityDistribution.dormant) }}</span>
              </div>
            </div>
          </div>

          <!-- Retention Analysis -->
          <div v-if="retentionAnalysis" class="retention-section">
            <h4>📈 Retention Analysis</h4>
            <div class="retention-grid">
              <div class="retention-card">
                <div class="retention-label">Day 1 Retention</div>
                <div class="retention-value">{{ retentionAnalysis.day1Retention.toFixed(1) }}%</div>
              </div>
              <div class="retention-card">
                <div class="retention-label">Day 7 Retention</div>
                <div class="retention-value">{{ retentionAnalysis.day7Retention.toFixed(1) }}%</div>
              </div>
              <div class="retention-card">
                <div class="retention-label">Day 30 Retention</div>
                <div class="retention-value">{{ retentionAnalysis.day30Retention.toFixed(1) }}%</div>
              </div>
              <div class="retention-card">
                <div class="retention-label">Churn Rate (7d)</div>
                <div class="retention-value negative">{{ retentionAnalysis.churnRate7d.toFixed(1) }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { defiUserAnalyticsApi } from '@/service/defiUserAnalytics'

interface ProtocolMetrics {
  protocolId: string
  protocolName: string
  chain: string
  totalUsers: number
  activeUsers24h: number
  activeUsers7d: number
  activeUsers30d: number
  newUsers24h: number
  newUsers7d: number
  newUsers30d: number
  retentionRate7d: number
  userGrowthRate7d: number
  userGrowthRate30d: number
}

interface Overview {
  totalProtocols: number
  totalUsers: number
  totalActiveUsers: number
  averageRetentionRate: number
  topProtocolsByUsers: ProtocolMetrics[]
  chainDistribution: { chain: string; userCount: number; percentage: number }[]
}

const overview = ref<Overview | null>(null)
const protocols = ref<ProtocolMetrics[]>([])
const selectedChain = ref('')
const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche']

const selectedProtocolData = ref<ProtocolMetrics | null>(null)
const activityDistribution = ref<any>(null)
const retentionAnalysis = ref<any>(null)

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatChainName = (chain: string): string => {
  const names: Record<string, string> = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    bsc: 'BSC',
    base: 'Base',
    avalanche: 'Avalanche'
  }
  return names[chain] || chain
}

const loadOverview = async () => {
  try {
    const res = await defiUserAnalyticsApi.getOverview()
    overview.value = res.data
  } catch (error) {
    console.error('Failed to load overview:', error)
  }
}

const loadProtocols = async () => {
  try {
    const res = await defiUserAnalyticsApi.getProtocols(selectedChain.value || undefined)
    protocols.value = res.data
  } catch (error) {
    console.error('Failed to load protocols:', error)
  }
}

const selectProtocol = async (protocol: ProtocolMetrics) => {
  selectedProtocolData.value = protocol
  try {
    const [activityRes, retentionRes] = await Promise.all([
      defiUserAnalyticsApi.getActivityDistribution(protocol.protocolId),
      defiUserAnalyticsApi.getRetentionAnalysis(protocol.protocolId)
    ])
    activityDistribution.value = activityRes.data
    retentionAnalysis.value = retentionRes.data
  } catch (error) {
    console.error('Failed to load protocol details:', error)
  }
}

onMounted(() => {
  loadOverview()
  loadProtocols()
})
</script>

<style scoped>
.defi-user-analytics {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.chain-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.chain-name {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}

.chain-users {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.chain-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 8px;
}

.chain-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.chain-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.controls {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  font-weight: 500;
}

.control-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.refresh-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn:hover {
  background: #5568d3;
}

.table-container {
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
  background: #f8f9fa;
  font-weight: 600;
  font-size: 13px;
}

tr:hover {
  background: #f8f9fa;
  cursor: pointer;
}

.protocol-name {
  font-weight: 600;
}

.chain-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  font-size: 12px;
}

.positive {
  color: #4caf50;
}

.negative {
  color: #f44336;
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
  width: 90%;
  max-width: 800px;
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
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.detail-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.detail-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.detail-value {
  font-size: 20px;
  font-weight: 600;
}

.activity-section, .retention-section {
  margin-top: 24px;
}

.activity-section h4, .retention-section h4 {
  margin: 0 0 16px 0;
}

.activity-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-label {
  width: 100px;
  font-size: 13px;
}

.activity-bar {
  flex: 1;
  height: 20px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.activity-fill {
  height: 100%;
  border-radius: 4px;
}

.activity-fill.very-active { background: #4caf50; }
.activity-fill.active { background: #8bc34a; }
.activity-fill.casual { background: #ffc107; }
.activity-fill.dormant { background: #9e9e9e; }

.activity-value {
  width: 60px;
  text-align: right;
  font-weight: 600;
}

.retention-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.retention-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.retention-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.retention-value {
  font-size: 18px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chain-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .retention-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
