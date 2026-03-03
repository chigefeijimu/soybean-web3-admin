<template>
  <div class="defi-protocol-explorer">
    <n-card title="🔬 DeFi Protocol Explorer" :bordered="false" class="explorer-card">
      <n-tabs type="line" animated>
        <!-- Dashboard Tab -->
        <n-tab-pane name="dashboard" tab="📊 Dashboard">
          <n-spin :show="loading">
            <n-grid :cols="4" :x-gap="16" :y-gap="16" class="stats-grid">
              <n-gi>
                <n-card class="stat-card">
                  <n-statistic label="Total Protocols" :value="dashboardData.totalProtocols" />
                </n-card>
              </n-gi>
              <n-gi>
                <n-card class="stat-card">
                  <n-statistic label="Total TVL" :value="formatNumber(dashboardData.totalTvl)" prefix="$">
                    <template #suffix>USD</template>
                  </n-statistic>
                </n-card>
              </n-gi>
              <n-gi>
                <n-card class="stat-card">
                  <n-statistic label="24h Revenue" :value="formatNumber(dashboardData.totalRevenue24h)" prefix="$">
                    <template #suffix>USD</template>
                  </n-statistic>
                </n-card>
              </n-gi>
              <n-gi>
                <n-card class="stat-card">
                  <n-statistic label="24h Users" :value="formatNumber(dashboardData.totalUsers24h)" />
                </n-card>
              </n-gi>
            </n-grid>

            <n-divider>Top Protocols by TVL</n-divider>
            <n-space vertical :size="12">
              <n-card v-for="protocol in dashboardData.topProtocols" :key="protocol.id" hoverable class="protocol-row">
                <n-space justify="space-between" align="center">
                  <n-space align="center" :size="12">
                    <n-avatar :src="protocol.logo" :size="40" round />
                    <n-space vertical :size="2">
                      <n-text strong>{{ protocol.name }}</n-text>
                      <n-text depth="3">{{ protocol.symbol }}</n-text>
                    </n-space>
                  </n-space>
                  <n-space align="center" :size="16">
                    <n-space vertical align="end" :size="2">
                      <n-text strong>{{ formatTVL(protocol.tvl) }}</n-text>
                      <n-text :type="protocol.tvlChange24h >= 0 ? 'success' : 'error'">
                        {{ protocol.tvlChange24h >= 0 ? '↑' : '↓' }} {{ Math.abs(protocol.tvlChange24h).toFixed(2) }}%
                      </n-text>
                    </n-space>
                  </n-space>
                </n-space>
              </n-card>
            </n-space>
          </n-spin>
        </n-tab-pane>

        <!-- Browse Protocols Tab -->
        <n-tab-pane name="browse" tab="📋 Browse Protocols">
          <n-space vertical :size="16">
            <n-space :size="12">
              <n-select
                v-model="filters.category"
                :options="categoryOptions"
                placeholder="All Categories"
                clearable
                style="width: 200px"
              />
              <n-select
                v-model="filters.chain"
                :options="chainOptions"
                placeholder="All Chains"
                clearable
                style="width: 180px"
              />
              <n-select
                v-model="filters.sort"
                :options="sortOptions"
                placeholder="Sort by"
                style="width: 180px"
              />
              <n-input
                v-model:value="searchQuery"
                placeholder="Search protocols..."
                clearable
                style="width: 250px"
              >
                <template #prefix>🔍</template>
              </n-input>
            </n-space>

            <n-spin :show="loading">
              <n-grid :cols="3" :x-gap="16" :y-gap="16">
                <n-gi v-for="protocol in filteredProtocols" :key="protocol.id">
                  <n-card class="protocol-card" hoverable @click="viewProtocol(protocol)">
                    <n-space vertical :size="12">
                      <n-space justify="space-between" align="center">
                        <n-space align="center" :size="10">
                          <n-avatar :src="protocol.logo" :size="48" round />
                          <n-space vertical :size="2">
                            <n-text strong style="font-size: 16px">{{ protocol.name }}</n-text>
                            <n-text depth="3">{{ protocol.symbol }}</n-text>
                          </n-space>
                        </n-space>
                        <n-tag :type="getCategoryType(protocol.category)">{{ protocol.category }}</n-tag>
                      </n-space>

                      <n-divider style="margin: 8px 0" />

                      <n-grid :cols="2" :x-gap="8" :y-gap="8">
                        <n-gi>
                          <n-text depth="3">TVL</n-text>
                          <br />
                          <n-text strong>{{ formatTVL(protocol.tvl) }}</n-text>
                        </n-gi>
                        <n-gi>
                          <n-text depth="3">24h Change</n-text>
                          <br />
                          <n-text :type="protocol.tvlChange24h >= 0 ? 'success' : 'error'">
                            {{ protocol.tvlChange24h >= 0 ? '+' : '' }}{{ protocol.tvlChange24h.toFixed(2) }}%
                          </n-text>
                        </n-gi>
                        <n-gi>
                          <n-text depth="3">24h Revenue</n-text>
                          <br />
                          <n-text strong>${{ formatNumber(protocol.revenue24h) }}</n-text>
                        </n-gi>
                        <n-gi>
                          <n-text depth="3">Risk Score</n-text>
                          <br />
                          <n-tag :type="getRiskType(protocol.riskScore)" size="small">
                            {{ protocol.riskScore }}
                          </n-tag>
                        </n-gi>
                      </n-grid>

                      <n-space :size="8">
                        <n-tag v-for="chain in protocol.chains.slice(0, 3)" :key="chain" size="small">
                          {{ chain.toUpperCase() }}
                        </n-tag>
                      </n-space>
                    </n-space>
                  </n-card>
                </n-gi>
              </n-grid>
            </n-spin>
          </n-space>
        </n-tab-pane>

        <!-- Search Tab -->
        <n-tab-pane name="search" tab="🔎 Search">
          <n-space vertical :size="16">
            <n-input
              v-model:value="searchQuery"
              placeholder="Search by name, symbol, category..."
              size="large"
              clearable
              @keyup.enter="searchProtocols"
            >
              <template #prefix>🔍</template>
            </n-input>
            <n-button type="primary" @click="searchProtocols" :loading="loading" block>
              Search
            </n-button>

            <n-divider v-if="searchResults.length > 0">Search Results</n-divider>
            <n-space vertical :size="12">
              <n-card
                v-for="protocol in searchResults"
                :key="protocol.id"
                hoverable
                class="protocol-row"
                @click="viewProtocol(protocol)"
              >
                <n-space justify="space-between" align="center">
                  <n-space align="center" :size="12">
                    <n-avatar :src="protocol.logo" :size="40" round />
                    <n-space vertical :size="2">
                      <n-text strong>{{ protocol.name }}</n-text>
                      <n-text depth="3">{{ protocol.description?.substring(0, 60) }}...</n-text>
                    </n-space>
                  </n-space>
                  <n-space align="center" :size="12">
                    <n-tag>{{ protocol.category }}</n-tag>
                    <n-text strong>{{ formatTVL(protocol.tvl) }}</n-text>
                  </n-space>
                </n-space>
              </n-card>
            </n-space>
          </n-space>
        </n-tab-pane>

        <!-- Compare Tab -->
        <n-tab-pane name="compare" tab="⚖️ Compare">
          <n-space vertical :size="16">
            <n-card title="Select Protocols to Compare">
              <n-select
                v-model="compareProtocols"
                :options="protocolOptions"
                multiple
                placeholder="Select protocols (max 5)"
                :max-tag-count="5"
              />
            </n-card>

            <n-button
              type="primary"
              @click="compareSelected"
              :disabled="compareProtocols.length < 2"
              :loading="loading"
              block
            >
              Compare Protocols
            </n-button>

            <n-spin :show="loading">
              <div v-if="comparisonData" class="comparison-results">
                <n-card title="Comparison Summary" class="comparison-card">
                  <n-grid :cols="compareProtocols.length + 1" :x-gap="16" :y-gap="8">
                    <n-gi>
                      <n-text strong>Protocol</n-text>
                    </n-gi>
                    <n-gi v-for="p in comparisonData.protocols" :key="p.id">
                      <n-text strong>{{ p.name }}</n-text>
                    </n-gi>

                    <n-gi>
                      <n-text depth="3">Category</n-text>
                    </n-gi>
                    <n-gi v-for="p in comparisonData.protocols" :key="p.id + 'cat'">
                      <n-tag size="small">{{ p.category }}</n-tag>
                    </n-gi>

                    <n-gi>
                      <n-text depth="3">TVL</n-text>
                    </n-gi>
                    <n-gi v-for="p in comparisonData.protocols" :key="p.id + 'tvl'">
                      {{ formatTVL(p.tvl) }}
                    </n-gi>

                    <n-gi>
                      <n-text depth="3">24h Change</n-text>
                    </n-gi>
                    <n-gi v-for="p in comparisonData.protocols" :key="p.id + 'change'">
                      <n-text :type="p.tvlChange24h >= 0 ? 'success' : 'error'">
                        {{ p.tvlChange24h >= 0 ? '+' : '' }}{{ p.tvlChange24h.toFixed(2) }}%
                      </n-text>
                    </n-gi>

                    <n-gi>
                      <n-text depth="3">24h Revenue</n-text>
                    </n-gi>
                    <n-gi v-for="p in comparisonData.protocols" :key="p.id + 'rev'">
                      ${{ formatNumber(p.revenue24h) }}
                    </n-gi>

                    <n-gi>
                      <n-text depth="3">Risk Score</n-text>
                    </n-gi>
                    <n-gi v-for="p in comparisonData.protocols" :key="p.id + 'risk'">
                      <n-tag :type="getRiskType(p.riskScore)" size="small">{{ p.riskScore }}</n-tag>
                    </n-gi>

                    <n-gi>
                      <n-text depth="3">Avg APY</n-text>
                    </n-gi>
                    <n-gi v-for="p in comparisonData.protocols" :key="p.id + 'apy'">
                      {{ p.avgAPY.toFixed(1) }}%
                    </n-gi>
                  </n-grid>
                </n-card>
              </div>
            </n-spin>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- Protocol Details Modal -->
    <n-modal v-model:show="showDetails" preset="card" title="Protocol Details" style="width: 800px; max-width: 90vw">
      <n-spin :show="loading">
        <div v-if="selectedProtocol">
          <n-space vertical :size="16">
            <n-space align="center" :size="16">
              <n-avatar :src="selectedProtocol.logo" :size="64" round />
              <n-space vertical :size="4">
                <n-text strong style="font-size: 24px">{{ selectedProtocol.name }}</n-text>
                <n-text depth="3">{{ selectedProtocol.symbol }}</n-text>
              </n-space>
            </n-space>

            <n-divider />

            <n-grid :cols="2" :x-gap="16" :y-gap="16">
              <n-gi>
                <n-card class="metric-card">
                  <n-statistic label="Total Value Locked" :value="formatTVL(selectedProtocol.tvl)" />
                </n-card>
              </n-gi>
              <n-gi>
                <n-card class="metric-card">
                  <n-statistic label="24h Change">
                    <template #default>
                      <n-text :type="selectedProtocol.tvlChange24h >= 0 ? 'success' : 'error'">
                        {{ selectedProtocol.tvlChange24h >= 0 ? '+' : '' }}{{ selectedProtocol.tvlChange24h.toFixed(2) }}%
                      </n-text>
                    </template>
                  </n-statistic>
                </n-card>
              </n-gi>
              <n-gi>
                <n-card class="metric-card">
                  <n-statistic label="24h Revenue" :value="'$' + formatNumber(selectedProtocol.revenue24h)" />
                </n-card>
              </n-gi>
              <n-gi>
                <n-card class="metric-card">
                  <n-statistic label="24h Users" :value="formatNumber(selectedProtocol.users24h)" />
                </n-card>
              </n-gi>
            </n-grid>

            <n-card>
              <n-space vertical :size="8">
                <n-text strong>Description</n-text>
                <n-text depth="2">{{ selectedProtocol.description }}</n-text>
              </n-space>
            </n-card>

            <n-grid :cols="2" :x-gap="16" :y-gap="16">
              <n-gi>
                <n-card title="Protocol Info">
                  <n-space vertical :size="8">
                    <n-space justify="space-between">
                      <n-text depth="3">Category</n-text>
                      <n-tag>{{ selectedProtocol.category }}</n-tag>
                    </n-space>
                    <n-space justify="space-between">
                      <n-text depth="3">Risk Score</n-text>
                      <n-tag :type="getRiskType(selectedProtocol.riskScore)">{{ selectedProtocol.riskScore }}</n-tag>
                    </n-space>
                    <n-space justify="space-between">
                      <n-text depth="3">Launch Date</n-text>
                      <n-text>{{ selectedProtocol.launchDate }}</n-text>
                    </n-space>
                    <n-space justify="space-between">
                      <n-text depth="3">Governance</n-text>
                      <n-text>{{ selectedProtocol.governanceModel }}</n-text>
                    </n-space>
                  </n-space>
                </n-card>
              </n-gi>
              <n-gi>
                <n-card title="Links">
                  <n-space vertical :size="8">
                    <n-a :href="selectedProtocol.website" target="_blank">🌐 Website</n-a>
                    <n-a :href="selectedProtocol.documentation" target="_blank">📚 Documentation</n-a>
                    <n-a :href="selectedProtocol.twitter" target="_blank">🐦 Twitter</n-a>
                    <n-a v-if="selectedProtocol.discord" :href="selectedProtocol.discord" target="_blank">💬 Discord</n-a>
                  </n-space>
                </n-card>
              </n-gi>
            </n-grid>

            <n-card title="Supported Chains">
              <n-space :size="8">
                <n-tag v-for="chain in selectedProtocol.chains" :key="chain" type="info">
                  {{ chain.toUpperCase() }}
                </n-tag>
              </n-space>
            </n-card>
          </n-space>
        </div>
      </n-spin>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'

