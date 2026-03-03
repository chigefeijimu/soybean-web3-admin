<template>
  <div class="defi-news-container">
    <div class="header">
      <h1>📰 DeFi Protocol News</h1>
      <p>Latest news and updates from DeFi protocols</p>
    </div>

    <!-- Filters -->
    <div class="filters">
      <el-input
        v-model="searchQuery"
        placeholder="Search news..."
        clearable
        @input="handleSearch"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select v-model="selectedProtocol" placeholder="All Protocols" clearable @change="fetchNews">
        <el-option
          v-for="protocol in protocols"
          :key="protocol.id"
          :label="protocol.name"
          :value="protocol.name"
        />
      </el-select>

      <el-select v-model="selectedCategory" placeholder="All Categories" clearable @change="fetchNews">
        <el-option
          v-for="cat in categories"
          :key="cat.id"
          :label="cat.name"
          :value="cat.id"
        />
      </el-select>

      <el-select v-model="selectedSentiment" placeholder="All Sentiments" clearable @change="fetchNews">
        <el-option label="Positive" value="positive" />
        <el-option label="Negative" value="negative" />
        <el-option label="Neutral" value="neutral" />
      </el-select>
    </div>

    <!-- Trending Protocols -->
    <div class="trending-section">
      <h3>🔥 Trending Protocols</h3>
      <div class="trending-tags">
        <el-tag
          v-for="item in trending"
          :key="item.protocol"
          type="warning"
          class="trending-tag"
        >
          {{ item.protocol }} ({{ item.newsCount }})
        </el-tag>
      </div>
    </div>

    <!-- Category Stats -->
    <div class="category-stats">
      <el-tag
        v-for="cat in categoryStats"
        :key="cat.id"
        :type="selectedCategory === cat.id ? 'primary' : 'info'"
        class="category-tag"
        @click="toggleCategory(cat.id)"
      >
        {{ cat.name }} ({{ cat.count }})
      </el-tag>
    </div>

    <!-- News List -->
    <div class="news-list" v-loading="loading">
      <el-empty v-if="!loading && newsList.length === 0" description="No news found" />

      <el-card
        v-for="article in newsList"
        :key="article.id"
        class="news-card"
        :class="{ 'positive': article.sentiment === 'positive', 'negative': article.sentiment === 'negative' }"
      >
        <div class="news-header">
          <el-tag size="small" :type="getCategoryType(article.category)">
            {{ article.category }}
          </el-tag>
          <el-tag v-if="article.sentiment" size="small" :type="getSentimentType(article.sentiment)">
            {{ article.sentiment }}
          </el-tag>
          <span class="protocol-name">{{ article.protocol }}</span>
        </div>

        <h3 class="news-title">{{ article.title }}</h3>
        <p class="news-summary">{{ article.summary }}</p>

        <div class="news-footer">
          <span class="source">📰 {{ article.source }}</span>
          <span class="date">{{ formatDate(article.publishedAt) }}</span>
        </div>

        <a :href="article.url" target="_blank" class="read-more">Read More →</a>
      </el-card>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchNews"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface NewsArticle {
  id: string
  title: string
  summary: string
  source: string
  url: string
  publishedAt: string
  protocol: string
  category: string
  sentiment?: string
}

const API_BASE = '/api/defi-news'

const loading = ref(false)
const newsList = ref<NewsArticle[]>([])
const protocols = ref<{ id: string; name: string; category: string }[]>([])
const trending = ref<{ protocol: string; newsCount: number }[]>([])
const categoryStats = ref<{ id: string; name: string; count: number }[]>([])

const searchQuery = ref('')
const selectedProtocol = ref('')
const selectedCategory = ref('')
const selectedSentiment = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const categories = [
  { id: 'announcement', name: 'Announcements' },
  { id: 'governance', name: 'Governance' },
  { id: 'update', name: 'Updates' },
  { id: 'security', name: 'Security' },
  { id: 'partnership', name: 'Partnerships' },
  { id: 'market', name: 'Market' },
]

const fetchNews = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    if (selectedProtocol.value) params.append('protocol', selectedProtocol.value)
    if (selectedCategory.value) params.append('category', selectedCategory.value)
    if (selectedSentiment.value) params.append('sentiment', selectedSentiment.value)
    params.append('page', String(currentPage.value))
    params.append('pageSize', String(pageSize.value))

    const res = await fetch(`${API_BASE}?${params}`)
    const data = await res.json()
    newsList.value = data.news
    total.value = data.total
  } catch (error) {
    ElMessage.error('Failed to fetch news')
  } finally {
    loading.value = false
  }
}

const fetchProtocols = async () => {
  try {
    const res = await fetch(`${API_BASE}/protocols`)
    protocols.value = await res.json()
  } catch (error) {
    console.error('Failed to fetch protocols')
  }
}

const fetchTrending = async () => {
  try {
    const res = await fetch(`${API_BASE}/trending`)
    trending.value = await res.json()
  } catch (error) {
    console.error('Failed to fetch trending')
  }
}

const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/categories`)
    categoryStats.value = await res.json()
  } catch (error) {
    console.error('Failed to fetch categories')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchNews()
}

const toggleCategory = (categoryId: string) => {
  selectedCategory.value = selectedCategory.value === categoryId ? '' : categoryId
  currentPage.value = 1
  fetchNews()
}

const getCategoryType = (category: string) => {
  const types: Record<string, string> = {
    announcement: 'success',
    governance: 'warning',
    update: 'primary',
    security: 'danger',
    partnership: 'info',
    market: '',
  }
  return types[category] || ''
}

const getSentimentType = (sentiment: string) => {
  const types: Record<string, string> = {
    positive: 'success',
    negative: 'danger',
    neutral: 'info',
  }
  return types[sentiment] || ''
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (hours < 168) return `${Math.floor(hours / 24)}d ago`
  return date.toLocaleDateString()
}

onMounted(() => {
  fetchNews()
  fetchProtocols()
  fetchTrending()
  fetchCategories()
})
</script>

<style scoped>
.defi-news-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.header p {
  color: #666;
  margin: 0;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  width: 300px;
}

.trending-section {
  margin-bottom: 16px;
}

.trending-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.trending-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.trending-tag {
  cursor: pointer;
}

.category-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.category-tag {
  cursor: pointer;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-card {
  transition: transform 0.2s;
}

.news-card:hover {
  transform: translateY(-2px);
}

.news-card.positive {
  border-left: 4px solid #67c23a;
}

.news-card.negative {
  border-left: 4px solid #f56c6c;
}

.news-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.protocol-name {
  color: #409eff;
  font-weight: 500;
}

.news-title {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.news-summary {
  color: #666;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.news-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.read-more {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.read-more:hover {
  text-decoration: underline;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
