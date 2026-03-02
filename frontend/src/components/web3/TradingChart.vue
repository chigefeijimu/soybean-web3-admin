<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { fetchKLines, fetchCurrentPrice, getTradingPairs, type KLine } from '@/service/api/web3';

interface TradingPair {
  symbol: string;
  base: string;
  quote: string;
}

const tradingPairs = getTradingPairs();
const selectedSymbol = ref('ETHUSDT');
const selectedPeriod = ref('1h');
const periods = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

const candlesticks = ref<KLine[]>([]);
const currentPrice = ref('0');
const priceChange = ref('0');
const isLoading = ref(false);

// Map period to Binance interval
const periodToInterval: Record<string, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', 
  '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w'
};

const fetchData = async () => {
  try {
    isLoading.value = true;
    const interval = periodToInterval[selectedPeriod.value];
    
    // Fetch klines and price in parallel
    const [klines, price] = await Promise.all([
      fetchKLines(selectedSymbol.value, interval, 100),
      fetchCurrentPrice(selectedSymbol.value)
    ]);
    
    candlesticks.value = klines;
    currentPrice.value = price.price;
    priceChange.value = price.change;
  } catch (e) {
    console.error('Failed to fetch data:', e);
  } finally {
    isLoading.value = false;
  }
};

// Computed
const priceChangePercent = computed(() => {
  const change = parseFloat(priceChange.value);
  const price = parseFloat(currentPrice.value);
  if (price === 0) return 0;
  return (change / (price - change)) * 100;
});

const selectedPair = computed(() => 
  tradingPairs.find(p => p.symbol === selectedSymbol.value) || tradingPairs[0]
);

// Chart dimensions
const chartHeight = 400;
const candleWidth = 8;
const candleGap = 2;

const priceRange = computed(() => {
  if (!candlesticks.value.length) return { min: 0, max: 100 };
  const highs = candlesticks.value.map(c => c.high);
  const lows = candlesticks.value.map(c => c.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const padding = (max - min) * 0.1;
  return { min: min - padding, max: max + padding };
});

const scaleY = (price: number) => {
  const { min, max } = priceRange.value;
  return chartHeight - ((price - min) / (max - min)) * chartHeight;
};

// Draw chart
const drawChart = () => {
  const canvas = document.getElementById('chart-canvas') as HTMLCanvasElement;
  if (!canvas || !candlesticks.value.length) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const width = canvas.width = canvas.offsetWidth * 2;
  const height = canvas.height = chartHeight * 2;
  ctx.scale(2, 2);
  
  // Clear
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);
  
  // Draw candles
  const totalWidth = candlesticks.value.length * (candleWidth + candleGap);
  const startX = (width/2 - totalWidth/2);
  
  candlesticks.value.forEach((candle, i) => {
    const x = startX + i * (candleWidth + candleGap);
    const isGreen = candle.close >= candle.open;
    const color = isGreen ? '#22c55e' : '#ef4444';
    
    // Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + candleWidth/2, scaleY(candle.high));
    ctx.lineTo(x + candleWidth/2, scaleY(candle.low));
    ctx.stroke();
    
    // Body
    const bodyTop = scaleY(Math.max(candle.open, candle.close));
    const bodyBottom = scaleY(Math.min(candle.open, candle.close));
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
    
    ctx.fillStyle = color;
    ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
  });
};

onMounted(() => {
  fetchData();
  const interval = setInterval(fetchData, 30000); // Refresh every 30s
  onUnmounted(() => clearInterval(interval));
});

watch([selectedSymbol, selectedPeriod], fetchData);
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-slate-700/50">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-4">
          <select v-model="selectedSymbol" class="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 font-semibold">
            <option v-for="pair in tradingPairs" :key="pair.symbol" :value="pair.symbol">
              {{ pair.base }}/{{ pair.quote }}
            </option>
          </select>
          <div>
            <span class="text-2xl font-bold">{{ parseFloat(currentPrice).toFixed(2) }}</span>
            <span class="text-sm ml-2" :class="priceChange >= 0 ? 'text-green-400' : 'text-red-400'">
              {{ priceChange >= 0 ? '+' : '' }}{{ priceChangePercent.toFixed(2) }}%
            </span>
          </div>
        </div>
        <div class="flex gap-1">
          <button v-for="period in periods" :key="period"
            @click="selectedPeriod = period"
            :class="['px-3 py-1 rounded text-sm', selectedPeriod === period ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400']">
            {{ period }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="h-[400px] flex items-center justify-center">
      <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
    </div>

    <!-- Chart -->
    <div v-else class="p-4">
      <canvas id="chart-canvas" class="w-full h-[400px] rounded-lg"></canvas>
    </div>

    <!-- Info -->
    <div class="p-4 border-t border-slate-700/50 grid grid-cols-4 gap-4 text-sm">
      <div>
        <p class="text-slate-400">Open</p>
        <p class="font-medium">{{ candlesticks[candlesticks.length-1]?.open.toFixed(2) || '---' }}</p>
      </div>
      <div>
        <p class="text-slate-400">High</p>
        <p class="font-medium text-green-400">{{ candlesticks[candlesticks.length-1]?.high.toFixed(2) || '---' }}</p>
      </div>
      <div>
        <p class="text-slate-400">Low</p>
        <p class="font-medium text-red-400">{{ candlesticks[candlesticks.length-1]?.low.toFixed(2) || '---' }}</p>
      </div>
      <div>
        <p class="text-slate-400">Close</p>
        <p class="font-medium">{{ candlesticks[candlesticks.length-1]?.close.toFixed(2) || '---' }}</p>
      </div>
    </div>
  </div>
</template>
