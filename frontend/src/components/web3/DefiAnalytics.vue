<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { NSelect, NCard, NGrid, NGi, NStatistic, NSpin, NTag, NTable, NButton, NEmpty, NProgress, NIcon, NDivider } from 'naive-ui';
import { 
  getDefiAnalyticsOverview, 
  getDefiProtocols, 
  getDefiProtocolDetails,
  getDefiProtocolHistory,
  getDefiCategories,
  getDefiChains,
  getTrendingDefiProtocols,
  getDefiRiskAnalysis,
  compareDefiProtocolsByName,
  type ProtocolInfo,
  type MarketOverview,
  type ProtocolHistory,
  type ChainStats
} from '@/service/api/web3';

// State
const isLoading = ref(false);
const activeTab = ref('overview');
const selectedProtocol = ref<string | null>(null);
const selectedCategory = ref<string | null>(null);
const selectedChain = ref<string | null>(null);
const sortBy = ref('tvl');

// Data
const overview = ref<MarketOverview | null>(null);
const protocols = ref<ProtocolInfo[]>([]);
const categories = ref<any[]>([]);
const chains = ref<any[]>([]);
const trending = ref<ProtocolInfo[]>([]);
const riskAnalysis = ref<any>(null);
const protocolHistory = ref<ProtocolHistory[]>([]);

// Format helpers
const formatNumber = (num: number): string => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const formatPercent = (num: number): string => {
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

const getRiskColor = (level: string): string => {
  switch (level) {
    case 'low': return 'success';
    case 'medium': return 'warning';
    case 'high': return 'error';
    default: return 'default';
  }
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'lending': 'Lending',
    'dex': 'DEX',
    'yield': 'Yield',
    'liquid-staking': 'Liquid Staking',
    'bridge': 'Bridge'
  };
  return labels[category] || category;
};

// Load data
const loadOverview = async () => {
  try {
    const response = await getDefiAnalyticsOverview();
    overview.value = response.data;
  } catch (error) {
    console.error('Failed to load overview:', error);
  }
};

