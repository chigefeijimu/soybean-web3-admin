<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface CrossChainPriceData {
  symbol: string;
  name: string;
  prices: {
    chain: string;
    price: number;
    change24h: number;
    volume24h: number;
  }[];
  averagePrice: number;
  priceDiff: number;
  priceDiffPercent: number;
  bestPrice: {
    chain: string;
    price: number;
  };
  worstPrice: {
    chain: string;
    price: number;
  };
}

interface TokenInfo {
  symbol: string;
  name: string;
}

const isLoading = ref(true);
const error = ref('');
const selectedToken = ref('ETH');
const allPrices = ref<CrossChainPriceData[]>([]);
const supportedTokens = ref<TokenInfo[]>([]);
const supportedChains = ref<string[]>([]);

const tokens = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟐' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$' },
  { symbol: 'USDT', name: 'Tether', icon: '$' },
  { symbol: 'BNB', name: 'BNB', icon: '⬡' },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬡' },
  { symbol: 'AVAX', name: 'Avalanche', icon: '▲' },
  { symbol: 'LINK', name: 'Chainlink', icon: '⬡' },
  { symbol: 'UNI', name: 'Uniswap', icon: '🦄' },
  { symbol: 'AAVE', name: 'Aave', icon: '👻' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'ARB', name: 'Arbitrum', icon: '◆' },
  { symbol: 'OP', name: 'Optimism', icon: '▲' },
];

const chains = [
  { id: 'Ethereum', name: 'Ethereum', color: '#627EEA' },
  { id: 'Polygon', name: 'Polygon', color: '#8247E5' },
  { id: 'Arbitrum', name: 'Arbitrum', color: '#28A0F0' },
  { id: 'Optimism', name: 'Optimism', color: '#FF0420' },
  { id: 'BSC', name: 'BSC', color: '#F3BA2F' },
  { id: 'Base', name: 'Base', color: '#0052FF' },
  { id: 'Avalanche', name: 'Avalanche', color: '#E84142' },
  { id: 'Solana', name: 'Solana', color: '#14F195' },
];

const currentPrice = computed(() => {
  return allPrices.value.find(p => p.symbol === selectedToken.value);
});

const arbitrageOpportunity = computed(() => {
  if (!currentPrice.value) return null;
  return {
    exists: currentPrice.value.priceDiffPercent > 1,
    profit: currentPrice.value.priceDiff,
    percent: currentPrice.value.priceDiffPercent,
    fromChain: currentPrice.value.bestPrice.chain,
    toChain: currentPrice.value.worstPrice.chain,
  };
});

const fetchData = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    // In production, call the actual API
    // const response = await fetch('/api/cross-chain-price/all');
    // const data = await response.json();
    
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 800));
    
    supportedTokens.value = tokens;
    supportedChains.value = chains.map(c => c.id);
    
    // Generate mock data
    allPrices.value = tokens.map(token => {
      const basePrice = getBasePrice(token.symbol);
      const prices = chains.map(chain => ({
        chain: chain.id,
        price: basePrice * (1 + (Math.random() - 0.5) * 0.04),
        change24h: (Math.random() - 0.5) * 10,
        volume24h: basePrice * (Math.random() * 1000000000 + 100000000),
      }));
      
      const priceValues = prices.map(p => p.price);
      const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
      const maxPrice = Math.max(...priceValues);
      const minPrice = Math.min(...priceValues);
      
      return {
        symbol: token.symbol,
        name: token.name,
        prices,
        averagePrice: avgPrice,
        priceDiff: maxPrice - minPrice,
        priceDiffPercent: ((maxPrice - minPrice) / avgPrice) * 100,
        bestPrice: { chain: prices.find(p => p.price === minPrice)?.chain || '', price: minPrice },
        worstPrice: { chain: prices.find(p => p.price === maxPrice)?.chain || '', price: maxPrice },
      };
    });
  } catch (e: any) {
    error.value = 'Failed to fetch cross-chain prices';
  } finally {
    isLoading.value = false;
  }
};

const getBasePrice = (symbol: string): number => {
  const prices: Record<string, number> = {
    ETH: 2450,
    BTC: 62500,
    USDC: 1,
    USDT: 1,
    BNB: 580,
    MATIC: 0.85,
    AVAX: 35,
    LINK: 18.5,
    UNI: 7.2,
    AAVE: 95,
    SOL: 145,
    ARB: 1.15,
    OP: 2.1,
  };
  return prices[symbol] || 1;
};

const formatPrice = (price: number): string => {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
};

const formatVolume = (volume: number): string => {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  return `$${(volume / 1e3).toFixed(0)}K`;
};

const getChainColor = (chain: string): string => {
  return chains.find(c => c.id === chain)?.color || '#666';
};

