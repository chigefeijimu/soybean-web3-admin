<template>
  <div class="ens-lookup">
    <div class="search-section">
      <h3>🔤 ENS Domain Lookup</h3>
      <p class="subtitle">查询ENS域名信息、正向/反向解析</p>
      
      <div class="search-tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'resolve' }]"
          @click="activeTab = 'resolve'"
        >
          正向解析
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'reverse' }]"
          @click="activeTab = 'reverse'"
        >
          反向解析
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'details' }]"
          @click="activeTab = 'details'"
        >
          详细信息
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'popular' }]"
          @click="activeTab = 'popular'"
        >
          热门域名
        </button>
      </div>
      
      <!-- 正向解析 -->
      <div v-if="activeTab === 'resolve'" class="search-form">
        <div class="input-group">
          <label>ENS域名</label>
          <input 
            v-model="ensName" 
            type="text" 
            placeholder="vitalik.eth"
            class="ens-input"
            @keyup.enter="resolveEns"
          />
        </div>
        <button 
          class="search-btn" 
          @click="resolveEns" 
          :disabled="loading || !ensName"
        >
          {{ loading ? '解析中...' : '🔍 解析' }}
        </button>
      </div>
      
      <!-- 反向解析 -->
      <div v-if="activeTab === 'reverse'" class="search-form">
        <div class="input-group">
          <label>ETH地址</label>
          <input 
            v-model="ethAddress" 
            type="text" 
            placeholder="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            class="address-input"
            @keyup.enter="reverseResolve"
          />
        </div>
        <button 
          class="search-btn" 
          @click="reverseResolve" 
          :disabled="loading || !ethAddress"
        >
          {{ loading ? '解析中...' : '🔍 反向解析' }}
        </button>
      </div>
      
      <!-- 详细信息 -->
      <div v-if="activeTab === 'details'" class="search-form">
        <div class="input-group">
          <label>ENS域名</label>
          <input 
            v-model="detailName" 
            type="text" 
            placeholder="uniswap.eth"
            class="ens-input"
            @keyup.enter="getDetails"
          />
        </div>
        <button 
          class="search-btn" 
          @click="getDetails" 
          :disabled="loading || !detailName"
        >
          {{ loading ? '查询中...' : '🔍 查询详情' }}
        </button>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
    
    <!-- 正向解析结果 -->
    <div v-if="resolveResult && activeTab === 'resolve'" class="result-card">
      <h4>解析结果</h4>
      <div class="result-item">
        <span class="label">域名:</span>
        <span class="value">{{ resolveResult.name }}</span>
      </div>
      <div class="result-item">
        <span class="label">解析地址:</span>
        <span class="value address">
          {{ resolveResult.address || '未解析' }}
          <button v-if="resolveResult.address" class="copy-btn" @click="copyAddress(resolveResult.address)">
            📋
          </button>
        </span>
      </div>
      <div class="result-item">
        <span class="label">状态:</span>
        <span :class="['status', resolveResult.resolved ? 'success' : 'error']">
          {{ resolveResult.resolved ? '✅ 已解析' : '❌ 未解析' }}
        </span>
      </div>
    </div>
    
    <!-- 反向解析结果 -->
    <div v-if="reverseResult && activeTab === 'reverse'" class="result-card">
      <h4>反向解析结果</h4>
      <div class="result-item">
        <span class="label">地址:</span>
        <span class="value address">
          {{ reverseResult.address }}
          <button class="copy-btn" @click="copyAddress(reverseResult.address)">📋</button>
        </span>
      </div>
      <div class="result-item">
        <span class="label">域名:</span>
        <span class="value domain">
          {{ reverseResult.name || '无' }}
        </span>
      </div>
      <div class="result-item">
        <span class="label">状态:</span>
        <span :class="['status', reverseResult.reverseResolved ? 'success' : 'default']">
          {{ reverseResult.reverseResolved ? '✅ 已反向解析' : '⚪ 未设置反向解析' }}
        </span>
      </div>
    </div>
    
    <!-- 详细信息结果 -->
    <div v-if="detailsResult && activeTab === 'details'" class="result-card details">
      <h4>{{ detailsResult.name }}</h4>
      
      <div v-if="detailsResult.avatar" class="avatar-section">
        <img :src="detailsResult.avatar" alt="Avatar" class="ens-avatar" />
      </div>
      
      <div class="result-item">
        <span class="label">所有者:</span>
        <span class="value address">
          {{ detailsResult.owner || '未知' }}
          <button v-if="detailsResult.owner" class="copy-btn" @click="copyAddress(detailsResult.owner)">📋</button>
        </span>
      </div>
      
      <div class="result-item">
        <span class="label">解析地址:</span>
        <span class="value address">
          {{ detailsResult.resolvedAddress || '未设置' }}
          <button v-if="detailsResult.resolvedAddress" class="copy-btn" @click="copyAddress(detailsResult.resolvedAddress)">📋</button>
        </span>
      </div>
      
      <div class="result-item">
        <span class="label">头像:</span>
        <span class="value">{{ detailsResult.avatar ? '✅ 已设置' : '❌ 未设置' }}</span>
      </div>
      
      <div class="result-item">
        <span class="label">注册日期:</span>
        <span class="value">{{ formatDate(detailsResult.registrationDate) }}</span>
      </div>
      
      <div class="result-item">
        <span class="label">到期日期:</span>
        <span class="value" :class="{ expired: detailsResult.isExpired }">
          {{ formatDate(detailsResult.expiryDate) }}
          <span v-if="detailsResult.isExpired" class="expired-tag">已过期</span>
        </span>
      </div>
      
      <div class="result-item">
        <span class="label">域名类型:</span>
        <span class="value">{{ detailsResult.is2LD ? '二级域名 (.eth)' : '子域名' }}</span>
      </div>
    </div>
    
    <!-- 热门域名 -->
    <div v-if="activeTab === 'popular'" class="popular-section">
      <h4>🌟 热门ENS域名</h4>
      <div v-if="loadingPopular" class="loading">加载中...</div>
      <div v-else class="popular-list">
        <div 
          v-for="item in popularResults" 
          :key="item.name"
          class="popular-item"
          @click="selectPopular(item.name)"
        >
          <div class="popular-avatar">
            <img v-if="item.avatar" :src="item.avatar" alt="" />
            <span v-else>🔤</span>
          </div>
          <div class="popular-info">
            <span class="popular-name">{{ item.name }}</span>
            <span class="popular-address">{{ formatAddress(item.resolvedAddress) }}</span>
          </div>
          <button class="view-btn">查看</button>
        </div>
      </div>
    </div>
    
    <!-- 演示域名 -->
    <div class="demo-section">
      <h4>试试这些域名:</h4>
      <div class="demo-list">
        <button class="demo-btn" @click="useDemo('vitalik.eth')">vitalik.eth</button>
        <button class="demo-btn" @click="useDemo('uniswap.eth')">uniswap.eth</button>
        <button class="demo-btn" @click="useDemo('aave.eth')">aave.eth</button>
        <button class="demo-btn" @click="useDemo('cryptopunk.eth')">cryptopunk.eth</button>
        <button class="demo-btn" @click="useDemo('yearn.eth')">yearn.eth</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  resolveEnsName, 
  reverseResolveEns, 
  getEnsDetails,
  getPopularEnsDomains,
  type EnsResolveResult,
  type EnsReverseResult,
  type EnsDetails 
} from '@/service/api/web3';