const loadProtocols = async () => {
  isLoading.value = true;
  try {
    const params: any = { sortBy: sortBy.value };
    if (selectedCategory.value) params.category = selectedCategory.value;
    if (selectedChain.value) params.chain = selectedChain.value;
    
    const response = await getDefiAnalyticsProtocols(params);
    protocols.value = response.data || [];
  } catch (error) {
    console.error('Failed to load protocols:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const response = await getDefiCategories();
    categories.value = response.data || [];
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
};

const loadChains = async () => {
  try {
    const response = await getDefiChains();
    chains.value = response.data || [];
  } catch (error) {
    console.error('Failed to load chains:', error);
  }
};

const loadTrending = async () => {
  try {
    const response = await getTrendingDefiProtocols(5);
    trending.value = response.data || [];
  } catch (error) {
    console.error('Failed to load trending:', error);
  }
};

const loadRiskAnalysis = async () => {
  try {
    const response = await getDefiRiskAnalysis();
    riskAnalysis.value = response.data;
  } catch (error) {
    console.error('Failed to load risk analysis:', error);
  }
};

const loadProtocolDetails = async (name: string) => {
  selectedProtocol.value = name;
  isLoading.value = true;
  try {
    const [detailsRes, historyRes] = await Promise.all([
      getDefiProtocolDetails(name),
      getDefiProtocolHistory(name, 30)
    ]);
    selectedProtocol.value = detailsRes.data ? name : null;
    protocolHistory.value = historyRes.data || [];
  } catch (error) {
    console.error('Failed to load protocol details:', error);
    selectedProtocol.value = null;
  } finally {
    isLoading.value = false;
  }
};

// Tab change handler
const handleTabChange = (tab: string) => {
  activeTab.value = tab;
  if (tab === 'protocols') {
    loadProtocols();
  } else if (tab === 'risk') {
    loadRiskAnalysis();
  }
};

// Watch for filter changes
const handleFilterChange = () => {
  if (activeTab.value === 'protocols') {
    loadProtocols();
  }
};

onMounted(async () => {
  isLoading.value = true;
  await Promise.all([
    loadOverview(),
    loadCategories(),
    loadChains(),
    loadTrending(),
    loadProtocols()
  ]);
  isLoading.value = false;
});
</script>

<template>
  <div class="defi-analytics">
    <n-spin :show="isLoading">
      <!-- Header Stats -->
      <n-grid :cols="4" :x-gap="16" :y-gap="16" class="stats-grid">
        <n-gi>
          <n-card class="stat-card">
            <n-statistic label="Total DeFi TVL" :value="overview ? formatNumber(overview.totalTvl) : '-'">
              <template #suffix>
                <n-tag :type="overview && overview.totalTvlChange24h >= 0 ? 'success' : 'error'" size="small">
                  {{ overview ? formatPercent(overview.totalTvlChange24h) : '-' }}
                </n-tag>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="stat-card">
            <n-statistic label="24h Volume" :value="overview ? formatNumber(overview.totalVolume24h) : '-'"></n-statistic>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="stat-card">
            <n-statistic label="24h Fees" :value="overview ? formatNumber(overview.totalFees24h) : '-'"></n-statistic>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="stat-card">
            <n-statistic label="Top Chain" :value="overview?.topChains[0]?.chain || '-'">
              <template #suffix>
                <span class="text-sm text-gray-500">
                  {{ overview ? formatNumber(overview.topChains[0]?.totalTvl || 0) : '' }}
                </span>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
      </n-grid>

      <!-- Tabs -->
      <n-card class="mt-4">
        <div class="flex gap-2 mb-4">
          <n-button 
            :type="activeTab === 'overview' ? 'primary' : 'default'" 
            @click="handleTabChange('overview')"
          >
            Market Overview
          </n-button>
          <n-button 
            :type="activeTab === 'protocols' ? 'primary' : 'default'" 
            @click="handleTabChange('protocols')"
          >
            Protocols
          </n-button>
          <n-button 
            :type="activeTab === 'trending' ? 'primary' : 'default'" 
            @click="handleTabChange('trending')"
          >
            Trending
          </n-button>
          <n-button 
            :type="activeTab === 'risk' ? 'primary' : 'default'" 
            @click="handleTabChange('risk')"
          >
            Risk Analysis
          </n-button>
        </div>

        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          <n-divider>Top Chains</n-divider>
          <n-grid :cols="5" :x-gap="12" :y-gap="12">
            <n-gi v-for="chain in overview?.topChains" :key="chain.chainId">
              <n-card size="small" class="chain-card">
                <div class="font-bold">{{ chain.chain }}</div>
                <div class="text-sm text-gray-500">{{ formatNumber(chain.totalTvl) }}</div>
                <div class="text-xs text-gray-400">{{ chain.protocolCount }} protocols</div>
              </n-card>
            </n-gi>
          </n-grid>

          <n-divider>Top Protocols</n-divider>
          <n-table :single-line="false" size="small">
            <thead>
              <tr>
                <th>#</th>
                <th>Protocol</th>
                <th>Category</th>
                <th>TVL</th>
                <th>24h Change</th>
                <th>24h Volume</th>
                <th>Avg APY</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(protocol, index) in overview?.topProtocols" :key="protocol.name">
                <td>{{ index + 1 }}</td>
                <td>
                  <span class="mr-2">{{ protocol.logo }}</span>
                  {{ protocol.name }}
                </td>
                <td>
                  <n-tag size="small">{{ getCategoryLabel(protocol.category) }}</n-tag>
                </td>
                <td>{{ formatNumber(protocol.tvl) }}</td>
                <td>
                  <n-tag :type="protocol.tvlChange24h >= 0 ? 'success' : 'error'" size="small">
                    {{ formatPercent(protocol.tvlChange24h) }}
                  </n-tag>
                </td>
                <td>{{ formatNumber(protocol.volume24h) }}</td>
                <td>{{ protocol.avgApy.toFixed(1) }}%</td>
                <td>
                  <n-tag :type="getRiskColor(protocol.riskLevel)" size="small">
                    {{ protocol.riskLevel }}
                  </n-tag>
                </td>
              </tr>
            </tbody>
          </n-table>
        </div>

        <!-- Protocols Tab -->
        <div v-if="activeTab === 'protocols'">
          <div class="flex gap-2 mb-4">
            <n-select
              v-model:value="selectedCategory"
              placeholder="Category"
              clearable
              style="width: 150px"
              :options="categories.map(c => ({ label: c.label, value: c.name }))"
              @update:value="handleFilterChange"
            />
            <n-select
              v-model:value="selectedChain"
              placeholder="Chain"
              clearable
              style="width: 150px"
              :options="chains.map(c => ({ label: c.name, value: c.name }))"
              @update:value="handleFilterChange"
            />
            <n-select
              v-model:value="sortBy"
              style="width: 150px"
              :options="[
                { label: 'Sort by TVL', value: 'tvl' },
                { label: 'Sort by Volume', value: 'volume' },
                { label: 'Sort by APY', value: 'apy' },
                { label: 'Sort by Risk', value: 'risk' }
              ]"
              @update:value="handleFilterChange"
            />
          </div>

          <n-grid :cols="3" :x-gap="16" :y-gap="16">
            <n-gi v-for="protocol in protocols" :key="protocol.name">
              <n-card class="protocol-card" hoverable @click="loadProtocolDetails(protocol.name)">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ protocol.logo }}</span>
                  <div>
                    <div class="font-bold">{{ protocol.name }}</div>
                    <div class="text-xs text-gray-500">{{ protocol.chain }}</div>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div class="text-gray-500">TVL</div>
                    <div class="font-medium">{{ formatNumber(protocol.tvl) }}</div>
                  </div>
                  <div>
                    <div class="text-gray-500">24h Vol</div>
                    <div class="font-medium">{{ formatNumber(protocol.volume24h) }}</div>
                  </div>
                  <div>
                    <div class="text-gray-500">APY</div>
                    <div class="font-medium">{{ protocol.avgApy.toFixed(1) }}%</div>
                  </div>
                  <div>
                    <div class="text-gray-500">Risk</div>
                    <n-tag :type="getRiskColor(protocol.riskLevel)" size="small">
                      {{ protocol.riskLevel }}
                    </n-tag>
                  </div>
                </div>
                <n-progress
                  type="line"
                  :percentage="100 - protocol.riskScore"
                  :indicator-placement="'inside'"
                  :height="6"
                  :color="protocol.riskScore < 30 ? '#18a058' : protocol.riskScore < 50 ? '#f0a020' : '#d03050'"
                  class="mt-2"
                >
                  Safety: {{ 100 - protocol.riskScore }}%
                </n-progress>
              </n-card>
            </n-gi>
          </n-grid>
        </div>

        <!-- Trending Tab -->
        <div v-if="activeTab === 'trending'">
          <n-grid :cols="5" :x-gap="16" :y-gap="16">
            <n-gi v-for="(protocol, index) in trending" :key="protocol.name">
              <n-card class="trending-card" hoverable>
                <div class="text-center">
                  <div class="text-3xl mb-2">🔥</div>
                  <div class="text-2xl font-bold">#{{ index + 1 }}</div>
                  <div class="text-3xl my-2">{{ protocol.logo }}</div>
                  <div class="font-bold">{{ protocol.name }}</div>
                  <div class="text-green-500 font-bold mt-2">
                    {{ formatPercent(protocol.tvlChange24h) }}
                  </div>
                  <div class="text-sm text-gray-500 mt-1">TVL Growth</div>
                </div>
              </n-card>
            </n-gi>
          </n-grid>
        </div>

        <!-- Risk Analysis Tab -->
        <div v-if="activeTab === 'risk' && riskAnalysis">
          <n-divider>Risk Distribution</n-divider>
          <n-grid :cols="3" :x-gap="16" :y-gap="16">
            <n-gi>
              <n-card class="risk-card low">
                <div class="text-center">
                  <div class="text-4xl mb-2">🛡️</div>
                  <div class="text-3xl font-bold text-green-500">
                    {{ riskAnalysis.summary.lowCount }}
                  </div>
                  <div class="text-gray-500">Low Risk Protocols</div>
                </div>
              </n-card>
            </n-gi>
            <n-gi>
              <n-card class="risk-card medium">
                <div class="text-center">
                  <div class="text-4xl mb-2">⚠️</div>
                  <div class="text-3xl font-bold text-yellow-500">
                    {{ riskAnalysis.summary.mediumCount }}
                  </div>
                  <div class="text-gray-500">Medium Risk Protocols</div>
                </div>
              </n-card>
            </n-gi>
            <n-gi>
              <n-card class="risk-card high">
                <div class="text-center">
                  <div class="text-4xl mb-2">🚨</div>
                  <div class="text-3xl font-bold text-red-500">
                    {{ riskAnalysis.summary.highCount }}
                  </div>
                  <div class="text-gray-500">High Risk Protocols</div>
                </div>
              </n-card>
            </n-gi>
          </n-grid>
        </div>
      </n-card>
    </n-spin>
  </div>
</template>

<style scoped>
.defi-analytics {
  padding: 16px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card :deep(.n-statistic .n-statistic-label) {
  color: rgba(255, 255, 255, 0.8);
}

.stat-card :deep(.n-statistic .n-statistic-value) {
  color: white;
}

.stats-grid {
  margin-bottom: 16px;
}

.protocol-card {
  transition: transform 0.2s;
}

.protocol-card:hover {
  transform: translateY(-4px);
}

.trending-card {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
}

.risk-card.low {
  border-left: 4px solid #18a058;
}

.risk-card.medium {
  border-left: 4px solid #f0a020;
}

.risk-card.high {
  border-left: 4px solid #d03050;
}

.chain-card {
  text-align: center;
  background: #f8f9fa;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-1 {
  margin-top: 4px;
}

.mb-2 {
  margin-bottom: 8px;
}

.text-sm {
  font-size: 14px;
}

.text-xs {
  font-size: 12px;
}

.text-gray-500 {
  color: #666;
}

.text-gray-400 {
  color: #999;
}

.text-green-500 {
  color: #18a058;
}

.font-bold {
  font-weight: 600;
}

.font-medium {
  font-weight: 500;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 8px;
}

.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.text-center {
  text-align: center;
}
</style>
