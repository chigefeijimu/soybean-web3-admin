<template>
  <div class="defi-simulator">
    <div class="header">
      <h2>🔄 DeFi Protocol Interaction Simulator</h2>
      <p>Simulate DeFi transactions before execution - estimate gas, slippage, and outcomes</p>
    </div>

    <!-- Protocol Selection -->
    <div class="card">
      <h3>Select Protocol Action</h3>
      <div class="action-tabs">
        <button 
          v-for="action in actions" 
          :key="action.type"
          :class="['tab-btn', { active: selectedAction === action.type }]"
          @click="selectedAction = action.type"
        >
          {{ action.icon }} {{ action.label }}
        </button>
      </div>
    </div>

    <!-- Swap Simulation -->
    <div v-if="selectedAction === 'swap'" class="card">
      <h3>Swap Simulation</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Protocol</label>
          <select v-model="swapForm.protocol">
            <option value="Uniswap">Uniswap</option>
            <option value="SushiSwap">SushiSwap</option>
            <option value="Curve">Curve</option>
          </select>
        </div>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="swapForm.chain">
            <option value="ethereum">Ethereum</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="polygon">Polygon</option>
          </select>
        </div>
        <div class="form-group">
          <label>From Token</label>
          <input v-model="swapForm.fromToken" placeholder="e.g., ETH" />
        </div>
        <div class="form-group">
          <label>To Token</label>
          <input v-model="swapForm.toToken" placeholder="e.g., USDC" />
        </div>
        <div class="form-group full-width">
          <label>Amount</label>
          <input v-model="swapForm.amount" type="number" placeholder="0.00" />
        </div>
      </div>
      <button class="btn-primary" @click="simulateSwap" :disabled="loading">
        {{ loading ? 'Simulating...' : 'Simulate Swap' }}
      </button>
    </div>

    <!-- Add Liquidity Simulation -->
    <div v-if="selectedAction === 'liquidity'" class="card">
      <h3>Add Liquidity Simulation</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Protocol</label>
          <select v-model="liquidityForm.protocol">
            <option value="Uniswap">Uniswap</option>
            <option value="SushiSwap">SushiSwap</option>
            <option value="Curve">Curve</option>
          </select>
        </div>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="liquidityForm.chain">
            <option value="ethereum">Ethereum</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="polygon">Polygon</option>
          </select>
        </div>
        <div class="form-group">
          <label>Token A</label>
          <input v-model="liquidityForm.tokenA" placeholder="e.g., ETH" />
        </div>
        <div class="form-group">
          <label>Token B</label>
          <input v-model="liquidityForm.tokenB" placeholder="e.g., USDC" />
        </div>
        <div class="form-group">
          <label>Amount A</label>
          <input v-model="liquidityForm.amountA" type="number" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label>Amount B</label>
          <input v-model="liquidityForm.amountB" type="number" placeholder="0.00" />
        </div>
      </div>
      <button class="btn-primary" @click="simulateAddLiquidity" :disabled="loading">
        {{ loading ? 'Simulating...' : 'Simulate Add Liquidity' }}
      </button>
    </div>

    <!-- Lending Simulation -->
    <div v-if="selectedAction === 'lending'" class="card">
      <h3>Lending Protocol Simulation</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Protocol</label>
          <select v-model="lendingForm.protocol">
            <option value="Aave">Aave</option>
            <option value="Compound">Compound</option>
            <option value="Morpho">Morpho</option>
          </select>
        </div>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="lendingForm.chain">
            <option value="ethereum">Ethereum</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="polygon">Polygon</option>
          </select>
        </div>
        <div class="form-group">
          <label>Action</label>
          <select v-model="lendingForm.action">
            <option value="deposit">Deposit</option>
            <option value="borrow">Borrow</option>
            <option value="withdraw">Withdraw</option>
            <option value="repay">Repay</option>
          </select>
        </div>
        <div class="form-group">
          <label>Token</label>
          <input v-model="lendingForm.token" placeholder="e.g., ETH" />
        </div>
        <div class="form-group full-width">
          <label>Amount</label>
          <input v-model="lendingForm.amount" type="number" placeholder="0.00" />
        </div>
      </div>
      <button class="btn-primary" @click="simulateLending" :disabled="loading">
        {{ loading ? 'Simulating...' : 'Simulate Lending' }}
      </button>
    </div>

    <!-- Staking Simulation -->
    <div v-if="selectedAction === 'staking'" class="card">
      <h3>Staking Simulation</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Protocol</label>
          <select v-model="stakingForm.protocol">
            <option value="Lido">Lido</option>
            <option value="Rocket Pool">Rocket Pool</option>
            <option value="Uniswap">Uniswap (LP)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="stakingForm.chain">
            <option value="ethereum">Ethereum</option>
          </select>
        </div>
        <div class="form-group">
          <label>Token</label>
          <input v-model="stakingForm.token" placeholder="e.g., ETH" />
        </div>
        <div class="form-group">
          <label>Amount</label>
          <input v-model="stakingForm.amount" type="number" placeholder="0.00" />
        </div>
      </div>
      <button class="btn-primary" @click="simulateStake" :disabled="loading">
        {{ loading ? 'Simulating...' : 'Simulate Stake' }}
      </button>
    </div>

    <!-- Results -->
    <div v-if="result" class="card result-card">
      <h3>📊 Simulation Results</h3>
      
      <div v-if="result.simulation" class="result-section">
        <h4>Transaction Details</h4>
        <div class="result-grid">
          <div v-if="result.simulation.input" class="result-item">
            <span class="label">Input:</span>
            <span class="value">{{ result.simulation.input.amount }} {{ result.simulation.input.token }}</span>
            <span class="usd">≈ ${{ result.simulation.input.amountUSD }}</span>
          </div>
          <div v-if="result.simulation.output" class="result-item">
            <span class="label">Output:</span>
            <span class="value">{{ result.simulation.output.amount }} {{ result.simulation.output.token }}</span>
            <span class="usd">≈ ${{ result.simulation.output.amountUSD }}</span>
          </div>
          <div v-if="result.simulation.rate" class="result-item">
            <span class="label">Rate:</span>
            <span class="value">{{ result.simulation.rate }}</span>
          </div>
          <div v-if="result.simulation.priceImpact" class="result-item">
            <span class="label">Price Impact:</span>
            <span class="value warning">{{ result.simulation.priceImpact }}</span>
          </div>
          <div v-if="result.simulation.lpTokens" class="result-item">
            <span class="label">LP Tokens:</span>
            <span class="value">{{ result.simulation.lpTokens }}</span>
          </div>
          <div v-if="result.simulation.shareOfPool" class="result-item">
            <span class="label">Pool Share:</span>
            <span class="value">{{ result.simulation.shareOfPool }}</span>
          </div>
          <div v-if="result.simulation.apy" class="result-item">
            <span class="label">APY:</span>
            <span class="value success">{{ result.simulation.apy }}</span>
          </div>
        </div>
      </div>

      <div v-if="result.result" class="result-section">
        <h4>Action Results</h4>
        <div class="result-grid">
          <template v-for="(value, key) in result.result" :key="key">
            <div class="result-item">
              <span class="label">{{ formatKey(key) }}:</span>
              <span class="value">{{ value }}</span>
            </div>
          </template>
        </div>
      </div>

      <div v-if="result.gas" class="result-section">
        <h4>Gas Estimation</h4>
        <div class="result-grid">
          <div class="result-item">
            <span class="label">Gas Limit:</span>
            <span class="value">{{ result.gas.estimatedGas.toLocaleString() }}</span>
          </div>
          <div class="result-item">
            <span class="label">Gas Price:</span>
            <span class="value">{{ result.gas.gasPrice }} ETH</span>
          </div>
          <div class="result-item">
            <span class="label">Gas Cost:</span>
            <span class="value">{{ result.gas.gasCost }} ETH</span>
          </div>
          <div class="result-item">
            <span class="label">Gas Cost USD:</span>
            <span class="value">${{ result.gas.gasCostUSD }}</span>
          </div>
        </div>
      </div>

      <div v-if="result.warnings && result.warnings.length" class="result-section warnings">
        <h4>⚠️ Warnings</h4>
        <ul>
          <li v-for="(warning, i) in result.warnings" :key="i">{{ warning }}</li>
        </ul>
      </div>

      <div v-if="result.risks" class="result-section risks">
        <h4>🚨 Risks</h4>
        <ul>
          <li v-for="(risk, i) in result.risks" :key="i">{{ risk }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const result = ref(null);
const selectedAction = ref('swap');

const actions = [
  { type: 'swap', label: 'Swap', icon: '🔄' },
  { type: 'liquidity', label: 'Add Liquidity', icon: '💧' },
  { type: 'lending', label: 'Lending', icon: '🏦' },
  { type: 'staking', label: 'Staking', icon: '🔒' },
];

const swapForm = reactive({
  protocol: 'Uniswap',
  chain: 'ethereum',
  fromToken: 'ETH',
  toToken: 'USDC',
  amount: '1',
});

const liquidityForm = reactive({
  protocol: 'Uniswap',
  chain: 'ethereum',
  tokenA: 'ETH',
  tokenB: 'USDC',
  amountA: '1',
  amountB: '1800',
});

const lendingForm = reactive({
  protocol: 'Aave',
  chain: 'ethereum',
  action: 'deposit',
  token: 'ETH',
  amount: '1',
});

const stakingForm = reactive({
  protocol: 'Lido',
  chain: 'ethereum',
  token: 'ETH',
  amount: '1',
});

const simulateSwap = async () => {
  if (!swapForm.amount || !swapForm.fromToken || !swapForm.toToken) {
    message.error('Please fill in all fields');
    return;
  }
  loading.value = true;
  try {
    const res = await fetch('/api/defi-simulator/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapForm),
    });
    result.value = await res.json();
    message.success('Simulation complete');
  } catch (e) {
    message.error('Simulation failed');
  }
  loading.value = false;
};

