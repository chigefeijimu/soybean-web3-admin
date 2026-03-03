<template>
  <div class="defi-health-monitor">
    <div class="header">
      <h2>🩺 DeFi Health Monitor</h2>
      <div class="header-actions">
        <el-input
          v-model="walletAddress"
          placeholder="Enter wallet address"
          class="address-input"
          @keyup.enter="loadData"
        >
          <template #append>
            <el-button @click="loadData">Analyze</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- Health Summary -->
    <el-card v-if="summary" class="summary-card">
      <div class="summary-grid">
        <div class="summary-item">
          <div class="label">Total Value</div>
          <div class="value">${{ formatNumber(summary.totalValueUSD) }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Positions</div>
          <div class="value">{{ summary.totalPositions }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Chains</div>
          <div class="value">{{ summary.chains.length }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Protocols</div>
          <div class="value">{{ summary.protocols.length }}</div>
        </div>
      </div>

      <!-- Health Score -->
      <div class="health-score-section">
        <div class="health-score" :class="summary.healthMetrics.riskLevel">
          <div class="score-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" class="bg" />
              <circle
                cx="50"
                cy="50"
                r="45"
                class="progress"
                :stroke-dasharray="`${summary.healthMetrics.overallScore * 2.83} 283`"
              />
            </svg>
            <div class="score-value">{{ summary.healthMetrics.overallScore }}</div>
          </div>
          <div class="score-label">Health Score</div>
          <div class="risk-badge" :class="summary.healthMetrics.riskLevel">
            {{ summary.healthMetrics.riskLevel.toUpperCase() }}
          </div>
        </div>

        <div class="health-metrics">
          <div class="metric">
            <span class="metric-label">Liquidity</span>
            <el-progress :percentage="summary.healthMetrics.liquidityScore" :color="getMetricColor(summary.healthMetrics.liquidityScore)" />
          </div>
          <div class="metric">
            <span class="metric-label">Diversification</span>
            <el-progress :percentage="summary.healthMetrics.diversificationScore" :color="getMetricColor(summary.healthMetrics.diversificationScore)" />
          </div>
          <div class="metric">
            <span class="metric-label">Yield</span>
            <el-progress :percentage="summary.healthMetrics.yieldScore" :color="getMetricColor(summary.healthMetrics.yieldScore)" />
          </div>
          <div class="metric">
            <span class="metric-label">Risk</span>
            <el-progress :percentage="100 - summary.healthMetrics.riskScore" :color="getMetricColor(100 - summary.healthMetrics.riskScore)" />
          </div>
        </div>
      </div>
    </el-card>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- Positions Tab -->
      <el-tab-pane label="Positions" name="positions">
        <div class="positions-list">
          <el-card v-for="position in positions" :key="position.id" class="position-card">
            <div class="position-header">
              <div class="position-chain">
                <el-tag>{{ position.chain.toUpperCase() }}</el-tag>
              </div>
              <div class="position-protocol">
                <span class="protocol-name">{{ position.protocol }}</span>
                <el-tag size="small" :type="getTypeColor(position.type)">{{ position.type }}</el-tag>
              </div>
            </div>
            <div class="position-details">
              <div class="detail-row">
                <span class="label">Tokens:</span>
                <span class="value">{{ position.token0 }}{{ position.token1 ? ` / ${position.token1}` : '' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Value:</span>
                <span class="value">${{ formatNumber(position.currentValueUSD) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">APY:</span>
                <span class="value apy">{{ position.apy.toFixed(1) }}%</span>
              </div>
              <div v-if="position.healthFactor" class="detail-row">
                <span class="label">Health:</span>
                <span class="value" :class="getHealthClass(position.healthFactor)">{{ position.healthFactor.toFixed(2) }}</span>
              </div>
              <div v-if="position.pendingRewardsUSD > 0" class="detail-row">
                <span class="label">Pending Rewards:</span>
                <span class="value rewards">${{ formatNumber(position.pendingRewardsUSD) }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Top Holdings Tab -->
      <el-tab-pane label="Top Holdings" name="holdings">
        <el-card v-if="summary?.topHoldings.length">
          <div class="holdings-list">
            <div v-for="holding in summary.topHoldings" :key="holding.token" class="holding-item">
              <div class="holding-token">{{ holding.token }}</div>
              <div class="holding-value">${{ formatNumber(holding.valueUSD) }}</div>
              <div class="holding-percent">{{ holding.percentage.toFixed(1) }}%</div>
              <el-progress :percentage="holding.percentage" :show-text="false" />
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Risk Distribution Tab -->
      <el-tab-pane label="Risk Distribution" name="risk">
        <el-card v-if="summary?.riskDistribution.length">
          <div class="risk-distribution">
            <div v-for="risk in summary.riskDistribution" :key="risk.risk" class="risk-item" :class="risk.risk">
              <div class="risk-label">{{ risk.risk.toUpperCase() }}</div>
              <div class="risk-count">{{ risk.count }} positions</div>
              <div class="risk-value">${{ formatNumber(risk.valueUSD) }}</div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Alerts Tab -->
      <el-tab-pane label="Alerts" name="alerts">
        <div class="alerts-list">
          <el-card v-for="alert in alerts" :key="alert.id" class="alert-card" :class="alert.severity">
            <div class="alert-header">
              <el-tag :type="getAlertType(alert.severity)">{{ alert.severity }}</el-tag>
              <el-tag>{{ alert.type }}</el-tag>
              <span class="alert-time">{{ formatTime(alert.triggeredAt) }}</span>
            </div>
            <div class="alert-message">{{ alert.message }}</div>
          </el-card>
          <el-empty v-if="!alerts.length" description="No alerts" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const walletAddress = ref('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
const activeTab = ref('positions');
const summary = ref<any>(null);
const positions = ref<any[]>([]);
const alerts = ref<any[]>([]);

const loadData = async () => {
  if (!walletAddress.value) {
    ElMessage.warning('Please enter a wallet address');
    return;
  }

  try {
    // Load summary
    const summaryRes = await fetch(`/api/web3-defi-health-monitor/health/summary?address=${walletAddress.value}`);
    summary.value = await summaryRes.json();

    // Load positions
    const positionsRes = await fetch(`/api/web3-defi-health-monitor/positions?address=${walletAddress.value}`);
    positions.value = await positionsRes.json();

    // Load alerts
    const alertsRes = await fetch(`/api/web3-defi-health-monitor/alerts?address=${walletAddress.value}`);
    alerts.value = await alertsRes.json();

    ElMessage.success('Data loaded successfully');
  } catch (error) {
    ElMessage.error('Failed to load data');
  }
};

const formatNumber = (num: number) => {
  return num?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0';
};

const formatTime = (date: string) => {
  return new Date(date).toLocaleString();
};

const getMetricColor = (value: number) => {
  if (value >= 80) return '#67c23a';
  if (value >= 60) return '#e6a23c';
  return '#f56c6c';
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    lending: 'success',
    staking: 'warning',
    liquidity: 'primary',
    yield_farming: 'danger',
    bridge: 'info',
  };
  return colors[type] || '';
};

const getHealthClass = (health: number) => {
  if (health >= 2) return 'health-good';
  if (health >= 1.5) return 'health-warning';
  return 'health-danger';
};

const getAlertType = (severity: string) => {
  const types: Record<string, string> = {
    critical: 'danger',
    warning: 'warning',
    info: 'info',
  };
  return types[severity] || '';
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.defi-health-monitor {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

.address-input {
  width: 400px;
}

.summary-card {
  margin-bottom: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.summary-item {
  text-align: center;
}

.summary-item .label {
  font-size: 14px;
  color: #909399;
}

.summary-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.health-score-section {
  display: flex;
  align-items: center;
  gap: 40px;
}

.health-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.score-circle svg {
  transform: rotate(-90deg);
}

.score-circle circle {
  fill: none;
  stroke-width: 8;
}

.score-circle .bg {
  stroke: #ebeef5;
}

.score-circle .progress {
  stroke: #67c23a;
  transition: stroke-dasharray 0.5s;
}

.health-score.low .progress { stroke: #67c23a; }
.health-score.medium .progress { stroke: #e6a23c; }
.health-score.high .progress { stroke: #f56c6c; }
.health-score.critical .progress { stroke: #f56c6c; }

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  font-weight: bold;
}

.score-label {
  margin-top: 10px;
  font-weight: bold;
}

.risk-badge {
  margin-top: 5px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.risk-badge.low { background: #67c23a; }
.risk-badge.medium { background: #e6a23c; }
.risk-badge.high { background: #f56c6c; }
.risk-badge.critical { background: #f56c6c; }

.health-metrics {
  flex: 1;
}

.metric {
  margin-bottom: 15px;
}

.metric-label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.positions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.position-card {
  margin-bottom: 10px;
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.position-protocol {
  display: flex;
  align-items: center;
  gap: 10px;
}

.protocol-name {
  font-weight: bold;
  text-transform: capitalize;
}

.position-details .detail-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #ebeef5;
}

.position-details .label {
  color: #909399;
}

.position-details .value.apy {
  color: #67c23a;
  font-weight: bold;
}

.position-details .value.rewards {
  color: #e6a23c;
  font-weight: bold;
}

.health-good { color: #67c23a; }
.health-warning { color: #e6a23c; }
.health-danger { color: #f56c6c; }

.holdings-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.holding-item {
  display: grid;
  grid-template-columns: 100px 150px 80px 1fr;
  align-items: center;
  gap: 15px;
}

.holding-token {
  font-weight: bold;
}

.holding-value {
  font-weight: bold;
}

.holding-percent {
  color: #909399;
}

.risk-distribution {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.risk-item {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.risk-item.low { background: #e1f3d8; }
.risk-item.medium { background: #faecd8; }
.risk-item.high { background: #fde2e2; }
.risk-item.critical { background: #fde2e2; }

.risk-label {
  font-weight: bold;
  margin-bottom: 5px;
}

.risk-count {
  color: #606266;
  margin-bottom: 5px;
}

.risk-value {
  font-size: 18px;
  font-weight: bold;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-card {
  border-left: 4px solid;
}

.alert-card.info { border-color: #909399; }
.alert-card.warning { border-color: #e6a23c; }
.alert-card.critical { border-color: #f56c6c; }

.alert-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.alert-time {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

.alert-message {
  color: #303133;
}
</style>