const activeTab = ref('resolve');
const loading = ref(false);
const loadingPopular = ref(false);
const error = ref('');

// Form inputs
const ensName = ref('');
const ethAddress = ref('');
const detailName = ref('');

// Results
const resolveResult = ref<EnsResolveResult | null>(null);
const reverseResult = ref<EnsReverseResult | null>(null);
const detailsResult = ref<EnsDetails | null>(null);
const popularResults = ref<EnsDetails[]>([]);

const copied = ref(false);

// Initialize
onMounted(() => {
  loadPopular();
});

// Load popular ENS
const loadPopular = async () => {
  loadingPopular.value = true;
  try {
    const result = await getPopularEnsDomains(15);
    popularResults.value = result.results || [];
  } catch (e: any) {
    console.error('Failed to load popular ENS:', e);
  } finally {
    loadingPopular.value = false;
  }
};

// Resolve ENS name
const resolveEns = async () => {
  if (!ensName.value) return;
  
  loading.value = true;
  error.value = '';
  resolveResult.value = null;
  
  try {
    const result = await resolveEnsName(ensName.value);
    resolveResult.value = result;
  } catch (e: any) {
    error.value = e.message || '解析失败';
  } finally {
    loading.value = false;
  }
};

// Reverse resolve
const reverseResolve = async () => {
  if (!ethAddress.value) return;
  
  loading.value = true;
  error.value = '';
  reverseResult.value = null;
  
  try {
    const result = await reverseResolveEns(ethAddress.value);
    reverseResult.value = result;
  } catch (e: any) {
    error.value = e.message || '解析失败';
  } finally {
    loading.value = false;
  }
};

