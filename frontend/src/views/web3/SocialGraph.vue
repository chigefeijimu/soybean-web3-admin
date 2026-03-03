<template>
  <div class="social-graph-container">
    <div class="header">
      <h1>🔗 On-chain Social Graph Analyzer</h1>
      <p>Analyze address relationships and network interactions</p>
    </div>

    <!-- Search Form -->
    <n-card class="search-card">
      <n-form inline :model="searchForm">
        <n-form-item label="Wallet Address">
          <n-input
            v-model:value="searchForm.address"
            placeholder="0x..."
            clearable
            style="width: 400px"
          />
        </n-form-item>
        <n-form-item label="Chain">
          <n-select v-model:value="searchForm.chain" :options="chainOptions" style="width: 150px" />
        </n-form-item>
        <n-form-item label="Depth">
          <n-select v-model:value="searchForm.depth" :options="depthOptions" style="width: 100px" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="handleAnalyze" :loading="loading">
            Analyze
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- Results -->
    <div v-if="graphData" class="results">
      <!-- Statistics Cards -->
      <n-row :gutter="20" class="stats-row">
        <n-col :span="6">
          <n-card class="stat-card">
            <div class="stat-value">{{ graphData.statistics.totalNodes }}</div>
            <div class="stat-label">Total Nodes</div>
          </n-card>
        </n-col>
        <n-col :span="6">
          <n-card class="stat-card">
            <div class="stat-value">{{ graphData.statistics.totalEdges }}</div>
            <div class="stat-label">Total Edges</div>
          </n-card>
        </n-col>
        <n-col :span="6">
          <n-card class="stat-card">
            <div class="stat-value">${{ formatNumber(graphData.statistics.totalVolume) }}</div>
            <div class="stat-label">Total Volume</div>
          </n-card>
        </n-col>
        <n-col :span="6">
          <n-card class="stat-card">
            <div class="stat-value">{{ graphData.statistics.density }}</div>
            <div class="stat-label">Network Density</div>
          </n-card>
        </n-col>
      </n-row>

      <!-- Central Addresses -->
      <n-card class="central-card">
        <template #header>
          <span>🏆 Central Addresses (Top Influencers)</span>
        </template>
        <n-data-table :columns="centralColumns" :data="graphData.centralAddresses" :bordered="false" />
      </n-card>

      <!-- Network Graph -->
      <n-card class="graph-card">
        <template #header>
          <span>🕸️ Network Visualization</span>
        </template>
        <div class="graph-container">
          <div class="graph-placeholder">
            <div class="placeholder-content">
              <div v-for="(node, idx) in graphData.nodes.slice(0, 30)" :key="idx"
                class="graph-node"
                :style="{
                  left: `${20 + (idx % 10) * 6}%`,
                  top: `${20 + Math.floor(idx / 10) * 25}%`,
                  width: `${Math.max(8, node.centrality / 15)}px`,
                  height: `${Math.max(8, node.centrality / 15)}px`,
                  backgroundColor: getNodeColor(node.type)
                }"
                :title="`${node.label}\nType: ${node.type}\nCentrality: ${node.centrality.toFixed(1)}`"
              />
            </div>
            <div class="legend">
              <span class="legend-item"><span class="dot address"></span> Address</span>
              <span class="legend-item"><span class="dot contract"></span> Contract</span>
              <span class="legend-item"><span class="dot exchange"></span> Exchange</span>
              <span class="legend-item"><span class="dot dao"></span> DAO</span>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Interactions Table -->
      <n-card class="interactions-card">
        <template #header>
          <span>🔄 Recent Interactions</span>
        </template>
        <n-data-table :columns="interactionColumns" :data="interactions" :loading="interactionsLoading" :bordered="false" />
      </n-card>
    </div>

    <!-- Empty State -->
    <n-empty v-if="!graphData && !loading" description="Enter an address to analyze social graph" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h } from 'vue'
import { useMessage } from 'naive-ui'
import { getAddressSocialGraph, getAddressInteractions } from '@/service/socialGraph'

const message = useMessage()

const searchForm = reactive({
  address: '',
  chain: 'ethereum',
  depth: 2
})

const chainOptions = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
  { label: 'BSC', value: 'bsc' },
  { label: 'Base', value: 'base' },
  { label: 'Avalanche', value: 'avalanche' }
]

const depthOptions = [
  { label: '1', value: 1 },
  { label: '2', value: 2 }
]

const loading = ref(false)
const interactionsLoading = ref(false)
const graphData = ref<any>(null)
const interactions = ref<any[]>([])

