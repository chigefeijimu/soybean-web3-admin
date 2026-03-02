<template>
  <div class="token-correlation">
    <n-card title="📊 Token Correlation Matrix" :bordered="false" class="correlation-card">
      <n-space vertical :size="16">
        <!-- Controls -->
        <n-space align="center" :size="12">
          <n-select
            v-model:value="selectedChain"
            :options="chainOptions"
            style="width: 150px"
            placeholder="Select Chain"
          />
          <n-select
            v-model:value="selectedTimeframe"
            :options="timeframeOptions"
            style="width: 120px"
            placeholder="Timeframe"
          />
          <n-button type="primary" @click="loadData" :loading="loading">
            <template #icon>
              <n-icon><Refresh /></n-icon>
            </template>
            Analyze
          </n-button>
        </n-space>

        <!-- Diversification Score -->
        <n-card v-if="diversificationData" class="diversification-card">
          <n-space vertical :size="12">
            <n-statistic label="Portfolio Diversification Score" :value="diversificationData.diversificationScore">
              <template #suffix>/ 100</template>
            </n-statistic>
            <n-tag :type="getRatingType(diversificationData.rating)">
              {{ diversificationData.rating.toUpperCase() }}
            </n-tag>
            <n-text depth="3">Avg Correlation: {{ diversificationData.averageCorrelation }}</n-text>
            
            <!-- Risky Pairs -->
            <n-collapse v-if="diversificationData.riskyPairs?.length">
              <n-collapse-item title="⚠️ High Risk Pairs" name="risky">
                <n-space vertical>
                  <n-tag v-for="pair in diversificationData.riskyPairs" :key="`${pair.tokenA}-${pair.tokenB}`" type="warning">
                    {{ pair.tokenA }} ↔ {{ pair.tokenB }}: {{ pair.correlation.toFixed(2) }}
                  </n-tag>
                </n-space>
              </n-collapse-item>
            </n-collapse>

            <!-- Recommendations -->
            <n-space vertical v-if="diversificationData.recommendations?.length">
              <n-text strong>💡 Recommendations:</n-text>
              <n-ul>
                <n-li v-for="(rec, idx) in diversificationData.recommendations" :key="idx">
                  <n-text>{{ rec }}</n-text>
                </n-li>
              </n-ul>
            </n-space>
          </n-space>
        </n-card>

        <!-- Heatmap -->
        <n-card title="Correlation Heatmap" :bordered="false" class="heatmap-card">
          <div v-if="heatmapData" class="heatmap-container">
            <div class="heatmap">
              <div class="heatmap-row heatmap-header">
                <div class="heatmap-cell header-cell"></div>
                <div 
                  v-for="token in heatmapData.map(h => h.token)" 
                  :key="token"
                  class="heatmap-cell header-cell"
                >
                  {{ token }}
                </div>
              </div>
              <div v-for="(row, rowIdx) in heatmapData" :key="row.token" class="heatmap-row">
                <div class="heatmap-cell row-header">{{ row.token }}</div>
                <div 
                  v-for="cell in row.values" 
                  :key="cell.token"
                  class="heatmap-cell"
                  :style="{ backgroundColor: cell.color }"
                  :title="`${row.token} ↔ ${cell.token}: ${cell.correlation}`"
                >
                  {{ cell.correlation }}
                </div>
              </div>
            </div>
            
            <!-- Legend -->
            <div class="heatmap-legend">
              <span>-1.0</span>
              <div class="legend-gradient"></div>
              <span>+1.0</span>
            </div>
          </div>
          <n-empty v-else description="Click Analyze to load data" />
        </n-card>

        <!-- Correlation Matrix -->
        <n-card title="Detailed Correlation Matrix" :bordered="false" v-if="correlationData">
          <n-space vertical>
            <n-data-table
              :columns="matrixColumns"
              :data="matrixTableData"
              :bordered="false"
              :single-line="false"
              max-height="400px"
            />
          </n-space>
        </n-card>

        <!-- Top Correlations -->
        <n-card title="🔥 Top Correlations" :bordered="false" v-if="topCorrelations">
          <n-tabs type="segment" animated>
            <n-tab-pane name="positive" tab="Positive">
              <n-space vertical>
                <n-card 
                  v-for="item in topPositiveCorrelations" 
                  :key="item.token" 
                  size="small"
                  :class="'correlation-item ' + (item.correlation > 0.7 ? 'high-risk' : '')"
                >
                  <n-space justify="space-between" align="center">
                    <n-text strong>{{ item.token }}</n-text>
                    <n-tag :type="getCorrelationTagType(item.correlation)">
                      {{ item.correlation.toFixed(3) }} ({{ item.strength }})
                    </n-tag>
                  </n-space>
                </n-card>
              </n-space>
            </n-tab-pane>
            <n-tab-pane name="negative" tab="Negative">
              <n-space vertical>
                <n-card 
                  v-for="item in topNegativeCorrelations" 
                  :key="item.token" 
                  size="small"
                >
                  <n-space justify="space-between" align="center">
                    <n-text strong>{{ item.token }}</n-text>
                    <n-tag :type="getCorrelationTagType(item.correlation)">
                      {{ item.correlation.toFixed(3) }} ({{ item.strength }})
                    </n-tag>
                  </n-space>
                </n-card>
              </n-space>
            </n-tab-pane>
          </n-tabs>
        </n-card>

        <!-- Token Selector for Custom Analysis -->
        <n-card title="🎯 Custom Portfolio Analysis" :bordered="false">
          <n-space vertical :size="12">
            <n-select
              v-model="selectedTokens"
              multiple
              filterable
              placeholder="Select tokens for analysis"
              :options="tokenOptions"
              :max-tag-count="8"
            />
            <n-button 
              type="primary" 
              @click="analyzePortfolio" 
              :disabled="selectedTokens.length < 2"
              :loading="loading"
            >
              Analyze Portfolio
            </n-button>
          </n-space>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { NCard, NSpace, NButton, NSelect, NStatistic, NTag, NText, NCollapse, NCollapseItem, NDataTable, NTabs, NTabPane, NEmpty, NIcon, NUl, NLi } from 'naive-ui';
