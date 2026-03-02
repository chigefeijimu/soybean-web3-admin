<template>
  <div class="data-exporter">
    <div class="header">
      <h2>📤 On-chain Data Exporter</h2>
      <p class="subtitle">Export your blockchain data to CSV or JSON</p>
    </div>

    <!-- Wallet Input -->
    <div class="section">
      <label class="section-label">Wallet Address</label>
      <div class="input-group">
        <input 
          v-model="walletAddress" 
          type="text" 
          placeholder="0x..."
          class="address-input"
        />
        <button @click="loadAddressInfo" class="btn btn-primary" :disabled="!walletAddress">
          🔍 Load
        </button>
      </div>
      <div v-if="addressInfo" class="address-info">
        <span class="info-badge">✓ Address loaded</span>
        <span class="chain-count">{{ Object.keys(addressInfo.chains).length }} chains detected</span>
      </div>
    </div>

    <!-- Chain Selection -->
    <div class="section">
      <label class="section-label">Select Chains</label>
      <div class="chain-grid">
        <label 
          v-for="chain in availableChains" 
          :key="chain.chainId"
          class="chain-checkbox"
          :class="{ active: selectedChains.includes(chain.chainId) }"
        >
          <input 
            type="checkbox" 
            :value="chain.chainId" 
            v-model="selectedChains"
          />
          <span class="chain-name">{{ chain.name }}</span>
          <span class="chain-symbol">({{ chain.symbol }})</span>
        </label>
      </div>
      <div class="chain-actions">
        <button @click="selectAllChains" class="btn btn-sm">Select All</button>
        <button @click="selectMainChains" class="btn btn-sm">Main Chains</button>
        <button @click="clearChains" class="btn btn-sm">Clear</button>
      </div>
    </div>

    <!-- Export Type Selection -->
    <div class="section">
      <label class="section-label">Export Type</label>
      <div class="export-types">
        <div 
          v-for="expType in exportTypes" 
          :key="expType.id"
          class="export-type-card"
          :class="{ active: selectedExportType === expType.id }"
          @click="selectedExportType = expType.id"
        >
          <div class="exp-type-icon">{{ expType.icon }}</div>
          <div class="exp-type-info">
            <div class="exp-type-name">{{ expType.label }}</div>
            <div class="exp-type-desc">{{ expType.description }}</div>
          </div>
          <div class="exp-type-check" v-if="selectedExportType === expType.id">✓</div>
        </div>
      </div>
    </div>

    <!-- Format Selection -->
    <div class="section">
      <label class="section-label">Export Format</label>
      <div class="format-options">
        <label 
          class="format-option"
          :class="{ active: selectedFormat === 'csv' }"
        >
          <input type="radio" value="csv" v-model="selectedFormat" />
          <span class="format-icon">📄</span>
          <span class="format-name">CSV</span>
          <span class="format-desc">Spreadsheet compatible</span>
        </label>
        <label 
          class="format-option"
          :class="{ active: selectedFormat === 'json' }"
        >
          <input type="radio" value="json" v-model="selectedFormat" />
          <span class="format-icon">📋</span>
          <span class="format-name">JSON</span>
          <span class="format-desc">Programmatic use</span>
        </label>
      </div>
    </div>

    <!-- Export Button -->
    <div class="section export-section">
      <button 
        @click="exportData" 
        class="btn btn-export"
        :disabled="!walletAddress || isExporting"
      >
        <span v-if="isExporting" class="spinner">⏳</span>
        <span v-else>📥</span>
        {{ isExporting ? 'Exporting...' : 'Export Data' }}
      </button>
      
      <!-- Preview -->
      <div v-if="exportPreview" class="preview-section">
        <h4>📊 Export Preview</h4>
        <div class="preview-stats">
          <div class="stat-item">
            <span class="stat-label">Type:</span>
            <span class="stat-value">{{ exportTypes.find(t => t.id === selectedExportType)?.label }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Format:</span>
            <span class="stat-value">{{ selectedFormat.toUpperCase() }}</span>
          </div>
          <div class="stat-item" v-if="exportPreview.count !== undefined">
            <span class="stat-label">Records:</span>
            <span class="stat-value">{{ exportPreview.count }}</span>
          </div>
          <div class="stat-item" v-if="exportPreview.total_value_usd">
            <span class="stat-label">Total Value:</span>
            <span class="stat-value">${{ exportPreview.total_value_usd.toFixed(2) }}</span>
          </div>
        </div>
        
        <!-- Data Preview Table -->
        <div v-if="exportPreview.data && exportPreview.data.length > 0" class="data-preview">
          <table>
            <thead>
              <tr>
                <th v-for="key in getPreviewKeys(exportPreview.data[0])" :key="key">
                  {{ formatKey(key) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in exportPreview.data.slice(0, 5)" :key="idx">
                <td v-for="key in getPreviewKeys(row)" :key="key">
                  {{ formatValue(row[key], key) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="exportPreview.data.length > 5" class="preview-note">
            Showing 5 of {{ exportPreview.data.length }} records
          </div>
        </div>
        
        <!-- Download Button -->
        <button @click="downloadExport" class="btn btn-download">
          ⬇️ Download {{ selectedFormat.toUpperCase() }}
        </button>
      </div>
    </div>

    <!-- Recent Exports -->
    <div class="section" v-if="recentExports.length > 0">
      <label class="section-label">Recent Exports</label>
      <div class="recent-exports">
        <div 
          v-for="exp in recentExports" 
          :key="exp.timestamp" 
          class="export-item"
        >
          <span class="exp-icon">{{ exp.icon }}</span>
          <div class="exp-details">
            <span class="exp-type">{{ exp.type }}</span>
            <span class="exp-time">{{ formatTime(exp.timestamp) }}</span>
          </div>
          <span class="exp-count">{{ exp.count }} records</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-large">⏳</div>
      <p>Loading blockchain data...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';

const API_BASE = 'http://localhost:3031';

// State
const walletAddress = ref('');
const addressInfo = ref<any>(null);
const selectedChains = ref<string[]>(['1']);
const selectedExportType = ref('balances');
const selectedFormat = ref('csv');
const isExporting = ref(false);
const isLoading = ref(false);
const exportPreview = ref<any>(null);
const recentExports = ref<Array<{type: string, icon: string, count: number, timestamp: number}>>([]);

// Available chains
const availableChains = [
  { chainId: '1', name: 'Ethereum', symbol: 'ETH' },
  { chainId: '137', name: 'Polygon', symbol: 'MATIC' },
  { chainId: '42161', name: 'Arbitrum', symbol: 'ETH' },
  { chainId: '10', name: 'Optimism', symbol: 'ETH' },
  { chainId: '56', name: 'BSC', symbol: 'BNB' },
  { chainId: '8453', name: 'Base', symbol: 'ETH' },
  { chainId: '43114', name: 'Avalanche', symbol: 'AVAX' },
];

// Export types
const exportTypes = [
  { id: 'balances', label: 'Token Balances', description: 'Export all token holdings with USD values', icon: '💰' },
  { id: 'transactions', label: 'Transactions', description: 'Export complete transaction history', icon: '📜' },
  { id: 'nfts', label: 'NFT Holdings', description: 'Export NFT collection', icon: '🖼️' },
  { id: 'defi-positions', label: 'DeFi Positions', description: 'Export DeFi protocol positions', icon: '🧪' },
  { id: 'portfolio', label: 'Full Portfolio', description: 'Export complete portfolio data', icon: '📊' },
];

// Chain selection actions
function selectAllChains() {
  selectedChains.value = availableChains.map(c => c.chainId);
}

function selectMainChains() {
  selectedChains.value = ['1', '137', '42161'];
}

function clearChains() {
  selectedChains.value = [];
}

// Load address info
async function loadAddressInfo() {
  if (!walletAddress.value) return;
  
  isLoading.value = true;
  try {
    // Quick balance check to verify address
    const response = await axios.post(`${API_BASE}/export/balances`, {
      address: walletAddress.value,
      chainIds: ['1'],
      format: 'json'
    });
    
    addressInfo.value = response.data;
  } catch (error) {
    console.error('Failed to load address:', error);
  } finally {
    isLoading.value = false;
  }
}

// Export data
async function exportData() {
  if (!walletAddress.value) return;
  
  isExporting.value = true;
  exportPreview.value = null;
  
  try {
    const endpoint = selectedExportType.value;
    const response = await axios.post(`${API_BASE}/export/${endpoint}`, {
      address: walletAddress.value,
      chainIds: selectedChains.value,
      format: selectedFormat.value
    }, {
      responseType: selectedFormat.value === 'json' ? 'json' : 'text'
    });
    
    if (selectedFormat.value === 'json') {
      exportPreview.value = response.data;
    } else {
      // For CSV, parse it for preview
      exportPreview.value = {
        format: 'csv',
        downloadUrl: URL.createObjectURL(new Blob([response.data], { type: 'text/csv' })),
        count: response.data.split('\n').length - 1
      };
    }
    
    // Add to recent exports
    const typeInfo = exportTypes.find(t => t.id === selectedExportType.value);
    recentExports.value.unshift({
      type: typeInfo?.label || selectedExportType.value,
      icon: typeInfo?.icon || '📤',
      count: exportPreview.value.count || 0,
      timestamp: Date.now()
    });
    
    // Keep only last 5
    if (recentExports.value.length > 5) {
      recentExports.value = recentExports.value.slice(0, 5);
    }
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed. Please try again.');
  } finally {
    isExporting.value = false;
  }
}

// Download export
function downloadExport() {
  if (!exportPreview.value) return;
  
  const filename = `${selectedExportType.value}_${walletAddress.value}_${Date.now()}.${selectedFormat.value}`;
  
  if (selectedFormat.value === 'json' && exportPreview.value.data) {
    const blob = new Blob([JSON.stringify(exportPreview.value, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } else if (exportPreview.value.downloadUrl) {
    const a = document.createElement('a');
    a.href = exportPreview.value.downloadUrl;
    a.download = filename;
    a.click();
  }
}

// Helper functions
function getPreviewKeys(obj: any): string[] {
  if (!obj) return [];
  return Object.keys(obj).slice(0, 6);
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(value: any, key: string): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    if (key.includes('price') || key.includes('value') || key.includes('usd')) {
      return '$' + value.toFixed(2);
    }
    return value.toFixed(4);
  }
  if (typeof value === 'string' && value.length > 20) {
    return value.substring(0, 10) + '...' + value.substring(value.length - 8);
  }
  return String(value);
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}
</script>

<style scoped>
.data-exporter {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  font-size: 28px;
  color: #1a1a2e;
}

.subtitle {
  color: #666;
  margin-top: 5px;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-label {
  display: block;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.input-group {
  display: flex;
  gap: 10px;
}

.address-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
}

.address-input:focus {
  outline: none;
  border-color: #627eea;
}

.address-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 10px;
}

.info-badge {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
}

.chain-count {
  color: #666;
  font-size: 13px;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.chain-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.chain-checkbox:hover {
  border-color: #627eea;
}

.chain-checkbox.active {
  background: #e8eaf6;
  border-color: #627eea;
}

.chain-checkbox input {
  display: none;
}

.chain-name {
  font-weight: 500;
  font-size: 14px;
}

.chain-symbol {
  color: #666;
  font-size: 12px;
}

.chain-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #627eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4a5fd6;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  background: #f5f5f5;
  color: #333;
  font-size: 12px;
}

.btn-sm:hover {
  background: #eee;
}

.export-types {
  display: grid;
  gap: 12px;
}

.export-type-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-type-card:hover {
  border-color: #627eea;
}

.export-type-card.active {
  background: #e8eaf6;
  border-color: #627eea;
}

.exp-type-icon {
  font-size: 28px;
}

.exp-type-name {
  font-weight: 600;
  color: #333;
}

.exp-type-desc {
  font-size: 13px;
  color: #666;
}

.exp-type-check {
  margin-left: auto;
  color: #627eea;
  font-weight: bold;
  font-size: 18px;
}

.format-options {
  display: flex;
  gap: 15px;
}

.format-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.format-option:hover {
  border-color: #627eea;
}

.format-option.active {
  background: #e8eaf6;
  border-color: #627eea;
}

.format-option input {
  display: none;
}

.format-icon {
  font-size: 32px;
}

.format-name {
  font-weight: 600;
  color: #333;
}

.format-desc {
  font-size: 12px;
  color: #666;
}

.export-section {
  text-align: center;
}

.btn-export {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #627eea 0%, #4a5fd6 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
}

.btn-export:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(98, 126, 234, 0.4);
}

.btn-export:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.preview-section {
  margin-top: 25px;
  text-align: left;
}

.preview-section h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.preview-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  gap: 8px;
  background: #f5f5f5;
  padding: 8px 14px;
  border-radius: 8px;
}

.stat-label {
  color: #666;
  font-size: 13px;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.data-preview {
  overflow-x: auto;
  margin: 15px 0;
}

.data-preview table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-preview th,
.data-preview td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-preview th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.data-preview td {
  font-family: monospace;
  font-size: 12px;
}

.preview-note {
  text-align: center;
  color: #666;
  font-size: 13px;
  margin-top: 10px;
}

.btn-download {
  width: 100%;
  padding: 14px;
  background: #4caf50;
  color: white;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 15px;
}

.btn-download:hover {
  background: #43a047;
}

.recent-exports {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.exp-icon {
  font-size: 24px;
}

.exp-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.exp-type {
  font-weight: 500;
  color: #333;
}

.exp-time {
  font-size: 12px;
  color: #666;
}

.exp-count {
  color: #627eea;
  font-weight: 500;
  font-size: 13px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner-large {
  font-size: 48px;
  animation: spin 1s linear infinite;
}

.loading-overlay p {
  margin-top: 15px;
  color: #666;
}
</style>
