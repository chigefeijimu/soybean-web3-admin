<template>
  <div class="address-label-lookup">
    <div class="header">
      <h2>🔍 Address Label Lookup</h2>
      <p class="subtitle">Identify known blockchain addresses (CEX, DeFi, protocols, whales)</p>
    </div>

    <!-- Search Box -->
    <div class="search-section">
      <div class="search-box">
        <input
          v-model="searchAddress"
          type="text"
          placeholder="Enter wallet address (e.g., 0xd8da6b...)"
          @keyup.enter="lookupAddress"
        />
        <button @click="lookupAddress" :disabled="loading">
          {{ loading ? 'Searching...' : 'Lookup' }}
        </button>
      </div>
      <div class="search-hints">
        <span class="hint-label">Try:</span>
        <button 
          v-for="addr in exampleAddresses" 
          :key="addr.address"
          class="hint-btn"
          @click="fillAddress(addr.address)"
        >
          {{ addr.label }}
        </button>
      </div>
    </div>

    <!-- Results -->
    <div v-if="result" class="result-card" :class="resultClass">
      <div class="result-header">
        <span class="category-badge" :class="result.category.toLowerCase()">
          {{ result.category }}
        </span>
        <span v-if="result.chain" class="chain-badge">{{ result.chain }}</span>
      </div>
      
      <div class="result-content">
        <h3>{{ result.label }}</h3>
        <div class="address-display">
          <code>{{ result.address }}</code>
          <button class="copy-btn" @click="copyAddress(result.address)">
            📋 Copy
          </button>
        </div>
        
        <div v-if="result.description" class="description">
          {{ result.description }}
        </div>
        
        <div v-if="result.protocol" class="protocol-info">
          <span class="label">Protocol:</span>
          <span class="value">{{ result.protocol }}</span>
        </div>
        
        <div class="risk-info" v-if="result.risk">
          <span class="label">Risk Level:</span>
          <span class="risk-badge" :class="result.risk">{{ result.risk }}</span>
        </div>
      </div>
    </div>

    <!-- No Result -->
    <div v-else-if="searched && !result" class="no-result">
      <p>No label found for this address</p>
      <p class="help-text">This address is not in our known addresses database</p>
    </div>

    <!-- Quick Categories -->
    <div class="categories-section">
      <h3>Browse by Category</h3>
      <div class="category-grid">
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          class="category-card"
          :class="{ active: selectedCategory === cat.id }"
          @click="filterByCategory(cat.id)"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-count">{{ cat.count }}</span>
        </button>
      </div>
    </div>

    <!-- Popular Labels -->
    <div v-if="!selectedCategory" class="popular-section">
      <h3>Popular Addresses</h3>
      <div class="popular-grid">
        <div 
          v-for="label in popularLabels" 
          :key="label.address"
          class="popular-item"
          @click="fillAddress(label.address)"
        >
          <span class="pop-category" :class="label.category.toLowerCase()">
            {{ label.category }}
          </span>
          <span class="pop-label">{{ label.label }}</span>
          <span class="pop-address">{{ shortenAddress(label.address) }}</span>
        </div>
      </div>
    </div>

    <!-- Category Results -->
    <div v-if="selectedCategory" class="category-results">
      <div class="results-header">
        <h3>{{ getCategoryName(selectedCategory) }}</h3>
        <button class="back-btn" @click="selectedCategory = null">← Back</button>
      </div>
      <div class="results-list">
        <div 
          v-for="label in categoryLabels" 
          :key="label.address"
          class="result-item"
          @click="fillAddress(label.address)"
        >
          <div class="item-info">
            <span class="item-label">{{ label.label }}</span>
            <code class="item-address">{{ shortenAddress(label.address) }}</code>
          </div>
          <span v-if="label.protocol" class="item-protocol">{{ label.protocol }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const searchAddress = ref('');
const loading = ref(false);
const searched = ref(false);
const result = ref<any>(null);
const popularLabels = ref<any[]>([]);
const categoryLabels = ref<any[]>([]);
const selectedCategory = ref<string | null>(null);
const allLabels = ref<any[]>([]);

const exampleAddresses = [
  { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', label: 'Vitalik' },
  { address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance' },
  { address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', label: 'Uniswap' },
  { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', label: 'USDC' },
];

const categories = [
  { id: 'CEX', name: 'CEX Wallets', icon: '🏦', count: 0 },
  { id: 'DeFi', name: 'DeFi Protocols', icon: '🧪', count: 0 },
  { id: 'NFT', name: 'NFT Platforms', icon: '🖼️', count: 0 },
  { id: 'Stablecoin', name: 'Stablecoins', icon: '💵', count: 0 },
  { id: 'Bridge', name: 'Bridges', icon: '🌉', count: 0 },
  { id: 'DAO', name: 'DAO Treasuries', icon: '🏛️', count: 0 },
  { id: 'Person', name: 'Known People', icon: '👤', count: 0 },
  { id: 'Token', name: 'Popular Tokens', icon: '🪙', count: 0 },
];

const resultClass = computed(() => {
  if (!result.value) return '';
  const categoryColors: Record<string, string> = {
    'CEX': 'result-cex',
    'DeFi': 'result-defi',
    'NFT': 'result-nft',
    'Stablecoin': 'result-stablecoin',
    'Bridge': 'result-bridge',
    'DAO': 'result-dao',
    'Person': 'result-person',
    'Token': 'result-token',
    'System': 'result-system',
  };
  return categoryColors[result.value.category] || 'result-default';
});

async function lookupAddress() {
  if (!searchAddress.value.trim()) return;
  
  loading.value = true;
  searched.value = true;
  
  try {
    const response = await axios.get(`/api/address-label/address/${searchAddress.value}`);
    result.value = response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      result.value = null;
    } else {
      ElMessage.error('Error looking up address');
    }
  } finally {
    loading.value = false;
  }
}

async function loadPopularLabels() {
  try {
    const response = await axios.get('/api/address-label/popular');
    popularLabels.value = response.data;
  } catch (error) {
    console.error('Error loading popular labels:', error);
  }
}

async function loadCategories() {
  try {
    const response = await axios.get('/api/address-label/categories');
    const dbCategories = response.data;
    
    // Get all labels to count categories
    const allResponse = await axios.get('/api/address-label/search');
    allLabels.value = allResponse.data;
    
    // Update category counts
    categories.forEach(cat => {
      cat.count = allLabels.value.filter((l: any) => l.category === cat.id).length;
    });
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

async function filterByCategory(categoryId: string) {
  selectedCategory.value = categoryId;
  loading.value = true;
  
  try {
    const response = await axios.get(`/api/address-label/search?category=${categoryId}`);
    categoryLabels.value = response.data;
  } catch (error) {
    ElMessage.error('Error loading category');
  } finally {
    loading.value = false;
  }
}

function fillAddress(addr: string) {
  searchAddress.value = addr;
  lookupAddress();
}

function shortenAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getCategoryName(id: string): string {
  const cat = categories.find(c => c.id === id);
  return cat?.name || id;
}

async function copyAddress(addr: string) {
  try {
    await navigator.clipboard.writeText(addr);
    ElMessage.success('Address copied!');
  } catch (error) {
    ElMessage.error('Failed to copy');
  }
}

function formatCategory(category: string): string {
  return category;
}

// Load data on mount
loadPopularLabels();
loadCategories();
</script>

<style scoped>
.address-label-lookup {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.subtitle {
  color: #666;
  margin: 8px 0 0;
}

.search-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 12px;
}

.search-box input {
  flex: 1;
  padding: 12px 16px;
  font-size: 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: monospace;
}

.search-box input:focus {
  border-color: #4f46e5;
  outline: none;
}

.search-box button {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.search-box button:hover:not(:disabled) {
  background: #4338ca;
}

.search-box button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.search-hints {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hint-label {
  color: #666;
  font-size: 13px;
}

.hint-btn {
  padding: 4px 10px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.hint-btn:hover {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 4px solid #4f46e5;
}

.result-cex { border-left-color: #10b981; }
.result-defi { border-left-color: #8b5cf6; }
.result-nft { border-left-color: #f59e0b; }
.result-stablecoin { border-left-color: #3b82f6; }
.result-bridge { border-left-color: #06b6d4; }
.result-dao { border-left-color: #ec4899; }
.result-person { border-left-color: #f97316; }
.result-token { border-left-color: #84cc16; }
.result-system { border-left-color: #6b7280; }

.result-header {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.category-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.category-badge.cex { background: #d1fae5; color: #065f46; }
.category-badge.defi { background: #ede9fe; color: #5b21b6; }
.category-badge.nft { background: #fef3c7; color: #92400e; }
.category-badge.stablecoin { background: #dbeafe; color: #1e40af; }
.category-badge.bridge { background: #cffafe; color: #0e7490; }
.category-badge.dao { background: #fce7f3; color: #9d174d; }
.category-badge.person { background: #ffedd5; color: #9a3412; }
.category-badge.token { background: #dcfce7; color: #166534; }
.category-badge.system { background: #f3f4f6; color: #374151; }

.chain-badge {
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.result-content h3 {
  margin: 0 0 12px;
  font-size: 20px;
  color: #111;
}

.address-display {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.address-display code {
  font-family: monospace;
  font-size: 13px;
  color: #333;
  flex: 1;
  word-break: break-all;
}

.copy-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.copy-btn:hover {
  background: #f3f4f6;
}

.description {
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
}

.protocol-info, .risk-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.protocol-info .label, .risk-info .label {
  color: #666;
}

.protocol-info .value {
  font-weight: 600;
}

.risk-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.risk-badge.safe { background: #d1fae5; color: #065f46; }
.risk-badge.low { background: #dbeafe; color: #1e40af; }
.risk-badge.medium { background: #fef3c7; color: #92400e; }
.risk-badge.high { background: #fee2e2; color: #991b1b; }
.risk-badge.critical { background: #991b1b; color: white; }

.no-result {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 24px;
}

.no-result p {
  margin: 0;
  color: #666;
}

.no-result .help-text {
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}

.categories-section {
  margin-bottom: 24px;
}

.categories-section h3 {
  margin: 0 0 16px;
  font-size: 18px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-card:hover {
  border-color: #4f46e5;
}

.category-card.active {
  border-color: #4f46e5;
  background: #eef2ff;
}

.cat-icon {
  font-size: 24px;
}

.cat-name {
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}

.cat-count {
  font-size: 11px;
  color: #999;
}

.popular-section h3, .category-results h3 {
  margin: 0 0 16px;
  font-size: 18px;
}

.popular-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.popular-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.popular-item:hover {
  border-color: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.pop-category {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 600;
}

.pop-category.cex { color: #10b981; }
.pop-category.defi { color: #8b5cf6; }
.pop-category.nft { color: #f59e0b; }
.pop-category.stablecoin { color: #3b82f6; }
.pop-category.dao { color: #ec4899; }
.pop-category.person { color: #f97316; }
.pop-category.token { color: #84cc16; }

.pop-label {
  font-weight: 600;
  font-size: 14px;
}

.pop-address {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.back-btn {
  padding: 8px 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.back-btn:hover {
  background: #e5e7eb;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  border-color: #4f46e5;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-label {
  font-weight: 500;
}

.item-address {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.item-protocol {
  font-size: 12px;
  color: #8b5cf6;
  font-weight: 500;
}
</style>
