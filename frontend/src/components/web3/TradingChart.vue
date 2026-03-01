<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { getIndicators, getKLine, getPrice } from '@/service/api/web3';

// Types
interface Candlestick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Indicator {
  name: string;
  value: number;
  color: string;
}

interface TradingPair {
  base: string;
  quote: string;
  price: number;
  change24h: number;
  changePercent: number;
}

// State
const selectedPair = ref<TradingPair>({
  base: 'ETH',
  quote: 'USDC',
  price: 2500.0,
  change24h: 125.0,
  changePercent: 5.26
});

const selectedPeriod = ref('1h');
const periods = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

const candlesticks = ref<Candlestick[]>([]);
const indicators = ref<{
  ma5: number[];
  ma20: number[];
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
}>({
  ma5: [],
  ma20: [],
  rsi: 65.5,
  macd: { macd: 25.0, signal: 20.0, histogram: 5.0 }
});

const isLoading = ref(false);

// Generate mock candlestick data (fallback)
const generateCandlesticks = (period: string) => {
  const now = Date.now();
  const periodMs: Record<string, number> = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000,
    '1w': 604800000
  };

  const ms = periodMs[period] || 3600000;
  const basePrice = 2500.0;
  const count = 100;

  const data: Candlestick[] = [];
  let price = basePrice;

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i - 1) * ms;
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility;

    const open = price;
    const close = open * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = 1000 + Math.random() * 10000;

    data.push({ timestamp, open, high, low, close, volume });
    price = close;
  }

  return data;
};

// Calculate MA
const calculateMA = (data: Candlestick[], period: number): number[] => {
  const result: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b.close, 0);
    result.push(sum / period);
  }
  return result;
};

// Canvas drawing
const chartCanvas = ref<HTMLCanvasElement | null>(null);

