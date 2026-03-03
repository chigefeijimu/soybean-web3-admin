<template>
  <div class="defi-collateral-tracker">
    <div class="header">
      <h1>🔐 DeFi Collateral Tracker</h1>
      <p class="subtitle">Track and manage your collateral positions across multiple DeFi protocols</p>
    </div>

    <!-- Address Input -->
    <div class="address-input-section">
      <n-input-group>
        <n-input
          v-model:value="address"
          placeholder="Enter wallet address (e.g., 0x...)"
          size="large"
          @keyup.enter="fetchData"
        />
        <n-select
          v-model:value="selectedChains"
          multiple
          :options="chainOptions"
          placeholder="Filter by chain"
          style="width: 280px"
        />
        <n-button type="primary" size="large" @click="fetchData" :loading="loading">
          Analyze
        </n-button>
      </n-input-group>
    </div>

    <template v-if="summary && !loading">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <n-card class="summary-card total-collateral">
          <div class="card-icon">💰</div>
          <div class="card-content">
            <div class="card-label">Total Collateral</div>
            <div class="card-value">${{ formatNumber(summary.totalCollateralValue) }}</div>
          </div>
        </n-card>

        <n-card class="summary-card total-borrowed">
          <div class="card-icon">📊</div>
          <div class="card-content">
            <div class="card-label">Total Borrowed</div>
            <div class="card-value">${{ formatNumber(summary.totalBorrowedValue) }}</div>
          </div>
        </n-card>

        <n-card class="summary-card net-value">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <div class="card-label">Net Value</div>
            <div class="card-value" :class="{ negative: summary.netValue < 0 }">
              ${{ formatNumber(summary.netValue) }}
            </div>
          </div>
        </n-card>

        <n-card class="summary-card health-factor" :class="healthFactorClass">
          <div class="card-icon">❤️</div>
          <div class="card-content">
            <div class="card-label">Health Factor</div>
            <div class="card-value">{{ summary.overallHealthFactor.toFixed(2) }}</div>
          </div>
        </n-card>

        <n-card class="summary-card liquidation-risk" :class="liquidationRiskClass">
          <div class="card-icon">⚠️</div>
          <div class="card-content">
            <div class="card-label">Liquidation Risk</div>
            <div class="card-value">{{ summary.liquidationRisk.toUpperCase() }}</div>
          </div>
        </n-card>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <n-card title="Collateral by Chain" class="chart-card">
          <div ref="chainChartRef" class="chart-container"></div>
        </n-card>

        <n-card title="Collateral by Protocol" class="chart-card">
          <div ref="protocolChartRef" class="chart-container"></div>
        </n-card>
      </div>

      <!-- Alerts Section -->
      <n-card v-if="alerts.length > 0" title="🚨 Liquidation Alerts" class="alerts-card">
        <n-alert
          v-for="alert in alerts"
          :key="alert.position.id"
          :type="alertSeverityType(alert.severity)"
          class="alert-item"
        >
          <template #header>{{ alert.message }}</template>
          <div class="alert-details">
            <span>Protocol: {{ alert.position.protocol }}</span>
            <span>Chain: {{ alert.position.chain }}</span>
            <span>Health Factor: {{ alert.position.healthFactor.toFixed(2) }}</span>
          </div>
        </n-alert>
      </n-card>

      <!-- Optimization Suggestions -->
      <n-card v-if="suggestions.length > 0" title="💡 Optimization Suggestions" class="suggestions-card">
        <n-list hoverable clickable>
          <n-list-item v-for="suggestion in suggestions" :key="suggestion.type">
            <n-thing>
              <template #header>
                <span :class="['priority-' + suggestion.priority]">
                  {{ suggestionPriorityIcon(suggestion.priority) }} {{ suggestion.message }}
                </span>
              </template>
              <template #description>
                Potential Benefit: {{ suggestion.potentialBenefit }}
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
      </n-card>

      <!-- Positions Table -->
      <n-card title="📋 Collateral Positions" class="positions-card">
        <n-data-table
          :columns="columns"
          :data="summary.positions"
          :pagination="pagination"
          :bordered="false"
        />
      </n-card>
    </template>

    <template v-else-if="!loading && !summary">
      <n-empty description="Enter a wallet address to view collateral positions">
        <template #extra>
          <n-button @click="loadSampleData">Load Sample Data</n-button>
        </template>
      </n-empty>
    </template>

    <template v-if="loading">
      <div class="loading-state">
        <n-spin size="large" />
        <p>Analyzing collateral positions...</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { NCard, NInput, NButton, NSelect, NDataTable, NAlert, NList, NListItem, NThing, NSpin, NInputGroup } from 'naive-ui';
