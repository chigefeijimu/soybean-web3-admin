<template>
  <div class="intent-solver">
    <div class="header">
      <h2>🎯 Intent Solver</h2>
      <div class="header-actions">
        <button @click="refreshData" :disabled="loading" class="btn-secondary">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- Create Intent Form -->
    <div class="section create-intent">
      <h3>Create New Intent</h3>
      <div class="intent-form">
        <div class="form-row">
          <div class="form-group">
            <label>Intent Type</label>
            <select v-model="newIntent.type" class="form-select">
              <option value="swap">Swap</option>
              <option value="bridge">Bridge</option>
              <option value="cross_chain_swap">Cross-Chain Swap</option>
              <option value="limit_order">Limit Order</option>
              <option value="aggregate">Aggregate</option>
            </select>
          </div>
          <div class="form-group">
            <label>Your Address</label>
            <input v-model="newIntent.user" placeholder="0x..." class="form-input" />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>From Chain</label>
            <select v-model="newIntent.fromChain" @change="loadTokens('from')" class="form-select">
              <option v-for="chain in supportedChains" :key="chain" :value="chain">{{ chain }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>To Chain</label>
            <select v-model="newIntent.toChain" :disabled="newIntent.type === 'swap'" class="form-select">
              <option value="">Same as From</option>
              <option v-for="chain in supportedChains" :key="chain" :value="chain">{{ chain }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>From Token</label>
            <select v-model="newIntent.fromToken" class="form-select">
              <option v-for="token in fromTokens" :key="token.symbol" :value="token.symbol">
                {{ token.symbol }} - {{ token.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>To Token</label>
            <select v-model="newIntent.toToken" class="form-select">
              <option v-for="token in toTokens" :key="token.symbol" :value="token.symbol">
                {{ token.symbol }} - {{ token.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Amount</label>
            <input v-model="newIntent.amount" type="number" placeholder="0.0" class="form-input" />
          </div>
          <div class="form-group">
            <label>Max Slippage (%)</label>
            <input v-model="newIntent.maxSlippage" type="number" placeholder="1.0" step="0.1" class="form-input" />
          </div>
        </div>

        <button @click="submitIntent" :disabled="!canSubmit || submitting" class="btn-primary submit-btn">
          {{ submitting ? 'Submitting...' : '🚀 Submit Intent' }}
        </button>
      </div>
    </div>

    <!-- Current Intent & Solutions -->
    <div v-if="currentIntent" class="section intent-status">
      <h3>📋 Intent Status: {{ currentIntent.id }}</h3>
      <div class="status-card">
        <div class="status-row">
          <span class="status-label">Status:</span>
          <span class="status-value" :class="currentIntent.status">{{ currentIntent.status }}</span>
        </div>
        <div class="status-row">
          <span class="status-label">Type:</span>
          <span class="status-value">{{ currentIntent.type }}</span>
        </div>
        <div class="status-row">
          <span class="status-label">From:</span>
          <span class="status-value">{{ currentIntent.amount }} {{ currentIntent.fromToken }} on {{ currentIntent.fromChain }}</span>
        </div>
        <div v-if="currentIntent.toChain" class="status-row">
          <span class="status-label">To:</span>
          <span class="status-value">{{ currentIntent.toChain }}</span>
        </div>
        <div class="status-row">
          <span class="status-label">Created:</span>
          <span class="status-value">{{ formatTime(currentIntent.createdAt) }}</span>
        </div>
      </div>

      <!-- Solutions -->
      <div v-if="solution" class="solutions-section">
        <h4>💡 Solver Quotes</h4>
        <div class="solution-header">
          <span class="best-badge" v-if="solution.recommendedSolver">Best: {{ solution.recommendedSolver }}</span>
          <span class="savings-badge" v-if="solution.savingsPercent > 0">
            Save {{ solution.savingsPercent.toFixed(2) }}% vs worst quote
          </span>
        </div>
        
        <div class="quotes-list">
          <div v-for="quote in solution.quotes" :key="quote.solver" 
               class="quote-card" :class="{ best: quote.solver === solution.recommendedSolver }">
            <div class="quote-solver">
              <span class="solver-name">{{ quote.solver }}</span>
              <span v-if="quote.solver === solution.recommendedSolver" class="best-indicator">⭐ Best</span>
            </div>
            <div class="quote-details">
              <div class="quote-row">
                <span>Output:</span>
                <span class="output-amount">{{ quote.outputAmount }} {{ currentIntent.toToken }}</span>
              </div>
              <div class="quote-row">
                <span>USD Value:</span>
                <span>${{ formatNumber(quote.outputAmountUSD) }}</span>
              </div>
              <div class="quote-row">
                <span>Gas Estimate:</span>
                <span>{{ quote.gasEstimate }} ETH</span>
              </div>
              <div class="quote-row">
                <span>Est. Time:</span>
                <span>{{ quote.estimatedTime }}s</span>
              </div>
              <div class="quote-row">
                <span>Confidence:</span>
                <span>{{ (quote.confidence * 100).toFixed(0) }}%</span>
              </div>
            </div>
            <button @click="executeWithSolver(quote.solver)" 
                    :disabled="currentIntent.status !== 'solved'" 
                    class="btn-execute">
              Execute
            </button>
          </div>
        </div>

        <!-- Execution Steps -->
        <div v-if="executionSteps.length" class="execution-steps">
          <h4>📝 Execution Steps</h4>
          <div class="steps-timeline">
            <div v-for="(step, index) in executionSteps" :key="index" class="step-item">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <span class="step-action">{{ step.action }}</span>
                <span class="step-protocol">{{ step.protocol }}</span>
                <span class="step-tokens">{{ step.fromToken }} → {{ step.toToken }}</span>
                <span class="step-gas">Gas: {{ step.gasEstimate }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Execution Result -->
        <div v-if="executionResult" class="execution-result">
          <h4>✅ Execution Result</h4>
          <div class="result-card">
            <p>Transaction Submitted!</p>
            <a :href="`https://etherscan.io/tx/${executionResult.txHash}`" target="_blank" class="tx-link">
              {{ executionResult.txHash.substring(0, 20) }}...
            </a>
            <span class="result-status">{{ executionResult.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="section stats-section">
      <h3>📊 Solver Statistics</h3>
      <div v-if="stats" class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalIntents }}</span>
          <span class="stat-label">Total Intents</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.solvedIntents }}</span>
          <span class="stat-label">Solved</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.completedIntents }}</span>
          <span class="stat-label">Completed</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.avgSolveTime }}s</span>
          <span class="stat-label">Avg Solve Time</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.avgSlippage }}%</span>
          <span class="stat-label">Avg Slippage</span>
        </div>
      </div>

      <div v-if="stats && stats.topSolvers.length" class="top-solvers">
        <h4>🏆 Top Solvers</h4>
        <div class="solver-ranking">
          <div v-for="(solver, index) in stats.topSolvers" :key="solver.solver" class="solver-item">
            <span class="rank">#{{ index + 1 }}</span>
            <span class="solver-name">{{ solver.solver }}</span>
            <span class="solver-count">{{ solver.count }} intents</span>
            <span class="solver-volume">${{ formatNumber(solver.volume) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Supported Chains & Tokens -->
    <div class="section info-section">
      <div class="info-grid">
        <div class="info-card">
          <h4>🌐 Supported Chains</h4>
          <div class="chain-tags">
            <span v-for="chain in supportedChains" :key="chain" class="chain-tag">{{ chain }}</span>
          </div>
        </div>
        <div class="info-card">
          <h4>🤖 Supported Solvers</h4>
          <div class="solver-tags">
            <span class="solver-tag">UniswapX</span>
            <span class="solver-tag">Across</span>
            <span class="solver-tag">CoW Swap</span>
            <span class="solver-tag">1inch</span>
            <span class="solver-tag">Paraswap</span>
            <span class="solver-tag">Odos</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const API_BASE = 'http://localhost:3019/api/v1/intent-solver';

export default {
  name: 'IntentSolver',
  setup() {
    const loading = ref(false);
    const submitting = ref(false);
    const supportedChains = ref([]);
    const fromTokens = ref([]);
    const toTokens = ref([]);
    const stats = ref(null);
    const currentIntent = ref(null);
    const solution = ref(null);
    const executionResult = ref(null);
    const executionSteps = ref([]);

    const newIntent = ref({
      user: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fE5b',
      type: 'swap',
      fromChain: 'Ethereum',
      toChain: '',
      fromToken: 'ETH',
      toToken: 'USDC',
      amount: '1',
      maxSlippage: '1.0',
    });

    const canSubmit = computed(() => {
      return newIntent.value.user && 
             newIntent.value.fromChain && 
             newIntent.value.fromToken && 
             newIntent.value.toToken && 
             parseFloat(newIntent.value.amount) > 0;
    });

    const loadSupportedData = async () => {
      try {
        const [chainsRes, tokensRes, statsRes] = await Promise.all([
          axios.get(`${API_BASE}/chains`),
          axios.get(`${API_BASE}/tokens?chain=Ethereum`),
          axios.get(`${API_BASE}/stats`).catch(() => ({ data: null })),
        ]);
        
        supportedChains.value = chainsRes.data;
        fromTokens.value = tokensRes.data;
        toTokens.value = tokensRes.data;
        stats.value = statsRes.data;
      } catch (error) {
        console.error('Failed to load supported data:', error);
        // Use fallback data
        supportedChains.value = ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'BSC', 'Base', 'Avalanche'];
        fromTokens.value = [
          { symbol: 'ETH', name: 'Ethereum' },
          { symbol: 'USDC', name: 'USD Coin' },
          { symbol: 'USDT', name: 'Tether' },
          { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
          { symbol: 'DAI', name: 'Dai Stablecoin' },
        ];
        toTokens.value = fromTokens.value;
      }
    };

    const loadTokens = async (type) => {
      const chain = type === 'from' ? newIntent.value.fromChain : newIntent.value.toChain || newIntent.value.fromChain;
      try {
        const res = await axios.get(`${API_BASE}/tokens?chain=${chain}`);
        if (type === 'from') {
          fromTokens.value = res.data;
        } else {
          toTokens.value = res.data;
        }
      } catch (error) {
        console.error('Failed to load tokens:', error);
      }
    };

    const submitIntent = async () => {
      submitting.value = true;
      try {
        const res = await axios.post(`${API_BASE}/intents`, {
          user: newIntent.value.user,
          type: newIntent.value.type,
          fromChain: newIntent.value.fromChain,
          toChain: newIntent.value.toChain || undefined,
          fromToken: newIntent.value.fromToken,
          toToken: newIntent.value.toToken,
          amount: newIntent.value.amount,
          maxSlippage: parseFloat(newIntent.value.maxSlippage),
        });

        currentIntent.value = res.data;
        
        // Poll for solution
        const pollInterval = setInterval(async () => {
          try {
            const solutionRes = await axios.get(`${API_BASE}/intents/${res.data.id}/solution`);
            if (solutionRes.data && solutionRes.data.quotes) {
              solution.value = solutionRes.data;
              executionSteps.value = solutionRes.data.executionSteps || [];
              clearInterval(pollInterval);
            }
          } catch (e) {
            // Keep polling
          }
        }, 1000);

        // Stop polling after 30 seconds
        setTimeout(() => clearInterval(pollInterval), 30000);
      } catch (error) {
        console.error('Failed to submit intent:', error);
        alert('Failed to submit intent. Please try again.');
      } finally {
        submitting.value = false;
      }
    };

    const executeWithSolver = async (solver) => {
      if (!currentIntent.value) return;
      
      try {
        const res = await axios.post(`${API_BASE}/intents/${currentIntent.value.id}/execute`, {
          solver,
        });
        executionResult.value = res.data;
        currentIntent.value.status = 'executing';
      } catch (error) {
        console.error('Failed to execute:', error);
        alert('Failed to execute. Please try again.');
      }
    };

    const refreshData = async () => {
      loading.value = true;
      await loadSupportedData();
      loading.value = false;
    };

    const formatNumber = (num) => {
      if (!num) return '0';
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
    };

    const formatTime = (time) => {
      return new Date(time).toLocaleString();
    };

    onMounted(() => {
      loadSupportedData();
    });

    return {
      loading,
      submitting,
      supportedChains,
      fromTokens,
      toTokens,
      stats,
      currentIntent,
      solution,
      executionResult,
      executionSteps,
      newIntent,
      canSubmit,
      loadTokens,
      submitIntent,
      executeWithSolver,
      refreshData,
      formatNumber,
      formatTime,
    };
  },
};
</script>

<style scoped>
.intent-solver {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  font-size: 28px;
  color: #1a1a2e;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
}

.intent-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.form-input, .form-select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #4f46e5;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-primary:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  border: 1px solid #ddd;
  color: #555;
}

.submit-btn {
  margin-top: 8px;
}

.status-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.status-row:last-child {
  border-bottom: none;
}

.status-label {
  font-weight: 500;
  color: #666;
}

.status-value {
  font-weight: 600;
}

.status-value.pending { color: #f59e0b; }
.status-value.solving { color: #3b82f6; }
.status-value.solved { color: #10b981; }
.status-value.executing { color: #8b5cf6; }
.status-value.completed { color: #059669; }
.status-value.failed { color: #ef4444; }

.solutions-section {
  margin-top: 20px;
}

.solution-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.best-badge, .savings-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.best-badge {
  background: #dbeafe;
  color: #1d4ed8;
}

.savings-badge {
  background: #d1fae5;
  color: #047857;
}

.quotes-list {
  display: grid;
  gap: 12px;
}

.quote-card {
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.quote-card.best {
  border-color: #10b981;
  background: #ecfdf5;
}

.quote-solver {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.solver-name {
  font-weight: 600;
  font-size: 15px;
  text-transform: capitalize;
}

.best-indicator {
  color: #10b981;
  font-size: 12px;
  font-weight: 500;
}

.quote-details {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin: 0 20px;
}

.quote-row {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.quote-row span:first-child {
  color: #666;
}

.output-amount {
  font-weight: 600;
  color: #10b981;
}

.btn-execute {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-execute:hover:not(:disabled) {
  background: #4338ca;
}

.btn-execute:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.execution-steps {
  margin-top: 24px;
}

.steps-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-number {
  width: 28px;
  height: 28px;
  background: #4f46e5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
}

.step-content {
  flex: 1;
  display: flex;
  gap: 16px;
  font-size: 13px;
}

.step-action {
  font-weight: 600;
  text-transform: capitalize;
}

.step-protocol {
  color: #4f46e5;
}

.step-tokens {
  color: #666;
}

.execution-result {
  margin-top: 24px;
}

.result-card {
  background: #ecfdf5;
  border: 1px solid #10b981;
  border-radius: 8px;
  padding: 16px;
}

.tx-link {
  color: #4f46e5;
  text-decoration: none;
  font-family: monospace;
}

.result-status {
  display: block;
  margin-top: 8px;
  color: #10b981;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #4f46e5;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.top-solvers {
  margin-top: 20px;
}

.solver-ranking {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.solver-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.rank {
  font-weight: 700;
  color: #4f46e5;
  min-width: 30px;
}

.solver-name {
  flex: 1;
  font-weight: 500;
}

.solver-count, .solver-volume {
  font-size: 13px;
  color: #666;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-card h4 {
  font-size: 14px;
  margin-bottom: 12px;
  color: #333;
}

.chain-tags, .solver-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chain-tag, .solver-tag {
  padding: 4px 10px;
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 12px;
  font-size: 12px;
}
</style>