// Get details
const getDetails = async () => {
  if (!detailName.value) return;
  
  loading.value = true;
  error.value = '';
  detailsResult.value = null;
  
  try {
    const result = await getEnsDetails(detailName.value);
    detailsResult.value = result;
  } catch (e: any) {
    error.value = e.message || '查询失败';
  } finally {
    loading.value = false;
  }
};

// Use demo
const useDemo = (name: string) => {
  if (activeTab.value === 'resolve') {
    ensName.value = name;
    resolveEns();
  } else if (activeTab.value === 'details') {
    detailName.value = name;
    getDetails();
  }
};

// Select popular
const selectPopular = (name: string) => {
  detailName.value = name;
  activeTab.value = 'details';
  getDetails();
};

// Copy address
const copyAddress = async (address: string) => {
  await navigator.clipboard.writeText(address);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
};

// Format address
const formatAddress = (address: string | null) => {
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format date
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '未知';
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
};
</script>

<style scoped>
.ens-lookup {
  padding: 20px;
}

.search-section {
  margin-bottom: 24px;
}

.search-section h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.subtitle {
  color: #666;
  margin-bottom: 16px;
}

.search-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.search-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.input-group label {
  font-size: 12px;
  color: #666;
}

.ens-input, .address-input {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
}

.search-btn {
  padding: 10px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.search-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
}

.result-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
}

.result-card h4 {
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.result-item .label {
  width: 100px;
  color: #666;
  font-size: 14px;
}

.result-item .value {
  flex: 1;
  font-size: 14px;
}

.result-item .value.address {
  font-family: monospace;
  background: #e5e7eb;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.result-item .value.domain {
  color: #4f46e5;
  font-weight: 500;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.success {
  background: #d1fae5;
  color: #059669;
}

.status.error {
  background: #fee2e2;
  color: #dc2626;
}

.status.default {
  background: #f3f4f6;
  color: #666;
}

.avatar-section {
  text-align: center;
  margin-bottom: 16px;
}

.ens-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #4f46e5;
}

.expired {
  color: #dc2626;
}

.expired-tag {
  background: #fee2e2;
  color: #dc2626;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.popular-section {
  margin-top: 20px;
}

.popular-section h4 {
  margin: 0 0 16px 0;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.popular-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popular-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.popular-item:hover {
  background: #f3f4f6;
}

.popular-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.popular-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.popular-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.popular-name {
  font-weight: 500;
  font-size: 14px;
}

.popular-address {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.view-btn {
  padding: 6px 12px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.demo-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.demo-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.demo-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.demo-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.demo-btn:hover {
  background: #e5e7eb;
}
</style>
