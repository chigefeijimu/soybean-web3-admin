<template>
  <div class="defi-protocol-graph">
    <div class="header">
      <h1>🔗 DeFi Protocol Interaction Graph</h1>
      <p class="subtitle">Visualize DeFi protocol relationships and fund flows</p>
    </div>

    <!-- Dashboard Overview -->
    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon> Loading protocol graph data...
    </div>

    <template v-else>
      <!-- Stats Cards -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value">{{ formatNumber(dashboard.overview?.totalProtocols || 0) }}</div>
            <div class="stat-label">Total Protocols</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value">{{ formatNumber(dashboard.overview?.totalInteractions || 0) }}</div>
            <div class="stat-label">Total Interactions</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value">${{ formatTVL(dashboard.overview?.totalTVL || 0) }}</div>
            <div class="stat-label">Total TVL</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value">{{ dashboard.overview?.avgRiskScore || 0 }}</div>
            <div class="stat-label">Avg Risk Score</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Main Content -->
      <el-row :gutter="20">
        <!-- Protocol List -->
        <el-col :span="8">
          <el-card class="protocol-list-card">
            <template #header>
              <div class="card-header">
                <span>📊 Protocol Rankings</span>
                <el-select v-model="filterChain" placeholder="Filter by Chain" size="small" clearable>
                  <el-option label="All Chains" value="" />
                  <el-option label="Ethereum" value="Ethereum" />
                  <el-option label="Polygon" value="Polygon" />
                  <el-option label="Arbitrum" value="Arbitrum" />
                  <el-option label="Optimism" value="Optimism" />
                  <el-option label="BSC" value="BSC" />
                  <el-option label="Avalanche" value="Avalanche" />
                  <el-option label="Base" value="Base" />
                </el-select>
              </div>
            </template>
            <div class="protocol-list">
              <div 
                v-for="protocol in filteredProtocols" 
                :key="protocol.id"
                class="protocol-item"
                :class="{ active: selectedProtocol?.id === protocol.id }"
                @click="selectProtocol(protocol)"
              >
                <div class="protocol-info">
                  <span class="protocol-name">{{ protocol.name }}</span>
                  <el-tag size="small" :type="getCategoryType(protocol.category)">
                    {{ protocol.category }}
                  </el-tag>
                </div>
                <div class="protocol-stats">
                  <span class="tvl">${{ formatTVL(protocol.tvl) }}</span>
                  <span class="interactions">{{ protocol.interactions }} links</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- Interaction Graph / Details -->
        <el-col :span="16">
          <el-card class="detail-card">
            <el-tabs v-model="activeTab">
              <!-- Graph View -->
              <el-tab-pane label="Protocol Network" name="graph">
                <div class="graph-container">
                  <div class="graph-placeholder">
                    <div class="network-visualization">
                      <div v-for="(protocol, idx) in topProtocols" :key="protocol.id" 
                           class="node"
                           :style="getNodeStyle(idx, topProtocols.length)"
                           @click="selectProtocol(protocol)"
                      >
                        {{ protocol.name.substring(0, 2).toUpperCase() }}
                      </div>
                      <svg class="edges">
                        <line v-for="(edge, idx) in topEdges" :key="idx"
                          :x1="edge.x1" :y1="edge.y1"
                          :x2="edge.x2" :y2="edge.y2"
                          stroke="#409eff" stroke-width="1" opacity="0.4"
                        />
                      </svg>
                    </div>
                    <div class="graph-legend">
                      <span><i class="dot eth"></i> Ethereum</span>
                      <span><i class="dot poly"></i> Polygon</span>
                      <span><i class="dot arb"></i> Arbitrum</span>
                      <span><i class="dot opt"></i> Optimism</span>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- Protocol Details -->
              <el-tab-pane label="Protocol Details" name="details">
                <template v-if="selectedProtocol">
                  <div class="protocol-details">
                    <h3>{{ selectedProtocol.name }}</h3>
                    <el-row :gutter="20">
                      <el-col :span="8">
                        <div class="detail-stat">
                          <label>TVL</label>
                          <span>${{ formatTVL(selectedProtocol.tvl) }}</span>
                        </div>
                      </el-col>
                      <el-col :span="8">
                        <div class="detail-stat">
                          <label>Chain</label>
                          <span>{{ selectedProtocol.chain }}</span>
                        </div>
                      </el-col>
                      <el-col :span="8">
                        <div class="detail-stat">
                          <label>Category</label>
                          <span>{{ selectedProtocol.category }}</span>
                        </div>
                      </el-col>
                    </el-row>
                    
                    <h4>Centrality Scores</h4>
                    <el-row :gutter="20">
                      <el-col :span="8">
                        <div class="centrality-card">
                          <div class="score">{{ selectedProtocol.centralities?.degree || 0 }}</div>
                          <label>Degree Centrality</label>
                        </div>
                      </el-col>
                      <el-col :span="8">
                        <div class="centrality-card">
                          <div class="score">{{ selectedProtocol.centralities?.betweenness || 0 }}</div>
                          <label>Betweenness</label>
                        </div>
                      </el-col>
                      <el-col :span="8">
                        <div class="centrality-card">
                          <div class="score">{{ Math.round((selectedProtocol.centralities?.closeness || 0) * 100) }}</div>
                          <label>Closeness</label>
                        </div>
                      </el-col>
                    </el-row>

                    <h4>Connected Protocols</h4>
                    <div class="connected-list">
                      <el-tag v-for="conn in connectedProtocols" :key="conn" class="connected-tag">
                        {{ conn }}
                      </el-tag>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="empty-state">Select a protocol to view details</div>
                </template>
              </el-tab-pane>

              <!-- Risk Propagation -->
              <el-tab-pane label="Risk Analysis" name="risk">
                <div class="risk-analysis">
                  <div class="risk-header">
                    <el-select v-model="riskProtocol" placeholder="Select Protocol" @change="loadRiskPropagation">
                      <el-option v-for="p in protocols" :key="p.id" :label="p.name" :value="p.id" />
                    </el-select>
                  </div>
                  <template v-if="riskData">
                    <el-alert :type="riskData.riskLevel === 'HIGH' ? 'error' : riskData.riskLevel === 'MEDIUM' ? 'warning' : 'success'" :title="`Risk Level: ${riskData.riskLevel}`" />
                    <div class="risk-stats">
                      <div class="risk-stat">
                        <span class="value">{{ riskData.connectedCount }}</span>
                        <span class="label">Connected Protocols</span>
                      </div>
                      <div class="risk-stat">
                        <span class="value">{{ riskData.totalExposure }}</span>
                        <span class="label">Total Exposure</span>
                      </div>
                      <div class="risk-stat">
                        <span class="value">{{ riskData.maxSingleExposure }}</span>
                        <span class="label">Max Single Exposure</span>
                      </div>
                    </div>
                    <el-table :data="riskData.riskPropagation" style="width: 100%">
                      <el-table-column prop="protocolName" label="Protocol" />
                      <el-table-column prop="riskScore" label="Risk Score" />
                      <el-table-column prop="interactionType" label="Interaction" />
                      <el-table-column label="Volume 24h">
                        <template #default="{ row }">
                          ${{ formatTVL(row.volume24h) }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="totalRisk" label="Total Risk" />
                    </el-table>
                  </template>
                </div>
              </el-tab-pane>

              <!-- Clusters -->
              <el-tab-pane label="Protocol Clusters" name="clusters">
                <div class="clusters-view">
                  <el-row :gutter="20">
                    <el-col v-for="cluster in clusters" :key="cluster.id" :span="8">
                      <el-card class="cluster-card">
                        <template #header>
                          <span>{{ cluster.name }}</span>
                        </template>
                        <div class="cluster-content">
                          <div class="cluster-tvl">${{ formatTVL(cluster.totalTVL) }}</div>
                          <div class="cluster-protocols">
                            <el-tag v-for="p in cluster.protocols" :key="p" size="small">
                              {{ p }}
                            </el-tag>
                          </div>
                        </div>
                      </el-card>
                    </el-col>
                  </el-row>
                </div>
              </el-tab-pane>

              <!-- Historical -->
              <el-tab-pane label="Historical Data" name="history">
                <div class="history-view">
                  <div class="period-selector">
                    <el-radio-group v-model="period" @change="loadHistoricalData">
                      <el-radio-button label="7d" />
                      <el-radio-button label="30d" />
                      <el-radio-button label="90d" />
                    </el-radio-group>
                  </div>
                  <div class="chart-placeholder">
                    <div v-for="point in historicalData" :key="point.date" class="chart-bar">
                      <div class="bar" :style="{ height: `${(point.totalTVL / maxHistoricalTVL) * 100}%` }"></div>
                      <span class="bar-label">{{ point.date.slice(5) }}</span>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const loading = ref(true)
const protocols = ref([])
const dashboard = ref({})
const selectedProtocol = ref(null)
const connectedProtocols = ref([])
const riskProtocol = ref('')
const riskData = ref(null)
const clusters = ref([])
const historicalData = ref([])
const filterChain = ref('')
const activeTab = ref('graph')
const period = ref('30d')

const topProtocols = computed(() => {
  return protocols.value.slice(0, 12)
})

const filteredProtocols = computed(() => {
  if (!filterChain.value) return protocols.value
  return protocols.value.filter(p => p.chain === filterChain.value)
})

const topEdges = computed(() => {
  const edges = []
  const nodes = topProtocols.value
  const centerX = 200
  const centerY = 150
  const radius = 120
  
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    
    if (i > 0) {
      const prevAngle = (2 * Math.PI * (i - 1)) / nodes.length
      edges.push({
        x1: centerX + radius * Math.cos(prevAngle),
        y1: centerY + radius * Math.sin(prevAngle),
        x2: x,
        y2: y
      })
    }
  })
  
  return edges
})

