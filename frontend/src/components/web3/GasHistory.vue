<template>
  <div class="gas-history-container">
    <n-card title="Gas Fee History & Analytics" :bordered="false" class="gas-card">
      <n-space vertical>
        <!-- Chain Selector -->
        <n-space align="center">
          <span>Select Chain:</span>
          <n-select
            v-model:value="selectedChain"
            :options="chainOptions"
            style="width: 200px"
            @update:value="loadData"
          />
          <n-button type="primary" @click="loadData" :loading="loading">
            <template #icon>
              <span>🔄</span>
            </template>
            Refresh
          </n-button>
        </n-space>

        <!-- Current Gas Prices -->
        <n-grid :cols="4" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-statistic label="Slow (Safe)" :value="currentGas?.slow || 0" suffix="Gwei">
              <template #prefix>🐢</template>
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="Normal (Propose)" :value="currentGas?.normal || 0" suffix="Gwei">
              <template #prefix>🚗</template>
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="Fast" :value="currentGas?.fast || 0" suffix="Gwei">
              <template #prefix>🚀</template>
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="Base Fee" :value="currentGas?.baseFee || 0" suffix="Gwei">
              <template #prefix>⛽</template>
            </n-statistic>
          </n-gi>
        </n-grid>

        <!-- Recommendation -->
        <n-alert v-if="prediction" :type="getRecommendationType(prediction.recommendation)" show-icon>
          <template #header>Recommendation</template>
          {{ prediction.recommendation }}
        </n-alert>

        <!-- Tabs for different views -->
        <n-tabs type="line" animated>
          <n-tab-pane name="history" tab="📊 Historical Data">
            <n-space vertical>
              <n-space>
                <n-radio-group v-model="historyDays" @update:value="loadHistoricalData">
                  <n-radio-button value="7">7 Days</n-radio-button>
                  <n-radio-button value="14">14 Days</n-radio-button>
                  <n-radio-button value="30">30 Days</n-radio-button>
                </n-radio-group>
              </n-space>
              
              <!-- Historical Chart -->
              <div ref="historyChartRef" style="width: 100%; height: 300px;"></div>
            </n-space>
          </n-tab-pane>

          <n-tab-pane name="hourly" tab="⏰ Hourly Pattern">
            <n-space vertical>
              <n-space>
                <n-radio-group v-model="hourlyHours" @update:value="loadHourlyData">
                  <n-radio-button value="24">24 Hours</n-radio-button>
                  <n-radio-button value="48">48 Hours</n-radio-button>
                  <n-radio-button value="72">72 Hours</n-radio-button>
                </n-radio-group>
              </n-space>
              
              <!-- Hourly Chart -->
              <div ref="hourlyChartRef" style="width: 100%; height: 300px;"></div>
            </n-space>
          </n-tab-pane>

          <n-tab-pane name="stats" tab="📈 Statistics">
            <n-grid :cols="3" :x-gap="16" :y-gap="16">
              <n-gi>
                <n-statistic label="Average Slow" :value="stats?.avgSlow || 0" suffix="Gwei" />
              </n-gi>
              <n-gi>
                <n-statistic label="Average Normal" :value="stats?.avgNormal || 0" suffix="Gwei" />
              </n-gi>
              <n-gi>
                <n-statistic label="Average Fast" :value="stats?.avgFast || 0" suffix="Gwei" />
              </n-gi>
              <n-gi>
                <n-statistic label="Minimum" :value="stats?.min || 0" suffix="Gwei" />
              </n-gi>
              <n-gi>
                <n-statistic label="Maximum" :value="stats?.max || 0" suffix="Gwei" />
              </n-gi>
              <n-gi>
                <n-statistic label="Volatility" :value="stats?.volatility || 0" suffix="Gwei" />
              </n-gi>
            </n-grid>

            <!-- Stats Chart -->
            <div ref="statsChartRef" style="width: 100%; height: 300px; margin-top: 20px;"></div>
          </n-tab-pane>

          <n-tab-pane name="compare" tab="⚖️ Chain Comparison">
            <n-space vertical>
              <!-- Chain Ranking -->
              <n-alert v-if="chainComparison" type="info" show-icon>
                <template #header>Cheapest Chain to Use</template>
                {{ chainComparison.cheapest.chainName }} - Normal Gas: {{ chainComparison.cheapest.normal }} Gwei
              </n-alert>

              <!-- Comparison Table -->
              <n-data-table
                :columns="comparisonColumns"
                :data="chainComparison?.ranking || []"
                :bordered="false"
              />
            </n-space>
          </n-tab-pane>

          <n-tab-pane name="prediction" tab="🔮 Prediction">
            <n-space vertical>
              <n-grid :cols="2" :x-gap="16" :y-gap="16">
                <n-gi>
                  <n-card title="Current Prices" size="small">
                    <n-space vertical>
                      <n-space justify="space-between">
                        <span>Slow:</span>
                        <span>{{ prediction?.current?.slow || 0 }} Gwei</span>
                      </n-space>
                      <n-space justify="space-between">
                        <span>Normal:</span>
                        <span>{{ prediction?.current?.normal || 0 }} Gwei</span>
                      </n-space>
                      <n-space justify="space-between">
                        <span>Fast:</span>
                        <span>{{ prediction?.current?.fast || 0 }} Gwei</span>
                      </n-space>
                    </n-space>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card title="Predicted Prices" size="small">
                    <n-space vertical>
                      <n-space justify="space-between">
                        <span>Slow:</span>
                        <span>{{ prediction?.predicted?.slow || 0 }} Gwei</span>
                      </n-space>
                      <n-space justify="space-between">
                        <span>Normal:</span>
                        <span>{{ prediction?.predicted?.normal || 0 }} Gwei</span>
                      </n-space>
                      <n-space justify="space-between">
                        <span>Fast:</span>
                        <span>{{ prediction?.predicted?.fast || 0 }} Gwei</span>
                      </n-space>
                      <n-space justify="space-between">
                        <span>Trend:</span>
                        <n-tag :type="getTrendType(prediction?.predicted?.trend)">
                          {{ prediction?.predicted?.trend || 'unknown' }}
                        </n-tag>
                      </n-space>
                    </n-space>
                  </n-card>
                </n-gi>
              </n-grid>

              <!-- Best Trading Hours -->
              <n-card title="Best Trading Hours" size="small" v-if="bestHours">
                <n-space vertical>
                  <n-space>
                    <span>Best hours (lowest gas):</span>
                    <n-tag v-for="hour in bestHours.bestHours" :key="hour" type="success">
                      {{ hour }}:00 UTC
                    </n-tag>
                  </n-space>
                  <n-space>
                    <span>Worst hours (highest gas):</span>
                    <n-tag v-for="hour in bestHours.worstHours" :key="hour" type="error">
                      {{ hour }}:00 UTC
                    </n-tag>
                  </n-space>
                  <n-p>{{ bestHours.recommendation }}</n-p>
                </n-space>
              </n-card>
            </n-space>
          </n-tab-pane>
        </n-tabs>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { NSelect, NButton, NCard, NTabs, NTabPane, NStatistic, NSpace, NGrid, NGi, NAlert, NRadioGroup, NRadioButton, NDataTable, NTag, NP } from 'naive-ui';