import { Refresh } from '@vicons/ionicons5';
import { tokenCorrelation } from '@/service/api/tokenCorrelation';

const loading = ref(false);
const selectedChain = ref('ethereum');
const selectedTimeframe = ref('30d');
const selectedTokens = ref<string[]>(['ETH', 'BTC', 'SOL', 'BNB']);

const chainOptions = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
  { label: 'BSC', value: 'bsc' },
  { label: 'Avalanche', value: 'avalanche' },
  { label: 'Base', value: 'base' },
  { label: 'Solana', value: 'solana' },
];

const timeframeOptions = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

const tokenOptions = [
  { label: 'ETH', value: 'ETH' },
  { label: 'BTC', value: 'BTC' },
  { label: 'SOL', value: 'SOL' },
  { label: 'BNB', value: 'BNB' },
  { label: 'XRP', value: 'XRP' },
  { label: 'ADA', value: 'ADA' },
  { label: 'MATIC', value: 'MATIC' },
  { label: 'AVAX', value: 'AVAX' },
  { label: 'LINK', value: 'LINK' },
  { label: 'UNI', value: 'UNI' },
  { label: 'AAVE', value: 'AAVE' },
  { label: 'MKR', value: 'MKR' },
  { label: 'CRV', value: 'CRV' },
  { label: 'WBTC', value: 'WBTC' },
  { label: 'DOGE', value: 'DOGE' },
  { label: 'SHIB', value: 'SHIB' },
  { label: 'DOT', value: 'DOT' },
  { label: 'ATOM', value: 'ATOM' },
];

const correlationData = ref<any>(null);
const diversificationData = ref<any>(null);
const heatmapData = ref<any>(null);
const topCorrelations = ref<any>(null);

const matrixColumns = computed(() => {
  if (!correlationData?.tokens) return [];
  
  const tokens = correlationData.value.tokens;
  const columns = [
    {
      title: 'Token',
      key: 'tokenA',
      width: 80,
    },
  ];
  
  tokens.forEach((token: string) => {
    columns.push({
      title: token,
      key: token,
      width: 80,
      render: (row: any) => {
        const value = row[token];
        return h('span', {
          style: {
            color: getCorrelationColor(value),
            fontWeight: Math.abs(value) > 0.6 ? 'bold' : 'normal',
          },
        }, value?.toFixed(2) || '-');
      },
    });
  });
  
  return columns;
});

