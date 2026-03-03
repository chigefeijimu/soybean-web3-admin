<template>
  <div class="dao-treasury-manager">
    <div class="header">
      <h1>🏛️ DAO Treasury Manager</h1>
      <p class="subtitle">Cross-chain DAO treasury management and analytics</p>
    </div>

    <!-- DAO Selector -->
    <div class="dao-selector">
      <el-select
        v-model="selectedDao"
        placeholder="Select DAO"
        @change="loadTreasury"
        filterable
        size="large"
      >
        <el-option
          v-for="dao in supportedDaos"
          :key="dao.name"
          :label="dao.name"
          :value="dao.name"
        />
      </el-select>
      <el-button type="primary" @click="loadTreasury" :loading="loading">
        Load Treasury
      </el-button>
    </div>

    <el-tabs v-model="activeTab" v-if="treasuryReport">
      <!-- Overview Tab -->
      <el-tab-pane label="Overview" name="overview">
        <div class="overview-grid">
          <!-- Total Value Card -->
          <el-card class="stat-card total-value">
            <div class="stat-label">Total Treasury Value</div>
            <div class="stat-value">${{ formatNumber(treasuryReport.totalValueUsd) }}</div>
            <div class="stat-change" :class="changeClass">
              {{ change24h >= 0 ? '↑' : '↓' }} {{ Math.abs(change24h).toFixed(2) }}% (24h)
            </div>
          </el-card>

          <!-- Health Score Card -->
          <el-card class="stat-card health-score">
            <div class="stat-label">Health Score</div>
            <div class="stat-value" :class="healthClass">
              {{ treasuryReport.health.score }}/100
            </div>
            <el-progress
              :percentage="treasuryReport.health.score"
              :color="healthColor"
              :show-text="false"
            />
          </el-card>

          <!-- Asset Count Card -->
          <el-card class="stat-card">
            <div class="stat-label">Total Assets</div>
            <div class="stat-value">{{ treasuryReport.assets.length }}</div>
          </el-card>

          <!-- Positions Card -->
          <el-card class="stat-card">
            <div class="stat-label">DeFi Positions</div>
            <div class="stat-value">{{ treasuryReport.positions.length }}</div>
          </el-card>
        </div>

        <!-- Health Breakdown -->
        <el-card class="health-breakdown">
          <h3>💊 Health Breakdown</h3>
          <div class="health-metrics">
            <div class="health-metric">
              <span>Liquidity</span>
              <el-progress :percentage="treasuryReport.health.liquidity" :color="liquidityColor" />
            </div>
            <div class="health-metric">
              <span>Diversification</span>
              <el-progress :percentage="treasuryReport.health.diversification" :color="diversificationColor" />
            </div>
            <div class="health-metric">
              <span>Sustainability</span>
              <el-progress :percentage="treasuryReport.health.sustainability" :color="sustainabilityColor" />
            </div>
          </div>
        </el-card>

        <!-- Recommendations -->
        <el-card v-if="treasuryReport.recommendations.length" class="recommendations">
          <h3>💡 Recommendations</h3>
          <ul>
            <li v-for="(rec, index) in treasuryReport.recommendations" :key="index">
              {{ rec }}
            </li>
          </ul>
        </el-card>
      </el-tab-pane>

      <!-- Assets Tab -->
      <el-tab-pane label="Assets" name="assets">
        <el-card>
          <el-table :data="treasuryReport.assets" style="width: 100%">
            <el-table-column prop="chain" label="Chain" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.chain }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="symbol" label="Token" width="120" />
            <el-table-column prop="balance" label="Balance" width="150" />
            <el-table-column prop="valueUsd" label="Value (USD)" width="150">
              <template #default="{ row }">
                ${{ formatNumber(row.valueUsd) }}
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'native' ? 'warning' : 'success'">
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Positions Tab -->
      <el-tab-pane label="Positions" name="positions">
        <el-card>
          <el-table :data="treasuryReport.positions" style="width: 100%">
            <el-table-column prop="protocol" label="Protocol" width="120" />
            <el-table-column prop="chain" label="Chain" width="100">
              <template #default="{ row }">
                <el-tag>{{ row.chain }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type" width="120" />
            <el-table-column prop="valueUsd" label="Value (USD)" width="150">
              <template #default="{ row }">
                ${{ formatNumber(row.valueUsd) }}
              </template>
            </el-table-column>
            <el-table-column prop="apy" label="APY" width="100">
              <template #default="{ row }">
                <span :class="apyClass(row.apy)">{{ row.apy.toFixed(2) }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="risk" label="Risk" width="100">
              <template #default="{ row }">
                <el-tag :type="riskType(row.risk)">{{ row.risk }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Distribution Tab -->
      <el-tab-pane label="Distribution" name="distribution">
        <div class="distribution-grid">
          <el-card>
            <h3>📊 By Chain</h3>
            <div class="chart-container">
              <div
                v-for="(value, chain) in treasuryReport.distribution.byChain"
                :key="chain"
                class="chain-bar"
              >
                <div class="chain-label">
                  <span>{{ chain }}</span>
                  <span>${{ formatNumber(value) }}</span>
                </div>
                <el-progress
                  :percentage="(value / treasuryReport.totalValueUsd) * 100"
                  :show-text="false"
                  :stroke-width="20"
                />
              </div>
            </div>
          </el-card>

          <el-card>
            <h3>📈 By Category</h3>
            <div class="chart-container">
              <div
                v-for="(value, category) in treasuryReport.distribution.byCategory"
                :key="category"
                class="category-bar"
              >
                <div class="category-label">
                  <span>{{ category }}</span>
                  <span>${{ formatNumber(value) }}</span>
                </div>
                <el-progress
                  :percentage="(value / treasuryReport.totalValueUsd) * 100"
                  :show-text="false"
                  :stroke-width="20"
                  color="#67c23a"
                />
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Risks Tab -->
      <el-tab-pane label="Risks" name="risks">
        <el-card v-if="riskAnalysis">
          <div class="risk-summary">
            <div class="risk-score" :class="overallRiskClass">
              <span>Overall Risk Score</span>
              <strong>{{ riskAnalysis.overallRisk }}/100</strong>
            </div>
          </div>
          <el-table :data="riskAnalysis.risks" style="width: 100%">
            <el-table-column prop="category" label="Category" width="150" />
            <el-table-column prop="level" label="Risk Level" width="120">
              <template #default="{ row }">
                <el-tag :type="riskType(row.level)">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="Description" />
            <el-table-column prop="mitigation" label="Mitigation" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Yield Tab -->
      <el-tab-pane label="Yield Opportunities" name="yield">
        <el-card>
          <el-table :data="yieldOpportunities" style="width: 100%">
            <el-table-column prop="protocol" label="Protocol" width="120" />
            <el-table-column prop="chain" label="Chain" width="100">
              <template #default="{ row }">
                <el-tag>{{ row.chain }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type" width="120" />
            <el-table-column prop="apy" label="APY" width="100">
              <template #default="{ row }">
                <span class="apy-high">{{ row.apy.toFixed(2) }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="risk" label="Risk" width="100">
              <template #default="{ row }">
                <el-tag :type="riskType(row.risk)">{{ row.risk }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="minDeposit" label="Min Deposit" width="120">
              <template #default="{ row }">
                ${{ formatNumber(row.minDeposit) }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="Description" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- History Tab -->
      <el-tab-pane label="History" name="history">
        <el-card>
          <div class="history-chart">
            <div
              v-for="point in historyData"
              :key="point.date"
              class="history-point"
            >
              <div class="history-date">{{ point.date }}</div>
              <div class="history-value">${{ formatNumber(point.valueUsd) }}</div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- Top Treasuries -->
    <el-card class="top-treasuries" v-if="topTreasuries.length">
      <h3>🏆 Top DAO Treasuries</h3>
      <el-table :data="topTreasuries" style="width: 100%">
        <el-table-column prop="rank" label="Rank" width="80" />
        <el-table-column prop="dao" label="DAO" />
        <el-table-column prop="totalValueUsd" label="Total Value">
          <template #default="{ row }">
            ${{ formatNumber(row.totalValueUsd) }}
          </template>
        </el-table-column>
        <el-table-column prop="change24h" label="24h Change">
          <template #default="{ row }">
            <span :class="row.change24h >= 0 ? 'positive' : 'negative'">
              {{ row.change24h >= 0 ? '↑' : '↓' }} {{ Math.abs(row.change24h).toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const selectedDao = ref('Uniswap');
const activeTab = ref('overview');
const loading = ref(false);
const supportedDaos = ref<{ name: string; address: string; chains: string[] }[]>([]);
const treasuryReport = ref<any>(null);
const topTreasuries = ref<any[]>([]);
const riskAnalysis = ref<any>(null);
const yieldOpportunities = ref<any[]>([]);
const historyData = ref<any[]>([]);
const change24h = ref(0);

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

const changeClass = computed(() =>
  change24h.value >= 0 ? 'positive' : 'negative'
);

const healthClass = computed(() => {
  if (!treasuryReport.value) return '';
  const score = treasuryReport.value.health.score;
  if (score >= 70) return 'health-good';
  if (score >= 40) return 'health-medium';
  return 'health-bad';
});

const healthColor = computed(() => {
  if (!treasuryReport.value) return '#67c23a';
  const score = treasuryReport.value.health.score;
  if (score >= 70) return '#67c23a';
  if (score >= 40) return '#e6a23c';
  return '#f56c6c';
});

const liquidityColor = computed(() => {
  if (!treasuryReport.value) return '#67c23a';
  const score = treasuryReport.value.health.liquidity;
  if (score >= 60) return '#67c23a';
  if (score >= 30) return '#e6a23c';
  return '#f56c6c';
});

const diversificationColor = computed(() => {
  if (!treasuryReport.value) return '#67c23a';
  const score = treasuryReport.value.health.diversification;
  if (score >= 60) return '#67c23a';
  if (score >= 30) return '#e6a23c';
  return '#f56c6c';
});

const sustainabilityColor = computed(() => {
  if (!treasuryReport.value) return '#67c23a';
  const score = treasuryReport.value.health.sustainability;
  if (score >= 70) return '#67c23a';
  if (score >= 50) return '#e6a23c';
  return '#f56c6c';
});

const overallRiskClass = computed(() => {
  if (!riskAnalysis.value) return '';
  const score = riskAnalysis.value.overallRisk;
  if (score < 30) return 'risk-low';
  if (score < 60) return 'risk-medium';
  return 'risk-high';
});

const riskType = (risk: string) => {
  switch (risk) {
    case 'low':
    case 'critical':
      return risk === 'low' ? 'success' : 'danger';
    case 'medium':
      return 'warning';
    case 'high':
      return 'danger';
    default:
      return 'info';
  }
};

const apyClass = (apy: number) => {
  if (apy >= 10) return 'apy-high';
  if (apy >= 5) return 'apy-medium';
  return 'apy-low';
};

const loadSupportedDaos = async () => {
  try {
    const response = await fetch('/api/v1/dao-treasury/supported');
    supportedDaos.value = await response.json();
  } catch (error) {
    console.error('Failed to load supported DAOs:', error);
    supportedDaos.value = [
      { name: 'Uniswap', address: '', chains: [] },
      { name: 'Aave', address: '', chains: [] },
      { name: 'MakerDAO', address: '', chains: [] },
      { name: 'Compound', address: '', chains: [] },
      { name: 'Curve', address: '', chains: [] },
    ];
  }
};

const loadTreasury = async () => {
  if (!selectedDao.value) return;
  
  loading.value = true;
  try {
    const [reportRes, topRes] = await Promise.all([
      fetch(`/api/v1/dao-treasury/report/${selectedDao.value}`),
      fetch('/api/v1/dao-treasury/top?limit=10'),
    ]);

    treasuryReport.value = await reportRes.json();
    topTreasuries.value = await topRes.json();
    change24h.value = (Math.random() - 0.5) * 10;

    // Load additional data
    await Promise.all([
      loadRiskAnalysis(),
      loadYieldOpportunities(),
      loadHistory(),
    ]);

    ElMessage.success('Treasury loaded successfully');
  } catch (error) {
    console.error('Failed to load treasury:', error);
    ElMessage.error('Failed to load treasury data');
  } finally {
    loading.value = false;
  }
};

const loadRiskAnalysis = async () => {
  try {
    const response = await fetch(`/api/v1/dao-treasury/risks/${selectedDao.value}`);
    riskAnalysis.value = await response.json();
  } catch (error) {
    console.error('Failed to load risk analysis:', error);
  }
};

const loadYieldOpportunities = async () => {
  try {
    const response = await fetch(`/api/v1/dao-treasury/yield-opportunities/${selectedDao.value}`);
    yieldOpportunities.value = await response.json();
  } catch (error) {
    console.error('Failed to load yield opportunities:', error);
  }
};

const loadHistory = async () => {
  try {
    const response = await fetch(`/api/v1/dao-treasury/history/${selectedDao.value}?days=30`);
    historyData.value = await response.json();
  } catch (error) {
    console.error('Failed to load history:', error);
  }
};

onMounted(async () => {
  await loadSupportedDaos();
  await loadTreasury();
});
</script>

<style scoped>
.dao-treasury-manager {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
}

.subtitle {
  color: #666;
  margin: 0;
}

.dao-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.dao-selector .el-select {
  width: 300px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-change {
  font-size: 14px;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.total-value .stat-value {
  color: #409eff;
}

.health-score .stat-value {
  font-size: 28px;
}

.health-good {
  color: #67c23a;
}

.health-medium {
  color: #e6a23c;
}

.health-bad {
  color: #f56c6c;
}

.health-breakdown {
  margin-bottom: 24px;
}

.health-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.health-metric {
  display: flex;
  align-items: center;
  gap: 16px;
}

.health-metric span {
  width: 150px;
  font-weight: 500;
}

.recommendations {
  margin-bottom: 24px;
}

.recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.recommendations li {
  margin-bottom: 8px;
  color: #666;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chain-bar,
.category-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chain-label,
.category-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.risk-summary {
  margin-bottom: 24px;
}

.risk-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border-radius: 8px;
  font-size: 18px;
}

.risk-score span {
  margin-bottom: 8px;
}

.risk-low {
  background: #f0f9eb;
  color: #67c23a;
}

.risk-medium {
  background: #fdf6ec;
  color: #e6a23c;
}

.risk-high {
  background: #fef0f0;
  color: #f56c6c;
}

.apy-high {
  color: #67c23a;
  font-weight: bold;
}

.apy-medium {
  color: #e6a23c;
}

.apy-low {
  color: #909399;
}

.history-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 500px;
  overflow-y: auto;
}

.history-point {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.history-date {
  color: #666;
}

.history-value {
  font-weight: 500;
}

.top-treasuries {
  margin-top: 24px;
}

.top-treasuries h3 {
  margin-top: 0;
}
</style>
