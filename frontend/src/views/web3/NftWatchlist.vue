<template>
  <div class="nft-watchlist">
    <div class="page-header">
      <h1>🎯 NFT Watchlist</h1>
      <p class="subtitle">Track your favorite NFT collections</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalItems }}</div>
          <div class="stat-label">Total Items</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⛓️</div>
        <div class="stat-content">
          <div class="stat-value">{{ Object.keys(stats.chains).length }}</div>
          <div class="stat-label">Chains</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💎</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalFloorValue.toFixed(2) }} ETH</div>
          <div class="stat-label">Total Floor Value</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalVolume24h.toFixed(2) }} ETH</div>
          <div class="stat-label">24h Volume</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔔</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.alertsEnabled }}</div>
          <div class="stat-label">Active Alerts</div>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search collections..."
          class="search-input"
        />
      </div>
      <div class="action-buttons">
        <button @click="refreshPrices" class="btn btn-secondary" :disabled="loading">
          🔄 Refresh Prices
        </button>
        <button @click="showAddModal = true" class="btn btn-primary">
          ➕ Add Collection
        </button>
        <button @click="showBulkAddModal = true" class="btn btn-secondary">
          📥 Bulk Add
        </button>
        <button @click="clearWatchlist" class="btn btn-danger" v-if="watchlist.length > 0">
          🗑️ Clear All
        </button>
      </div>
    </div>

    <!-- Alerts Banner -->
    <div class="alerts-banner" v-if="triggeredAlerts.length > 0">
      <span class="alert-icon">⚠️</span>
      <span>{{ triggeredAlerts.length }} collection(s) triggered alert conditions!</span>
      <button @click="showAlerts = true" class="btn-link">View Alerts</button>
    </div>

    <!-- Watchlist Table -->
    <div class="table-container">
      <table class="data-table" v-if="filteredWatchlist.length > 0">
        <thead>
          <tr>
            <th>Collection</th>
            <th>Chain</th>
            <th>Floor Price</th>
            <th>24h Change</th>
            <th>24h Volume</th>
            <th>Holders</th>
            <th>Alert</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredWatchlist" :key="item.id">
            <td>
              <div class="collection-info">
                <div class="collection-image">
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.collectionName" />
                  <div v-else class="placeholder-image">🎨</div>
                </div>
                <div class="collection-details">
                  <div class="collection-name">{{ item.collectionName || 'Unknown' }}</div>
                  <div class="collection-address">{{ shortAddress(item.collectionAddress) }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="chain-badge" :class="item.chain">{{ item.chain }}</span>
            </td>
            <td>
              <div class="price-cell">
                <span class="price">{{ item.floorPrice?.toFixed(3) || '0' }}</span>
                <span class="currency">ETH</span>
              </div>
            </td>
            <td>
              <span 
                class="change-badge" 
                :class="item.floorPriceChange24h >= 0 ? 'positive' : 'negative'"
              >
                {{ item.floorPriceChange24h >= 0 ? '↑' : '↓' }}
                {{ Math.abs(item.floorPriceChange24h || 0).toFixed(2) }}%
              </span>
            </td>
            <td>{{ item.volume24h?.toFixed(2) || '0' }} ETH</td>
            <td>{{ formatNumber(item.holders || 0) }}</td>
            <td>
              <div class="alert-cell">
                <label class="toggle">
                  <input 
                    type="checkbox" 
                    :checked="item.alertEnabled"
                    @change="toggleAlert(item)"
                  />
                  <span class="slider"></span>
                </label>
                <span v-if="item.alertEnabled && item.alertFloorPrice" class="alert-threshold">
                  &lt; {{ item.alertFloorPrice }} ETH
                </span>
              </div>
            </td>
            <td>
              <div class="actions-cell">
                <button @click="editItem(item)" class="btn-icon" title="Edit">✏️</button>
                <button @click="removeItem(item.id)" class="btn-icon" title="Remove">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <div class="empty-icon">🎨</div>
        <h3>No collections in watchlist</h3>
        <p>Add your favorite NFT collections to track their floor prices and volume.</p>
        <button @click="showAddModal = true" class="btn btn-primary">
          Add Your First Collection
        </button>
      </div>
    </div>

    <!-- Add Modal -->
    <div class="modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Add Collection to Watchlist</h2>
          <button @click="showAddModal = false" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Collection Address *</label>
            <input 
              v-model="newItem.collectionAddress" 
              type="text" 
              placeholder="0x..."
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Chain *</label>
            <select v-model="newItem.chain" class="form-select">
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
              <option value="base">Base</option>
              <option value="solana">Solana</option>
              <option value="avalanche">Avalanche</option>
            </select>
          </div>
          <div class="form-group">
            <label>Collection Name</label>
            <input 
              v-model="newItem.collectionName" 
              type="text" 
              placeholder="My Favorite NFT"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea 
              v-model="newItem.notes" 
              placeholder="Add notes about this collection..."
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="newItem.alertEnabled" />
              Enable price alert
            </label>
          </div>
          <div class="form-group" v-if="newItem.alertEnabled">
            <label>Alert when floor price falls below (ETH)</label>
            <input 
              v-model.number="newItem.alertFloorPrice" 
              type="number" 
              step="0.1"
              placeholder="15.0"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAddModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="addCollection" class="btn btn-primary" :disabled="!newItem.collectionAddress || !newItem.chain">
            Add Collection
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal-overlay" v-if="showEditModal" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Edit Collection</h2>
          <button @click="showEditModal = false" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Collection Name</label>
            <input 
              v-model="editingItem.collectionName" 
              type="text" 
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea 
              v-model="editingItem.notes" 
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="editingItem.alertEnabled" />
              Enable price alert
            </label>
          </div>
          <div class="form-group" v-if="editingItem.alertEnabled">
            <label>Alert when floor price falls below (ETH)</label>
            <input 
              v-model.number="editingItem.alertFloorPrice" 
              type="number" 
              step="0.1"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showEditModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="saveEdit" class="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Alerts Modal -->
    <div class="modal-overlay" v-if="showAlerts" @click.self="showAlerts = false">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>⚠️ Triggered Alerts</h2>
          <button @click="showAlerts = false" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="triggeredAlerts.length === 0" class="empty-state small">
            <p>No alerts triggered</p>
          </div>
          <div v-else class="alert-list">
            <div v-for="alert in triggeredAlerts" :key="alert.id" class="alert-item">
              <div class="alert-collection">{{ alert.collectionName }}</div>
              <div class="alert-details">
                Current: {{ alert.floorPrice?.toFixed(3) }} ETH | Alert: &lt; {{ alert.alertFloorPrice }} ETH
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Add Modal -->
    <div class="modal-overlay" v-if="showBulkAddModal" @click.self="showBulkAddModal = false">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Bulk Add Collections</h2>
          <button @click="showBulkAddModal = false" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <p class="form-hint">Enter one collection per line in format: address,chain,name</p>
          <textarea 
            v-model="bulkText" 
            placeholder="0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d,ethereum,BoredApeYachtClub
0x23581767a106ae21c074b2276d25e5c3e136a68b,ethereum,Moonbird"
            class="form-textarea bulk-textarea"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showBulkAddModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="bulkAdd" class="btn btn-primary" :disabled="!bulkText">
            Add Collections
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-overlay" v-if="loading">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { nftWatchlist, type NftWatchlistItem, type WatchlistStats } from '@/service/nftWatchlist'

const watchlist = ref<NftWatchlistItem[]>([])
const stats = ref<WatchlistStats | null>(null)
const triggeredAlerts = ref<NftWatchlistItem[]>([])
const loading = ref(false)
const searchQuery = ref('')

// Modals
const showAddModal = ref(false)
const showEditModal = ref(false)
const showAlerts = ref(false)
const showBulkAddModal = ref(false)

// Form data
const newItem = ref({
  collectionAddress: '',
  chain: 'ethereum',
  collectionName: '',
  notes: '',
  alertEnabled: false,
  alertFloorPrice: undefined as number | undefined
})

const editingItem = ref<Partial<NftWatchlistItem>>({})
const bulkText = ref('')

// Computed
const filteredWatchlist = computed(() => {
  if (!searchQuery.value) return watchlist.value
  const query = searchQuery.value.toLowerCase()
  return watchlist.value.filter(
    item =>
      item.collectionName?.toLowerCase().includes(query) ||
      item.collectionAddress.toLowerCase().includes(query) ||
      item.chain.toLowerCase().includes(query)
  )
})

// Methods
const loadWatchlist = async () => {
  loading.value = true
  try {
    const res = await nftWatchlist.getWatchlist()
    watchlist.value = res.data || []
    
    const statsRes = await nftWatchlist.getStats()
    stats.value = statsRes.data || null
    
    const alertsRes = await nftWatchlist.getAlerts()
    triggeredAlerts.value = alertsRes.data || []
  } catch (error) {
    console.error('Failed to load watchlist:', error)
  } finally {
    loading.value = false
  }
}

const addCollection = async () => {
  try {
    await nftWatchlist.addToWatchlist(newItem.value)
    showAddModal.value = false
    newItem.value = {
      collectionAddress: '',
      chain: 'ethereum',
      collectionName: '',
      notes: '',
      alertEnabled: false,
      alertFloorPrice: undefined
    }
    await loadWatchlist()
  } catch (error) {
    console.error('Failed to add collection:', error)
  }
}

const editItem = (item: NftWatchlistItem) => {
  editingItem.value = { ...item }
  showEditModal.value = true
}

const saveEdit = async () => {
  if (!editingItem.value.id) return
  try {
    await nftWatchlist.updateWatchlistItem(editingItem.value.id, editingItem.value)
    showEditModal.value = false
    await loadWatchlist()
  } catch (error) {
    console.error('Failed to update collection:', error)
  }
}

const removeItem = async (id: string) => {
  if (!confirm('Are you sure you want to remove this collection?')) return
  try {
    await nftWatchlist.removeFromWatchlist(id)
    await loadWatchlist()
  } catch (error) {
    console.error('Failed to remove collection:', error)
  }
}

const toggleAlert = async (item: NftWatchlistItem) => {
  try {
    await nftWatchlist.updateWatchlistItem(item.id, { alertEnabled: !item.alertEnabled })
    await loadWatchlist()
  } catch (error) {
    console.error('Failed to toggle alert:', error)
  }
}

const refreshPrices = async () => {
  loading.value = true
  try {
    const res = await nftWatchlist.refreshPrices()
    watchlist.value = res.data || []
  } catch (error) {
    console.error('Failed to refresh prices:', error)
  } finally {
    loading.value = false
  }
}

const clearWatchlist = async () => {
  if (!confirm('Are you sure you want to clear all items from your watchlist?')) return
  try {
    await nftWatchlist.clearWatchlist()
    await loadWatchlist()
  } catch (error) {
    console.error('Failed to clear watchlist:', error)
  }
}

const bulkAdd = async () => {
  const lines = bulkText.value.split('\n').filter(line => line.trim())
  const collections = lines.map(line => {
    const [address, chain, name] = line.split(',').map(s => s.trim())
    return { collectionAddress: address, chain: chain || 'ethereum', collectionName: name }
  })
  
  try {
    await nftWatchlist.bulkAdd(collections)
    showBulkAddModal.value = false
    bulkText.value = ''
    await loadWatchlist()
  } catch (error) {
    console.error('Failed to bulk add:', error)
  }
}

const shortAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

onMounted(() => {
  loadWatchlist()
})
</script>

<style scoped>
.nft-watchlist {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: #1a1a2e;
}

.subtitle {
  color: #666;
  margin: 4px 0 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-secondary {
  background: #f3f4f6;
  color: #1a1a2e;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}

.btn-danger:hover {
  background: #fecaca;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-link {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  text-decoration: underline;
}

.alerts-banner {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon {
  font-size: 20px;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 13px;
  color: #666;
  text-transform: uppercase;
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collection-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
}

.collection-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.collection-name {
  font-weight: 500;
}

.collection-address {
  font-size: 12px;
  color: #999;
}

.chain-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.chain-badge.ethereum { background: #e0e7ff; color: #3730a3; }
.chain-badge.polygon { background: #ede9fe; color: #5b21b6; }
.chain-badge.arbitrum { background: #dbeafe; color: #1e40af; }
.chain-badge.optimism { background: #fce7f3; color: #9d174d; }
.chain-badge.base { background: #d1fae5; color: #065f46; }
.chain-badge.solana { background: #fef3c7; color: #92400e; }
.chain-badge.avalanche { background: #fee2e2; color: #991b1b; }

.price-cell {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price {
  font-weight: 600;
}

.currency {
  font-size: 12px;
  color: #999;
}

.change-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.change-badge.positive {
  background: #d1fae5;
  color: #065f46;
}

.change-badge.negative {
  background: #fee2e2;
  color: #991b1b;
}

.alert-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 22px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle input:checked + .slider {
  background-color: #4f46e5;
}

.toggle input:checked + .slider:before {
  transform: translateX(18px);
}

.alert-threshold {
  font-size: 11px;
  color: #999;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-state.small {
  padding: 30px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #1a1a2e;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
}

.modal-overlay {
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

.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
}

.modal-large {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.bulk-textarea {
  min-height: 200px;
  font-family: monospace;
}

.form-hint {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 16px;
}

.alert-collection {
  font-weight: 600;
  margin-bottom: 4px;
}

.alert-details {
  font-size: 13px;
  color: #666;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
