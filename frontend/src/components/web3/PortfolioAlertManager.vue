<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const API_BASE = '/api/web3/portfolio-alerts';

// State
const loading = ref(false);
const error = ref('');
const activeTab = ref('price');
const alerts = ref<any[]>([]);
const newAlert = ref({
  type: 'price',
  token: '',
  condition: 'above',
  value: '',
  enabled: true
});

// Price alerts
const priceAlerts = computed(() => alerts.value.filter(a => a.type === 'price'));

// Portfolio change alerts
const portfolioAlerts = computed(() => alerts.value.filter(a => a.type === 'portfolio'));

// Gas alerts
const gasAlerts = computed(() => alerts.value.filter(a => a.type === 'gas'));

// Alert history
const alertHistory = ref<any[]>([]);

// Popular tokens
const popularTokens = [
  { symbol: 'ETH', name: 'Ethereum', price: 2500 },
  { symbol: 'BTC', name: 'Bitcoin', price: 62500 },
  { symbol: 'SOL', name: 'Solana', price: 120 },
  { symbol: 'BNB', name: 'BNB', price: 580 },
  { symbol: 'ARB', name: 'Arbitrum', price: 1.8 },
  { symbol: 'OP', name: 'Optimism', price: 3.2 },
  { symbol: 'MATIC', name: 'Polygon', price: 0.85 },
  { symbol: 'AVAX', name: 'Avalanche', price: 35 },
  { symbol: 'LINK', name: 'Chainlink', price: 18 },
  { symbol: 'UNI', name: 'Uniswap', price: 10 },
];

// Chains
const chains = [
  { id: 1, name: 'Ethereum' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10, name: 'Optimism' },
  { id: 56, name: 'BSC' },
  { id: 8453, name: 'Base' },
];

// Alert conditions
const conditions = [
  { id: 'above', label: 'Goes above', symbol: '↑' },
  { id: 'below', label: 'Goes below', symbol: '↓' },
  { id: 'change_up', label: 'Increases by', symbol: '📈' },
  { id: 'change_down', label: 'Decreases by', symbol: '📉' },
];

