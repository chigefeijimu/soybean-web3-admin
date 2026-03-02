<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  fetchTradingStrategies, 
  backtestStrategy, 
  compareStrategies, 
  optimizeStrategy,
  fetchLiveTradingSignals,
  type BacktestResult,
  type CompareResult
} from '@/service/api/web3';

// State
const loading = ref(false);
const strategies = ref<string[]>([]);
const activeTab = ref<'backtest' | 'compare' | 'optimize' | 'signals'>('backtest');

// Backtest form
const backtestForm = ref({
  strategy: 'Grid Trading',
  symbol: 'ETH/USDT',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  initialCapital: 10000,
  marketType: 'bull' as 'bull' | 'bear' | 'sideways' | 'volatile',
  gridLevels: 10,
  investmentPerGrid: 100,
  dcaAmount: 100,
  dcaInterval: 7,
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  momentumPeriod: 20,
  meanReversionPeriod: 20,
  stdDev: 2
});

const backtestResult = ref<BacktestResult | null>(null);

// Compare form
const compareForm = ref({
  strategies: ['Grid Trading', 'DCA', 'RSI'],
  symbol: 'ETH/USDT',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  initialCapital: 10000,
  marketType: 'bull'
});

const compareResult = ref<CompareResult | null>(null);

// Optimize form
const optimizeForm = ref({
  strategy: 'Grid Trading',
  symbol: 'ETH/USDT',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  initialCapital: 10000,
  marketType: 'bull'
});

const optimizeLoading = ref(false);
const optimizeResult = ref<{ bestParams: Record<string, any>; results: BacktestResult } | null>(null);

// Live signals
const signals = ref<{ symbol: string; signal: string; strength: number; price: number; change24h: number }[]>([]);
const signalsLoading = ref(false);

// Computed
const strategyParams = computed(() => {
  const s = backtestForm.value.strategy;
  const params: Record<string, any> = {};
  
  if (s === 'Grid Trading') {
    params.gridLevels = backtestForm.value.gridLevels;
    params.investmentPerGrid = backtestForm.value.investmentPerGrid;
  } else if (s === 'DCA') {
    params.dcaAmount = backtestForm.value.dcaAmount;
    params.dcaInterval = backtestForm.value.dcaInterval;
  } else if (s === 'RSI') {
    params.rsiPeriod = backtestForm.value.rsiPeriod;
    params.rsiOverbought = backtestForm.value.rsiOverbought;
    params.rsiOversold = backtestForm.value.rsiOversold;
  } else if (s === 'MACD') {
    params.macdFast = backtestForm.value.macdFast;
    params.macdSlow = backtestForm.value.macdSlow;
    params.macdSignal = backtestForm.value.macdSignal;
  } else if (s === 'Momentum') {
    params.momentumPeriod = backtestForm.value.momentumPeriod;
  } else if (s === 'Mean Reversion') {
    params.meanReversionPeriod = backtestForm.value.meanReversionPeriod;
    params.stdDev = backtestForm.value.stdDev;
  }
  
  return params;
});

// Methods
const loadStrategies = async () => {
  try {
    const res = await fetchTradingStrategies();
    strategies.value = res.data || [];
  } catch (error) {
    console.error('Failed to load strategies:', error);
    // Fallback strategies
    strategies.value = ['Grid Trading', 'DCA', 'RSI', 'MACD', 'Momentum', 'Mean Reversion'];
  }
};

const runBacktest = async () => {
  loading.value = true;
  try {
    const res = await backtestStrategy({
      strategy: backtestForm.value.strategy,
      symbol: backtestForm.value.symbol,
      startDate: backtestForm.value.startDate,
      endDate: backtestForm.value.endDate,
      initialCapital: backtestForm.value.initialCapital,
      marketType: backtestForm.value.marketType,
      parameters: strategyParams.value
    });
    backtestResult.value = res.data;
  } catch (error) {
    console.error('Backtest failed:', error);
  } finally {
    loading.value = false;
  }
};

const runCompare = async () => {
  loading.value = true;
  try {
    const res = await compareStrategies({
      strategies: compareForm.value.strategies,
      symbol: compareForm.value.symbol,
      startDate: compareForm.value.startDate,
      endDate: compareForm.value.endDate,
      initialCapital: compareForm.value.initialCapital,
      marketType: compareForm.value.marketType as any
    });
    compareResult.value = res.data;
  } catch (error) {
    console.error('Compare failed:', error);
  } finally {
    loading.value = false;
  }
};

