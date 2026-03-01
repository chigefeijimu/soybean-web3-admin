<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// NFT Floor Price Tracker
interface NftCollection {
  id: string;
  name: string;
  symbol: string;
  floorPrice: number;
  floorPriceETH: number;
  volume24h: number;
  volumeChange: number;
  holders: number;
  totalSupply: number;
  image: string;
  trend: 'up' | 'down' | 'stable';
  history7d: number[];
}

const collections = ref<NftCollection[]>([
  {
    id: 'bored-ape-yacht-club',
    name: 'Bored Ape Yacht Club',
    symbol: 'BAYC',
    floorPrice: 18.5,
    floorPriceETH: 18.5,
    volume24h: 1250,
    volumeChange: 15.2,
    holders: 6400,
    totalSupply: 10000,
    image: '🦍',
    trend: 'up',
    history7d: [17.2, 17.8, 18.0, 17.5, 18.2, 18.0, 18.5]
  },
  {
    id: 'cryptopunks',
    name: 'CryptoPunks',
    symbol: 'PUNK',
    floorPrice: 42.8,
    floorPriceETH: 42.8,
    volume24h: 890,
    volumeChange: -5.3,
    holders: 5800,
    totalSupply: 10000,
    image: '👾',
    trend: 'down',
    history7d: [45.2, 44.5, 43.8, 43.2, 43.0, 43.5, 42.8]
  },
  {
    id: 'azuki',
    name: 'Azuki',
    symbol: 'AZUKI',
    floorPrice: 8.2,
    floorPriceETH: 8.2,
    volume24h: 2100,
    volumeChange: 28.5,
    holders: 8200,
    totalSupply: 10000,
    image: '🍡',
    trend: 'up',
    history7d: [7.0, 7.3, 7.5, 7.8, 8.0, 7.9, 8.2]
  },
  {
    id: 'pudgy-penguins',
    name: 'Pudgy Penguins',
    symbol: 'PENGU',
    floorPrice: 3.8,
    floorPriceETH: 3.8,
    volume24h: 560,
    volumeChange: 12.1,
    holders: 4200,
    totalSupply: 8888,
    image: '🐧',
    trend: 'up',
    history7d: [3.2, 3.4, 3.5, 3.6, 3.7, 3.7, 3.8]
  },
  {
    id: 'milady',
    name: 'Milady Maker',
    symbol: 'LADY',
    floorPrice: 1.9,
    floorPriceETH: 1.9,
    volume24h: 320,
    volumeChange: -8.2,
    holders: 2100,
    totalSupply: 10000,
    image: '💄',
    trend: 'down',
    history7d: [2.2, 2.1, 2.0, 2.0, 1.9, 1.9, 1.9]
  },
  {
    id: 'degod',
    name: 'DeGods',
    symbol: 'DGOD',
    floorPrice: 520,
    floorPriceETH: 520,
    volume24h: 45,
    volumeChange: 5.6,
    holders: 980,
    totalSupply: 10000,
    image: '👽',
    trend: 'up',
    history7d: [480, 490, 500, 510, 515, 518, 520]
  }
]);

const searchQuery = ref('');
const selectedChain = ref('ethereum');
const viewMode = ref<'grid' | 'list'>('grid');
const sortBy = ref<'floor' | 'volume' | 'change'>('floor');
const showAddModal = ref(false);

// Filtered collections
const filteredCollections = computed(() => {
  let result = collections.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      c => c.name.toLowerCase().includes(query) || c.symbol.toLowerCase().includes(query)
    );
  }
  
  // Sort
  switch (sortBy.value) {
    case 'floor':
      result = [...result].sort((a, b) => b.floorPrice - a.floorPrice);
      break;
    case 'volume':
      result = [...result].sort((a, b) => b.volume24h - a.volume24h);
      break;
    case 'change':
      result = [...result].sort((a, b) => b.volumeChange - a.volumeChange);
      break;
  }
  
  return result;
});

// Add custom collection
const newCollection = ref({
  address: '',
  name: ''
});