const simulateAddLiquidity = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/defi-simulator/add-liquidity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(liquidityForm),
    });
    result.value = await res.json();
    message.success('Simulation complete');
  } catch (e) {
    message.error('Simulation failed');
  }
  loading.value = false;
};

const simulateLending = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/defi-simulator/lending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lendingForm),
    });
    result.value = await res.json();
    message.success('Simulation complete');
  } catch (e) {
    message.error('Simulation failed');
  }
  loading.value = false;
};

const simulateStake = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/defi-simulator/stake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stakingForm),
    });
    result.value = await res.json();
    message.success('Simulation complete');
  } catch (e) {
    message.error('Simulation failed');
  }
  loading.value = false;
};

const formatKey = (key) => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};
</script>

<style scoped>
.defi-simulator {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  color: #1890ff;
}

.header p {
  color: #666;
  margin-top: 4px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card h3 {
  margin: 0 0 16px;
  color: #333;
}

.card h4 {
  margin: 16px 0 12px;
  color: #555;
  font-size: 14px;
}

.action-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.tab-btn.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1890ff;
}

.btn-primary {
  margin-top: 16px;
  padding: 10px 24px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result-card {
  background: #fafafa;
}

.result-section {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.result-section:last-child {
  border-bottom: none;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.result-item {
  display: flex;
  flex-direction: column;
}

.result-item .label {
  font-size: 12px;
  color: #888;
}

.result-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.result-item .value.success {
  color: #52c41a;
}

.result-item .value.warning {
  color: #faad14;
}

.result-item .usd {
  font-size: 12px;
  color: #888;
}

.warnings, .risks {
  color: #d9363e;
}

.warnings ul, .risks ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

.warnings li, .risks li {
  font-size: 13px;
  margin-bottom: 4px;
}
</style>
