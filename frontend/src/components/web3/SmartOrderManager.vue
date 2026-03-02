<template>
  <div class="smart-order-manager">
    <div class="header">
      <h2>📋 Smart Order Manager</h2>
      <p class="subtitle">Set take-profit, stop-loss, and limit orders</p>
    </div>

    <!-- Stats Overview -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total Orders</div>
        </div>
      </div>
      <div class="stat-card active">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.active }}</div>
          <div class="stat-label">Active</div>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.triggered }}</div>
          <div class="stat-label">Triggered</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.expired }}</div>
          <div class="stat-label">Expired</div>
        </div>
      </div>
    </div>

    <!-- Create Order Form -->
    <div class="card create-order-card">
      <h3>Create New Order</h3>
      
      <div class="form-grid">
        <div class="form-group">
          <label>Chain</label>
          <select v-model="form.chainId" @change="loadTokens">
            <option v-for="chain in chains" :key="chain.chainId" :value="chain.chainId">
              {{ chain.name }} ({{ chain.symbol }})
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Token</label>
          <select v-model="form.tokenAddress" @change="updateTokenInfo">
            <option v-for="token in tokens" :key="token.address" :value="token.address">
              {{ token.logo }} {{ token.symbol }} - {{ token.name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Order Type</label>
          <select v-model="form.orderType">
            <option value="take_profit">Take Profit</option>
            <option value="stop_loss">Stop Loss</option>
            <option value="limit_buy">Limit Buy</option>
            <option value="limit_sell">Limit Sell</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Side</label>
          <select v-model="form.side">
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Amount ({{ selectedToken?.symbol || 'TOKEN' }})</label>
          <input 
            type="number" 
            v-model="form.amount" 
            placeholder="0.00"
            step="0.0001"
          />
        </div>
        
        <div class="form-group">
          <label>Trigger Price (USD)</label>
          <input 
            type="number" 
            v-model="form.triggerPrice" 
            placeholder="0.00"
            step="0.01"
          />
        </div>
        
        <div class="form-group" v-if="form.orderType.includes('limit')">
          <label>Limit Price (USD)</label>
          <input 
            type="number" 
            v-model="form.limitPrice" 
            placeholder="0.00"
            step="0.01"
          />
        </div>
        
        <div class="form-group">
          <label>Expires In (hours, optional)</label>
          <input 
            type="number" 
            v-model="form.expiresInHours" 
            placeholder="No expiration"
            min="1"
          />
        </div>
      </div>
      
      <div class="form-group full-width">
        <label>Notes (optional)</label>
        <input 
          type="text" 
          v-model="form.notes" 
          placeholder="Add a note..."
        />
      </div>
      
      <!-- Price Info -->
      <div class="price-info" v-if="currentPrice">
        <span class="current-price">
          Current Price: <strong>${{ currentPrice.toFixed(4) }}</strong>
        </span>
        <span class="price-diff" :class="priceDiffClass">
          {{ priceDiffText }}
        </span>
      </div>
      
      <button 
        class="btn-primary" 
        @click="createOrder"
        :disabled="!canCreateOrder || loading"
      >
        {{ loading ? 'Creating...' : 'Create Order' }}
      </button>
    </div>

    <!-- Filter & Orders List -->
    <div class="card orders-card">
      <div class="card-header">
        <h3>Your Orders</h3>
        <div class="filters">
          <select v-model="filterStatus" @change="loadOrders">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="triggered">Triggered</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
          <select v-model="filterChain" @change="loadOrders">
            <option value="">All Chains</option>
            <option v-for="chain in chains" :key="chain.chainId" :value="chain.chainId">
              {{ chain.name }}
            </option>
          </select>
          <button class="btn-refresh" @click="checkOrders">
            🔄 Check Orders
          </button>
        </div>
      </div>
      
      <div class="orders-list" v-if="orders.length > 0">
        <div 
          v-for="order in orders" 
          :key="order.id" 
          class="order-item"
          :class="order.status"
        >
          <div class="order-header">
            <span class="order-type" :class="order.side">
              {{ getOrderTypeLabel(order.orderType) }}
            </span>
            <span class="order-status" :class="order.status">
              {{ order.status }}
            </span>
          </div>
          
          <div class="order-details">
            <div class="detail">
              <span class="label">Token:</span>
              <span class="value">{{ order.tokenSymbol }}</span>
            </div>
            <div class="detail">
              <span class="label">Amount:</span>
              <span class="value">{{ parseFloat(order.amount).toFixed(4) }}</span>
            </div>
            <div class="detail">
              <span class="label">Trigger:</span>
              <span class="value">${{ order.triggerPrice.toFixed(4) }}</span>
            </div>
            <div class="detail">
              <span class="label">Current:</span>
              <span class="value" :class="priceChangeClass(order)">
                ${{ order.currentPrice.toFixed(4) }}
              </span>
            </div>
          </div>
          
          <div class="order-footer">
            <span class="chain-badge">{{ getChainName(order.chainId) }}</span>
            <span class="time">{{ formatTime(order.createdAt) }}</span>
            
            <div class="order-actions">
              <button 
                v-if="order.status === 'active'"
                class="btn-small danger"
                @click="cancelOrder(order.id)"
              >
                Cancel
              </button>
              <button 
                class="btn-small"
                @click="deleteOrder(order.id)"
              >
                Delete
              </button>
            </div>
          </div>
          
          <div class="progress-bar" v-if="order.status === 'active'">
            <div 
              class="progress" 
              :class="progressClass(order)"
              :style="{ width: getProgressWidth(order) + '%' }"
            ></div>
          </div>
        </div>
      </div>
      
      <div class="empty-state" v-else>
        <p>No orders found</p>
        <p class="hint">Create your first order above!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';

interface Chain {
  chainId: string;
  name: string;
  symbol: string;
  color?: string;
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
}

interface Order {
  id: string;
  userAddress: string;
  chainId: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  orderType: string;
  side: string;
  amount: string;
  triggerPrice: number;
  currentPrice: number;
  limitPrice?: number;
  status: string;
  createdAt: number;
  triggeredAt?: number;
  expiresAt?: number;
  notes?: string;
}

interface Stats {
  total: number;
  active: number;
  triggered: number;
  cancelled: number;
  expired: number;
  byType: Record<string, number>;
  byChain: Record<string, number>;
}

const API_BASE = 'http://localhost:3022/smart-order';

// State
const chains = ref<Chain[]>([]);
const tokens = ref<Token[]>([]);
const orders = ref<Order[]>([]);
const stats = ref<Stats>({
  total: 0,
  active: 0,
  triggered: 0,
  cancelled: 0,
  expired: 0,
  byType: {},
  byChain: {},
});
const currentPrice = ref<number>(0);
const loading = ref(false);

const form = ref({
  chainId: '1',
  tokenAddress: '',
  tokenSymbol: '',
  tokenName: '',
  orderType: 'take_profit',
  side: 'sell',
  amount: '',
  triggerPrice: '',
  limitPrice: '',
  expiresInHours: '',
  notes: '',
});

const filterStatus = ref('');
const filterChain = ref('');

const selectedToken = computed(() => {
  return tokens.value.find(t => t.address === form.value.tokenAddress);
});

const canCreateOrder = computed(() => {
  return form.value.chainId && 
         form.value.tokenAddress && 
         form.value.amount && 
         parseFloat(form.value.amount) > 0 &&
         form.value.triggerPrice && 
         parseFloat(form.value.triggerPrice) > 0;
});

const priceDiffClass = computed(() => {
  if (!currentPrice.value || !form.value.triggerPrice) return '';
  const diff = (parseFloat(form.value.triggerPrice) - currentPrice.value) / currentPrice.value * 100;
  if (diff > 0) return 'positive';
  if (diff < 0) return 'negative';
  return '';
});

const priceDiffText = computed(() => {
  if (!currentPrice.value || !form.value.triggerPrice) return '';
  const diff = (parseFloat(form.value.triggerPrice) - currentPrice.value) / currentPrice.value * 100;
  if (diff > 0) return `+${diff.toFixed(2)}% above current`;
  if (diff < 0) return `${diff.toFixed(2)}% below current`;
  return 'At current price';
});

// Methods
const getOrderTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'take_profit': 'Take Profit',
    'stop_loss': 'Stop Loss',
    'limit_buy': 'Limit Buy',
    'limit_sell': 'Limit Sell',
  };
  return labels[type] || type;
};