const maxHistoricalTVL = computed(() => {
  return Math.max(...historicalData.value.map(d => d.totalTVL), 1)
})

const getNodeStyle = (index, total) => {
  const angle = (2 * Math.PI * index) / total
  const centerX = 200
  const centerY = 150
  const radius = 120
  return {
    left: `${centerX + radius * Math.cos(angle)}px`,
    top: `${centerY + radius * Math.sin(angle)}px`
  }
}

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const formatTVL = (num) => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const getCategoryType = (category) => {
  const types = {
    'Lending': 'danger',
    'DEX': 'success',
    'Liquid Staking': 'warning',
    'Yield Aggregator': 'info',
    'Yield': 'info'
  }
  return types[category] || ''
}

const selectProtocol = async (protocol) => {
  selectedProtocol.value = protocol
  try {
    const res = await fetch(`/api/web3/defi-protocol-graph/protocol/${protocol.id}`)
    const data = await res.json()
    connectedProtocols.value = data.connectedProtocols || []
  } catch (e) {
    console.error(e)
  }
}

const loadRiskPropagation = async () => {
  if (!riskProtocol.value) return
  try {
    const res = await fetch(`/api/web3/defi-protocol-graph/risk-propagation/${riskProtocol.value}`)
    riskData.value = await res.json()
  } catch (e) {
    console.error(e)
  }
}