const addCollection = () => {
  if (!newCollection.value.address || !newCollection.value.name) return;
  
  collections.value.push({
    id: newCollection.value.address,
    name: newCollection.value.name,
    symbol: newCollection.value.name.substring(0, 4).toUpperCase(),
    floorPrice: 0,
    floorPriceETH: 0,
    volume24h: 0,
    volumeChange: 0,
    holders: 0,
    totalSupply: 0,
    image: '🎨',
    trend: 'stable',
    history7d: [0, 0, 0, 0, 0, 0, 0]
  });
  
  newCollection.value = { address: '', name: '' };
  showAddModal.value = false;
};

// Format price
const formatPrice = (price: number) => {
  if (price >= 1000) return price.toFixed(0);
  if (price >= 100) return price.toFixed(1);
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(3);
};

// Get trend color
const getTrendColor = (change: number) => {
  if (change > 0) return 'text-green-400';
  if (change < 0) return 'text-red-400';
  return 'text-gray-400';
};

// Get trend icon
const getTrendIcon = (trend: string) => {
  if (trend === 'up') return '📈';
  if (trend === 'down') return '📉';
  return '➡️';
};

// Calculate 7d change
const calc7dChange = (history: number[]) => {
  if (history.length < 2 || history[0] === 0) return 0;
  return ((history[history.length - 1] - history[0]) / history[0]) * 100;
};

// Refresh data
const isRefreshing = ref(false);
const refreshData = async () => {
  isRefreshing.value = true;
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  isRefreshing.value = false;
};

// Chain options
const chains = [
  { id: 'ethereum', name: 'Ethereum', icon: '🔷' },
  { id: 'polygon', name: 'Polygon', icon: '🟣' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
  { id: 'optimism', name: 'Optimism', icon: '🟠' },
  { id: 'bsc', name: 'BNB Chain', icon: '🟡' }
];

// Stats
const totalVolume = computed(() => 
  collections.value.reduce((sum, c) => sum + c.volume24h, 0)
);

const avgFloor = computed(() => {
  const valid = collections.value.filter(c => c.floorPrice > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, c) => sum + c.floorPrice, 0) / valid.length;
});

