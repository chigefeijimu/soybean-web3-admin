<script setup lang="ts">
import { ref, computed } from 'vue';

// Strategy types
const strategyType = ref('swap');
const initialAmount = ref(1000);
const fromToken = ref('ETH');
const toToken = ref('USDC');
const startDate = ref('2024-01-01');
const endDate = ref('2024-12-31');
const iterations = ref(100);

// Simulation results
const isRunning = ref(false);
const results = ref<any>(null);

// Historical mock data
const generateHistoricalData = () => {
  const data = [];
  const start = new Date(startDate.value).getTime();
  const end = new Date(endDate.value).getTime();
  const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  
  let price = 2500; // ETH starting price
  for (let i = 0; i <= days; i++) {
    const volatility = 0.03;
    const change = (Math.random() - 0.5) * 2 * volatility;
    price = price * (1 + change);
    data.push({
      date: new Date(start + i * 1000 * 60 * 60 * 24).toISOString().split('T')[0],
      price: price,
      volume: Math.random() * 1000000000 + 500000000
    });
  }
  return data;
};

// Run backtest simulation
const runBacktest = async () => {
  isRunning.value = true;
  results.value = null;
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const historicalData = generateHistoricalData();
  
  // Calculate strategy performance
  let totalReturn = 0;
  let bestReturn = -Infinity;
  let worstReturn = Infinity;
  let trades = 0;
  
  const tradesList = [];
  
  for (let i = 0; i < historicalData.length - 1; i++) {
    const currentPrice = historicalData[i].price;
    const nextPrice = historicalData[i + 1].price;
    const change = (nextPrice - currentPrice) / currentPrice;
    
    // Simple strategy: buy when price goes up, sell when down
    if (strategyType.value === 'swap') {
      if (change > 0.01) {
        trades++;
        totalReturn += change * 100;
        tradesList.push({
          date: historicalData[i].date,
          type: 'BUY',
          price: currentPrice,
          change: (change * 100).toFixed(2) + '%'
        });
      } else if (change < -0.01) {
        trades++;
        totalReturn += change * 100;
        tradesList.push({
          date: historicalData[i].date,
          type: 'SELL',
          price: currentPrice,
          change: (change * 100).toFixed(2) + '%'
        });
      }
    } else if (strategyType.value === 'hold') {
      totalReturn += change * 100;
    } else if (strategyType.value === 'dca') {
      // Dollar cost averaging
      const dcaReturn = (nextPrice - currentPrice) / currentPrice * 100 / 30;
      totalReturn += dcaReturn;
    }
    
    bestReturn = Math.max(bestReturn, change * 100);
    worstReturn = Math.min(worstReturn, change * 100);
  }
  
  const avgReturn = totalReturn / historicalData.length;
  const finalAmount = initialAmount.value * (1 + totalReturn / 100);
  
  results.value = {
    initialAmount: initialAmount.value,
    finalAmount: finalAmount.toFixed(2),
    totalReturn: totalReturn.toFixed(2) + '%',
    avgDailyReturn: avgReturn.toFixed(4) + '%',
    bestDay: bestReturn.toFixed(2) + '%',
    worstDay: worstReturn.toFixed(2) + '%',
    totalTrades: trades,
    sharpeRatio: (avgReturn / Math.abs(worstReturn)).toFixed(2),
    maxDrawdown: worstReturn.toFixed(2) + '%',
    winRate: ((tradesList.filter(t => t.type === 'BUY').length / Math.max(trades, 1)) * 100).toFixed(1) + '%',
    historicalData: historicalData,
    trades: tradesList.slice(0, 20)
  };
  
  isRunning.value = false;
};

// Strategy options
const strategies = [
  { id: 'hold', name: 'Buy & Hold', description: 'Buy and hold for long term' },
  { id: 'swap', name: 'Swing Trading', description: 'Trade based on price swings' },
  { id: 'dca', name: 'Dollar Cost Averaging', description: 'Invest fixed amount regularly' }
];

const tokens = ['ETH', 'BTC', 'SOL', 'ARB', 'OP', 'MATIC', 'AVAX', 'LINK'];
</script>