const message = useMessage()

const loading = ref(false)
const protocols = ref<any[]>([])
const searchResults = ref<any[]>([])
const comparisonData = ref<any>(null)
const dashboardData = ref({
  totalProtocols: 0,
  totalTvl: 0,
  totalRevenue24h: 0,
  totalUsers24h: 0,
  topProtocols: [] as any[],
  topGainers: [] as any[],
  topLosers: [] as any[],
  categoryDistribution: [] as any[],
})
const selectedProtocol = ref<any>(null)
const showDetails = ref(false)
const compareProtocols = ref<string[]>([])
const searchQuery = ref('')

const filters = ref({
  category: null,
  chain: null,
  sort: 'tvl',
})

const categoryOptions = [
  { label: 'DEX', value: 'DEX' },
  { label: 'Lending', value: 'Lending' },
  { label: 'Liquid Staking', value: 'Liquid Staking' },
  { label: 'Yield Aggregator', value: 'Yield Aggregator' },
  { label: 'Derivatives', value: 'Derivatives' },
]

const chainOptions = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
  { label: 'BSC', value: 'bsc' },
  { label: 'Base', value: 'base' },
  { label: 'Avalanche', value: 'avalanche' },
]

const sortOptions = [
  { label: 'TVL (High to Low)', value: 'tvl' },
  { label: '24h Change', value: 'tvlChange24h' },
  { label: '24h Revenue', value: 'revenue24h' },
  { label: 'Users', value: 'users24h' },
  { label: 'Name', value: 'name' },
]