const runOptimize = async () => {
  optimizeLoading.value = true;
  try {
    const res = await optimizeStrategy({
      strategy: optimizeForm.value.strategy,
      symbol: optimizeForm.value.symbol,
      startDate: optimizeForm.value.startDate,
      endDate: optimizeForm.value.endDate,
      initialCapital: optimizeForm.value.initialCapital,
      marketType: optimizeForm.value.marketType as any
    });
    optimizeResult.value = res.data;
  } catch (error) {
    console.error('Optimize failed:', error);
  } finally {
    optimizeLoading.value = false;
  }
};

const loadSignals = async () => {
  signalsLoading.value = true;
  try {
    const res = await fetchLiveTradingSignals({ timeRange: '24h' });
    signals.value = res.data || [];
  } catch (error) {
    console.error('Failed to load signals:', error);
  } finally {
    signalsLoading.value = false;
  }
};

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const formatPercent = (num: number) => {
  return (num >= 0 ? '+' : '') + num.toFixed(2) + '%';
};

const getSignalColor = (signal: string) => {
  switch (signal) {
    case 'BUY': return 'text-green-400';
    case 'SELL': return 'text-red-400';
    default: return 'text-yellow-400';
  }
};

const getSignalBg = (signal: string) => {
  switch (signal) {
    case 'BUY': return 'bg-green-400/10';
    case 'SELL': return 'bg-red-400/10';
    default: return 'bg-yellow-400/10';
  }
};