const drawChart = () => {
  const canvas = chartCanvas.value;
  if (!canvas || !candlesticks.value.length) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate price range
  const prices = candlesticks.value.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices) * 0.999;
  const maxPrice = Math.max(...prices) * 1.001;
  const priceRange = maxPrice - minPrice;

  // Draw grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    // Price labels
    const price = maxPrice - (priceRange / 5) * i;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(price.toFixed(2), padding - 5, y + 3);
  }

  // Draw candlesticks
  const candleWidth = (chartWidth / candlesticks.value.length) * 0.8;

  candlesticks.value.forEach((candle, i) => {
    const x = padding + (i / candlesticks.value.length) * chartWidth + candleWidth / 2;

    const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
    const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
    const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
    const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;

    const isGreen = candle.close >= candle.open;
    const color = isGreen ? '#22c55e' : '#ef4444';

    // Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();

    // Body
    ctx.fillStyle = color;
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
    ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
  });

  // Draw MA5 line
  if (indicators.value.ma5.length) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const ma5Start = candlesticks.value.length - indicators.value.ma5.length;
    indicators.value.ma5.forEach((ma, i) => {
      const x = padding + ((ma5Start + i) / candlesticks.value.length) * chartWidth;
      const y = padding + ((maxPrice - ma) / priceRange) * chartHeight;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // Draw MA20 line
  if (indicators.value.ma20.length) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const ma20Start = candlesticks.value.length - indicators.value.ma20.length;
    indicators.value.ma20.forEach((ma, i) => {
      const x = padding + ((ma20Start + i) / candlesticks.value.length) * chartWidth;
      const y = padding + ((maxPrice - ma) / priceRange) * chartHeight;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
};

const loadData = async () => {
  isLoading.value = true;

  try {
    // Fetch from API
    const [klineRes, priceRes, indicatorsRes] = await Promise.all([
      getKLine(selectedPair.value.base, selectedPair.value.quote, selectedPeriod.value, 100),
      getPrice(selectedPair.value.base, selectedPair.value.quote),
      getIndicators(selectedPair.value.base, selectedPair.value.quote, selectedPeriod.value)
    ]);

    if (klineRes.success && klineRes.data) {
      candlesticks.value = klineRes.data;
      // Calculate MA from actual data
      indicators.value.ma5 = calculateMA(candlesticks.value, 5);
      indicators.value.ma20 = calculateMA(candlesticks.value, 20);
    }

    if (priceRes.success && priceRes.data) {
      selectedPair.value = {
        ...selectedPair.value,
        base: priceRes.data.base,
        quote: priceRes.data.quote,
        price: priceRes.data.price,
        change24h: priceRes.data.change24h,
        changePercent: priceRes.data.changePercent
      };
    }

    if (indicatorsRes.success && indicatorsRes.data) {
      const ind = indicatorsRes.data;
      indicators.value.rsi = ind.rsi?.value || 50;
      if (ind.macd) {
        indicators.value.macd = ind.macd;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch from API, using mock data:', e);
    // Fallback to mock data
    candlesticks.value = generateCandlesticks(selectedPeriod.value);
    indicators.value.ma5 = calculateMA(candlesticks.value, 5);
    indicators.value.ma20 = calculateMA(candlesticks.value, 20);
  }

  setTimeout(drawChart, 100);

  isLoading.value = false;
};

const changePeriod = (period: string) => {
  selectedPeriod.value = period;
  loadData();
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

const priceChangeClass = computed(() => {
  return selectedPair.value.changePercent >= 0 ? 'text-green-400' : 'text-red-400';
});

// Handle window resize
const handleResize = () => {
  if (chartCanvas.value) {
    chartCanvas.value.width = chartCanvas.value.offsetWidth;
    chartCanvas.value.height = 400;
    drawChart();
  }
};

onMounted(() => {
  if (chartCanvas.value) {
    chartCanvas.value.width = chartCanvas.value.offsetWidth;
    chartCanvas.value.height = 400;
  }
  loadData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div>
          <h2 class="text-xl font-semibold">{{ selectedPair.base }}/{{ selectedPair.quote }}</h2>
          <div class="flex items-center gap-2">
            <span class="text-2xl font-bold">${{ selectedPair.price.toLocaleString() }}</span>
            <span class="text-sm font-medium" :class="[priceChangeClass]">
              {{ selectedPair.changePercent >= 0 ? '+' : '' }}{{ selectedPair.changePercent.toFixed(2) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Period Selector -->
      <div class="flex gap-1">
        <button
          v-for="period in periods"
          :key="period"
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          :class="[
            selectedPeriod === period
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
          ]"
          @click="changePeriod(period)"
        >
          {{ period }}
        </button>
      </div>
    </div>

    <!-- Chart -->
    <div class="relative mb-4">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-slate-900/50">
        <span class="text-slate-400">Loading...</span>
      </div>
      <canvas ref="chartCanvas" class="h-[400px] w-full rounded-xl" />
    </div>

    <!-- Indicators -->
    <div class="grid grid-cols-4 gap-4 border-t border-slate-700 pt-4">
      <div class="rounded-xl bg-slate-900/50 p-3">
        <p class="mb-1 text-xs text-slate-400">MA5</p>
        <p class="text-amber-400 font-semibold">${{ indicators.ma5[indicators.ma5.length - 1]?.toFixed(2) || '—' }}</p>
      </div>
      <div class="rounded-xl bg-slate-900/50 p-3">
        <p class="mb-1 text-xs text-slate-400">MA20</p>
        <p class="text-blue-400 font-semibold">${{ indicators.ma20[indicators.ma20.length - 1]?.toFixed(2) || '—' }}</p>
      </div>
      <div class="rounded-xl bg-slate-900/50 p-3">
        <p class="mb-1 text-xs text-slate-400">RSI(14)</p>
        <p
          class="font-semibold"
          :class="[indicators.rsi > 70 ? 'text-red-400' : indicators.rsi < 30 ? 'text-green-400' : 'text-slate-300']"
        >
          {{ indicators.rsi.toFixed(1) }}
        </p>
      </div>
      <div class="rounded-xl bg-slate-900/50 p-3">
        <p class="mb-1 text-xs text-slate-400">MACD</p>
        <p class="font-semibold" :class="[indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400']">
          {{ indicators.macd.histogram.toFixed(2) }}
        </p>
      </div>
    </div>
  </div>
</template>
