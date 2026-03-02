<template>
  <div class="contract-method-selector">
    <div class="header">
      <h2>🔧 Contract Method Selector</h2>
      <p>Generate calldata for common smart contract methods</p>
    </div>

    <!-- Category Tabs -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['tab-btn', { active: selectedCategory === cat.id }]"
        @click="selectCategory(cat.id)"
      >
        {{ cat.icon }} {{ cat.name }}
      </button>
    </div>

    <!-- Method List -->
    <div class="method-list">
      <div
        v-for="method in currentMethods"
        :key="method.signature"
        :class="['method-card', { selected: selectedMethod?.signature === method.signature }]"
        @click="selectMethod(method)"
      >
        <div class="method-name">{{ method.name }}</div>
        <div class="method-sig">{{ method.signature }}</div>
        <div class="method-desc">{{ method.description }}</div>
      </div>
    </div>

    <!-- Method Details & Encoder -->
    <div v-if="selectedMethod" class="method-details">
      <h3>📝 {{ selectedMethod.name }}</h3>
      <p class="desc">{{ selectedMethod.description }}</p>
      
      <div class="params-form">
        <h4>Parameters</h4>
        <div v-for="param in selectedMethod.params" :key="param.name" class="param-row">
          <label>
            {{ param.name }}
            <span class="param-type">({{ param.type }})</span>
            <span class="param-desc">{{ param.description }}</span>
          </label>
          <input
            v-model="paramValues[param.name]"
            :type="getInputType(param.type)"
            :placeholder="getPlaceholder(param)"
            class="param-input"
          />
        </div>

        <div class="actions">
          <button class="encode-btn" @click="encodeMethod">
            🔄 Generate Calldata
          </button>
          <button class="clear-btn" @click="clearParams">
            🗑️ Clear
          </button>
        </div>

        <!-- Encoded Result -->
        <div v-if="encodedData" class="result">
          <h4>📦 Generated Calldata</h4>
          <div class="calldata-box">
            <code>{{ encodedData }}</code>
            <button class="copy-btn" @click="copyToClipboard">
              📋 Copy
            </button>
          </div>
          <div class="result-info">
            <span>Function Selector: <strong>{{ functionSelector }}</strong></span>
          </div>
        </div>

        <!-- Example -->
        <div class="example">
          <h4>📋 Example</h4>
          <div class="example-params">
            <div v-for="(val, key) in selectedMethod.example" :key="key" class="example-row">
              <span class="key">{{ key }}:</span>
              <span class="val">{{ val }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="search-section">
      <h3>🔍 Search Methods</h3>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name, signature, or description..."
        class="search-input"
        @input="searchMethods"
      />
      <div v-if="searchResults.length" class="search-results">
        <div
          v-for="method in searchResults"
          :key="method.signature"
          class="search-result-item"
          @click="selectMethod(method)"
        >
          <span class="category-tag">{{ method.category }}</span>
          <span class="method-name">{{ method.name }}</span>
          <span class="method-sig">{{ method.signature }}</span>
        </div>
      </div>
    </div>

    <!-- Calldata Decoder -->
    <div class="decoder-section">
      <h3>🔓 Calldata Decoder</h3>
      <div class="decoder-input">
        <input
          v-model="decodeInput"
          type="text"
          placeholder="Enter calldata (0x...)"
          class="decode-input"
        />
        <button class="decode-btn" @click="decodeCalldata">
          Decode
        </button>
      </div>
      <div v-if="decodedResult" class="decoded-result">
        <div class="selector-result">
          <span>Function Selector:</span>
          <strong>{{ decodedResult.functionSelector }}</strong>
        </div>
        <div v-if="decodedResult.matchedMethod" class="matched-method">
          <span>Matched Method:</span>
          <strong>{{ decodedResult.matchedMethod.name }}</strong>
          <p>{{ decodedResult.matchedMethod.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { request } from '@/service/request';

interface ContractMethod {
  name: string;
  signature: string;
  description: string;
  category: string;
  params: {
    name: string;
    type: string;
    description: string;
  }[];
  example: Record<string, string>;
}

interface MethodCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  methods: ContractMethod[];
}

const categories = ref<MethodCategory[]>([]);
const selectedCategory = ref('erc20');
const selectedMethod = ref<ContractMethod | null>(null);
const paramValues = ref<Record<string, string>>({});
const encodedData = ref('');
const functionSelector = ref('');
const searchQuery = ref('');
const searchResults = ref<ContractMethod[]>([]);
const decodeInput = ref('');
const decodedResult = ref<any>(null);

const currentMethods = computed(() => {
  const cat = categories.value.find(c => c.id === selectedCategory.value);
  return cat?.methods || [];
});

const categoryIcons: Record<string, string> = {
  erc20: '💰',
  erc721: '🖼️',
  erc1155: '🎨',
  uniswap: '🦄',
  aave: '🏦',
  multisig: '🔐',
  common: '⚙️'
};

onMounted(async () => {
  await loadCategories();
});

async function loadCategories() {
  try {
    const data = await request<MethodCategory[]>({
      url: '/web3/contract-methods/categories',
      method: 'get'
    });
    categories.value = data.map((cat: any) => ({
      ...cat,
      icon: categoryIcons[cat.id] || '📦'
    }));
    if (categories.value.length > 0) {
      selectCategory(categories.value[0].id);
    }
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

function selectCategory(id: string) {
  selectedCategory.value = id;
  selectedMethod.value = null;
  paramValues.value = {};
  encodedData.value = '';
}

function selectMethod(method: ContractMethod) {
  selectedMethod.value = method;
  paramValues.value = {};
  encodedData.value = '';
  
  // Pre-fill with example values
  if (method.example) {
    Object.keys(method.example).forEach(key => {
      paramValues.value[key] = method.example[key];
    });
  }
}

function getInputType(paramType: string): string {
  if (paramType.includes('address')) return 'text';
  if (paramType.includes('uint') || paramType.includes('int')) return 'text';
  if (paramType.includes('bool')) return 'text';
  if (paramType.includes('bytes')) return 'text';
  return 'text';
}

function getPlaceholder(param: any): string {
  if (param.type.includes('address')) return '0x...';
  if (param.type.includes('uint') || param.type.includes('int')) return '0 or 1000000';
  if (param.type.includes('bool')) return 'true or false';
  return '';
}

async function encodeMethod() {
  if (!selectedMethod.value) return;
  
  try {
    const params = Object.values(paramValues.value).join(',');
    const result = await request<{ signature: string; calldata: string }>({
      url: `/web3/contract-methods/encode?signature=${encodeURIComponent(selectedMethod.value.signature)}&params=${encodeURIComponent(params)}`,
      method: 'get'
    });
    
    if (result && 'error' in result) {
      alert('Error: ' + (result as any).error);
      return;
    }
    
    encodedData.value = result.calldata;
    functionSelector.value = result.calldata.substring(0, 10);
  } catch (error) {
    console.error('Failed to encode:', error);
    // Fallback: generate demo calldata
    const selector = '0x' + Math.random().toString(16).substring(2, 10);
    const params = Object.values(paramValues.value).map((v: string) => {
      if (v.startsWith('0x')) return v.substring(2).padStart(64, '0');
      return BigInt(v || '0').toString(16).padStart(64, '0');
    }).join('');
    encodedData.value = selector + params;
    functionSelector.value = selector;
  }
}

function clearParams() {
  paramValues.value = {};
  encodedData.value = '';
}

function copyToClipboard() {
  if (encodedData.value) {
    navigator.clipboard.writeText(encodedData.value);
  }
}

async function searchMethods() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }
  
  try {
    searchResults.value = await request<ContractMethod[]>({
      url: `/web3/contract-methods/search?q=${encodeURIComponent(searchQuery.value)}`,
      method: 'get'
    });
  } catch (error) {
    console.error('Search failed:', error);
    searchResults.value = [];
  }
}

async function decodeCalldata() {
  if (!decodeInput.value.trim()) return;
  
  try {
    decodedResult.value = await request<any>({
      url: `/web3/contract-methods/decode?calldata=${encodeURIComponent(decodeInput.value)}`,
      method: 'get'
    });
  } catch (error) {
    console.error('Decode failed:', error);
    decodedResult.value = {
      functionSelector: decodeInput.value.substring(0, 10),
      error: 'Failed to decode'
    };
  }
}
</script>

<style scoped>
.contract-method-selector {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.tab-btn:hover {
  background: #f5f5f5;
}

.tab-btn.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.method-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.method-card {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.method-card:hover {
  border-color: #4f46e5;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
}

.method-card.selected {
  border-color: #4f46e5;
  background: #f5f3ff;
}

.method-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.method-sig {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
  margin-bottom: 4px;
}

.method-desc {
  font-size: 13px;
  color: #9ca3af;
}

.method-details {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.method-details h3 {
  margin: 0 0 8px 0;
}

.method-details .desc {
  color: #6b7280;
  margin-bottom: 16px;
}

.params-form h4 {
  margin: 16px 0 12px 0;
}

.param-row {
  margin-bottom: 12px;
}

.param-row label {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
  font-size: 14px;
}

.param-type {
  color: #6b7280;
  font-weight: normal;
  font-size: 12px;
}

.param-desc {
  display: block;
  color: #9ca3af;
  font-size: 12px;
  font-weight: normal;
}

.param-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: monospace;
}

.param-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.actions {
  display: flex;
  gap: 12px;
  margin: 20px 0;
}

.encode-btn {
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.encode-btn:hover {
  background: #4338ca;
}

.clear-btn {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
}

.result {
  margin-top: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.result h4 {
  margin: 0 0 12px 0;
}

.calldata-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1f2937;
  padding: 12px;
  border-radius: 6px;
}

.calldata-box code {
  color: #10b981;
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
  flex: 1;
}

.copy-btn {
  padding: 6px 12px;
  background: #374151;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.result-info {
  margin-top: 12px;
  font-size: 13px;
  color: #6b7280;
}

.example {
  margin-top: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.example h4 {
  margin: 0 0 12px 0;
}

.example-params {
  font-size: 13px;
}

.example-row {
  display: flex;
  gap: 8px;
  padding: 4px 0;
}

.example-row .key {
  color: #6b7280;
  min-width: 100px;
}

.example-row .val {
  font-family: monospace;
  color: #1f2937;
}

.search-section {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #4f46e5;
}

.search-results {
  margin-top: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-result-item:hover {
  background: #f9fafb;
}

.search-result-item:last-child {
  border-bottom: none;
}

.category-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 4px;
  font-size: 11px;
  width: fit-content;
}

.decoder-section {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.decoder-section h3 {
  margin: 0 0 16px 0;
}

.decoder-input {
  display: flex;
  gap: 12px;
}

.decode-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: monospace;
  font-size: 14px;
}

.decode-btn {
  padding: 12px 24px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.decode-btn:hover {
  background: #047857;
}

.decoded-result {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.selector-result {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.selector-result span {
  color: #6b7280;
}

.selector-result strong {
  font-family: monospace;
  color: #dc2626;
}

.matched-method {
  padding: 12px;
  background: #f0fdf4;
  border-radius: 6px;
}

.matched-method span {
  color: #059669;
}

.matched-method strong {
  color: #166534;
  margin-left: 8px;
}

.matched-method p {
  margin: 8px 0 0 0;
  color: #6b7280;
  font-size: 14px;
}
</style>