const getChainName = (chainId: string) => {
  const chain = chains.value.find(c => c.chainId === chainId);
  return chain?.name || chainId;
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const priceChangeClass = (order: Order) => {
  if (order.side === 'sell') {
    if (order.orderType === 'take_profit') {
      return order.currentPrice >= order.triggerPrice ? 'positive' : '';
    } else {
      return order.currentPrice <= order.triggerPrice ? 'positive' : 'negative';
    }
  } else {
    return order.currentPrice <= order.triggerPrice ? 'positive' : 'negative';
  }
};

const progressClass = (order: Order) => {
  if (order.side === 'sell') {
    return order.currentPrice >= order.triggerPrice ? 'ready' : '';
  } else {
    return order.currentPrice <= order.triggerPrice ? 'ready' : '';
  }
};

const getProgressWidth = (order: Order) => {
  if (!order.currentPrice || !order.triggerPrice) return 0;
  const current = order.currentPrice;
  const trigger = order.triggerPrice;
  const base = order.side === 'sell' 
    ? Math.min(current, trigger) 
    : Math.max(current, trigger);
  const range = Math.abs(trigger - current);
  return range > 0 ? Math.min(100, (range / base) * 100) : 100;
};

// API Calls
const loadChains = async () => {
  try {
    const response = await axios.get(`${API_BASE}/chains`);
    chains.value = response.data.chains;
    if (chains.value.length > 0) {
      form.value.chainId = chains.value[0].chainId;
      await loadTokens();
    }
  } catch (error) {
    console.error('Failed to load chains:', error);
  }
};

const loadTokens = async () => {
  try {
    const response = await axios.get(`${API_BASE}/tokens/${form.value.chainId}`);
    tokens.value = response.data.tokens;
    if (tokens.value.length > 0) {
      form.value.tokenAddress = tokens.value[0].address;
      form.value.tokenSymbol = tokens.value[0].symbol;
      form.value.tokenName = tokens.value[0].name;
      await updateTokenInfo();
    }
  } catch (error) {
    console.error('Failed to load tokens:', error);
  }
};

const updateTokenInfo = async () => {
  const token = selectedToken.value;
  if (!token) return;
  
  form.value.tokenSymbol = token.symbol;
  form.value.tokenName = token.name;
  
  // Get current price
  try {
    const response = await axios.get(`${API_BASE}/price/${form.value.chainId}/${token.address}`);
    currentPrice.value = response.data.price;
    
    // Auto-fill trigger price with current price
    if (!form.value.triggerPrice) {
      form.value.triggerPrice = currentPrice.value.toFixed(4);
    }
  } catch (error) {
    console.error('Failed to get price:', error);
  }
};

const loadOrders = async () => {
  const userAddress = '0x0000000000000000000000000000000000000001'; // Demo address
  
  try {
    let url = `${API_BASE}/orders/${userAddress}`;
    const params = [];
    if (filterStatus.value) params.push(`status=${filterStatus.value}`);
    if (filterChain.value) params.push(`chainId=${filterChain.value}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    const response = await axios.get(url);
    orders.value = response.data.orders;
    
    // Also update stats
    const statsResponse = await axios.get(`${API_BASE}/stats/${userAddress}`);
    stats.value = statsResponse.data.stats;
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
};

const createOrder = async () => {
  if (!canCreateOrder.value) return;
  
  loading.value = true;
  try {
    await axios.post(`${API_BASE}/create`, {
      userAddress: '0x0000000000000000000000000000000000000001', // Demo
      chainId: form.value.chainId,
      tokenAddress: form.value.tokenAddress,
      tokenSymbol: form.value.tokenSymbol,
      tokenName: form.value.tokenName,
      orderType: form.value.orderType,
      side: form.value.side,
      amount: form.value.amount,
      triggerPrice: form.value.triggerPrice,
      limitPrice: form.value.limitPrice || undefined,
      expiresInHours: form.value.expiresInHours ? parseInt(form.value.expiresInHours) : undefined,
      notes: form.value.notes || undefined,
    });
    
    // Reset form
    form.value.amount = '';
    form.value.notes = '';
    
    // Reload orders
    await loadOrders();
  } catch (error: any) {
    console.error('Failed to create order:', error);
    alert(error.response?.data?.error || 'Failed to create order');
  } finally {
    loading.value = false;
  }
};

const cancelOrder = async (orderId: string) => {
  try {
    await axios.put(`${API_BASE}/order/${orderId}`, { status: 'cancelled' });
    await loadOrders();
  } catch (error) {
    console.error('Failed to cancel order:', error);
  }
};

const deleteOrder = async (orderId: string) => {
  if (!confirm('Are you sure you want to delete this order?')) return;
  
  try {
    await axios.delete(`${API_BASE}/order/${orderId}`);
    await loadOrders();
  } catch (error) {
    console.error('Failed to delete order:', error);
  }
};

const checkOrders = async () => {
  try {
    const userAddress = '0x0000000000000000000000000000000000000001';
    await axios.post(`${API_BASE}/check`, { userAddress });
    await loadOrders();
    alert('Orders checked!');
  } catch (error) {
    console.error('Failed to check orders:', error);
  }
};

// Initialize
onMounted(async () => {
  await loadChains();
  await loadOrders();
});

// Watch for chain changes
watch(() => form.value.chainId, async () => {
  await loadTokens();
});
</script>

<style scoped>
.smart-order-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.subtitle {
  color: #666;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-card.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card.success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.stat-card.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.current-price {
  font-size: 16px;
}

.price-diff {
  font-size: 14px;
  font-weight: 500;
}

.price-diff.positive {
  color: #11998e;
}

.price-diff.negative {
  color: #f5576c;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
}

.filters {
  display: flex;
  gap: 8px;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}

.btn-refresh {
  padding: 8px 12px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.btn-refresh:hover {
  background: #e0e0e0;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 16px;
  border-left: 4px solid #ddd;
}

.order-item.active {
  border-left-color: #667eea;
}

.order-item.triggered {
  border-left-color: #11998e;
  background: #f0fdf4;
}

.order-item.cancelled,
.order-item.expired {
  border-left-color: #f5576c;
  opacity: 0.7;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.order-type {
  font-weight: 600;
  font-size: 14px;
}

.order-type.buy {
  color: #11998e;
}

.order-type.sell {
  color: #f5576c;
}

.order-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.order-status.active {
  background: #e0e7ff;
  color: #4338ca;
}

.order-status.triggered {
  background: #dcfce7;
  color: #166534;
}

.order-status.cancelled,
.order-status.expired {
  background: #fee2e2;
  color: #991b1b;
}

.order-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.detail {
  font-size: 13px;
}

.detail .label {
  color: #666;
  margin-right: 4px;
}

.detail .value {
  font-weight: 500;
}

.detail .value.positive {
  color: #11998e;
}

.detail .value.negative {
  color: #f5576c;
}

.order-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.chain-badge {
  font-size: 11px;
  padding: 4px 8px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 4px;
}

.time {
  font-size: 12px;
  color: #666;
  flex: 1;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.btn-small.danger {
  background: #fee2e2;
  border-color: #fecaca;
  color: #991b1b;
}

.btn-small:hover {
  background: #f5f5f5;
}

.progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin-top: 12px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #667eea;
  transition: width 0.3s;
}

.progress.ready {
  background: #11998e;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state .hint {
  font-size: 13px;
  color: #999;
}
</style>