import * as echarts from 'echarts';

const selectedChain = ref(1);
const loading = ref(false);
const currentGas = ref<any>(null);
const historicalData = ref<any[]>([]);
const hourlyData = ref<any[]>([]);
const stats = ref<any>(null);
const prediction = ref<any>(null);
const bestHours = ref<any>(null);
const chainComparison = ref<any>(null);

const historyDays = ref('7');
const hourlyHours = ref('24');

const historyChartRef = ref<HTMLElement>();
const hourlyChartRef = ref<HTMLElement>();
const statsChartRef = ref<HTMLElement>();

let historyChart: any = null;
let hourlyChart: any = null;
let statsChart: any = null;

const chainOptions = [
  { label: 'Ethereum', value: 1 },
  { label: 'BNB Chain', value: 56 },
  { label: 'Polygon', value: 137 },
  { label: 'Arbitrum', value: 42161 },
  { label: 'Optimism', value: 10 },
  { label: 'Base', value: 8453 },
];

const comparisonColumns = [
  { title: 'Rank', key: 'rank', width: 80 },
  { title: 'Chain', key: 'chainName', width: 150 },
  { title: 'Slow (Gwei)', key: 'slow', width: 120 },
  { title: 'Normal (Gwei)', key: 'normal', width: 120 },
  { title: 'Fast (Gwei)', key: 'fast', width: 120 },
];

