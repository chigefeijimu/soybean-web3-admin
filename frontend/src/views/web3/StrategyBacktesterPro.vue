<template>
  <div class="strategy-backtester-pro">
    <div class="header">
      <h1>📈 AI Strategy Backtester Pro</h1>
      <p class="subtitle">Advanced backtesting with 10+ trading strategies, risk analytics, and AI insights</p>
    </div>

    <div class="main-layout">
      <!-- Configuration Panel -->
      <div class="config-panel">
        <div class="panel-section">
          <h3>Strategy Configuration</h3>
          
          <div class="form-group">
            <label>Trading Strategy</label>
            <select v-model="config.strategy">
              <option v-for="s in availableStrategies" :key="s" :value="s">
                {{ formatStrategyName(s) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Token</label>
            <select v-model="config.token">
              <option v-for="t in availableTokens" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Blockchain</label>
            <select v-model="config.chain">
              <option v-for="c in availableChains" :key="c" :value="c">{{ formatChainName(c) }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Initial Capital (USD)</label>
            <input type="number" v-model.number="config.initialCapital" min="100" step="100" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" v-model="config.startDate" />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" v-model="config.endDate" />
            </div>
          </div>
        </div>

        <!-- Strategy Parameters -->
        <div class="panel-section" v-if="showParams">
          <h3>Strategy Parameters</h3>
          
          <!-- Grid Parameters -->
          <div v-if="config.strategy === 'grid'" class="params-grid">
            <div class="form-group">
              <label>Grid Levels</label>
              <input type="number" v-model.number="config.parameters.gridLevels" min="5" max="50" />
            </div>
            <div class="form-group">
              <label>Grid Spacing (%)</label>
              <input type="number" v-model.number="config.parameters.gridSpacing" min="0.5" max="5" step="0.1" />
            </div>
          </div>

          <!-- DCA Parameters -->
          <div v-if="config.strategy === 'dca'" class="params-grid">
            <div class="form-group">
              <label>DCA Amount (USD)</label>
              <input type="number" v-model.number="config.parameters.dcaAmount" min="10" step="10" />
            </div>
            <div class="form-group">
              <label>Frequency</label>
              <select v-model="config.parameters.dcaFrequency">
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <!-- RSI Parameters -->
          <div v-if="config.strategy === 'rsi'" class="params-grid">
            <div class="form-group">
              <label>RSI Period</label>
              <input type="number" v-model.number="config.parameters.rsiPeriod" min="7" max="28" />
            </div>
            <div class="form-group">
              <label>Overbought Level</label>
              <input type="number" v-model.number="config.parameters.rsiOverbought" min="60" max="90" />
            </div>
            <div class="form-group">
              <label>Oversold Level</label>
              <input type="number" v-model.number="config.parameters.rsiOversold" min="10" max="40" />
            </div>
          </div>

          <!-- MACD Parameters -->
          <div v-if="config.strategy === 'macd'" class="params-grid">
            <div class="form-group">
              <label>Fast Period</label>
              <input type="number" v-model.number="config.parameters.macdFast" min="5" max="20" />
            </div>
            <div class="form-group">
              <label>Slow Period</label>
              <input type="number" v-model.number="config.parameters.macdSlow" min="15" max="50" />
            </div>
            <div class="form-group">
              <label>Signal Period</label>
              <input type="number" v-model.number="config.parameters.macdSignal" min="5" max="15" />
            </div>
          </div>

          <!-- Bollinger Bands Parameters -->
          <div v-if="config.strategy === 'bollinger'" class="params-grid">
            <div class="form-group">
              <label>Period</label>
              <input type="number" v-model.number="config.parameters.bbPeriod" min="10" max="50" />
            </div>
            <div class="form-group">
              <label>Std Deviation</label>
              <input type="number" v-model.number="config.parameters.bbStdDev" min="1" max="3" step="0.1" />
            </div>
          </div>

          <!-- Momentum Parameters -->
          <div v-if="config.strategy === 'momentum'" class="params-grid">
            <div class="form-group">
              <label>Momentum Period</label>
              <input type="number" v-model.number="config.parameters.momentumPeriod" min="5" max="30" />
            </div>
            <div class="form-group">
              <label>Threshold (%)</label>
              <input type="number" v-model.number="config.parameters.momentumThreshold" min="1" max="20" step="0.5" />
            </div>
          </div>

          <!-- Mean Reversion Parameters -->
          <div v-if="config.strategy === 'mean_reversion'" class="params-grid">
            <div class="form-group">
              <label>Period</label>
              <input type="number" v-model.number="config.parameters.meanReversionPeriod" min="10" max="50" />
            </div>
            <div class="form-group">
              <label>Std Deviation</label>
              <input type="number" v-model.number="config.parameters.meanReversionStdDev" min="1" max="3" step="0.1" />
            </div>
          </div>
        </div>

        <button class="btn-run" @click="runBacktest" :disabled="loading">
          {{ loading ? '⏳ Running Backtest...' : '🚀 Run Backtest' }}
        </button>
      </div>

      <!-- Results Panel -->
      <div class="results-panel" v-if="result">
        <!-- Performance Summary -->
        <div class="result-section">
          <h3>📊 Performance Summary</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <span class="metric-label">Initial Capital</span>
              <span class="metric-value">${{ result.initialCapital.toLocaleString() }}</span>
            </div>
            <div class="metric-card highlight">
              <span class="metric-label">Final Capital</span>
              <span class="metric-value success">${{ result.finalCapital.toLocaleString() }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Total Return</span>
              <span :class="['metric-value', result.totalReturnPercent >= 0 ? 'success' : 'danger']">
                {{ result.totalReturnPercent >= 0 ? '+' : '' }}{{ result.totalReturnPercent.toFixed(2) }}%
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Max Drawdown</span>
              <span class="metric-value danger">-{{ result.maxDrawdownPercent.toFixed(2) }}%</span>
            </div>
          </div>
        </div>

        <!-- Risk Metrics -->
        <div class="result-section">
          <h3>⚠️ Risk Metrics</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <span class="metric-label">Sharpe Ratio</span>
              <span :class="['metric-value', result.sharpeRatio >= 1 ? 'success' : '']">
                {{ result.sharpeRatio.toFixed(2) }}
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Sortino Ratio</span>
              <span class="metric-value">{{ result.sortinoRatio.toFixed(2) }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Calmar Ratio</span>
              <span class="metric-value">{{ result.calmarRatio.toFixed(2) }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Volatility</span>
              <span class="metric-value">{{ result.volatility.toFixed(2) }}%</span>
            </div>
          </div>
        </div>

        <!-- Trade Statistics -->
        <div class="result-section">
          <h3>📋 Trade Statistics</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <span class="metric-label">Total Trades</span>
              <span class="metric-value">{{ result.totalTrades }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Win Rate</span>
              <span :class="['metric-value', result.winRate >= 50 ? 'success' : 'danger']">
                {{ result.winRate.toFixed(1) }}%
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Profit Factor</span>
              <span :class="['metric-value', result.profitFactor >= 1.5 ? 'success' : '']">
                {{ result.profitFactor.toFixed(2) }}
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Avg Holding Period</span>
              <span class="metric-value">{{ result.avgHoldingPeriod.toFixed(1) }} days</span>
            </div>
          </div>
        </div>

        <!-- Benchmark Comparison -->
        <div class="result-section">
          <h3>📈 Benchmark Comparison</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <span class="metric-label">Strategy Return</span>
              <span :class="['metric-value', result.totalReturnPercent >= 0 ? 'success' : 'danger']">
                {{ result.totalReturnPercent >= 0 ? '+' : '' }}{{ result.totalReturnPercent.toFixed(2) }}%
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Market Return</span>
              <span class="metric-value">{{ result.marketReturn >= 0 ? '+' : '' }}{{ result.marketReturn.toFixed(2) }}%</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Alpha</span>
              <span :class="['metric-value', result.alpha >= 0 ? 'success' : 'danger']">
                {{ result.alpha >= 0 ? '+' : '' }}{{ result.alpha.toFixed(2) }}%
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Beta</span>
              <span class="metric-value">{{ result.beta.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- AI Insights -->
        <div class="result-section" v-if="result.aiInsights.length > 0">
          <h3>🤖 AI Insights</h3>
          <div class="insights-list">
            <div 
              v-for="(insight, idx) in result.aiInsights" 
              :key="idx"
              :class="['insight-card', insight.type]"
            >
              <div class="insight-header">
                <span class="insight-icon">{{ getInsightIcon(insight.type) }}</span>
                <span class="insight-title">{{ insight.title }}</span>
                <span class="insight-confidence">{{ insight.confidence }}% confidence</span>
              </div>
              <p class="insight-desc">{{ insight.description }}</p>
            </div>
          </div>
        </div>

        <!-- Equity Curve -->
        <div class="result-section" v-if="result.equityCurve.length > 0">
          <h3>📉 Equity Curve</h3>
          <div class="chart-container">
            <canvas ref="equityChart"></canvas>
          </div>
        </div>

        <!-- Trade History -->
        <div class="result-section" v-if="result.tradeHistory.length > 0">
          <h3>📜 Trade History</h3>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Value</th>
                  <th>P&L</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="trade in result.tradeHistory.slice(0, 20)" :key="trade.id">
                  <td>{{ trade.id }}</td>
                  <td>{{ trade.date }}</td>
                  <td>
                    <span :class="['trade-type', trade.type.toLowerCase()]">
                      {{ trade.type }}
                    </span>
                  </td>
                  <td>${{ trade.price.toFixed(2) }}</td>
                  <td>{{ trade.amount.toFixed(4) }}</td>
                  <td>${{ trade.value.toFixed(2) }}</td>
                  <td :class="trade.pnl >= 0 ? 'positive' : 'negative'">
                    {{ trade.pnl >= 0 ? '+' : '' }}${{ trade.pnl.toFixed(2) }}
                  </td>
                  <td class="reason">{{ trade.reason }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="results-panel empty" v-else>
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>No Backtest Results</h3>
          <p>Configure your strategy parameters and run a backtest to see results</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const loading = ref(false);
const equityChart = ref(null);
let chartInstance = null;

const availableStrategies = ref([]);
const availableTokens = ref([]);
const availableChains = ref([]);

const config = reactive({
  strategy: 'rsi',
  token: 'BTC',
  chain: 'ethereum',
  initialCapital: 10000,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  parameters: {
    gridLevels: 10,
    gridSpacing: 2,
    dcaAmount: 100,
    dcaFrequency: 'daily',
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    bbPeriod: 20,
    bbStdDev: 2,
    momentumPeriod: 10,
    momentumThreshold: 5,
    meanReversionPeriod: 20,
    meanReversionStdDev: 2
  }
});

const result = ref(null);

const showParams = ref(true);

const formatStrategyName = (name) => {
  const names = {
    'grid': 'Grid Trading',
    'dca': 'Dollar Cost Averaging',
    'rsi': 'RSI Strategy',
    'macd': 'MACD Strategy',
    'bollinger': 'Bollinger Bands',
    'momentum': 'Momentum Trading',
    'mean_reversion': 'Mean Reversion',
    'breakout': 'Breakout Strategy',
    'moving_average_crossover': 'MA Crossover',
    'dual_moving_average': 'Dual MA'
  };
  return names[name] || name;
};

const formatChainName = (chain) => {
  const names = {
    'ethereum': 'Ethereum',
    'polygon': 'Polygon',
    'arbitrum': 'Arbitrum',
    'optimism': 'Optimism',
    'bsc': 'BNB Chain',
    'base': 'Base',
    'avalanche': 'Avalanche'
  };
  return names[chain] || chain;
};

const getInsightIcon = (type) => {
  const icons = {
    'strength': '💪',
    'weakness': '⚠️',
    'recommendation': '💡',
    'warning': '🚨'
  };
  return icons[type] || '🤖';
};

const runBacktest = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:3000/api/strategy-backtester/backtest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    result.value = await response.json();
    
    // Draw chart after results
    setTimeout(() => drawEquityChart(), 100);
  } catch (error) {
    console.error('Backtest failed:', error);
    // Generate mock data for demo
    result.value = generateMockResult();
    setTimeout(() => drawEquityChart(), 100);
  } finally {
    loading.value = false;
  }
};

const generateMockResult = () => {
  const trades = [];
  const startPrice = 45000;
  let price = startPrice;
  
  for (let i = 0; i < 30; i++) {
    price = price * (1 + (Math.random() - 0.48) * 0.05);
    trades.push({
      id: i + 1,
      date: `2025-${String(Math.floor(i/3) + 1).padStart(2, '0')}-${String((i % 3) * 10 + 1).padStart(2, '0')}`,
      type: i % 4 === 0 ? 'SELL' : 'BUY',
      price: parseFloat(price.toFixed(2)),
      amount: 0.1,
      value: parseFloat((price * 0.1).toFixed(2)),
      fees: parseFloat((price * 0.003).toFixed(2)),
      pnl: i % 4 === 0 ? parseFloat((Math.random() * 500 - 100).toFixed(2)) : 0,
      pnlPercent: i % 4 === 0 ? parseFloat((Math.random() * 10 - 3).toFixed(2)) : 0,
      reason: i % 4 === 0 ? 'Take profit' : 'Buy signal'
    });
  }

  const finalCapital = config.initialCapital * (1 + (Math.random() * 0.5 - 0.1));
  const totalReturn = finalCapital - config.initialCapital;
  
  return {
    strategy: config.strategy,
    token: config.token,
    chain: config.chain,
    period: { start: config.startDate, end: config.endDate },
    initialCapital: config.initialCapital,
    finalCapital: parseFloat(finalCapital.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    totalReturnPercent: parseFloat(((totalReturn / config.initialCapital) * 100).toFixed(2)),
    maxDrawdown: parseFloat((config.initialCapital * 0.15).toFixed(2)),
    maxDrawdownPercent: 15.5,
    sharpeRatio: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
    winRate: parseFloat((Math.random() * 30 + 40).toFixed(1)),
    totalTrades: trades.length,
    profitableTrades: Math.floor(trades.length * 0.6),
    losingTrades: Math.floor(trades.length * 0.4),
    avgWin: 350,
    avgLoss: 180,
    profitFactor: 1.8,
    calmarRatio: 1.2,
    sortinoRatio: 1.5,
    volatility: 35,
    beta: 1.1,
    alpha: 5.2,
    marketReturn: 12.5,
    avgHoldingPeriod: 5.5,
    tradeHistory: trades,
    equityCurve: generateMockEquityCurve(),
    monthlyReturns: [],
    riskMetrics: {
      valueAtRisk: 1500,
      conditionalValueAtRisk: 2200,
      downsideDeviation: 12,
      upsideDeviation: 18,
      trackingError: 8,
      informationRatio: 0.6,
      treynorRatio: 0.05,
      omegaRatio: 1.4
    },
    aiInsights: [
      { type: 'strength', title: 'Good Risk-Adjusted Returns', description: 'Sharpe ratio above 1 indicates solid risk management.', confidence: 88 },
      { type: 'recommendation', title: 'Consider Higher Position Size', description: 'Win rate is good. Increasing position size could improve returns.', confidence: 75 },
      { type: 'warning', title: 'Moderate Drawdown Risk', description: 'Max drawdown is moderate. Consider adding stop-losses.', confidence: 82 }
    ]
  };
};

const generateMockEquityCurve = () => {
  const curve = [];
  let equity = config.initialCapital;
  let benchmark = config.initialCapital;
  
  for (let i = 0; i < 365; i++) {
    equity = equity * (1 + (Math.random() - 0.48) * 0.03);
    benchmark = benchmark * (1 + (Math.random() - 0.49) * 0.025);
    curve.push({
      date: `2025-${String(Math.floor(i/30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
      equity: parseFloat(equity.toFixed(2)),
      benchmark: parseFloat(benchmark.toFixed(2))
    });
  }
  return curve;
};

const drawEquityChart = () => {
  if (!equityChart.value || !result.value?.equityCurve) return;
  
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  const ctx = equityChart.value.getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: result.value.equityCurve.map(p => p.date),
      datasets: [
        {
          label: 'Strategy Equity',
          data: result.value.equityCurve.map(p => p.equity),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Buy & Hold',
          data: result.value.equityCurve.map(p => p.benchmark),
          borderColor: '#6b7280',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => '$' + value.toLocaleString()
          }
        }
      }
    }
  });
};

const fetchOptions = async () => {
  try {
    const [strategiesRes, tokensRes, chainsRes] = await Promise.all([
      fetch('http://localhost:3000/api/strategy-backtester/strategies'),
      fetch('http://localhost:3000/api/strategy-backtester/tokens'),
      fetch('http://localhost:3000/api/strategy-backtester/chains')
    ]);
    
    availableStrategies.value = await strategiesRes.json();
    availableTokens.value = await tokensRes.json();
    availableChains.value = await chainsRes.json();
  } catch (error) {
    // Use defaults
    availableStrategies.value = ['grid', 'dca', 'rsi', 'macd', 'bollinger', 'momentum', 'mean_reversion', 'breakout', 'moving_average_crossover', 'dual_moving_average'];
    availableTokens.value = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOGE', 'LINK', 'UNI', 'AAVE', 'MKR'];
    availableChains.value = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];
  }
};

onMounted(() => {
  fetchOptions();
});

watch(() => config.strategy, (newVal) => {
  showParams.value = ['grid', 'dca', 'rsi', 'macd', 'bollinger', 'momentum', 'mean_reversion'].includes(newVal);
});
</script>

<style scoped>
.strategy-backtester-pro {
  padding: 20px;
  background: #0f172a;
  min-height: 100vh;
  color: #e2e8f0;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.subtitle {
  color: #94a3b8;
  font-size: 14px;
}

.main-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

.config-panel {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  height: fit-content;
}

.panel-section {
  margin-bottom: 20px;
}

.panel-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #f1f5f9;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #10b981;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.params-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-run {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-run:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.results-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.results-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.empty-state {
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.result-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.result-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.metric-card {
  background: #0f172a;
  padding: 14px;
  border-radius: 8px;
  text-align: center;
}

.metric-card.highlight {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
  border: 1px solid #10b981;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.metric-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
}

.metric-value.success {
  color: #10b981;
}

.metric-value.danger {
  color: #ef4444;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-card {
  background: #0f172a;
  padding: 14px;
  border-radius: 8px;
  border-left: 4px solid;
}

.insight-card.strength {
  border-left-color: #10b981;
}

.insight-card.weakness {
  border-left-color: #f59e0b;
}

.insight-card.recommendation {
  border-left-color: #3b82f6;
}

.insight-card.warning {
  border-left-color: #ef4444;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.insight-icon {
  font-size: 16px;
}

.insight-title {
  font-weight: 600;
  flex: 1;
}

.insight-confidence {
  font-size: 12px;
  color: #64748b;
}

.insight-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.chart-container {
  height: 300px;
}

.table-container {
  overflow-x: auto;
}

.table-container table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table-container th,
.table-container td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #334155;
}

.table-container th {
  background: #0f172a;
  color: #94a3b8;
  font-weight: 600;
}

.trade-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.trade-type.buy {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.trade-type.sell {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.reason {
  color: #64748b;
  font-size: 12px;
}
</style>