const protocolOptions = computed(() =>
  protocols.value.map((p) => ({ label: p.name, value: p.id }))
)

const filteredProtocols = computed(() => {
  let result = [...protocols.value]

  if (filters.value.category) {
    result = result.filter((p) => p.category === filters.value.category)
  }

  if (filters.value.chain) {
    result = result.filter((p) => p.chains?.includes(filters.value.chain))
  }

  if (filters.value.sort) {
    result.sort((a, b) => {
      if (filters.value.sort === 'name') {
        return a.name.localeCompare(b.name)
      }
      return (b[filters.value.sort] || 0) - (a[filters.value.sort] || 0)
    })
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.symbol.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    )
  }

  return result
})

const formatNumber = (num: number): string => {
  if (!num) return '0'
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const formatTVL = (tvl: number): string => {
  return '$' + formatNumber(tvl)
}

const getCategoryType = (category: string): 'default' | 'info' | 'success' | 'warning' | 'error' => {
  const types: Record<string, any> = {
    DEX: 'info',
    Lending: 'success',
    'Liquid Staking': 'warning',
    'Yield Aggregator': 'error',
    Derivatives: 'default',
  }
  return types[category] || 'default'
}

const getRiskType = (score: number): 'success' | 'warning' | 'error' => {
  if (score <= 20) return 'success'
  if (score <= 35) return 'warning'
  return 'error'
}

const fetchProtocols = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/defi-protocol-explorer/protocols?limit=100')
    const data = await response.json()
    if (data.success) {
      protocols.value = data.data
    }
  } catch (error) {
    message.error('Failed to fetch protocols')
  } finally {
    loading.value = false
  }
}