const centralColumns = [
  {
    title: 'Address',
    key: 'id',
    render(row: any) {
      return h('a', {
        style: { color: '#18a058', cursor: 'pointer' },
        onClick: () => navigateToAddress(row.id)
      }, `${row.id.substring(0, 10)}...${row.id.substring(38)}`)
    }
  },
  { title: 'Label', key: 'label' },
  {
    title: 'Type',
    key: 'type',
    render(row: any) {
      const typeMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
        address: 'info',
        contract: 'warning',
        exchange: 'success',
        dao: 'error'
      }
      return h('span', { class: `type-tag type-${row.type}` }, row.type)
    }
  },
  {
    title: 'Centrality',
    key: 'centrality',
    render(row: any) {
      return h('div', { style: { width: '100px' } },
        h('div', {
          style: {
            width: `${row.centrality}%`,
            height: '6px',
            background: '#18a058',
            borderRadius: '3px'
          }
        })
      )
    }
  },
  {
    title: 'Volume',
    key: 'totalVolume',
    render(row: any) {
      return `$${formatNumber(row.totalVolume)}`
    }
  },
  { title: 'Tx Count', key: 'txCount' }
]

const interactionColumns = [
  {
    title: 'Address',
    key: 'address',
    render(row: any) {
      return h('a', {
        style: { color: '#18a058', cursor: 'pointer' },
        onClick: () => navigateToAddress(row.address)
      }, `${row.address.substring(0, 10)}...${row.address.substring(38)}`)
    }
  },
  { title: 'Label', key: 'label' },
  {
    title: 'Type',
    key: 'type',
    render(row: any) {
      const colors: Record<string, string> = {
        sent: '#18a058',
        received: '#2080f0',
        both: '#f0a020'
      }
      return h('span', { style: { color: colors[row.type] || '#999' } }, row.type)
    }
  },
  { title: 'Tx Count', key: 'count' },
  {
    title: 'Volume',
    key: 'volume',
    render(row: any) {
      return `$${formatNumber(row.volume)}`
    }
  },
  {
    title: 'Last Interaction',
    key: 'lastInteraction',
    render(row: any) {
      return formatDate(row.lastInteraction)
    }
  }
]

const handleAnalyze = async () => {
  if (!searchForm.address) {
    message.warning('Please enter an address')
    return
  }

  loading.value = true
  try {
    const [graphResult, interactionsResult] = await Promise.all([
      getAddressSocialGraph({
        address: searchForm.address,
        chain: searchForm.chain,
        depth: searchForm.depth
      }),
      getAddressInteractions({
        address: searchForm.address,
        chain: searchForm.chain,
        limit: 20
      })
    ])

    graphData.value = graphResult.data
    interactions.value = interactionsResult.data || []
  } catch (error: any) {
    message.error(error.message || 'Failed to analyze address')
  } finally {
    loading.value = false
  }
}

const navigateToAddress = (address: string) => {
  searchForm.address = address
  handleAnalyze()
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  return num.toFixed(2)
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString()
}

const getNodeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    address: '#409eff',
    contract: '#e6a23c',
    exchange: '#67c23a',
    dao: '#f56c6c',
    unknown: '#909399'
  }
  return colorMap[type] || '#909399'
}
</script>

<style scoped lang="scss">
.social-graph-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
  
  h1 {
    font-size: 28px;
    margin-bottom: 8px;
  }
  
  p {
    color: #666;
  }
}

.search-card {
  margin-bottom: 20px;
}

.stats-row {
  margin-bottom: 20px;
  
  .stat-card {
    text-align: center;
    
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #18a058;
    }
    
    .stat-label {
      color: #666;
      margin-top: 8px;
    }
  }
}

.central-card,
.graph-card,
.interactions-card {
  margin-bottom: 20px;
}

.graph-container {
  height: 400px;
  position: relative;
}

.graph-placeholder {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.placeholder-content {
  position: relative;
  width: 100%;
  height: 300px;
}

.graph-node {
  position: absolute;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.5);
  }
}

.legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 15px;
  background: white;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      
      &.address { background: #409eff; }
      &.contract { background: #e6a23c; }
      &.exchange { background: #67c23a; }
      &.dao { background: #f56c6c; }
    }
  }
}

.type-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.type-address { background: #e8f4ff; color: #409eff; }
  &.type-contract { background: #fdf6ec; color: #e6a23c; }
  &.type-exchange { background: #f0f9eb; color: #67c23a; }
  &.type-dao { background: #fef0f0; color: #f56c6c; }
}
</style>