const matrixTableData = computed(() => {
  if (!correlationData?.matrix || !correlationData?.tokens) return [];
  
  const tokens = correlationData.value.tokens;
  const matrix = correlationData.value.matrix;
  
  return tokens.map((token: string, i: number) => {
    const row: any = { tokenA: token };
    tokens.forEach((t: string, j: number) => {
      const cell = matrix.find((m: any) => m.tokenA === token && m.tokenB === t);
      row[t] = cell?.correlation || 0;
    });
    return row;
  });
});

const topPositiveCorrelations = computed(() => {
  if (!topCorrelations.value?.correlations) return [];
  return topCorrelations.value.correlations
    .filter((c: any) => c.correlation > 0)
    .sort((a: any, b: any) => b.correlation - a.correlation)
    .slice(0, 5);
});

const topNegativeCorrelations = computed(() => {
  if (!topCorrelations.value?.correlations) return [];
  return topCorrelations.value.correlations
    .filter((c: any) => c.correlation < 0)
    .sort((a: any, b: any) => a.correlation - b.correlation)
    .slice(0, 5);
});

const getCorrelationColor = (value: number): string => {
  if (value >= 0.8) return '#166534';
  if (value >= 0.6) return '#22c55e';
  if (value >= 0.4) return '#15803d';
  if (value >= 0.2) return '#86efac';
  if (value >= 0) return '#86efac';
  if (value >= -0.2) return '#fecaca';
  if (value >= -0.4) return '#f87171';
  if (value >= -0.6) return '#dc2626';
  return '#991b1b';
};

const getRatingType = (rating: string) => {
  switch (rating) {
    case 'excellent': return 'success';
    case 'good': return 'info';
    case 'moderate': return 'warning';
    case 'poor': return 'error';
    default: return 'error';
  }
};

const getCorrelationTagType = (value: number) => {
  if (value >= 0.6) return 'success';
  if (value >= 0.3) return 'info';
  if (value >= 0) return 'default';
  if (value >= -0.3) return 'default';
  if (value >= -0.6) return 'warning';
  return 'error';
};

const loadData = async () => {
  loading.value = true;
  try {
    // Load heatmap data
    const heatmapRes = await tokenCorrelation.getHeatmapData({
      chain: selectedChain.value,
      timeframe: selectedTimeframe.value,
    });
    heatmapData.value = heatmapRes.data.heatmap;

    // Load diversification data
    const divRes = await tokenCorrelation.getDiversificationScore({
      tokens: selectedTokens.value.join(','),
      chain: selectedChain.value,
      timeframe: selectedTimeframe.value,
    });
    diversificationData.value = divRes.data;

    // Load top correlations for first token
    const topRes = await tokenCorrelation.getTopCorrelations({
      token: selectedTokens.value[0] || 'BTC',
      chain: selectedChain.value,
      timeframe: selectedTimeframe.value,
      limit: 10,
    });
    topCorrelations.value = topRes.data;

    // Load full matrix
    const matrixRes = await tokenCorrelation.getCorrelationMatrix({
      tokens: selectedTokens.value.join(','),
      chain: selectedChain.value,
      timeframe: selectedTimeframe.value,
    });
    correlationData.value = matrixRes.data;
  } catch (error) {
    console.error('Failed to load correlation data:', error);
  } finally {
    loading.value = false;
  }
};

const analyzePortfolio = async () => {
  await loadData();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.token-correlation {
  padding: 16px;
}

.correlation-card {
  margin-bottom: 16px;
}

.diversification-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.heatmap-container {
  overflow-x: auto;
}

.heatmap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 600px;
}

.heatmap-row {
  display: flex;
  gap: 2px;
}

.heatmap-cell {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  border-radius: 4px;
  transition: transform 0.2s;
}

.heatmap-cell:hover {
  transform: scale(1.1);
  z-index: 1;
}

.header-cell {
  font-weight: bold;
  background: #f5f5f5;
}

.row-header {
  width: 60px;
  font-weight: bold;
  background: #f5f5f5;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.legend-gradient {
  width: 200px;
  height: 12px;
  background: linear-gradient(to right, #991b1b, #dc2626, #f87171, #fecaca, #f0fdf4, #dcfce7, #22c55e, #166534);
  border-radius: 6px;
}

.correlation-item {
  transition: all 0.3s;
}

.correlation-item.high-risk {
  border-left: 3px solid #f59e0b;
}
</style>