const fetchDashboard = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/defi-protocol-explorer/dashboard')
    const data = await response.json()
    if (data.success) {
      dashboardData.value = data.data
    }
  } catch (error) {
    message.error('Failed to fetch dashboard')
  } finally {
    loading.value = false
  }
}

const searchProtocols = async () => {
  if (!searchQuery.value) return

  loading.value = true
  try {
    const response = await fetch(`/api/defi-protocol-explorer/search?q=${encodeURIComponent(searchQuery.value)}`)
    const data = await response.json()
    if (data.success) {
      searchResults.value = data.data
    }
  } catch (error) {
    message.error('Search failed')
  } finally {
    loading.value = false
  }
}

const viewProtocol = async (protocol: any) => {
  selectedProtocol.value = protocol
  showDetails.value = true
}

const compareSelected = async () => {
  if (compareProtocols.value.length < 2) return

  loading.value = true
  try {
    const response = await fetch(
      `/api/defi-protocol-explorer/compare?ids=${compareProtocols.value.join(',')}`
    )
    const data = await response.json()
    if (data.success) {
      comparisonData.value = data.data
    }
  } catch (error) {
    message.error('Comparison failed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProtocols()
  fetchDashboard()
})
</script>

<style scoped>
.defi-protocol-explorer {
  padding: 16px;
}

.explorer-card {
  background: #fff;
  border-radius: 8px;
}

.stats-grid {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
}

.protocol-card {
  transition: all 0.3s ease;
}

.protocol-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.protocol-row {
  cursor: pointer;
  transition: all 0.2s ease;
}

.protocol-row:hover {
  background: #f5f5f5;
}

.metric-card {
  text-align: center;
}

.comparison-card {
  margin-top: 16px;
}

.comparison-results {
  margin-top: 16px;
}
</style>