<template>
  <div class="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
    <div class="mb-6 flex items-center gap-3">
      <span class="text-3xl">📈</span>
      <div>
        <h2 class="text-xl font-semibold">DeFi Strategy Backtester</h2>
        <p class="text-sm text-slate-400">Test your DeFi strategies against historical data</p>
      </div>
    </div>

    <!-- Configuration -->
    <div class="mb-6 grid gap-4 md:grid-cols-2">
      <div>
        <label class="mb-2 block text-sm text-slate-400">Strategy Type</label>
        <select
          v-model="strategyType"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 focus:border-purple-500 focus:outline-none"
        >
          <option v-for="s in strategies" :key="s.id" :value="s.id">{{ s.name }} - {{ s.description }}</option>
        </select>
      </div>
      
      <div>
        <label class="mb-2 block text-sm text-slate-400">Initial Amount ($)</label>
        <input
          v-model.number="initialAmount"
          type="number"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 focus:border-purple-500 focus:outline-none"
        />
      </div>
      
      <div>
        <label class="mb-2 block text-sm text-slate-400">From Token</label>
        <select
          v-model="fromToken"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 focus:border-purple-500 focus:outline-none"
        >
          <option v-for="t in tokens" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
      
      <div>
        <label class="mb-2 block text-sm text-slate-400">To Token</label>
        <select
          v-model="toToken"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 focus:border-purple-500 focus:outline-none"
        >
          <option v-for="t in tokens" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
      
      <div>
        <label class="mb-2 block text-sm text-slate-400">Start Date</label>
        <input
          v-model="startDate"
          type="date"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 focus:border-purple-500 focus:outline-none"
        />
      </div>
      
      <div>
        <label class="mb-2 block text-sm text-slate-400">End Date</label>
        <input
          v-model="endDate"
          type="date"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 focus:border-purple-500 focus:outline-none"
        />
      </div>
    </div>

    <!-- Run Button -->
    <button
      :disabled="isRunning"
      class="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 font-semibold transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
      @click="runBacktest"
    >
      <span v-if="isRunning" class="animate-spin">⏳</span>
      <span>{{ isRunning ? 'Running Backtest...' : '🚀 Run Backtest' }}</span>
    </button>

    <!-- Results -->
    <div v-if="results" class="space-y-6">
      <!-- Summary Stats -->
      <div class="grid gap-4 md:grid-cols-4">
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Initial</p>
          <p class="text-xl font-bold">${{ results.initialAmount }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Final</p>
          <p class="text-xl font-bold text-green-400">${{ results.finalAmount }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Total Return</p>
          <p class="text-xl font-bold" :class="parseFloat(results.totalReturn) >= 0 ? 'text-green-400' : 'text-red-400'">
            {{ results.totalReturn }}
          </p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Total Trades</p>
          <p class="text-xl font-bold">{{ results.totalTrades }}</p>
        </div>
      </div>

      <!-- Detailed Stats -->
      <div class="rounded-xl bg-slate-900/50 p-4">
        <h3 class="mb-4 font-semibold">📊 Performance Metrics</h3>
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <p class="text-xs text-slate-400">Avg Daily Return</p>
            <p class="font-semibold">{{ results.avgDailyReturn }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Best Day</p>
            <p class="font-semibold text-green-400">{{ results.bestDay }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Worst Day</p>
            <p class="font-semibold text-red-400">{{ results.worstDay }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Sharpe Ratio</p>
            <p class="font-semibold">{{ results.sharpeRatio }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Max Drawdown</p>
            <p class="font-semibold text-red-400">{{ results.maxDrawdown }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Win Rate</p>
            <p class="font-semibold">{{ results.winRate }}</p>
          </div>
        </div>
      </div>

      <!-- Price Chart -->
      <div class="rounded-xl bg-slate-900/50 p-4">
        <h3 class="mb-4 font-semibold">📈 Price History</h3>
        <div class="h-48 overflow-hidden">
          <div class="flex h-full items-end gap-px">
            <div
              v-for="(point, idx) in results.historicalData.filter((_, i) => i % 10 === 0)"
              :key="idx"
              class="flex-1 bg-purple-500/50 transition-all hover:bg-purple-400"
              :style="{ height: `${(point.price / Math.max(...results.historicalData.map(p => p.price))) * 100}%` }"
              :title="`${point.date}: $${point.price.toFixed(2)}`"
            />
          </div>
        </div>
      </div>

      <!-- Recent Trades -->
      <div class="rounded-xl bg-slate-900/50 p-4">
        <h3 class="mb-4 font-semibold">📋 Recent Trades</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-slate-400">
                <th class="pb-2 text-left">Date</th>
                <th class="pb-2 text-left">Type</th>
                <th class="pb-2 text-right">Price</th>
                <th class="pb-2 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trade in results.trades" :key="trade.date" class="border-t border-slate-700/50">
                <td class="py-2">{{ trade.date }}</td>
                <td class="py-2">
                  <span
                    class="rounded px-2 py-1 text-xs font-semibold"
                    :class="trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'"
                  >
                    {{ trade.type }}
                  </span>
                </td>
                <td class="py-2 text-right">${{ trade.price.toFixed(2) }}</td>
                <td class="py-2 text-right" :class="parseFloat(trade.change) >= 0 ? 'text-green-400' : 'text-red-400'">
                  {{ trade.change }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-12 text-center text-slate-400">
      <div class="mb-4 text-5xl">🔮</div>
      <p>Configure your strategy and run a backtest to see results</p>
    </div>
  </div>
</template>