// Format functions
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPrice = (price: number) => {
  if (price >= 1000) return `$${price.toLocaleString()}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
};

// Load alerts from localStorage
const loadAlerts = () => {
  try {
    const stored = localStorage.getItem('portfolio_alerts');
    if (stored) {
      alerts.value = JSON.parse(stored);
    } else {
      // Default demo alerts
      alerts.value = [
        { id: 1, type: 'price', token: 'ETH', condition: 'above', value: 3000, enabled: true, createdAt: Date.now() },
        { id: 2, type: 'price', token: 'BTC', condition: 'below', value: 60000, enabled: true, createdAt: Date.now() },
        { id: 3, type: 'gas', chain: 1, condition: 'below', value: 20, enabled: true, createdAt: Date.now() },
      ];
      saveAlerts();
    }
    
    const history = localStorage.getItem('alert_history');
    if (history) {
      alertHistory.value = JSON.parse(history);
    }
  } catch (e) {
    console.error('Failed to load alerts:', e);
  }
};

// Save alerts to localStorage
const saveAlerts = () => {
  try {
    localStorage.setItem('portfolio_alerts', JSON.stringify(alerts.value));
  } catch (e) {
    console.error('Failed to save alerts:', e);
  }
};

// Add new alert
const addAlert = () => {
  if (!newAlert.value.token || !newAlert.value.value) {
    error.value = 'Please fill in all required fields';
    return;
  }
  
  const alert = {
    id: Date.now(),
    ...newAlert.value,
    value: parseFloat(newAlert.value.value),
    createdAt: Date.now(),
  };
  
  alerts.value.push(alert);
  saveAlerts();
  
  // Reset form
  newAlert.value = {
    type: 'price',
    token: '',
    condition: 'above',
    value: '',
    enabled: true
  };
  error.value = '';
};

// Toggle alert enabled
const toggleAlert = (id: number) => {
  const alert = alerts.value.find(a => a.id === id);
  if (alert) {
    alert.enabled = !alert.enabled;
    saveAlerts();
  }
};

// Delete alert
const deleteAlert = (id: number) => {
  alerts.value = alerts.value.filter(a => a.id !== id);
  saveAlerts();
};

// Check alerts (simulate)
const checkAlerts = async () => {
  loading.value = true;
  
  // Simulate checking alerts with random price data
  const triggeredAlerts: any[] = [];
  
  for (const alert of alerts.value.filter(a => a.enabled)) {
    if (alert.type === 'price') {
      // Simulate current price
      const tokenPrice = popularTokens.find(t => t.symbol === alert.token)?.price || 0;
      const currentPrice = tokenPrice * (0.9 + Math.random() * 0.2);
      
      let triggered = false;
      if (alert.condition === 'above' && currentPrice > alert.value) triggered = true;
      if (alert.condition === 'below' && currentPrice < alert.value) triggered = true;
      
      if (triggered) {
        triggeredAlerts.push({
          ...alert,
          triggeredAt: Date.now(),
          currentPrice,
          message: `${alert.token} price ${alert.condition === 'above' ? 'rose above' : 'fell below'} $${alert.value}`
        });
      }
    } else if (alert.type === 'gas') {
      // Simulate gas price
      const currentGas = 10 + Math.random() * 30;
      
      let triggered = false;
      if (alert.condition === 'above' && currentGas > alert.value) triggered = true;
      if (alert.condition === 'below' && currentGas < alert.value) triggered = true;
      
      if (triggered) {
        triggeredAlerts.push({
          ...alert,
          triggeredAt: Date.now(),
          currentGas,
          message: `Gas ${alert.condition === 'above' ? 'rose above' : 'fell below'} ${alert.value} Gwei`
        });
      }
    }
  }
  
  // Add to history
  alertHistory.value = [...triggeredAlerts, ...alertHistory.value].slice(0, 50);
  localStorage.setItem('alert_history', JSON.stringify(alertHistory.value));
  
  loading.value = false;
};

// Clear history
const clearHistory = () => {
  alertHistory.value = [];
  localStorage.setItem('alert_history', JSON.stringify([]));
};

// Stats
const stats = computed(() => ({
  total: alerts.value.length,
  active: alerts.value.filter(a => a.enabled).length,
  triggered: alertHistory.value.length,
  priceAlerts: priceAlerts.value.length,
  gasAlerts: gasAlerts.value.length,
}));

onMounted(() => {
  loadAlerts();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">Portfolio Alert Manager</h2>
        <p class="text-sm text-slate-400">Set price & portfolio alerts</p>
      </div>
      <button
        class="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium hover:bg-purple-600"
        @click="checkAlerts"
        :disabled="loading"
      >
        {{ loading ? 'Checking...' : 'Check Alerts' }}
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="rounded-xl bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Total Alerts</p>
        <p class="text-2xl font-bold">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Active</p>
        <p class="text-2xl font-bold text-green-400">{{ stats.active }}</p>
      </div>
      <div class="rounded-xl bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Price Alerts</p>
        <p class="text-2xl font-bold text-blue-400">{{ stats.priceAlerts }}</p>
      </div>
      <div class="rounded-xl bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Triggered</p>
        <p class="text-2xl font-bold text-yellow-400">{{ stats.triggered }}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-slate-700">
      <button
        v-for="tab in ['price', 'portfolio', 'gas']"
        :key="tab"
        class="px-4 py-2 text-sm font-medium capitalize transition-colors"
        :class="activeTab === tab ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-white'"
        @click="activeTab = tab"
      >
        {{ tab }} Alerts
      </button>
    </div>

    <!-- Add New Alert Form -->
    <div class="rounded-xl bg-slate-800/50 p-6">
      <h3 class="mb-4 text-lg font-semibold">Create New Alert</h3>
      
      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Alert Type -->
        <div>
          <label class="mb-1 block text-sm text-slate-400">Alert Type</label>
          <select
            v-model="newAlert.type"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2"
          >
            <option value="price">Token Price</option>
            <option value="portfolio">Portfolio Change</option>
            <option value="gas">Gas Price</option>
          </select>
        </div>

        <!-- Token (for price alerts) -->
        <div v-if="newAlert.type === 'price'">
          <label class="mb-1 block text-sm text-slate-400">Token</label>
          <select
            v-model="newAlert.token"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2"
          >
            <option value="">Select token</option>
            <option v-for="token in popularTokens" :key="token.symbol" :value="token.symbol">
              {{ token.symbol }} - {{ token.name }}
            </option>
          </select>
        </div>

        <!-- Chain (for gas alerts) -->
        <div v-if="newAlert.type === 'gas'">
          <label class="mb-1 block text-sm text-slate-400">Network</label>
          <select
            v-model="newAlert.chain"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2"
          >
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }}
            </option>
          </select>
        </div>

        <!-- Condition -->
        <div>
          <label class="mb-1 block text-sm text-slate-400">Condition</label>
          <select
            v-model="newAlert.condition"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2"
          >
            <option v-for="cond in conditions" :key="cond.id" :value="cond.id">
              {{ cond.label }}
            </option>
          </select>
        </div>

        <!-- Value -->
        <div>
          <label class="mb-1 block text-sm text-slate-400">
            {{ newAlert.type === 'gas' ? 'Gas Price (Gwei)' : newAlert.type === 'portfolio' ? 'Change (%)' : 'Price (USD)' }}
          </label>
          <input
            v-model="newAlert.value"
            type="number"
            step="0.01"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2"
            :placeholder="newAlert.type === 'gas' ? 'e.g. 20' : 'e.g. 3000'"
          />
        </div>
      </div>

      <div class="mt-4 flex items-center gap-4">
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="newAlert.enabled" class="rounded" />
          <span class="text-sm">Enable immediately</span>
        </label>
        <button
          class="ml-auto rounded-lg bg-green-500 px-6 py-2 font-medium hover:bg-green-600"
          @click="addAlert"
        >
          Create Alert
        </button>
      </div>

      <p v-if="error" class="mt-2 text-sm text-red-400">{{ error }}</p>
    </div>

    <!-- Active Alerts -->
    <div class="rounded-xl bg-slate-800/50 p-6">
      <h3 class="mb-4 text-lg font-semibold">Active Alerts</h3>
      
      <div v-if="alerts.length === 0" class="py-8 text-center text-slate-400">
        No alerts configured. Create one above!
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4"
        >
          <div class="flex items-center gap-4">
            <button
              class="relative"
              @click="toggleAlert(alert.id)"
            >
              <span
                class="text-2xl"
                :class="alert.enabled ? 'text-green-400' : 'text-slate-500'"
              >
                {{ alert.enabled ? '🔔' : '🔕' }}
              </span>
            </button>
            
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold">
                  {{ alert.type === 'gas' ? '⛽ Gas' : alert.token || alert.type }}
                </span>
                <span class="text-sm text-slate-400">
                  {{ conditions.find(c => c.id === alert.condition)?.symbol }}
                  {{ alert.condition.includes('above') || alert.condition === 'above' ? '>' : '<' }}
                  {{ alert.value }}{{ alert.type === 'gas' ? ' Gwei' : alert.type === 'portfolio' ? '%' : '$' }}
                </span>
              </div>
              <p class="text-xs text-slate-500">
                Created {{ formatDate(alert.createdAt) }}
              </p>
            </div>
          </div>
          
          <button
            class="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-400 hover:bg-red-500/30"
            @click="deleteAlert(alert.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Alert History -->
    <div v-if="alertHistory.length > 0" class="rounded-xl bg-slate-800/50 p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">Alert History</h3>
        <button
          class="text-sm text-slate-400 hover:text-white"
          @click="clearHistory"
        >
          Clear
        </button>
      </div>
      
      <div class="space-y-2">
        <div
          v-for="(alert, idx) in alertHistory.slice(0, 10)"
          :key="idx"
          class="flex items-center justify-between rounded-lg bg-slate-900/30 p-3"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">⚠️</span>
            <span class="text-sm">{{ alert.message }}</span>
          </div>
          <span class="text-xs text-slate-500">{{ formatDate(alert.triggeredAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
