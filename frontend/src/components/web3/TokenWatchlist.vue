<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

// Types
interface WatchedToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  alertAbove?: number;
  alertBelow?: number;
  addedAt: number;
}

interface PriceAlert {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  type: 'above' | 'below';
  targetPrice: number;
  triggered: boolean;
  createdAt: number;
}

// State
const watchedTokens = ref<WatchedToken[]>([]);
const priceAlerts = ref<PriceAlert[]>([]);
const searchQuery = ref('');
const showAddModal = ref(false);
const showAlertModal = ref(false);
const selectedToken = ref<WatchedToken | null>(null);
const isLoading = ref(false);

// Alert form
const alertForm = ref({
  type: 'above' as 'above' | 'below',
  targetPrice: 0
});

// Demo tokens for search
const demoTokens = [
  { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', price: 2845.32, change24h: 1250000000, changePercent24h: 2.34 },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', price: 62450.00, change24h: 890000000, changePercent24h: 1.45 },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', price: 1.00, change24h: 500000000, changePercent24h: 0.01 },
  { address: '0x6B175474E89094C44Da98b954EesadcdEF9ce6CC', symbol: 'DAI', name: 'Dai Stablecoin', price: 1.00, change24h: 300000000, changePercent24h: -0.02 },
  { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave Token', price: 285.50, change24h: 45000000, changePercent24h: 5.67 },
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', price: 7.85, change24h: 38000000, changePercent24h: 3.21 },
  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', price: 14.75, change24h: 28000000, changePercent24h: 1.89 },
  { address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', symbol: 'MATIC', name: 'Polygon', price: 0.92, change24h: 22000000, changePercent24h: -1.23 },
  { address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF', symbol: 'BAT', name: 'Basic Attention Token', price: 0.28, change24h: 8500000, changePercent24h: 4.56 },
  { address: '0x1985365e9f78359a9B6AD760e32412f4a445E862', symbol: 'REP', name: 'Augur', price: 1.85, change24h: 3200000, changePercent24h: -2.11 }
];

// Filtered tokens for search
const filteredTokens = computed(() => {
  if (!searchQuery.value) return demoTokens;
  const query = searchQuery.value.toLowerCase();
  return demoTokens.filter(t => 
    t.symbol.toLowerCase().includes(query) || 
    t.name.toLowerCase().includes(query)
  );
});

// Format helpers
const formatPrice = (price: number): string => {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
};

const formatVolume = (vol: number): string => {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
  return `$${vol.toLocaleString()}`;
};

const formatMarketCap = (mc: number): string => {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
  return `$${mc.toLocaleString()}`;
};

// Add token to watchlist
const addToken = (token: typeof demoTokens[0]) => {
  const exists = watchedTokens.value.find(t => t.address === token.address);
  if (exists) return;
  
  watchedTokens.value.push({
    ...token,
    marketCap: token.price * token.change24h * 100,
    volume24h: token.change24h,
    addedAt: Date.now()
  });
  showAddModal.value = false;
  saveToStorage();
};

// Remove token from watchlist
const removeToken = (address: string) => {
  watchedTokens.value = watchedTokens.value.filter(t => t.address !== address);
  priceAlerts.value = priceAlerts.value.filter(a => a.tokenAddress !== address);
  saveToStorage();
};

// Add price alert
const openAlertModal = (token: WatchedToken) => {
  selectedToken.value = token;
  alertForm.value = { type: 'above', targetPrice: token.price };
  showAlertModal.value = true;
};

const addPriceAlert = () => {
  if (!selectedToken.value) return;
  
  const alert: PriceAlert = {
    id: Date.now().toString(),
    tokenAddress: selectedToken.value.address,
    tokenSymbol: selectedToken.value.symbol,
    type: alertForm.value.type,
    targetPrice: alertForm.value.targetPrice,
    triggered: false,
    createdAt: Date.now()
  };
  
  priceAlerts.value.push(alert);
  showAlertModal.value = false;
  
  // Update token with alert
  const token = watchedTokens.value.find(t => t.address === selectedToken.value?.address);
  if (token) {
    if (alertForm.value.type === 'above') {
      token.alertAbove = alertForm.value.targetPrice;
    } else {
      token.alertBelow = alertForm.value.targetPrice;
    }
  }
  
  saveToStorage();
};

// Remove alert
const removeAlert = (alertId: string) => {
  const alert = priceAlerts.value.find(a => a.id === alertId);
  if (alert) {
    const token = watchedTokens.value.find(t => t.address === alert.tokenAddress);
    if (token) {
      if (alert.type === 'above') token.alertAbove = undefined;
      else token.alertBelow = undefined;
    }
  }
  priceAlerts.value = priceAlerts.value.filter(a => a.id !== alertId);
  saveToStorage();
};

// Storage
const saveToStorage = () => {
  localStorage.setItem('web3_watched_tokens', JSON.stringify(watchedTokens.value));
  localStorage.setItem('web3_price_alerts', JSON.stringify(priceAlerts.value));
};

const loadFromStorage = () => {
  const tokens = localStorage.getItem('web3_watched_tokens');
  const alerts = localStorage.getItem('web3_price_alerts');
  if (tokens) watchedTokens.value = JSON.parse(tokens);
  if (alerts) priceAlerts.value = JSON.parse(alerts);
};

// Simulate price updates
const simulatePriceUpdate = () => {
  watchedTokens.value.forEach(token => {
    const change = (Math.random() - 0.5) * 0.02;
    token.price = token.price * (1 + change);
    token.changePercent24h += (Math.random() - 0.5) * 0.5;
    
    // Check alerts
    if (token.alertAbove && token.price >= token.alertAbove) {
      triggerAlert(token, 'above');
    }
    if (token.alertBelow && token.price <= token.alertBelow) {
      triggerAlert(token, 'below');
    }
  });
};

const triggerAlert = (token: WatchedToken, type: 'above' | 'below') => {
  const alert = priceAlerts.value.find(a => 
    a.tokenAddress === token.address && 
    a.type === type && 
    !a.triggered
  );
  if (alert) {
    alert.triggered = true;
    // Could trigger notification here
    console.log(`🔔 Alert: ${token.symbol} went ${type} $${type === 'above' ? token.alertAbove : token.alertBelow}`);
  }
};

// Initialize
onMounted(() => {
  loadFromStorage();
  // Simulate price updates every 10 seconds
  setInterval(simulatePriceUpdate, 10000);
});

// Summary stats
const totalValue = computed(() => {
  return watchedTokens.value.reduce((sum, t) => sum + t.price, 0);
});

const totalAlerts = computed(() => priceAlerts.value.filter(a => !a.triggered).length);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">📊 Token Watchlist</h2>
        <p class="text-sm text-slate-400">Track your favorite tokens & set price alerts</p>
      </div>
      <button
        class="rounded-xl bg-purple-500/20 px-4 py-2 text-purple-400 border border-purple-500/50 transition-all hover:bg-purple-500/30"
        @click="showAddModal = true"
      >
        + Add Token
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4">
      <div class="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
        <p class="text-xs text-slate-400">Watching</p>
        <p class="text-2xl font-bold text-white">{{ watchedTokens.length }}</p>
      </div>
      <div class="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
        <p class="text-xs text-slate-400">Active Alerts</p>
        <p class="text-2xl font-bold text-yellow-400">{{ totalAlerts }}</p>
      </div>
      <div class="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
        <p class="text-xs text-slate-400">Triggered</p>
        <p class="text-2xl font-bold text-green-400">{{ priceAlerts.filter(a => a.triggered).length }}</p>
      </div>
    </div>

    <!-- Watchlist Table -->
    <div v-if="watchedTokens.length > 0" class="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-900/50">
          <tr class="text-left text-xs text-slate-400">
            <th class="p-4">Token</th>
            <th class="p-4">Price</th>
            <th class="p-4">24h Change</th>
            <th class="p-4">Volume</th>
            <th class="p-4">Alerts</th>
            <th class="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="token in watchedTokens" 
            :key="token.address"
            class="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors"
          >
            <td class="p-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg font-bold">
                  {{ token.symbol.charAt(0) }}
                </div>
                <div>
                  <p class="font-semibold text-white">{{ token.symbol }}</p>
                  <p class="text-xs text-slate-400">{{ token.name }}</p>
                </div>
              </div>
            </td>
            <td class="p-4">
              <p class="font-semibold text-white">{{ formatPrice(token.price) }}</p>
            </td>
            <td class="p-4">
              <span 
                :class="token.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'"
              >
                {{ token.changePercent24h >= 0 ? '+' : '' }}{{ token.changePercent24h.toFixed(2) }}%
              </span>
            </td>
            <td class="p-4 text-slate-300">
              {{ formatVolume(token.volume24h) }}
            </td>
            <td class="p-4">
              <div class="flex gap-1">
                <span 
                  v-if="token.alertAbove" 
                  class="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400"
                  title="Alert above"
                >
                  ↑ {{ formatPrice(token.alertAbove) }}
                </span>
                <span 
                  v-if="token.alertBelow" 
                  class="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400"
                  title="Alert below"
                >
                  ↓ {{ formatPrice(token.alertBelow) }}
                </span>
                <button
                  v-if="!token.alertAbove && !token.alertBelow"
                  class="text-slate-400 hover:text-yellow-400"
                  title="Set alert"
                  @click="openAlertModal(token)"
                >
                  🔔
                </button>
              </div>
            </td>
            <td class="p-4">
              <div class="flex gap-2">
                <button
                  class="text-slate-400 hover:text-white"
                  title="Set alert"
                  @click="openAlertModal(token)"
                >
                  🔔
                </button>
                <button
                  class="text-slate-400 hover:text-red-400"
                  title="Remove"
                  @click="removeToken(token.address)"
                >
                  ✕
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-12 text-center">
      <div class="text-5xl mb-4">👀</div>
      <p class="text-slate-400 mb-4">No tokens in your watchlist yet</p>
      <button
        class="rounded-xl bg-purple-500/20 px-6 py-2 text-purple-400 border border-purple-500/50"
        @click="showAddModal = true"
      >
        Add Your First Token
      </button>
    </div>

    <!-- Price Alerts Section -->
    <div v-if="priceAlerts.length > 0" class="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
      <h3 class="text-lg font-semibold text-white mb-4">🔔 Price Alerts</h3>
      <div class="space-y-2">
        <div 
          v-for="alert in priceAlerts" 
          :key="alert.id"
          class="flex items-center justify-between p-3 rounded-xl bg-slate-900/50"
          :class="{ 'opacity-50': alert.triggered }"
        >
          <div class="flex items-center gap-3">
            <span 
              class="text-lg"
              :class="alert.type === 'above' ? 'text-green-400' : 'text-red-400'"
            >
              {{ alert.type === 'above' ? '⬆️' : '⬇️' }}
            </span>
            <div>
              <p class="text-white font-medium">{{ alert.tokenSymbol }}</p>
              <p class="text-xs text-slate-400">
                {{ alert.type === 'above' ? 'Above' : 'Below' }} {{ formatPrice(alert.targetPrice) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span 
              v-if="alert.triggered"
              class="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400"
            >
              Triggered
            </span>
            <button
              class="text-slate-400 hover:text-red-400"
              @click="removeAlert(alert.id)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Token Modal -->
    <div 
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md mx-4">
        <h3 class="text-xl font-bold text-white mb-4">Add Token to Watchlist</h3>
        
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tokens..."
          class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
        />
        
        <div class="max-h-64 overflow-y-auto space-y-2">
          <button
            v-for="token in filteredTokens"
            :key="token.address"
            class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
            :disabled="watchedTokens.some(t => t.address === token.address)"
            @click="addToken(token)"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                {{ token.symbol.charAt(0) }}
              </div>
              <div class="text-left">
                <p class="text-white font-medium">{{ token.symbol }}</p>
                <p class="text-xs text-slate-400">{{ token.name }}</p>
              </div>
            </div>
            <span class="text-slate-400">{{ formatPrice(token.price) }}</span>
          </button>
        </div>
        
        <button
          class="mt-4 w-full rounded-xl bg-slate-700 py-3 text-white hover:bg-slate-600"
          @click="showAddModal = false"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Alert Modal -->
    <div 
      v-if="showAlertModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAlertModal = false"
    >
      <div class="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md mx-4">
        <h3 class="text-xl font-bold text-white mb-4">
          Set Price Alert: {{ selectedToken?.symbol }}
        </h3>
        
        <div class="mb-4">
          <label class="block text-sm text-slate-400 mb-2">Alert Type</label>
          <div class="flex gap-2">
            <button
              class="flex-1 py-3 rounded-xl font-medium transition-colors"
              :class="alertForm.type === 'above' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                : 'bg-slate-700 text-slate-400'"
              @click="alertForm.type = 'above'"
            >
              ⬆️ Price Above
            </button>
            <button
              class="flex-1 py-3 rounded-xl font-medium transition-colors"
              :class="alertForm.type === 'below' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                : 'bg-slate-700 text-slate-400'"
              @click="alertForm.type = 'below'"
            >
              ⬇️ Price Below
            </button>
          </div>
        </div>
        
        <div class="mb-6">
          <label class="block text-sm text-slate-400 mb-2">Target Price ($)</label>
          <input
            v-model.number="alertForm.targetPrice"
            type="number"
            step="0.01"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div class="flex gap-3">
          <button
            class="flex-1 rounded-xl bg-slate-700 py-3 text-white hover:bg-slate-600"
            @click="showAlertModal = false"
          >
            Cancel
          </button>
          <button
            class="flex-1 rounded-xl bg-purple-500 py-3 text-white hover:bg-purple-600"
            @click="addPriceAlert"
          >
            Set Alert
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