const getChangeColor = (change: number): string => {
  if (change > 0) return 'text-green-400';
  if (change < 0) return 'text-red-400';
  return 'text-gray-400';
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-white flex items-center gap-2">
        <span class="text-2xl">⛓️</span>
        Cross-chain Price API
      </h3>
      <button 
        @click="fetchData" 
        :disabled="isLoading"
        class="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
      >
        {{ isLoading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <!-- Token Selector -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="token in tokens"
        :key="token.symbol"
        @click="selectedToken = token.symbol"
        :class="[
          'px-3 py-1.5 text-sm rounded-lg transition-all',
          selectedToken === token.symbol 
            ? 'bg-blue-600 text-white' 
            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
        ]"
      >
        {{ token.symbol }}
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <!-- Price Data -->
    <div v-else-if="currentPrice" class="space-y-4">
      <!-- Price Summary -->
      <div class="grid grid-cols-2 gap-4">
        <div class="p-4 bg-slate-800/50 rounded-xl">
          <div class="text-sm text-slate-400 mb-1">Average Price</div>
          <div class="text-2xl font-bold text-white">${{ formatPrice(currentPrice.averagePrice) }}</div>
        </div>
        <div class="p-4 bg-slate-800/50 rounded-xl">
          <div class="text-sm text-slate-400 mb-1">Cross-chain Spread</div>
          <div class="text-2xl font-bold" :class="arbitrageOpportunity?.exists ? 'text-yellow-400' : 'text-green-400'">
            {{ currentPrice.priceDiffPercent.toFixed(2) }}%
          </div>
        </div>
      </div>

      <!-- Arbitrage Alert -->
      <div v-if="arbitrageOpportunity?.exists" class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <div class="flex items-start gap-3">
          <span class="text-2xl">💰</span>
          <div>
            <div class="font-semibold text-yellow-400">Arbitrage Opportunity!</div>
            <div class="text-sm text-slate-300 mt-1">
              Buy on <span class="text-green-400">{{ arbitrageOpportunity.fromChain }}</span> at ${{ formatPrice(currentPrice.bestPrice.price) }},
              sell on <span class="text-red-400">{{ arbitrageOpportunity.toChain }}</span> at ${{ formatPrice(currentPrice.worstPrice.price) }}
              <br/>
              Potential profit: <span class="text-yellow-400 font-semibold">${{ formatPrice(arbitrageOpportunity.profit) }}</span> per unit
            </div>
          </div>
        </div>
      </div>

      <!-- Chain Prices Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left text-sm text-slate-400 border-b border-slate-700">
              <th class="pb-3 pl-2">Chain</th>
              <th class="pb-3 text-right">Price</th>
              <th class="pb-3 text-right">24h Change</th>
              <th class="pb-3 text-right">Volume</th>
              <th class="pb-3 text-right">vs Avg</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="priceData in currentPrice.prices" 
              :key="priceData.chain"
              class="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
            >
              <td class="py-3 pl-2">
                <div class="flex items-center gap-2">
                  <div 
                    class="w-3 h-3 rounded-full" 
                    :style="{ backgroundColor: getChainColor(priceData.chain) }"
                  ></div>
                  <span class="font-medium text-white">{{ priceData.chain }}</span>
                </div>
              </td>
              <td class="py-3 text-right font-mono text-white">
                ${{ formatPrice(priceData.price) }}
              </td>
              <td class="py-3 text-right font-mono" :class="getChangeColor(priceData.change24h)">
                {{ priceData.change24h > 0 ? '+' : '' }}{{ priceData.change24h.toFixed(2) }}%
              </td>
              <td class="py-3 text-right text-slate-400 font-mono text-sm">
                {{ formatVolume(priceData.volume24h) }}
              </td>
              <td class="py-3 text-right">
                <span 
                  :class="[
                    'text-xs px-2 py-0.5 rounded',
                    priceData.price < currentPrice.averagePrice 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  ]"
                >
                  {{ priceData.price < currentPrice.averagePrice ? '-' : '+' }}{{ Math.abs(((priceData.price - currentPrice.averagePrice) / currentPrice.averagePrice) * 100).toFixed(1) }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Best/Worst Prices -->
      <div class="grid grid-cols-2 gap-4 pt-2">
        <div class="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div class="text-sm text-green-400 mb-1">💚 Best Price</div>
          <div class="font-semibold text-white">{{ currentPrice.bestPrice.chain }}</div>
          <div class="text-lg font-mono text-green-400">${{ formatPrice(currentPrice.bestPrice.price) }}</div>
        </div>
        <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div class="text-sm text-red-400 mb-1">❤️ Highest Price</div>
          <div class="font-semibold text-white">{{ currentPrice.worstPrice.chain }}</div>
          <div class="text-lg font-mono text-red-400">${{ formatPrice(currentPrice.worstPrice.price) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