import * as echarts from 'echarts';

const address = ref('0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E');
const selectedChains = ref<string[]>([]);
const loading = ref(false);
const summary = ref<any>(null);
const alerts = ref<any[]>([]);
const suggestions = ref<any[]>([]);
const chainChartRef = ref<HTMLElement | null>(null);
const protocolChartRef = ref<HTMLElement | null>(null);

const chainOptions = [
  { label: 'Ethereum', value: 'Ethereum' },
  { label: 'Polygon', value: 'Polygon' },
  { label: 'Arbitrum', value: 'Arbitrum' },
  { label: 'Optimism', value: 'Optimism' },
  { label: 'Base', value: 'Base' },
  { label: 'Avalanche', value: 'Avalanche' },
  { label: 'BSC', value: 'BSC' },
];

const healthFactorClass = computed(() => {
  if (!summary.value) return '';
  const hf = summary.value.overallHealthFactor;
  if (hf < 1.2) return 'critical';
  if (hf < 1.5) return 'danger';
  if (hf < 2) return 'warning';
  return 'safe';
});

const liquidationRiskClass = computed(() => {
  if (!summary.value) return '';
  return `risk-${summary.value.liquidationRisk}`;
});

const columns = [
  {
    title: 'Protocol',
    key: 'protocol',
    width: 120,
    render: (row: any) => h('span', { class: 'protocol-tag' }, row.protocol),
  },
  {
    title: 'Chain',
    key: 'chain',
    width: 100,
  },
  {
    title: 'Collateral',
    key: 'collateralToken',
    width: 100,
  },
  {
    title: 'Amount',
    key: 'collateralAmount',
    width: 120,
    render: (row: any) => `${row.collateralAmount.toFixed(4)} ${row.collateralToken}`,
  },
  {
    title: 'Value',
    key: 'collateralValue',
    width: 120,
    render: (row: any) => `$${formatNumber(row.collateralValue)}`,
  },
  {
    title: 'Borrowed',
    key: 'borrowedValue',
    width: 120,
    render: (row: any) => `$${formatNumber(row.borrowedValue)}`,
  },
  {
    title: 'Health Factor',
    key: 'healthFactor',
    width: 100,
    render: (row: any) => {
      const hf = row.healthFactor;
      let color = '#52c41a';
      if (hf < 1.2) color = '#ff4d4f';
      else if (hf < 1.5) color = '#faad14';
      else if (hf < 2) color = '#fa8c16';
      return h('span', { style: { color, fontWeight: 'bold' } }, hf.toFixed(2));
    },
  },
  {
    title: 'Liquidation Price',
    key: 'liquidationPrice',
    width: 130,
    render: (row: any) => `$${row.liquidationPrice.toFixed(2)}`,
  },
  {
    title: 'Current Price',
    key: 'currentPrice',
    width: 110,
    render: (row: any) => `$${row.currentPrice.toFixed(2)}`,
  },
  {
    title: 'Max LTV',
    key: 'maxLTV',
    width: 80,
    render: (row: any) => `${(row.maxLTV * 100).toFixed(0)}%`,
  },
  {
    title: 'APY',
    key: 'apy',
    width: 80,
    render: (row: any) => `${row.apy.toFixed(2)}%`,
  },
];

