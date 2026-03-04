<template>
  <div class="portfolio-risk-assessment">
    <n-card title="投资组合风险评估" :bordered="false" class="mb-4">
      <n-space vertical>
        <n-space align="center">
          <n-input
            v-model:value="address"
            placeholder="输入钱包地址 (0x...)"
            style="width: 400px"
            @keyup.enter="analyzePortfolio"
          />
          <n-select
            v-model:value="selectedChains"
            multiple
            :options="chainOptions"
            placeholder="选择链"
            style="width: 300px"
          />
          <n-button type="primary" @click="analyzePortfolio" :loading="loading">
            分析风险
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <n-grid v-if="analysisResult" :cols="3" :x-gap="16" :y-gap="16">
      <!-- Risk Score Card -->
      <n-gi>
        <n-card title="风险评分" class="risk-score-card">
          <div class="score-display">
            <n-progress
              type="circle"
              :percentage="analysisResult.riskScore.score"
              :color="getScoreColor(analysisResult.riskScore.score)"
              :rail-color="getScoreColor(analysisResult.riskScore.score, 0.2)"
            >
              <div class="score-content">
                <span class="score-value">{{ analysisResult.riskScore.score }}</span>
                <span class="score-level">{{ analysisResult.riskScore.level }}</span>
              </div>
            </n-progress>
          </div>
          <n-tag :type="getCategoryType(analysisResult.riskScore.category)" class="mt-3">
            {{ getCategoryText(analysisResult.riskScore.category) }}
          </n-tag>
        </n-card>
      </n-gi>

      <!-- Total Value Card -->
      <n-gi>
        <n-card title="总资产价值">
          <n-statistic :value="analysisResult.totalValue" :precision="2">
            <template #prefix>$</template>
          </n-statistic>
          <n-divider />
          <n-space vertical>
            <div class="stat-item">
              <span class="label">持仓数量:</span>
              <span class="value">{{ analysisResult.topHoldings.length }}</span>
            </div>
            <div class="stat-item">
              <span class="label">链数量:</span>
              <span class="value">{{ analysisResult.chainDistribution.length }}</span>
            </div>
          </n-space>
        </n-card>
      </n-gi>

      <!-- Risk Flags Card -->
      <n-gi>
        <n-card title="风险标志">
          <n-space vertical>
            <n-alert
              v-for="(flag, idx) in analysisResult.riskFlags"
              :key="idx"
              type="warning"
              class="mb-2"
            >
              {{ flag }}
            </n-alert>
            <n-empty v-if="analysisResult.riskFlags.length === 0" description="暂无风险标志" />
          </n-space>
        </n-card>
      </n-gi>

      <!-- Risk Factors -->
      <n-gi :span="2">
        <n-card title="风险因素分析">
          <n-space vertical>
            <div
              v-for="factor in analysisResult.riskFactors"
              :key="factor.factor"
              class="factor-item"
            >
              <div class="factor-header">
                <span class="factor-name">{{ factor.factor }}</span>
                <span class="factor-value">{{ factor.value }}</span>
              </div>
              <n-progress
                :percentage="factor.value"
                :color="getScoreColor(factor.value)"
                :show-indicator="false"
              />
            </div>
          </n-space>
        </n-card>
      </n-gi>

      <!-- Recommendations -->
      <n-gi>
        <n-card title="优化建议">
          <n-space vertical>
            <n-button
              v-for="rec in analysisResult.recommendations"
              :key="rec"
              text
              type="primary"
              class="recommendation-item"
            >
              <template #icon>
                <n-icon><BulbOutline /></n-icon>
              </template>
              {{ rec }}
            </n-button>
            <n-empty v-if="analysisResult.recommendations.length === 0" description="暂无建议" />
          </n-space>
        </n-card>
      </n-gi>

      <!-- Chain Distribution -->
      <n-gi>
        <n-card title="链分布">
          <n-space vertical>
            <div
              v-for="chain in analysisResult.chainDistribution"
              :key="chain.chain"
              class="distribution-item"
            >
              <span class="chain-name">{{ chain.chain }}</span>
              <span class="chain-value">${{ chain.value.toFixed(2) }}</span>
              <span class="chain-percent">{{ chain.percentage.toFixed(1) }}%</span>
            </div>
          </n-space>
        </n-card>
      </n-gi>

      <!-- Category Distribution -->
      <n-gi :span="2">
        <n-card title="类别分布">
          <n-space vertical>
            <div
              v-for="cat in analysisResult.categoryDistribution"
              :key="cat.category"
              class="category-item"
            >
              <span class="category-name">{{ cat.category }}</span>
              <n-progress
                type="line"
                :percentage="cat.percentage"
                :show-indicator="false"
                style="width: 200px"
              />
              <span class="category-value">${{ cat.value.toFixed(2) }}</span>
              <span class="category-percent">{{ cat.percentage.toFixed(1) }}%</span>
            </div>
          </n-space>
        </n-card>
      </n-gi>

      <!-- Top Holdings -->
      <n-gi :span="3">
        <n-card title="持仓明细">
          <n-data-table
            :columns="holdingsColumns"
            :data="analysisResult.topHoldings"
            :pagination="false"
          />
        </n-card>
      </n-gi>
    </n-grid>

    <n-card v-else-if="!loading" class="empty-card">
      <n-empty description="输入钱包地址开始分析" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NSpace, NCard, NInput, NSelect, NButton, NGrid, NGi, NProgress, NTag, NStatistic, NDivider, NAlert, NEmpty, NDataTable, NIcon } from 'naive-ui'
