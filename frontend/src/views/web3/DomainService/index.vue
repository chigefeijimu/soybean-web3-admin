<template>
  <div class="domain-service">
    <div class="header">
      <h1>🌐 Web3 Domain Service</h1>
      <p>查询和管理 ENS、Space ID、Unstoppable Domains、Solana 等Web3域名</p>
    </div>

    <!-- Search Section -->
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>域名查询</span>
        </div>
      </template>
      <el-form :model="searchForm" inline>
        <el-form-item label="域名">
          <el-input
            v-model="searchForm.domain"
            placeholder="输入域名 (e.g., vitalik.eth, wallet.bnb)"
            style="width: 300px"
            @keyup.enter="queryDomain"
          />
        </el-form-item>
        <el-form-item label="链">
          <el-select v-model="searchForm.chainId" style="width: 120px">
            <el-option label="Ethereum" :value="1" />
            <el-option label="BNB Chain" :value="56" />
            <el-option label="Polygon" :value="137" />
            <el-option label="Arbitrum" :value="42161" />
            <el-option label="Solana" :value="101" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryDomain" :loading="loading">
            查询
          </el-button>
        </el-form-item>
      </el-form>

      <!-- Domain Type Detection -->
      <div v-if="detectedType" class="detected-type">
        <el-tag :type="getTypeTagType(detectedType)">
          检测到类型: {{ detectedType }}
        </el-tag>
      </div>
    </el-card>

    <!-- Results Section -->
    <el-card v-if="domainInfo" class="result-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>域名信息</span>
          <el-tag :type="domainInfo.owner ? 'success' : 'danger'">
            {{ domainInfo.owner ? '已注册' : '未注册' }}
          </el-tag>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="域名">
          <strong>{{ domainInfo.name }}</strong>
        </el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag>{{ domainInfo.type }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所有者">
          <el-tooltip :content="domainInfo.owner">
            <span class="address">{{ formatAddress(domainInfo.owner) }}</span>
          </el-tooltip>
        </el-descriptions-item>
        <el-descriptions-item label="解析器">
          <el-tooltip :content="domainInfo.resolver">
            <span class="address">{{ formatAddress(domainInfo.resolver) }}</span>
          </el-tooltip>
        </el-descriptions-item>
        <el-descriptions-item label="ETH地址" v-if="domainInfo.address">
          <el-tooltip :content="domainInfo.address">
            <span class="address">{{ formatAddress(domainInfo.address) }}</span>
          </el-tooltip>
        </el-descriptions-item>
        <el-descriptions-item label="Content Hash" v-if="domainInfo.contentHash">
          <el-tooltip :content="domainInfo.contentHash">
            <span class="address">{{ formatAddress(domainInfo.contentHash) }}</span>
          </el-tooltip>
        </el-descriptions-item>
        <el-descriptions-item label="到期日期" v-if="domainInfo.expiryDate">
          {{ formatDate(domainInfo.expiryDate) }}
        </el-descriptions-item>
        <el-descriptions-item label="注册日期" v-if="domainInfo.registrationDate">
          {{ formatDate(domainInfo.registrationDate) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Price Check Section -->
    <el-card class="price-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>价格查询</span>
        </div>
      </template>
      <el-form :model="priceForm" inline>
        <el-form-item label="域名">
          <el-input
            v-model="priceForm.domain"
            placeholder="输入域名"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="priceForm.type" style="width: 120px">
            <el-option label="ENS" value="ENS" />
            <el-option label="Space ID" value="SPACE_ID" />
            <el-option label="UNS" value="UNS" />
          </el-select>
        </el-form-item>
        <el-form-item label="年限">
          <el-input-number v-model="priceForm.years" :min="1" :max="10" />
        </el-form-item>
        <el-form-item>
          <el-button @click="checkPrice" :loading="priceLoading">
            查询价格
          </el-button>
        </el-form-item>
      </el-form>

      <div v-if="priceInfo" class="price-result">
        <el-alert
          :title="`${priceInfo.name} - $${priceInfo.price} ${priceInfo.currency}/${priceInfo.period}年`"
          type="success"
          :closable="false"
        />
      </div>
    </el-card>

    <!-- Popular Domains -->
    <el-card class="popular-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>热门域名推荐</span>
          <el-select v-model="popularType" @change="loadPopularDomains" style="width: 120px">
            <el-option label="ENS" value="ENS" />
            <el-option label="Space ID" value="SPACE_ID" />
            <el-option label="UNS" value="UNS" />
          </el-select>
        </div>
      </template>
      <div class="popular-domains">
        <el-tag
          v-for="domain in popularDomains"
          :key="domain"
          class="domain-tag"
          @click="searchForm.domain = domain; queryDomain()"
        >
          {{ domain }}
        </el-tag>
      </div>
    </el-card>

    <!-- Stats Dashboard -->
    <el-card class="stats-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>域名统计</span>
          <el-button text @click="loadStats">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">ENS 域名总数</div>
            <div class="stat-value">{{ formatNumber(stats.ens?.totalDomains || 0) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">Space ID 域名总数</div>
            <div class="stat-value">{{ formatNumber(stats.spaceId?.totalDomains || 0) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">UNS 域名总数</div>
            <div class="stat-value">{{ formatNumber(stats.uns?.totalDomains || 0) }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- Batch Query -->
    <el-card class="batch-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>批量查询</span>
        </div>
      </template>
      <el-input
        v-model="batchDomains"
        type="textarea"
        :rows="5"
        placeholder="输入域名，每行一个 (e.g., vitalik.eth, crypto.eth)"
      />
      <el-button 
        type="primary" 
        @click="batchQuery" 
        :loading="batchLoading"
        style="margin-top: 10px"
      >
        批量查询
      </el-button>

      <el-table v-if="batchResults.length > 0" :data="batchResults" style="margin-top: 20px">
        <el-table-column prop="name" label="域名" />
        <el-table-column prop="type" label="类型">
          <template #default="{ row }">
            <el-tag>{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="所有者">
          <template #default="{ row }">
            <span class="address">{{ formatAddress(row.owner) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.owner ? 'success' : 'danger'">
              {{ row.owner ? '已注册' : '未注册' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from 'axios'

interface DomainInfo {
  name: string
  type: string
  owner: string
  resolver: string
  address?: string
  contentHash?: string
  expiryDate?: string
  registrationDate?: string
}

interface DomainPrice {
  name: string
  type: string
  price: number
  currency: string
  period: number
}

const searchForm = ref({
  domain: '',
  chainId: 1,
})

const priceForm = ref({
  domain: '',
  type: 'ENS' as 'ENS' | 'SPACE_ID' | 'UNS',
  years: 1,
})

const loading = ref(false)
const priceLoading = ref(false)
const batchLoading = ref(false)

const domainInfo = ref<DomainInfo | null>(null)
const priceInfo = ref<DomainPrice | null>(null)
const detectedType = ref('')
const popularType = ref('ENS')
const popularDomains = ref<string[]>([])
const batchDomains = ref('')
const batchResults = ref<DomainInfo[]>([])

const stats = ref({
  ens: { totalDomains: 0, renewalRate: 0 },
  spaceId: { totalDomains: 0 },
  uns: { totalDomains: 0 },
})

const API_BASE = '/api/web3'

const queryDomain = async () => {
  if (!searchForm.value.domain) {
    ElMessage.warning('请输入域名')
    return
  }

  loading.value = true
  try {
    // Detect domain type
    const typeRes = await axios.get(`${API_BASE}/domain/type?domain=${searchForm.value.domain}`)
    detectedType.value = typeRes.data.type

    const res = await axios.get(`${API_BASE}/domain/query?domain=${searchForm.value.domain}`, {
      params: { chainId: searchForm.value.chainId },
    })
    domainInfo.value = res.data
    ElMessage.success('查询成功')
  } catch (error: any) {
    ElMessage.error(error.message || '查询失败')
    domainInfo.value = null
  } finally {
    loading.value = false
  }
}

const checkPrice = async () => {
  if (!priceForm.value.domain) {
    ElMessage.warning('请输入域名')
    return
  }

  priceLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/domain/price?domain=${priceForm.value.domain}&type=${priceForm.value.type}&years=${priceForm.value.years}`, {
      params: {
        type: priceForm.value.type,
        years: priceForm.value.years,
      },
    })
    priceInfo.value = res.data
    if (!priceInfo.value) {
      ElMessage.warning('暂不支持该类型域名的价格查询')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '价格查询失败')
    priceInfo.value = null
  } finally {
    priceLoading.value = false
  }
}

const loadPopularDomains = async () => {
  try {
    const res = await axios.get(`${API_BASE}/domain/popular`, {
      params: { type: popularType.value },
    })
    popularDomains.value = res.data
  } catch (error: any) {
    // Use fallback data
    popularDomains.value = popularType.value === 'ENS' 
      ? ['wallet.eth', 'crypto.eth', 'defi.eth', 'nft.eth', 'dao.eth']
      : popularType.value === 'SPACE_ID'
      ? ['wallet.bnb', 'crypto.bnb', 'defi.bnb', 'dao.bnb']
      : ['wallet.crypto', 'crypto.crypto', 'defi.crypto']
  }
}

const loadStats = async () => {
  try {
    const res = await axios.get(`${API_BASE}/domain/stats`)
    stats.value = res.data
  } catch (error) {
    stats.value = {
      ens: { totalDomains: 2500000, renewalRate: 75 },
      spaceId: { totalDomains: 2500000 },
      uns: { totalDomains: 3000000 },
    }
  }
}

const batchQuery = async () => {
  if (!batchDomains.value.trim()) {
    ElMessage.warning('请输入域名')
    return
  }

  const domains = batchDomains.value.split('\n').map(d => d.trim()).filter(d => d)
  if (domains.length === 0) {
    ElMessage.warning('请输入有效域名')
    return
  }

  batchLoading.value = true
  try {
    const res = await axios.post(`${API_BASE}/domain/batch`, {
      domains,
      chainId: searchForm.value.chainId,
    })
    batchResults.value = res.data
    ElMessage.success(`批量查询完成，共 ${res.data.length} 个域名`)
  } catch (error: any) {
    ElMessage.error(error.message || '批量查询失败')
  } finally {
    batchLoading.value = false
  }
}

const formatAddress = (address: string) => {
  if (!address) return '-'
  if (address.length <= 20) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  } catch {
    return dateStr
  }
}

const formatNumber = (num: number) => {
  return num.toLocaleString()
}

const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    ENS: 'success',
    SPACE_ID: 'warning',
    UNS: 'danger',
    SOL: 'info',
    CNS: '',
  }
  return typeMap[type] || ''
}

onMounted(() => {
  loadPopularDomains()
  loadStats()
})
</script>

<style scoped>
.domain-service {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.header p {
  color: #666;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detected-type {
  margin-top: 10px;
}

.address {
  font-family: monospace;
  cursor: pointer;
}

.price-result {
  margin-top: 15px;
}

.popular-domains {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.domain-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.domain-tag:hover {
  transform: scale(1.05);
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}
</style>