onMounted(() => {
  refreshData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">NFT Floor Tracker</h2>
        <p class="text-sm text-slate-400">Track NFT floor prices & trends</p>
      </div>
      
      <div class="flex items-center gap-2">
        <button
          @click="refreshData"
          :disabled="isRefreshing"
          class="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          <span :class="{ 'animate-spin': isRefreshing }">🔄</span>
          Refresh
        </button>
        <button
          @click="showAddModal = true"
          class="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-500"
        >
          + Add Collection
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
      <!-- Search -->
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search collections..."
          class="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
      </div>
      
      <!-- Chain Filter -->
      <select
        v-model="selectedChain"
        class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
      >
        <option v-for="chain in chains" :key="chain.id" :value="chain.id">
          {{ chain.icon }} {{ chain.name }}
        </option>
      </select>
      
      <!-- Sort -->
      <select
        v-model="sortBy"
        class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
      >
        <option value="floor">Sort by Floor</option>
        <option value="volume">Sort by Volume</option>
        <option value="change">Sort by Change</option>
      </select>
      
      <!-- View Mode -->
      <div class="flex rounded-lg border border-slate-700 bg-slate-800 p-1">
        <button
          @click="viewMode = 'grid'"
          :class="[
            'rounded px-3 py-1 text-sm',
            viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400'
          ]"
        >
          ▦ Grid
        </button>
        <button
          @click="viewMode = 'list'"
          :class="[
            'rounded px-3 py-1 text-sm',
            viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400'
          ]"
        >
          ☰ List
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="rounded-lg bg-slate-800 p-4">
        <p class="text-sm text-slate-400">Total 24h Volume</p>
        <p class="text-xl font-bold text-white">{{ totalVolume.toFixed(0) }} ETH</p>
      </div>
      <div class="rounded-lg bg-slate-800 p-4">
        <p class="text-sm text-slate-400">Avg Floor Price</p>
        <p class="text-xl font-bold text-white">{{ avgFloor.toFixed(2) }} ETH</p>
      </div>
      <div class="rounded-lg bg-slate-800 p-4">
        <p class="text-sm text-slate-400">Collections</p>
        <p class="text-xl font-bold text-white">{{ collections.length }}</p>
      </div>
      <div class="rounded-lg bg-slate-800 p-4">
        <p class="text-sm text-slate-400">Best Performer</p>
        <p class="text-xl font-bold text-green-400">+{{ Math.max(...collections.map(c => c.volumeChange)).toFixed(1) }}%</p>
      </div>
    </div>

    <!-- Collections Grid -->
    <div
      v-if="viewMode === 'grid'"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="collection in filteredCollections"
        :key="collection.id"
        class="group rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-purple-500/50 hover:bg-slate-800"
      >
        <!-- Header -->
        <div class="mb-4 flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-2xl">
              {{ collection.image }}
            </div>
            <div>
              <h3 class="font-semibold text-white">{{ collection.name }}</h3>
              <p class="text-xs text-slate-400">{{ collection.symbol }}</p>
            </div>
          </div>
          <span class="text-xl">{{ getTrendIcon(collection.trend) }}</span>
        </div>
        
        <!-- Floor Price -->
        <div class="mb-4">
          <p class="text-sm text-slate-400">Floor Price</p>
          <p class="text-2xl font-bold text-white">{{ formatPrice(collection.floorPrice) }} ETH</p>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p class="text-slate-400">24h Volume</p>
            <p class="text-white">{{ collection.volume24h }} ETH</p>
          </div>
          <div>
            <p class="text-slate-400">24h Change</p>
            <p :class="getTrendColor(collection.volumeChange)">
              {{ collection.volumeChange > 0 ? '+' : '' }}{{ collection.volumeChange.toFixed(1) }}%
            </p>
          </div>
          <div>
            <p class="text-slate-400">Holders</p>
            <p class="text-white">{{ collection.holders.toLocaleString() }}</p>
          </div>
          <div>
            <p class="text-slate-400">7d Change</p>
            <p :class="getTrendColor(calc7dChange(collection.history7d))">
              {{ calc7dChange(collection.history7d) > 0 ? '+' : '' }}{{ calc7dChange(collection.history7d).toFixed(1) }}%
            </p>
          </div>
        </div>
        
        <!-- Mini Chart -->
        <div class="mt-4 h-12 flex items-end gap-1">
          <div
            v-for="(price, idx) in collection.history7d"
            :key="idx"
            :class="[
              'flex-1 rounded-sm',
              price >= collection.history7d[0] ? 'bg-green-500/50' : 'bg-red-500/50'
            ]"
            :style="{ height: `${(price / Math.max(...collection.history7d)) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Collections List -->
    <div v-else class="space-y-2">
      <div
        v-for="collection in filteredCollections"
        :key="collection.id"
        class="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-purple-500/50"
      >
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-xl">
            {{ collection.image }}
          </div>
          <div>
            <h3 class="font-semibold text-white">{{ collection.name }}</h3>
            <p class="text-xs text-slate-400">{{ collection.symbol }} • {{ collection.holders.toLocaleString() }} holders</p>
          </div>
        </div>
        
        <div class="flex items-center gap-8">
          <div class="text-right">
            <p class="text-sm text-slate-400">Floor</p>
            <p class="font-semibold text-white">{{ formatPrice(collection.floorPrice) }} ETH</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-400">24h Volume</p>
            <p class="font-semibold text-white">{{ collection.volume24h }} ETH</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-400">24h Change</p>
            <p :class="['font-semibold', getTrendColor(collection.volumeChange)]">
              {{ collection.volumeChange > 0 ? '+' : '' }}{{ collection.volumeChange.toFixed(1) }}%
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-400">7d Change</p>
            <p :class="['font-semibold', getTrendColor(calc7dChange(collection.history7d))]">
              {{ calc7dChange(collection.history7d) > 0 ? '+' : '' }}{{ calc7dChange(collection.history7d).toFixed(1) }}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Collection Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showAddModal = false"
    >
      <div class="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 class="mb-4 text-lg font-bold text-white">Add Custom Collection</h3>
        
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm text-slate-400">Contract Address</label>
            <input
              v-model="newCollection.address"
              type="text"
              placeholder="0x..."
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label class="mb-1 block text-sm text-slate-400">Collection Name</label>
            <input
              v-model="newCollection.name"
              type="text"
              placeholder="My NFT Collection"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
        
        <div class="mt-6 flex justify-end gap-2">
          <button
            @click="showAddModal = false"
            class="rounded-lg px-4 py-2 text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            @click="addCollection"
            class="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-500"
          >
            Add Collection
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