import { BulbOutline } from '@vicons/ionicons5'
import axios from 'axios'

const address = ref('')
const loading = ref(false)
const selectedChains = ref(['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'])
const analysisResult = ref<any>(null)

const chainOptions = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
  { label: 'BSC', value: 'bsc' },
  { label: 'Base', value: 'base' },
  { label: 'Avalanche', value: 'avalanche' },
]

const holdingsColumns = [
  { title: '代币', key: 'symbol' },
  { title: '链', key: 'chain' },
  { title: '协议', key: 'protocol' },
  { title: '类别', key: 'category' },
  { title: '数量', key: 'amount', render: (row: any) => row.amount.toFixed(4) },
  { title: '价值 ($)', key: 'value', render: (row: any) => `$${row.value.toFixed(2)}` },
]

const getScoreColor = (score: number, opacity = 1) => {
  if (score < 30) return `rgba(82, 196, 26, ${opacity})`
  if (score < 50) return `rgba(250, 204, 20, ${opacity})`
  if (score < 70) return `rgba(255, 136, 0, ${opacity})`
  return `rgba(255, 77, 79, ${opacity})`
}

const getCategoryType = (category: string) => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    low: 'success',
    medium: 'warning',
    high: 'error',
    critical: 'error',
  }
  return map[category] || 'default'
}

const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    low: '低风险',
    medium: '中等风险',
    high: '高风险',
    critical: '严重风险',
  }
  return map[category] || category
}

const analyzePortfolio = async () => {
  if (!address.value) return
  loading.value = true
  try {
    const { data } = await axios.get(`/api/web3/portfolio-risk-assessment/analyze/${address.value}`, {
      params: { chains: selectedChains.value.join(',') }
    })
    analysisResult.value = data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.portfolio-risk-assessment {
  padding: 16px;
}

.risk-score-card .score-display {
  display: flex;
  justify-content: center;
}

.score-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-value {
  font-size: 32px;
  font-weight: bold;
}

.score-level {
  font-size: 14px;
  color: #666;
}

.stat-item {
  display: flex;
  justify-content: space-between;
}

.stat-item .label {
  color: #666;
}

.stat-item .value {
  font-weight: 500;
}

.factor-item {
  margin-bottom: 12px;
}

.factor-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.factor-name {
  font-weight: 500;
}

.factor-value {
  color: #666;
}

.recommendation-item {
  text-align: left;
  white-space: normal;
}

.distribution-item,
.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.chain-name,
.category-name {
  width: 100px;
  font-weight: 500;
}

.chain-value,
.category-value {
  flex: 1;
}

.chain-percent,
.category-percent {
  width: 60px;
  text-align: right;
  color: #666;
}

.empty-card {
  text-align: center;
  padding: 60px;
}
</style>