const pagination = {
  pageSize: 10,
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const alertSeverityType = (severity: string): 'error' | 'warning' | 'info' => {
  if (severity === 'critical') return 'error';
  if (severity === 'high') return 'warning';
  return 'info';
};

const suggestionPriorityIcon = (priority: string): string => {
  if (priority === 'high') return '🔴';
  if (priority === 'medium') return '🟡';
  return '🟢';
};

const fetchData = async () => {
  if (!address.value) return;
  
  loading.value = true;
  
  try {
    const baseUrl = 'http://localhost:3000';
    const chainsParam = selectedChains.value.length > 0 
      ? `?chains=${selectedChains.value.join(',')}` 
      : '';
    
    const [summaryRes, alertsRes, suggestionsRes] = await Promise.all([
      fetch(`${baseUrl}/defi-collateral-tracker/summary/${address.value}${chainsParam}`),
      fetch(`${baseUrl}/defi-collateral-tracker/alerts/${address.value}`),
      fetch(`${baseUrl}/defi-collateral-tracker/suggestions/${address.value}`),
    ]);

    summary.value = await summaryRes.json();
    alerts.value = await alertsRes.json();
    suggestions.value = await suggestionsRes.json();

    setTimeout(renderCharts, 100);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
};

const loadSampleData = async () => {
  loading.value = true;
  
  try {
    const baseUrl = 'http://localhost:3000';
    
    const [summaryRes, alertsRes, suggestionsRes] = await Promise.all([
      fetch(`${baseUrl}/defi-collateral-tracker/summary/${address.value}`),
      fetch(`${baseUrl}/defi-collateral-tracker/alerts/${address.value}`),
      fetch(`${baseUrl}/defi-collateral-tracker/suggestions/${address.value}`),
    ]);

    summary.value = await summaryRes.json();
    alerts.value = await alertsRes.json();
    suggestions.value = await suggestionsRes.json();

    setTimeout(renderCharts, 100);
  } catch (error) {
    console.error('Error loading sample data:', error);
  } finally {
    loading.value = false;
  }
};

const renderCharts = () => {
  if (!summary.value) return;

  // Chain distribution chart
  if (chainChartRef.value) {
    const chainChart = echarts.init(chainChartRef.value);
    const chainData = Object.entries(summary.value.byChain).map(([chain, data]: [string, any]) => ({
      name: chain,
      value: data.collateral,
    }));
    
    chainChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ${c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: chainData,
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
      }],
    });
  }

  // Protocol distribution chart
  if (protocolChartRef.value) {
    const protocolChart = echarts.init(protocolChartRef.value);
    const protocolData = Object.entries(summary.value.byProtocol).map(([protocol, data]: [string, any]) => ({
      name: protocol,
      value: data.collateral,
    }));
    
    protocolChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ${c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: protocolData,
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
      }],
    });
  }
};

onMounted(() => {
  // Initial setup
});
</script>

<style scoped>
.defi-collateral-tracker {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 32px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  font-size: 16px;
}

.address-input-section {
  margin-bottom: 24px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  text-align: center;
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-4px);
}

.summary-card.total-collateral {
  border-left: 4px solid #52c41a;
}

.summary-card.total-borrowed {
  border-left: 4px solid #1890ff;
}

.summary-card.net-value {
  border-left: 4px solid #722ed1;
}

.summary-card.health-factor {
  border-left: 4px solid #52c41a;
}

.summary-card.health-factor.warning {
  border-left-color: #faad14;
}

.summary-card.health-factor.danger {
  border-left-color: #fa8c16;
}

.summary-card.health-factor.critical {
  border-left-color: #ff4d4f;
}

.summary-card.liquidation-risk {
  border-left: 4px solid #52c41a;
}

.summary-card.liquidation-risk.risk-warning {
  border-left-color: #faad14;
}

.summary-card.liquidation-risk.risk-danger {
  border-left-color: #fa8c16;
}

.summary-card.liquidation-risk.risk-critical {
  border-left-color: #ff4d4f;
}

.card-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.card-value.negative {
  color: #ff4d4f;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  height: 350px;
}

.chart-container {
  width: 100%;
  height: 280px;
}

.alerts-card {
  margin-bottom: 24px;
  border-left: 4px solid #ff4d4f;
}

.alert-item {
  margin-bottom: 12px;
}

.alert-details {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}

.suggestions-card {
  margin-bottom: 24px;
}

.priority-high {
  color: #ff4d4f;
}

.priority-medium {
  color: #faad14;
}

.priority-low {
  color: #52c41a;
}

.positions-card {
  margin-bottom: 24px;
}

.protocol-tag {
  padding: 2px 8px;
  border-radius: 4px;
  background: #f0f0f0;
  font-size: 12px;
}

.loading-state {
  text-align: center;
  padding: 60px;
}

.loading-state p {
  margin-top: 16px;
  color: #666;
}
</style>