// Initialize
onMounted(() => {
  loadStrategies();
  loadSignals();
});
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-100">🤖 Trading Bot Simulator</h1>
        <p class="text-gray-400 mt-1">回测交易策略、比较性能、优化参数</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-gray-700 pb-2">
      <button
        v-for="tab in ['backtest', 'compare', 'optimize', 'signals']"
        :key="tab"
        @click="activeTab = tab as any"
        :class="[
          'px-4 py-2 rounded-t-lg transition-colors',
          activeTab === tab 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        ]"
      >
        {{ tab === 'backtest' ? '🔬 回测' : tab === 'compare' ? '⚖️ 比较' : tab === 'optimize' ? '⚡ 优化' : '📡 信号' }}
      </button>
    </div>

    <!-- Backtest Tab -->
    <div v-if="activeTab === 'backtest'" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Form -->
        <div class="lg:col-span-1 bg-gray-800 rounded-xl p-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-100">策略配置</h3>
          
          <div>
            <label class="block text-sm text-gray-400 mb-1">交易策略</label>
            <select v-model="backtestForm.strategy" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100">
              <option v-for="s in strategies" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">交易对</label>
            <select v-model="backtestForm.symbol" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100">
              <option>ETH/USDT</option>
              <option>BTC/USDT</option>
              <option>SOL/USDT</option>
              <option>BNB/USDT</option>
              <option>ARBITRUM/USDT</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">开始日期</label>
              <input v-model="backtestForm.startDate" type="date" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100" />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">结束日期</label>
              <input v-model="backtestForm.endDate" type="date" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100" />
            </div>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">初始资金 ($)</label>
            <input v-model.number="backtestForm.initialCapital" type="number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100" />
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">市场类型</label>
            <select v-model="backtestForm.marketType" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100">
              <option value="bull">🐂 牛市</option>
              <option value="bear">🐻 熊市</option>
              <option value="sideways">📊 震荡</option>
              <option value="volatile">🌪️ 高波动</option>
            </select>
          </div>

          <!-- Strategy-specific params -->
          <div v-if="backtestForm.strategy === 'Grid Trading'" class="space-y-3 pt-3 border-t border-gray-700">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-400 mb-1">网格数量</label>
                <input v-model.number="backtestForm.gridLevels" type="number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-100 text-sm" />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">每格投资($)</label>
                <input v-model.number="backtestForm.investmentPerGrid" type="number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-100 text-sm" />
              </div>
            </div>
          </div>

          <div v-if="backtestForm.strategy === 'DCA'" class="space-y-3 pt-3 border-t border-gray-700">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-400 mb-1">定投金额($)</label>
                <input v-model.number="backtestForm.dcaAmount" type="number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-100 text-sm" />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">间隔(天)</label>
                <input v-model.number="backtestForm.dcaInterval" type="number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-100 text-sm" />
              </div>
            </div>
          </div>

          <div v-if="backtestForm.strategy === 'RSI'" class="space-y-3 pt-3 border-t border-gray-700">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-gray-400 mb-1">RSI周期</label>
                <input v-model.number="backtestForm.rsiPeriod" type="number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-100 text-sm" />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">超买</label>
                <input v-model.number="backtestForm.rsiOverbought" type="number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-100 text-sm" />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">超卖</label>
                <input v-model.number="backtestForm.rsiOversold" type="number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-100 text-sm" />
              </div>
            </div>
          </div>

          <button 
            @click="runBacktest"
            :disabled="loading"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            {{ loading ? '⏳ 运行中...' : '🚀 运行回测' }}
          </button>
        </div>

        <!-- Results -->
        <div class="lg:col-span-2 space-y-4">
          <div v-if="backtestResult" class="space-y-4">
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-gray-800 rounded-xl p-4">
                <div class="text-sm text-gray-400">总收益</div>
                : <div :class="['text-xl font-bold', backtestResult.totalReturn >= 0 ? 'text-green-400' : 'text-red-400']">
                  {{ formatCurrency(backtestResult.totalReturn) }}
                </div>
                <div :class="['text-sm', backtestResult.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400']">
                  {{ formatPercent(backtestResult.totalReturnPercent) }}
                </div>
              </div>
              <div class="bg-gray-800 rounded-xl p-4">
                <div class="text-sm text-gray-400">夏普比率</div>
                <div class="text-xl font-bold text-blue-400">{{ backtestResult.sharpeRatio.toFixed(2) }}</div>
              </div>
              <div class="bg-gray-800 rounded-xl p-4">
                <div class="text-sm text-gray-400">胜率</div>
                <div class="text-xl font-bold text-purple-400">{{ (backtestResult.winRate * 100).toFixed(1) }}%</div>
              </div>
              <div class="bg-gray-800 rounded-xl p-4">
                <div class="text-sm text-gray-400">最大回撤</div>
                <div class="text-xl font-bold text-red-400">-{{ (backtestResult.maxDrawdown * 100).toFixed(1) }}%</div>
              </div>
            </div>

            <!-- Detailed Metrics -->
            <div class="bg-gray-800 rounded-xl p-6">
              <h3 class="text-lg font-semibold text-gray-100 mb-4">📊 详细指标</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div class="bg-gray-700/50 rounded-lg p-3">
                  <div class="text-xs text-gray-400">初始资金</div>
                  <div class="text-gray-100 font-medium">{{ formatCurrency(backtestResult.initialCapital) }}</div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                  <div class="text-xs text-gray-400">最终资金</div>
                  <div class="text-gray-100 font-medium">{{ formatCurrency(backtestResult.finalCapital) }}</div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                  <div class="text-xs text-gray-400">总交易数</div>
                  <div class="text-gray-100 font-medium">{{ backtestResult.totalTrades }}</div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                  <div class="text-xs text-gray-400">盈利交易</div>
                  <div class="text-green-400 font-medium">{{ backtestResult.profitableTrades }}</div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                  <div class="text-xs text-gray-400">亏损交易</div>
                  <div class="text-red-400 font-medium">{{ backtestResult.losingTrades }}</div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                  <div class="text-xs text-gray-400">盈亏比</div>
                  <div class="text-gray-100 font-medium">{{ backtestResult.profitFactor.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- Trades -->
            <div class="bg-gray-800 rounded-xl p-6">
              <h3 class="text-lg font-semibold text-gray-100 mb-4">📋 交易记录</h3>
              <div class="max-h-64 overflow-y-auto">
                <table class="w-full text-sm">
                  <thead class="text-gray-400 border-b border-gray-700">
                    <tr>
                      <th class="text-left py-2">类型</th>
                      <th class="text-right py-2">价格</th>
                      <th class="text-right py-2">数量</th>
                      <th class="text-right py-2">价值</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(trade, i) in backtestResult.trades.slice(0, 50)" :key="i" class="border-b border-gray-700/50">
                      <td :class="['py-2', trade.type === 'buy' ? 'text-green-400' : 'text-red-400']">
                        {{ trade.type === 'buy' ? '买入' : '卖出' }}
                      </td>
                      <td class="text-right text-gray-300">${{ trade.price.toFixed(2) }}</td>
                      <td class="text-right text-gray-300">{{ trade.amount.toFixed(4) }}</td>
                      <td class="text-right text-gray-300">${{ trade.value.toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="backtestResult.trades.length > 50" class="text-center text-gray-400 py-2">
                  ... 还有 {{ backtestResult.trades.length - 50 }} 笔交易
                </div>
              </div>
            </div>
          </div>

          <div v-else class="bg-gray-800 rounded-xl p-12 text-center">
            <div class="text-4xl mb-4">🤖</div>
            <div class="text-gray-400">配置策略参数并点击"运行回测"开始</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Compare Tab -->
    <div v-if="activeTab === 'compare'" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-gray-800 rounded-xl p-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-100">策略对比</h3>
          
          <div>
            <label class="block text-sm text-gray-400 mb-2">选择策略</label>
            <div class="space-y-2">
              <label v-for="s in strategies" :key="s" class="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  :value="s" 
                  v-model="compareForm.strategies"
                  class="rounded bg-gray-700 border-gray-600"
                />
                <span class="text-gray-300">{{ s }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">交易对</label>
            <select v-model="compareForm.symbol" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100">
              <option>ETH/USDT</option>
              <option>BTC/USDT</option>
              <option>SOL/USDT</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">开始日期</label>
              <input v-model="compareForm.startDate" type="date" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100" />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">结束日期</label>
              <input v-model="compareForm.endDate" type="date" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100" />
            </div>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">初始资金 ($)</label>
            <input v-model.number="compareForm.initialCapital" type="number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100" />
          </div>

          <button 
            @click="runCompare"
            :disabled="loading || compareForm.strategies.length < 2"
            class="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            {{ loading ? '⏳ 比较中...' : '⚖️ 开始对比' }}
          </button>
        </div>

        <div class="lg:col-span-2">
          <div v-if="compareResult" class="space-y-4">
            <!-- Best Strategy -->
            <div class="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30">
              <div class="text-sm text-gray-400 mb-2">🏆 最佳策略</div>
              <div class="text-2xl font-bold text-purple-400">{{ compareResult.metrics.bestStrategy }}</div>
              <div class="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div class="text-xs text-gray-400">收益率</div>
                  <div class="text-green-400 font-bold">{{ formatPercent(compareResult.metrics.bestReturn) }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-400">夏普比率</div>
                  <div class="text-blue-400 font-bold">{{ compareResult.metrics.bestSharpe }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-400">胜率</div>
                  <div class="text-purple-400 font-bold">{{ compareResult.metrics.bestWinRate }}</div>
                </div>
              </div>
            </div>

            <!-- Comparison Table -->
            <div class="bg-gray-800 rounded-xl p-6">
              <h3 class="text-lg font-semibold text-gray-100 mb-4">策略对比详情</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="text-gray-400 border-b border-gray-700">
                    <tr>
                      <th class="text-left py-3">策略</th>
                      <th class="text-right py-3">收益率</th>
                      <th class="text-right py-3">夏普比率</th>
                      <th class="text-right py-3">胜率</th>
                      <th class="text-right py-3">最大回撤</th>
                      <th class="text-right py-3">交易数</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in compareResult.results" :key="r.strategy" class="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td class="py-3 font-medium text-gray-100">{{ r.strategy }}</td>
                      <td :class="['text-right', r.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400']">
                        {{ formatPercent(r.totalReturnPercent) }}
                      </td>
                      <td class="text-right text-blue-400">{{ r.sharpeRatio.toFixed(2) }}</td>
                      <td class="text-right text-purple-400">{{ (r.winRate * 100).toFixed(1) }}%</td>
                      <td class="text-right text-red-400">-{{ (r.maxDrawdown * 100).toFixed(1) }}%</td>
                      <td class="text-right text-gray-300">{{ r.totalTrades }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-else class="bg-gray-800 rounded-xl p-12 text-center">
            <div class="text-4xl mb-4">⚖️</div>
            <div class="text-gray-400">选择至少2个策略进行对比</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Optimize Tab -->
    <div v-if="activeTab === 'optimize'" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-gray-800 rounded-xl p-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-100">参数优化</h3>
          
          <div>
            <label class="block text-sm text-gray-400 mb-1">交易策略</label>
            <select v-model="optimizeForm.strategy" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100">
              <option>Grid Trading</option>
              <option>RSI</option>
              <option>MACD</option>
            </select>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">交易对</label>
            <select v-model="optimizeForm.symbol" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100">
              <option>ETH/USDT</option>
              <option>BTC/USDT</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">开始日期</label>
              <input v-model="optimizeForm.startDate" type="date" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100" />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">结束日期</label>
              <input v-model="optimizeForm.endDate" type="date" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100" />
            </div>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">初始资金 ($)</label>
            <input v-model.number="optimizeForm.initialCapital" type="number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100" />
          </div>

          <button 
            @click="runOptimize"
            :disabled="optimizeLoading"
            class="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            {{ optimizeLoading ? '⏳ 优化中...' : '⚡ 开始优化' }}
          </button>
        </div>

        <div class="lg:col-span-2">
          <div v-if="optimizeResult" class="space-y-4">
            <!-- Best Params -->
            <div class="bg-gradient-to-r from-green-900/50 to-teal-900/50 rounded-xl p-6 border border-green-500/30">
              <div class="text-sm text-gray-400 mb-2">🎯 最佳参数</div>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div v-for="(v, k) in optimizeResult.bestParams" :key="k" class="bg-gray-800/50 rounded-lg p-2">
                  <div class="text-xs text-gray-400">{{ k }}</div>
                  <div class="text-gray-100 font-medium">{{ v }}</div>
                </div>
              </div>
            </div>

            <!-- Results -->
            <div class="bg-gray-800 rounded-xl p-6">
              <h3 class="text-lg font-semibold text-gray-100 mb-4">📊 优化结果</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gray-700/50 rounded-lg p-3">
                  <div class="text-xs text-gray-400">收益率</div>
                  <div :class="['text-lg font-bold', optimizeResult.results.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400']">
                    {{ formatPercent(optimizeResult.results.totalReturnPercent) }}
                  </div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                  <div class="text-xs text-gray-400">夏普比率</div>
                  <div class="text-lg font-bold text-blue-400">{{ optimizeResult.results.sharpeRatio.toFixed(2) }}</div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                  <div class="text-xs text-gray-400">胜率</div>
                  <div class="text-lg font-bold text-purple-400">{{ (optimizeResult.results.winRate * 100).toFixed(1) }}%</div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                  <div class="text-xs text-gray-400">最大回撤</div>
                  <div class="text-lg font-bold text-red-400">-{{ (optimizeResult.results.maxDrawdown * 100).toFixed(1) }}%</div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="bg-gray-800 rounded-xl p-12 text-center">
            <div class="text-4xl mb-4">⚡</div>
            <div class="text-gray-400">配置策略并开始参数优化</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Signals Tab -->
    <div v-if="activeTab === 'signals'" class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-100">📡 实时交易信号</h3>
        <button 
          @click="loadSignals"
          :disabled="signalsLoading"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          {{ signalsLoading ? '⏳ 刷新中...' : '🔄 刷新' }}
        </button>
      </div>

      <div v-if="signals.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="sig in signals" 
          :key="sig.symbol"
          :class="['rounded-xl p-4 border', getSignalBg(sig.signal)]"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="font-semibold text-gray-100">{{ sig.symbol }}</div>
            <div :class="['px-2 py-0.5 rounded text-xs font-bold', getSignalColor(sig.signal)]">
              {{ sig.signal }}
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-100">${{ sig.price.toLocaleString() }}</div>
          <div :class="['text-sm', sig.change24h >= 0 ? 'text-green-400' : 'text-red-400']">
            {{ formatPercent(sig.change24h) }} (24h)
          </div>
          <div class="mt-2">
            <div class="text-xs text-gray-400">信号强度</div>
            <div class="w-full bg-gray-700 rounded-full h-2 mt-1">
              <div 
                class="bg-blue-500 h-2 rounded-full" 
                :style="{ width: sig.strength + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-gray-800 rounded-xl p-12 text-center">
        <div class="text-4xl mb-4">📡</div>
        <div class="text-gray-400">暂无实时信号</div>
      </div>
    </div>
  </div>
</template>