const API_BASE = 'http://localhost:3000';

async function loadData() {
  loading.value = true;
  try {
    const [gasRes, predRes, statsRes, hoursRes, compareRes] = await Promise.all([
      fetch(`${API_BASE}/gas-history/current?chainId=${selectedChain.value}`),
      fetch(`${API_BASE}/gas-history/prediction?chainId=${selectedChain.value}`),
      fetch(`${API_BASE}/gas-history/stats?chainId=${selectedChain.value}&days=7`),
      fetch(`${API_BASE}/gas-history/best-hours?chainId=${selectedChain.value}`),
      fetch(`${API_BASE}/gas-history/compare`),
    ]);

    currentGas.value = await gasRes.json();
    prediction.value = await predRes.json();
    stats.value = await statsRes.json();
    bestHours.value = await hoursRes.json();
    chainComparison.value = await compareRes.json();

    await loadHistoricalData();
    await loadHourlyData();
  } catch (error) {
    console.error('Failed to load gas data:', error);
    // Use mock data for demo
    currentGas.value = {
      chainId: selectedChain.value,
      slow: 20,
      normal: 25,
      fast: 35,
      baseFee: 15,
    };
    prediction.value = {
      recommendation: 'Gas prices are NORMAL - Good time for most transactions.',
      current: currentGas.value,
      predicted: { trend: 'stable' },
    };
    bestHours.value = {
      bestHours: [2, 3, 4, 5],
      worstHours: [15, 16, 17, 18],
      recommendation: 'Gas prices are typically lowest between 00:00-06:00 UTC',
    };
    chainComparison.value = {
      ranking: [
        { rank: 1, chainName: 'Arbitrum', slow: 0.1, normal: 0.15, fast: 0.2 },
        { rank: 2, chainName: 'Optimism', slow: 0.001, normal: 0.002, fast: 0.005 },
        { rank: 3, chainName: 'Base', slow: 0.5, normal: 1, fast: 2 },
        { rank: 4, chainName: 'BNB Chain', slow: 3, normal: 5, fast: 8 },
        { rank: 5, chainName: 'Polygon', slow: 40, normal: 50, fast: 80 },
        { rank: 6, chainName: 'Ethereum', slow: 20, normal: 25, fast: 35 },
      ],
      cheapest: { chainName: 'Arbitrum', normal: 0.15 },
    };
  } finally {
    loading.value = false;
  }
}

async function loadHistoricalData() {
  try {
    const res = await fetch(`${API_BASE}/gas-history/historical?chainId=${selectedChain.value}&days=${historyDays.value}`);
    historicalData.value = await res.json();
    await nextTick();
    renderHistoryChart();
  } catch (error) {
    // Mock data
    const days = parseInt(historyDays.value);
    historicalData.value = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 86400000).toISOString().split('T')[0],
      slow: 15 + Math.random() * 20,
      normal: 20 + Math.random() * 25,
      fast: 30 + Math.random() * 30,
    }));
    await nextTick();
    renderHistoryChart();
  }
}

async function loadHourlyData() {
  try {
    const res = await fetch(`${API_BASE}/gas-history/hourly?chainId=${selectedChain.value}&hours=${hourlyHours.value}`);
    hourlyData.value = await res.json();
    await nextTick();
    renderHourlyChart();
  } catch (error) {
    // Mock data
    const hours = parseInt(hourlyHours.value);
    hourlyData.value = Array.from({ length: hours }, (_, i) => ({
      date: new Date(Date.now() - (hours - i - 1) * 3600000).toISOString(),
      slow: 15 + Math.random() * 20,
      normal: 20 + Math.random() * 25,
      fast: 30 + Math.random() * 30,
    }));
    await nextTick();
    renderHourlyChart();
  }
}

