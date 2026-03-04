<template>
  <div class="defi-tvl-comparator">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <span class="title">📊 DeFi Protocol TVL Comparator</span>
          <div class="header-actions">
            <el-select v-model="selectedTimeRange" placeholder="Time Range" style="width: 120px" @change="fetchData">
              <el-option label="7 Days" value="7d" />
              <el-option label="30 Days" value="30d" />
              <el-option label="90 Days" value="90d" />
              <el-option label="1 Year" value="1y" />
            </el-select>
            <el-button :icon="Refresh" @click="fetchData">Refresh</el-button>
          </div>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <el-select v-model="selectedChains" multiple placeholder="All Chains" style="width: 100%" @change="fetchData">
            <el-option v-for="chain in availableChains" :key="chain.id" :label="chain.name" :value="chain.id" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select v-model="selectedCategories" multiple placeholder="All Categories" style="width: 100%" @change="fetchData">
            <el-option v-for="cat in availableCategories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" style="width: 100%" @click="showCompare = true">Compare Protocols</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Overview Stats -->
    <el-row :gutter="20" class="stats-row" v-if="comparison">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">${{ formatNumber(comparison.totalTVL) }}</div>
          <div class="stat-label">Total DeFi TVL</div>
          <div class="stat-change" :class="comparison.totalTVLChange24h >= 0 ? 'positive' : 'negative'">
            {{ comparison.totalTVLChange24h >= 0 ? '↑' : '↓' }} {{ Math.abs(comparison.totalTVLChange24h).toFixed(2) }}% (24h)
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ comparison.protocols.length }}</div>
          <div class="stat-label">Protocols Tracked</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ comparison.chains.length }}</div>
          <div class="stat-label">Chains Supported</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ topGainers.length }}</div>
          <div class="stat-label">Top Gainers (24h)</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Historical Trend Chart -->
    <el-card shadow="hover" v-if="comparison?.historicalTrend?.length">
      <template #header>
        <span>📈 TVL Historical Trend</span>
      </template>
      <div ref="trendChartRef" style="width: 100%; height: 300px;"></div>
    </el-card>

    <!-- Category Breakdown -->
    <el-row :gutter="20" v-if="categoryBreakdown.length">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>🏷️ Category Distribution</span>
          </template>
          <div ref="categoryChartRef" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>⛓️ Chain TVL Distribution</span>
          </template>
          <div ref="chainChartRef" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Top Gainers -->
    <el-card shadow="hover" v-if="topGainers.length">
      <template #header>
        <div class="card-header">
          <span>🚀 Top Gainers</span>
          <el-radio-group v-model="gainersPeriod" size="small" @change="fetchTopGainers">
            <el-radio-button label="24h">24h</el-radio-button>
            <el-radio-button label="7d">7d</el-radio-button>
            <el-radio-button label="30d">30d</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-table :data="topGainers" stripe>
        <el-table-column prop="rank" label="Rank" width="60" />
        <el-table-column prop="name" label="Protocol" width="150" />
        <el-table-column prop="category" label="Category" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="chain" label="Chain" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.chain }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tvl" label="TVL" width="140">
          <template #default="{ row }">
            ${{ formatNumber(row.tvl) }}
          </template>
        </el-table-column>
        <el-table-column :label="gainersPeriod === '24h' ? '24h Change' : gainersPeriod === '7d' ? '7d Change' : '30d Change'" width="120">
          <template #default="{ row }">
            <span :class="getChangeClass(row, gainersPeriod)">
              {{ getChangeValue(row, gainersPeriod) >= 0 ? '+' : '' }}{{ getChangeValue(row, gainersPeriod).toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Protocol List -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>💰 All Protocols by TVL</span>
          <el-input v-model="searchQuery" placeholder="Search protocols..." style="width: 200px" size="small" />
        </div>
      </template>
      <el-table :data="filteredProtocols" stripe>
        <el-table-column prop="rank" label="Rank" width="60" />
        <el-table-column prop="name" label="Protocol" width="180">
          <template #default="{ row }">
            <div class="protocol-name">
              <strong>{{ row.name }}</strong>
              <el-tag size="small" type="info">{{ row.category }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="chain" label="Chain" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.chain }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tvl" label="TVL" width="150">
          <template #default="{ row }">
            <div class="tvl-cell">
              <span class="tvl-value">${{ formatNumber(row.tvl) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="tvlChange24h" label="24h %" width="100">
          <template #default="{ row }">
            <span :class="row.tvlChange24h >= 0 ? 'positive' : 'negative'">
              {{ row.tvlChange24h >= 0 ? '↑' : '↓' }}{{ Math.abs(row.tvlChange24h).toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="tvlChange7d" label="7d %" width="100">
          <template #default="{ row }">
            <span :class="row.tvlChange7d >= 0 ? 'positive' : 'negative'">
              {{ row.tvlChange7d >= 0 ? '↑' : '↓' }}{{ Math.abs(row.tvlChange7d).toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="tvlChange30d" label="30d %" width="100">
          <template #default="{ row }">
            <span :class="row.tvlChange30d >= 0 ? 'positive' : 'negative'">
              {{ row.tvlChange30d >= 0 ? '↑' : '↓' }}{{ Math.abs(row.tvlChange30d).toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewProtocolDetails(row)">Details</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Protocol Details Drawer -->
    <el-drawer v-model="showDetails" :title="selectedProtocol?.name || 'Protocol Details'" size="50%">
      <div v-if="protocolDetails" class="protocol-details">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover" class="detail-card">
              <div class="detail-value">${{ formatNumber(protocolDetails.totalTVL) }}</div>
              <div class="detail-label">Total TVL</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="detail-card">
              <div class="detail-value" :class="protocolDetails.tvlChange24h >= 0 ? 'positive' : 'negative'">
                {{ protocolDetails.tvlChange24h >= 0 ? '+' : '' }}{{ protocolDetails.tvlChange24h.toFixed(2) }}%
              </div>
              <div class="detail-label">24h Change</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="detail-card">
              <div class="detail-value">{{ protocolDetails.topHolderPercent }}%</div>
              <div class="detail-label">Top Holder %</div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="hover" class="mt-4">
          <template #header>
            <span>📊 TVL History</span>
          </template>
          <div ref="protocolChartRef" style="width: 100%; height: 250px;"></div>
        </el-card>

        <el-card shadow="hover" class="mt-4">
          <template #header>
            <span>⛓️ Chain Breakdown</span>
          </template>
          <el-table :data="protocolDetails.chainBreakdown" stripe>
            <el-table-column prop="chain" label="Chain" />
            <el-table-column prop="tvl" label="TVL">
              <template #default="{ row }">
                ${{ formatNumber(row.tvl) }}
              </template>
            </el-table-column>
            <el-table-column prop="tvlShare" label="Share">
              <template #default="{ row }">
                {{ row.tvlShare.toFixed(2) }}%
              </template>
            </el-table-column>
            <el-table-column prop="rank" label="Rank" />
          </el-table>
        </el-card>
      </div>
    </el-drawer>

    <!-- Compare Dialog -->
    <el-dialog v-model="showCompare" title="Compare Protocols" width="60%">
      <el-select v-model="compareProtocols" multiple placeholder="Select protocols to compare" style="width: 100%">
        <el-option v-for="p in comparison?.protocols || []" :key="p.id" :label="p.name" :value="p.id" />
      </el-select>
      <template #footer>
        <el-button @click="showCompare = false">Cancel</el-button>
        <el-button type="primary" @click="compareSelected">Compare</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { 
  getTVLComparison, 
  getTopGainers, 
  getCategoryBreakdown, 
  getSupportedChains, 
  getSupportedCategories,
  getProtocolDetails,
  type TVLComparison as TVLComparisonType,
  type ProtocolTVL,
  type CategoryBreakdown,
  type ProtocolDetails
} from '@/service/defiTvlComparator';

const comparison = ref<TVLComparisonType | null>(null);
const topGainers = ref<ProtocolTVL[]>([]);
const categoryBreakdown = ref<CategoryBreakdown[]>([]);
const availableChains = ref<{ id: string; name: string }[]>([]);
const availableCategories = ref<string[]>([]);
const protocolDetails = ref<ProtocolDetails | null>(null);

const selectedChains = ref<string[]>([]);
const selectedCategories = ref<string[]>([]);
const selectedTimeRange = ref('30d');
const gainersPeriod = ref('24h');
const searchQuery = ref('');

const showDetails = ref(false);
const showCompare = ref(false);
const selectedProtocol = ref<ProtocolTVL | null>(null);
const compareProtocols = ref<string[]>([]);

const trendChartRef = ref<HTMLElement | null>(null);
const categoryChartRef = ref<HTMLElement | null>(null);
const chainChartRef = ref<HTMLElement | null>(null);
const protocolChartRef = ref<HTMLElement | null>(null);

const filteredProtocols = computed(() => {
  if (!comparison.value?.protocols) return [];
  if (!searchQuery.value) return comparison.value.protocols;
  return comparison.value.protocols.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const formatNumber = (num: number): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const getChangeClass = (row: ProtocolTVL, period: string) => {
  const value = getChangeValue(row, period);
  return value >= 0 ? 'positive' : 'negative';
};

const getChangeValue = (row: ProtocolTVL, period: string): number => {
  switch (period) {
    case '7d': return row.tvlChange7d;
    case '30d': return row.tvlChange30d;
    default: return row.tvlChange24h;
  }
};

const fetchData = async () => {
  try {
    const [comparisonRes, categoriesRes, chainsRes] = await Promise.all([
      getTVLComparison({
        chains: selectedChains.value.length ? selectedChains.value : undefined,
        categories: selectedCategories.value.length ? selectedCategories.value : undefined,
        timeRange: selectedTimeRange.value
      }),
      getCategoryBreakdown(),
      getSupportedChains()
    ]);

    if (comparisonRes.data.success) {
      comparison.value = comparisonRes.data.data;
    }
    if (categoriesRes.data.success) {
      categoryBreakdown.value = categoriesRes.data.data;
    }
    if (chainsRes.data.success) {
      availableChains.value = chainsRes.data.data;
      availableCategories.value = ['dex', 'lending', 'staking', 'bridge', 'derivatives', 'yield', 'nft'];
    }

    await fetchTopGainers();
    await nextTick();
    initCharts();
  } catch (error) {
    ElMessage.error('Failed to fetch TVL data');
  }
};

const fetchTopGainers = async () => {
  try {
    const res = await getTopGainers(10, gainersPeriod.value);
    if (res.data.success) {
      topGainers.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to fetch top gainers');
  }
};

const viewProtocolDetails = async (protocol: ProtocolTVL) => {
  selectedProtocol.value = protocol;
  showDetails.value = true;
  try {
    const res = await getProtocolDetails(protocol.id);
    if (res.data.success) {
      protocolDetails.value = res.data.data;
      await nextTick();
      initProtocolChart();
    }
  } catch (error) {
    ElMessage.error('Failed to fetch protocol details');
  }
};

const compareSelected = () => {
  showCompare.value = false;
  ElMessage.info(`Comparing ${compareProtocols.value.length} protocols`);
};

const initCharts = () => {
  if (comparison.value?.historicalTrend?.length && trendChartRef.value) {
    const chart = echarts.init(trendChartRef.value);
    const dates = comparison.value.historicalTrend.map(d => d.date.slice(5));
    const values = comparison.value.historicalTrend.map(d => d.tvl / 1e9);
    
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { 
        type: 'value', 
        axisLabel: { formatter: (v: number) => '$' + v.toFixed(0) + 'B' }
      },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#409eff' }
      }]
    });
  }

  if (categoryBreakdown.value.length && categoryChartRef.value) {
    const chart = echarts.init(categoryChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ${c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: categoryBreakdown.value.map(c => ({
          name: c.name,
          value: c.totalTVL
        }))
      }]
    });
  }

  if (comparison.value?.chains.length && chainChartRef.value) {
    const chart = echarts.init(chainChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: comparison.value.chains.map(c => c.chain) },
      yAxis: { 
        type: 'value', 
        axisLabel: { formatter: (v: number) => '$' + (v / 1e9).toFixed(0) + 'B' }
      },
      series: [{
        type: 'bar',
        data: comparison.value.chains.map(c => c.tvl / 1e9),
        itemStyle: { color: '#67c23a' }
      }]
    });
  }
};

const initProtocolChart = () => {
  if (protocolDetails.value?.historicalTrend?.length && protocolChartRef.value) {
    const chart = echarts.init(protocolChartRef.value);
    const dates = protocolDetails.value.historicalTrend.map(d => d.date.slice(5));
    const values = protocolDetails.value.historicalTrend.map(d => d.tvl / 1e9);
    
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { 
        type: 'value', 
        axisLabel: { formatter: (v: number) => '$' + v.toFixed(0) + 'B' }
      },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#e6a23c' }
      }]
    });
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.defi-tvl-comparator {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-change {
  font-size: 14px;
  margin-top: 5px;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.protocol-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tvl-cell {
  font-weight: 500;
}

.detail-card {
  text-align: center;
}

.detail-value {
  font-size: 20px;
  font-weight: 700;
}

.detail-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