const loadHistoricalData = async () => {
  try {
    const res = await fetch(`/api/web3/defi-protocol-graph/historical?period=${period.value}`)
    const data = await res.json()
    historicalData.value = data.data || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  try {
    const [dashboardRes, protocolsRes, clustersRes] = await Promise.all([
      fetch('/api/web3/defi-protocol-graph/dashboard'),
      fetch('/api/web3/defi-protocol-graph/protocols'),
      fetch('/api/web3/defi-protocol-graph/cluster')
    ])
    
    dashboard.value = await dashboardRes.json()
    protocols.value = await protocolsRes.json()
    clusters.value = await clustersRes.json()
    
    if (protocols.value.length > 0) {
      selectedProtocol.value = protocols.value[0]
      await selectProtocol(protocols.value[0])
    }
    
    await loadHistoricalData()
    
    if (protocols.value.length > 0) {
      riskProtocol.value = protocols.value[0].id
      await loadRiskPropagation()
    }
  } catch (e) {
    ElMessage.error('Failed to load protocol graph data')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.defi-protocol-graph {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.subtitle {
  color: #666;
  margin: 5px 0 0;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #999;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.protocol-list-card {
  max-height: 600px;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.protocol-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.protocol-item:hover {
  background: #f5f7fa;
}

.protocol-item.active {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
}

.protocol-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.protocol-name {
  font-weight: 500;
}

.protocol-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.detail-card {
  min-height: 600px;
}

.graph-container {
  padding: 20px;
}

.graph-placeholder {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  height: 350px;
}

.network-visualization {
  position: relative;
  width: 400px;
  height: 300px;
  margin: 0 auto;
}

.node {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  transform: translate(-50%, -50%);
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.edges {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.graph-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.graph-legend .dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
}

.graph-legend .dot.eth { background: #627eea; }
.graph-legend .dot.poly { background: #8247e5; }
.graph-legend .dot.arb { background: #28a0f0; }
.graph-legend .dot.opt { background: #ff0420; }

.protocol-details h3 {
  margin: 0 0 20px;
}

.protocol-details h4 {
  margin: 20px 0 10px;
  color: #333;
}

.detail-stat {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.detail-stat label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.detail-stat span {
  font-size: 18px;
  font-weight: bold;
}

.centrality-card {
  background: #ecf5ff;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.centrality-card .score {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.centrality-card label {
  font-size: 12px;
  color: #666;
}

.connected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.connected-tag {
  margin: 2px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}

.risk-analysis {
  padding: 20px;
}

.risk-header {
  margin-bottom: 20px;
}

.risk-stats {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}

.risk-stat {
  flex: 1;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.risk-stat .value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.risk-stat .label {
  font-size: 12px;
  color: #666;
}

.clusters-view {
  padding: 20px;
}

.cluster-card {
  margin-bottom: 20px;
}

.cluster-content {
  text-align: center;
}

.cluster-tvl {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
}

.cluster-protocols {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
}

.history-view {
  padding: 20px;
}

.period-selector {
  margin-bottom: 20px;
}

.chart-placeholder {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 200px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, #409eff, #67c23a);
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  transition: height 0.3s;
}

.bar-label {
  font-size: 10px;
  color: #999;
  margin-top: 5px;
}
</style>
