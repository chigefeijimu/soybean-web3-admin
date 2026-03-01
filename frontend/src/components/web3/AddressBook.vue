<template>
  <div class="address-book">
    <div class="header">
      <h3>📒 Address Book</h3>
      <button class="btn-add" @click="showAddModal = true">
        + Add Address
      </button>
    </div>

    <!-- Search -->
    <div class="search-box">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search by label or address..."
        @input="handleSearch"
      />
    </div>

    <!-- Address List -->
    <div class="address-list">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="filteredAddresses.length === 0" class="empty">
        No saved addresses. Add your first contact!
      </div>
      <div 
        v-else
        v-for="addr in filteredAddresses" 
        :key="addr.id" 
        class="address-card"
        :class="{ favorite: addr.isFavorite }"
      >
        <div class="address-info">
          <div class="label">{{ addr.label }}</div>
          <div class="address">{{ formatAddress(addr.address) }}</div>
          <div class="meta">
            <span class="chain">Chain: {{ getChainName(addr.chainId) }}</span>
            <span v-if="addr.addressType" class="type">{{ addr.addressType }}</span>
          </div>
          <div v-if="addr.description" class="description">{{ addr.description }}</div>
        </div>
        <div class="actions">
          <button class="btn-icon" @click="copyAddress(addr.address)" title="Copy">
            📋
          </button>
          <button class="btn-icon" @click="toggleFavorite(addr)" :title="addr.isFavorite ? 'Remove from favorites' : 'Add to favorites'">
            {{ addr.isFavorite ? '⭐' : '☆' }}
          </button>
          <button class="btn-icon" @click="editAddress(addr)" title="Edit">
            ✏️
          </button>
          <button class="btn-icon danger" @click="deleteAddress(addr.id)" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h4>{{ showEditModal ? 'Edit Address' : 'Add New Address' }}</h4>
        <form @submit.prevent="saveAddress">
          <div class="form-group">
            <label>Label *</label>
            <input v-model="form.label" type="text" required placeholder="e.g., My Main Wallet" />
          </div>
          <div class="form-group">
            <label>Address *</label>
            <input v-model="form.address" type="text" required placeholder="0x..." />
          </div>
          <div class="form-group">
            <label>Chain</label>
            <select v-model="form.chainId">
              <option :value="1">Ethereum</option>
              <option :value="56">BSC</option>
              <option :value="137">Polygon</option>
              <option :value="42161">Arbitrum</option>
              <option :value="10">Optimism</option>
              <option :value="8453">Base</option>
            </select>
          </div>
          <div class="form-group">
            <label>Type</label>
            <select v-model="form.addressType">
              <option value="">Select type</option>
              <option value="eoa">EOA (Wallet)</option>
              <option value="contract">Smart Contract</option>
              <option value="token">Token Contract</option>
              <option value="nft">NFT Contract</option>
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="form.description" placeholder="Optional notes..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
            <button type="submit" class="btn-save">{{ showEditModal ? 'Update' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface AddressEntry {
  id: string;
  userId: string;
  label: string;
  address: string;
  chainId: number;
  addressType?: string;
  description?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  ensName?: string;
  balance?: string;
}

const addresses = ref<AddressEntry[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const showAddModal = ref(false);
const showEditModal = ref(false);
const editingId = ref('');

const form = ref({
  label: '',
  address: '',
  chainId: 1,
  addressType: '',
  description: ''
});

const chainNames: Record<number, string> = {
  1: 'Ethereum',
  56: 'BSC',
  137: 'Polygon',
  42161: 'Arbitrum',
  421613: 'Arbitrum Goerli',
  10: 'Optimism',
  69: 'Optimism Goerli',
  8453: 'Base',
  84531: 'Base Goerli',
  80001: 'Mumbai'
};

const filteredAddresses = computed(() => {
  if (!searchQuery.value) return addresses.value;
  const q = searchQuery.value.toLowerCase();
  return addresses.value.filter(a => 
    a.label.toLowerCase().includes(q) || 
    a.address.toLowerCase().includes(q)
  );
});

function getChainName(chainId: number): string {
  return chainNames[chainId] || `Chain ${chainId}`;
}

function formatAddress(addr: string): string {
  if (!addr) return '';
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

async function fetchAddresses() {
  loading.value = true;
  try {
    const res = await fetch('/api/web3/address-book/list');
    const json = await res.json();
    if (json.success) {
      addresses.value = json.data || [];
    }
  } catch (e) {
    console.error('Failed to fetch addresses:', e);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  // Search is handled by computed property
}

async function toggleFavorite(addr: AddressEntry) {
  try {
    const res = await fetch(`/api/web3/address-book/${addr.id}/favorite`, { 
      method: 'POST' 
    });
    const json = await res.json();
    if (json.success) {
      addr.isFavorite = json.data.isFavorite;
      // Re-sort
      addresses.value.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return b.isFavorite ? 1 : -1;
        return a.label.localeCompare(b.label);
      });
    }
  } catch (e) {
    console.error('Failed to toggle favorite:', e);
  }
}

function copyAddress(addr: string) {
  navigator.clipboard.writeText(addr);
  alert('Address copied!');
}

function editAddress(addr: AddressEntry) {
  editingId.value = addr.id;
  form.value = {
    label: addr.label,
    address: addr.address,
    chainId: addr.chainId,
    addressType: addr.addressType || '',
    description: addr.description || ''
  };
  showEditModal.value = true;
}

async function deleteAddress(id: string) {
  if (!confirm('Are you sure you want to delete this address?')) return;
  
  try {
    const res = await fetch(`/api/web3/address-book/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      addresses.value = addresses.value.filter(a => a.id !== id);
      alert('Address deleted');
    }
  } catch (e) {
    console.error('Failed to delete:', e);
  }
}

function closeModal() {
  showAddModal.value = false;
  showEditModal.value = false;
  editingId.value = '';
  form.value = {
    label: '',
    address: '',
    chainId: 1,
    addressType: '',
    description: ''
  };
}

async function saveAddress() {
  const payload = {
    label: form.value.label,
    address: form.value.address,
    chainId: form.value.chainId,
    addressType: form.value.addressType || null,
    description: form.value.description || null
  };

  try {
    let url = '/api/web3/address-book';
    let method = 'POST';

    if (showEditModal.value) {
      url = `/api/web3/address-book/${editingId.value}`;
      method = 'PUT';
      Object.assign(payload, { id: editingId.value });
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (json.success) {
      alert(showEditModal.value ? 'Address updated!' : 'Address saved!');
      closeModal();
      fetchAddresses();
    } else {
      alert(json.msg || 'Failed to save');
    }
  } catch (e) {
    console.error('Failed to save:', e);
    alert('Failed to save address');
  }
}

onMounted(() => {
  fetchAddresses();
});
</script>

<style scoped>
.address-book {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.btn-add {
  background: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover {
  background: #40a9ff;
}

.search-box {
  margin-bottom: 16px;
}

.search-box input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.address-card {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.address-card.favorite {
  border-color: #faad14;
  background: #fffbe6;
}

.address-info {
  flex: 1;
}

.label {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
}

.address {
  font-family: monospace;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.type {
  background: #e6f7ff;
  padding: 2px 8px;
  border-radius: 4px;
  color: #1890ff;
}

.description {
  margin-top: 6px;
  font-size: 13px;
  color: #888;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-icon.danger:hover {
  color: red;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
}

.modal h4 {
  margin: 0 0 16px;
  font-size: 18px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  min-height: 60px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel {
  background: #f0f0f0;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save {
  background: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