function renderHistoryChart() {
  if (!historyChartRef.value) return;
  
  if (historyChart) {
    historyChart.dispose();
  }
  
  historyChart = echarts.init(historyChartRef.value);
  
  const dates = historicalData.value.map(d => d.date);
  
  historyChart.setOption({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Slow', 'Normal', 'Fast'],
    },
    xAxis: {
      type: 'category',
      data: dates,
    },
    yAxis: {
      type: 'value',
      name: 'Gas (Gwei)',
    },
    series: [
      {
        name: 'Slow',
        type: 'line',
        data: historicalData.value.map(d => d.slow?.toFixed(2)),
        smooth: true,
        itemStyle: { color: '#4CAF50' },
      },
      {
        name: 'Normal',
        type: 'line',
        data: historicalData.value.map(d => d.normal?.toFixed(2)),
        smooth: true,
        itemStyle: { color: '#2196F3' },
      },
      {
        name: 'Fast',
        type: 'line',
        data: historicalData.value.map(d => d.fast?.toFixed(2)),
        smooth: true,
        itemStyle: { color: '#F44336' },
      },
    ],
  });
}

function renderHourlyChart() {
  if (!hourlyChartRef.value) return;
  
  if (hourlyChart) {
    hourlyChart.dispose();
  }
  
  hourlyChart = echarts.init(hourlyChartRef.value);
  
  const times = hourlyData.value.map(d => {
    const date = new Date(d.date);
    return `${date.getHours()}:00`;
  });
  
  hourlyChart.setOption({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Slow', 'Normal', 'Fast'],
    },
    xAxis: {
      type: 'category',
      data: times,
    },
    yAxis: {
      type: 'value',
      name: 'Gas (Gwei)',
    },
    series: [
      {
        name: 'Slow',
        type: 'line',
        data: hourlyData.value.map(d => d.slow?.toFixed(2)),
        smooth: true,
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#4CAF50' },
      },
      {
        name: 'Normal',
        type: 'line',
        data: hourlyData.value.map(d => d.normal?.toFixed(2)),
        smooth: true,
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#2196F3' },
      },
      {
        name: 'Fast',
        type: 'line',
        data: hourlyData.value.map(d => d.fast?.toFixed(2)),
        smooth: true,
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#F44336' },
      },
    ],
  });
}

function renderStatsChart() {
  if (!statsChartRef.value || !stats.value) return;
  
  if (statsChart) {
    statsChart.dispose();
  }
  
  statsChart = echarts.init(statsChartRef.value);
  
  statsChart.setOption({
    tooltip: {},
    radar: {
      indicator: [
        { name: 'Avg Slow', max: 100 },
        { name: 'Avg Normal', max: 100 },
        { name: 'Avg Fast', max: 100 },
        { name: 'Min', max: 100 },
        { name: 'Max', max: 100 },
        { name: 'Volatility', max: 50 },
      ],
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              stats.value.avgSlow,
              stats.value.avgNormal,
              stats.value.avgFast,
              stats.value.min,
              stats.value.max,
              stats.value.volatility,
            ],
            name: 'Gas Stats',
          },
        ],
      },
    ],
  });
}

function getRecommendationType(recommendation: string) {
  if (recommendation?.includes('LOW')) return 'success';
  if (recommendation?.includes('HIGH')) return 'warning';
  if (recommendation?.includes('VERY HIGH')) return 'error';
  return 'info';
}

function getTrendType(trend: string) {
  switch (trend) {
    case 'increasing': return 'error';
    case 'decreasing': return 'success';
    default: return 'default';
  }
}

watch(stats, () => {
  nextTick(() => {
    renderStatsChart();
  });
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.gas-history-container {
  padding: 16px;
}

.gas-card {
  background: #fff;
  border-radius: 8px;
}

:deep(.n-statistic .n-statistic-value) {
  font-size: 24px;
  font-weight: bold;
}
</style>
