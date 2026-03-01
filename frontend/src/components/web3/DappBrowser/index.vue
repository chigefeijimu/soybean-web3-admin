<template>
  <div class="dapp-browser">
    <!-- Header -->
    <div class="browser-header">
      <h2>🌐 DApp Browser</h2>
      <div class="header-actions">
        <input
          v-model="searchQuery"
          placeholder="Search DApps..."
          class="search-input"
          @input="handleSearch"
        />
        <button class="add-btn" @click="showAddDialog = true">
          + Add Custom DApp
        </button>
      </div>
    </div>

    <!-- Categories -->
    <div class="categories">
      <div class="category-tabs">
        <button
          :class="['cat-btn', { active: selectedCategory === 'all' }]"
          @click="selectedCategory = 'all'"
        >
          All
        </button>
        <button
          v-for="cat in categories"
          :key="cat"
          :class="['cat-btn', { active: selectedCategory === cat }]"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Trending Section -->
    <div v-if="!searchQuery && selectedCategory === 'all'" class="trending-section">
      <h3>🔥 Trending DApps</h3>
      <div class="trending-grid">
        <div
          v-for="dapp in trendingDapps"
          :key="dapp.id"
          class="trending-card"
          @click="openDapp(dapp)"
        >
          <div class="dapp-logo">{{ dapp.logo }}</div>
          <div class="dapp-info">
            <div class="dapp-name">{{ dapp.name }}</div>
            <div class="dapp-desc">{{ dapp.description }}</div>
          </div>
          <div class="dapp-stats">
            <span>👁️ {{ dapp.visits }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- DApps Grid -->
    <div class="dapps-section">
      <h3>{{ selectedCategory === 'all' ? 'All DApps' : selectedCategory }}</h3>
      <div class="dapps-grid">
        <div
          v-for="dapp in filteredDapps"
          :key="dapp.id"
          class="dapp-card"
          @click="openDapp(dapp)"
        >
          <div class="dapp-logo">{{ dapp.logo }}</div>
          <div class="dapp-info">
            <div class="dapp-name">
              {{ dapp.name }}
              <span v-if="dapp.isCustom" class="custom-badge">Custom</span>
            </div>
            <div class="dapp-desc">{{ dapp.description }}</div>
            <div class="dapp-chains">
              <span
                v-for="chain in dapp.chains.slice(0, 4)"
                :key="chain"
                class="chain-badge"
              >
                {{ getChainName(chain) }}
              </span>
              <span v-if="dapp.chains.length > 4" class="chain-more">
                +{{ dapp.chains.length - 4 }}
              </span>
            </div>
          </div>
          <div class="dapp-actions">
            <button
              v-if="dapp.isCustom"
              class="delete-btn"
              @click.stop="removeCustomDapp(dapp.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Custom DApp Dialog -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="showAddDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>Add Custom DApp</h3>
          <button class="close-btn" @click="showAddDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>Name</label>
            <input v-model="customDappForm.name" placeholder="DApp Name" />
          </div>
          <div class="form-group">
            <label>URL</label>
            <input v-model="customDappForm.url" placeholder="https://" />
          </div>
          <div class="form-group">
            <label>Category</label>
            <select v-model="customDappForm.category">
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea
              v-model="customDappForm.description"
              rows="2"
              placeholder="Description"
            />
          </div>
          <div class="form-group">
            <label>Logo (Emoji)</label>
            <input v-model="customDappForm.logo" placeholder="🔗" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="showAddDialog = false">Cancel</button>
          <button class="primary-btn" @click="addCustomDapp">Add DApp</button>
        </div>
      </div>
    </div>

    <!-- DApp Preview Dialog -->
    <div v-if="showPreviewDialog" class="dialog-overlay" @click="showPreviewDialog = false">
      <div class="dialog dialog-large" @click.stop>
        <div class="dialog-header">
          <h3>{{ selectedDapp?.name }}</h3>
          <button class="close-btn" @click="showPreviewDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <div class="preview-header">
            <button class="primary-btn" @click="openInNewTab">
              Open in New Tab ↗
            </button>
          </div>
          <div class="preview-info">
            <p>{{ selectedDapp?.description }}</p>
            <p><strong>Category:</strong> {{ selectedDapp?.category }}</p>
            <p><strong>Supported Chains:</strong> {{ selectedDapp?.chains?.map(c => getChainName(c)).join(', ') }}</p>
          </div>
          <div class="info-alert">
            Due to browser security restrictions, DApps require wallet connection and cannot be embedded directly.
            Click "Open in New Tab" to access the DApp.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

interface Dapp {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  logo?: string;
  chains: number[];
  isCustom?: boolean;
  visits?: number;
}

const { CHAIN_INFO } = useWeb3();

const dapps = ref<Dapp[]>([]);
const categories = ref<string[]>([]);
const trendingDapps = ref<Dapp[]>([]);
const searchQuery = ref('');
const selectedCategory = ref('all');
const showAddDialog = ref(false);
const showPreviewDialog = ref(false);
const selectedDapp = ref<Dapp | null>(null);

const customDappForm = ref({
  name: '',
  url: '',
  category: 'Custom',
  description: '',
  logo: '🔗',
});

const filteredDapps = computed(() => {
  let result = dapps.value;
  if (selectedCategory.value !== 'all') {
    result = result.filter(d => d.category === selectedCategory.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  }
  return result;
});

function getChainName(chainId: number): string {
  return CHAIN_INFO[chainId]?.name || `Chain ${chainId}`;
}

function handleSearch() {
  // Search is handled by computed property
}

async function loadDapps() {
  try {
    const response = await fetch('/api/web3/dapp-browser/list');
    const data = await response.json();
    dapps.value = data;
  } catch (error) {
    console.error('Failed to load DApps:', error);
  }
}

async function loadCategories() {
  try {
    const response = await fetch('/api/web3/dapp-browser/categories');
    const data = await response.json();
    categories.value = data;
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

async function loadTrending() {
  try {
    const response = await fetch('/api/web3/dapp-browser/trending/list');
    const data = await response.json();
    trendingDapps.value = data;
  } catch (error) {
    console.error('Failed to load trending:', error);
  }
}

function openDapp(dapp: Dapp) {
  selectedDapp.value = dapp;
  showPreviewDialog.value = true;
}

function openInNewTab() {
  if (selectedDapp.value?.url) {
    window.open(selectedDapp.value.url, '_blank');
  }
}

async function addCustomDapp() {
  if (!customDappForm.value.name || !customDappForm.value.url) {
    alert('Please fill in name and URL');
    return;
  }

  try {
    const response = await fetch('/api/web3/dapp-browser/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customDappForm.value),
    });
    
    if (response.ok) {
      alert('DApp added successfully');
      showAddDialog.value = false;
      customDappForm.value = {
        name: '',
        url: '',
        category: 'Custom',
        description: '',
        logo: '🔗',
      };
      loadDapps();
    }
  } catch (error) {
    alert('Failed to add DApp');
  }
}

async function removeCustomDapp(id: string) {
  if (!confirm('Are you sure you want to remove this DApp?')) return;
  
  try {
    const response = await fetch(`/api/web3/dapp-browser/custom/${id}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      alert('DApp removed');
      loadDapps();
    }
  } catch (error) {
    alert('Failed to remove DApp');
  }
}

onMounted(() => {
  loadDapps();
  loadCategories();
  loadTrending();
});
</script>

<style scoped>
.dapp-browser {
  padding: 20px;
}

.browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.browser-header h2 {
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 200px;
}

.add-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.add-btn:hover {
  background: #5568d3;
}

.categories {
  margin-bottom: 20px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cat-btn {
  padding: 6px 14px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.cat-btn:hover {
  border-color: #667eea;
}

.cat-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.trending-section,
.dapps-section {
  margin-bottom: 30px;
}

.trending-section h3,
.dapps-section h3 {
  margin-bottom: 15px;
  font-size: 18px;
}

.trending-grid,
.dapps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.trending-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.trending-card:hover {
  transform: translateY(-3px);
}

.dapp-logo {
  font-size: 36px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  flex-shrink: 0;
}

.dapp-info {
  flex: 1;
  min-width: 0;
}

.dapp-name {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dapp-desc {
  font-size: 12px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dapp-stats {
  font-size: 13px;
}

.dapp-card {
  padding: 15px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dapp-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.dapp-chains {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.chain-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: #334155;
  border-radius: 4px;
  color: #94a3b8;
}

.chain-more {
  font-size: 11px;
  color: #64748b;
}

.custom-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #f59e0b;
  color: white;
  border-radius: 4px;
}

.dapp-actions {
  border-top: 1px solid #334155;
  padding-top: 10px;
}

.delete-btn {
  padding: 4px 10px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #1e293b;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  max-height: 90vh;
  overflow: auto;
}

.dialog-large {
  max-width: 600px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #334155;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
}

.dialog-body {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #334155;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 13px;
  color: #94a3b8;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: white;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.cancel-btn {
  padding: 8px 16px;
  background: #334155;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.primary-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.primary-btn:hover {
  background: #5568d3;
}

.preview-header {
  margin-bottom: 15px;
}

.preview-info {
  margin-bottom: 15px;
}

.preview-info p {
  margin: 8px 0;
  color: #cbd5e1;
}

.info-alert {
  padding: 12px;
  background: #1e3a5f;
  border-radius: 6px;
  color: #93c5fd;
  font-size: 13px;
}
</style>
