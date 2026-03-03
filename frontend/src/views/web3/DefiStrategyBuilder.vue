<template>
  <div class="defi-strategy-builder">
    <div class="header">
      <h1>🎯 DeFi Strategy Builder</h1>
      <p class="subtitle">Create, test, and manage your DeFi strategies</p>
    </div>

    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- Strategies List Tab -->
    <div v-if="activeTab === 'strategies'" class="tab-content">
      <div class="section-header">
        <h2>My Strategies</h2>
        <button class="btn-primary" @click="showCreateModal = true">
          + New Strategy
        </button>
      </div>

      <div class="strategies-grid">
        <div v-for="strategy in strategies" :key="strategy.id" class="strategy-card">
          <div class="strategy-header">
            <span :class="['risk-badge', strategy.riskLevel]">
              {{ strategy.riskLevel.toUpperCase() }}
            </span>
            <span class="chain-tags">
              <span v-for="chain in strategy.chains" :key="chain" class="chain-tag">
                {{ chain }}
              </span>
            </span>
          </div>
          <h3>{{ strategy.name }}</h3>
          <p class="description">{{ strategy.description }}</p>
          
          <div class="strategy-stats">
            <div class="stat">
              <span class="label">Expected APY</span>
              <span class="value success">{{ strategy.expectedApy }}%</span>
            </div>
            <div class="stat">
              <span class="label">Protocols</span>
              <span class="value">{{ strategy.protocols.length }}</span>
            </div>
            <div class="stat">
              <span class="label">Status</span>
              <span :class="['value', strategy.isActive ? 'success' : 'muted']">
                {{ strategy.isActive ? 'Active' : 'Paused' }}
              </span>
            </div>
          </div>

          <div class="strategy-actions">
            <button class="btn-secondary" @click="runBacktest(strategy)">
              📊 Backtest
            </button>
            <button class="btn-secondary" @click="analyzeRisk(strategy)">
              ⚠️ Risk Analysis
            </button>
            <button class="btn-danger" @click="deleteStrategy(strategy.id)">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div v-if="strategies.length === 0" class="empty-state">
        <p>No strategies yet. Create your first DeFi strategy!</p>
      </div>
    </div>

    <!-- Templates Tab -->
    <div v-if="activeTab === 'templates'" class="tab-content">
      <h2>Strategy Templates</h2>
      <p class="section-desc">Start with a proven strategy template</p>

      <div class="templates-grid">
        <div 
          v-for="template in templates" 
          :key="template.id" 
          class="template-card"
          @click="createFromTemplate(template)"
        >
          <div class="template-icon">{{ template.icon }}</div>
          <h3>{{ template.name }}</h3>
          <p>{{ template.description }}</p>
          <div class="template-meta">
            <span :class="['risk-tag', template.riskLevel]">{{ template.riskLevel }} risk</span>
            <span class="complexity">{{ template.complexity }} complexity</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Backtest Tab -->
    <div v-if="activeTab === 'backtest'" class="tab-content">
      <h2>Strategy Backtest</h2>
      
      <div v-if="selectedStrategy" class="backtest-panel">
        <div class="backtest-header">
          <h3>{{ selectedStrategy.name }}</h3>
          <select v-model="backtestPeriod" class="period-select">
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="1y">1 Year</option>
          </select>
          <button class="btn-primary" @click="runBacktest(selectedStrategy)">
            Run Backtest
          </button>
        </div>

        <div v-if="backtestResult" class="backtest-results">
          <div class="metrics-grid">
            <div class="metric-card">
              <span class="metric-label">Total Return</span>
              <span :class="['metric-value', backtestResult.totalReturn >= 0 ? 'success' : 'danger']">
                {{ backtestResult.totalReturn }}%
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-label">APY</span>
              <span class="metric-value">{{ backtestResult.apy }}%</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Max Drawdown</span>
              <span class="metric-value danger">{{ backtestResult.maxDrawdown.toFixed(2) }}%</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Sharpe Ratio</span>
              <span class="metric-value">{{ backtestResult.sharpeRatio.toFixed(2) }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Win Rate</span>
              <span class="metric-value">{{ backtestResult.winRate.toFixed(1) }}%</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Total Trades</span>
              <span class="metric-value">{{ backtestResult.trades }}</span>
            </div>
          </div>

          <div class="chart-container">
            <h4>Performance Chart</h4>
            <div class="simple-chart">
              <div 
                v-for="(point, index) in backtestResult.dataPoints" 
                :key="index"
                class="chart-bar"
                :style="{ height: `${(point.value / maxValue) * 100}%` }"
                :title="`${point.date}: $${point.value}`"
              ></div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>Select a strategy and run backtest to see results</p>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>Please select a strategy from the Strategies tab first</p>
      </div>
    </div>

    <!-- Risk Analysis Tab -->
    <div v-if="activeTab === 'risk'" class="tab-content">
      <h2>Risk Analysis</h2>
      
      <div v-if="riskAnalysis" class="risk-panel">
        <div class="risk-score" :class="riskAnalysis.riskLevel">
          <div class="score-circle">
            <span class="score">{{ riskAnalysis.overallRiskScore }}</span>
            <span class="label">Risk Score</span>
          </div>
          <div class="risk-level">{{ riskAnalysis.riskLevel.toUpperCase() }} RISK</div>
        </div>

        <div class="risk-factors">
          <h3>Risk Factors</h3>
          <div v-for="factor in riskAnalysis.riskFactors" :key="factor.factor" class="risk-factor">
            <span class="factor-name">{{ factor.factor }}</span>
            <span :class="['factor-impact', factor.impact]">{{ factor.impact }} impact</span>
            <span class="factor-score">+{{ factor.score }}</span>
          </div>
        </div>

        <div class="recommendations">
          <h3>Recommendations</h3>
          <ul>
            <li v-for="rec in riskAnalysis.recommendations" :key="rec">{{ rec }}</li>
          </ul>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>Run risk analysis on a strategy to see results</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingStrategy ? 'Edit Strategy' : 'Create New Strategy' }}</h2>
          <button class="close-btn" @click="showCreateModal = false">×</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Strategy Name</label>
            <input v-model="formData.name" type="text" placeholder="My DeFi Strategy" />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="formData.description" placeholder="Describe your strategy..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Strategy Type</label>
              <select v-model="formData.type">
                <option value="yield_farming">Yield Farming</option>
                <option value="staking">Staking</option>
                <option value="lending">Lending</option>
                <option value="liquidity">Liquidity Provision</option>
                <option value="arbitrage">Arbitrage</option>
                <option value="rebalancing">Rebalancing</option>
              </select>
            </div>

            <div class="form-group">
              <label>Risk Level</label>
              <select v-model="formData.riskLevel">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Chains</label>
            <div class="checkbox-group">
              <label v-for="chain in availableChains" :key="chain">
                <input 
                  type="checkbox" 
                  :value="chain" 
                  v-model="formData.chains"
                />
                {{ chain }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Protocols</label>
            <div class="checkbox-group">
              <label v-for="protocol in availableProtocols" :key="protocol.name">
                <input 
                  type="checkbox" 
                  :value="protocol.name" 
                  v-model="formData.protocols"
                />
                {{ protocol.name }} ({{ protocol.chain }})
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Input Token</label>
              <input v-model="formData.parameters.inputToken" type="text" placeholder="ETH" />
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input v-model="formData.parameters.amount" type="number" placeholder="1" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Slippage Tolerance (%)</label>
              <input v-model="formData.parameters.slippageTolerance" type="number" step="0.1" />
            </div>
            <div class="form-group">
              <label>Frequency</label>
              <select v-model="formData.parameters.frequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Stop Loss (%)</label>
              <input v-model="formData.parameters.stopLoss" type="number" placeholder="Optional" />
            </div>
            <div class="form-group">
              <label>Take Profit (%)</label>
              <input v-model="formData.parameters.takeProfit" type="number" placeholder="Optional" />
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.parameters.autoCompound" />
              Auto-compound rewards
            </label>
          </div>

          <div class="form-group">
            <label>Expected APY (%)</label>
            <input v-model="formData.expectedApy" type="number" step="0.1" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="showCreateModal = false">Cancel</button>
          <button class="btn-primary" @click="saveStrategy">
            {{ editingStrategy ? 'Update' : 'Create' }} Strategy
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { defiStrategyBuilderApi } from '@/service/api';

const tabs = [
  { id: 'strategies', name: 'Strategies', icon: '📋' },
  { id: 'templates', name: 'Templates', icon: '📦' },
  { id: 'backtest', name: 'Backtest', icon: '📊' },
  { id: 'risk', name: 'Risk Analysis', icon: '⚠️' },
];

const activeTab = ref('strategies');
const strategies = ref<any[]>([]);
const templates = ref<any[]>([]);
const availableChains = ref<string[]>([]);
const availableProtocols = ref<any[]>([]);
const selectedStrategy = ref<any>(null);
const backtestPeriod = ref('30d');
const backtestResult = ref<any>(null);
const riskAnalysis = ref<any>(null);
const showCreateModal = ref(false);
const editingStrategy = ref<any>(null);

const formData = ref({
  name: '',
  description: '',
  type: 'yield_farming',
  riskLevel: 'medium',
  chains: [] as string[],
  protocols: [] as string[],
  expectedApy: 10,
  isActive: true,
  parameters: {
    inputToken: 'ETH',
    outputToken: '',
    amount: 1,
    slippageTolerance: 0.5,
    frequency: 'weekly',
    stopLoss: undefined as number | undefined,
    takeProfit: undefined as number | undefined,
    autoCompound: false,
  },
});

const maxValue = computed(() => {
  if (!backtestResult.value?.dataPoints) return 1;
  return Math.max(...backtestResult.value.dataPoints.map((p: any) => p.value));
});

async function loadData() {
  try {
    const [strategiesData, templatesData, chainsData, protocolsData] = await Promise.all([
      defiStrategyBuilderApi.getStrategies(),
      defiStrategyBuilderApi.getTemplates(),
      defiStrategyBuilderApi.getChains(),
      defiStrategyBuilderApi.getProtocols(),
    ]);
    strategies.value = strategiesData;
    templates.value = templatesData;
    availableChains.value = chainsData;
    availableProtocols.value = protocolsData;
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

async function saveStrategy() {
  try {
    if (editingStrategy.value) {
      await defiStrategyBuilderApi.updateStrategy(editingStrategy.value.id, formData.value);
    } else {
      await defiStrategyBuilderApi.createStrategy(formData.value);
    }
    showCreateModal.value = false;
    editingStrategy.value = null;
    resetForm();
    await loadData();
  } catch (error) {
    console.error('Failed to save strategy:', error);
  }
}

async function deleteStrategy(id: string) {
  if (!confirm('Are you sure you want to delete this strategy?')) return;
  try {
    await defiStrategyBuilderApi.deleteStrategy(id);
    await loadData();
  } catch (error) {
    console.error('Failed to delete strategy:', error);
  }
}

async function runBacktest(strategy: any) {
  selectedStrategy.value = strategy;
  activeTab.value = 'backtest';
  try {
    backtestResult.value = await defiStrategyBuilderApi.runBacktest(strategy.id, backtestPeriod.value);
  } catch (error) {
    console.error('Failed to run backtest:', error);
  }
}

async function analyzeRisk(strategy: any) {
  selectedStrategy.value = strategy;
  activeTab.value = 'risk';
  try {
    riskAnalysis.value = await defiStrategyBuilderApi.analyzeRisk(strategy.id);
  } catch (error) {
    console.error('Failed to analyze risk:', error);
  }
}

function createFromTemplate(template: any) {
  formData.value = {
    name: template.name,
    description: template.description,
    type: template.id.replace('template-', ''),
    riskLevel: template.riskLevel,
    chains: [],
    protocols: template.protocols || [],
    expectedApy: 15,
    isActive: true,
    parameters: {
      inputToken: 'ETH',
      outputToken: '',
      amount: 1,
      slippageTolerance: 0.5,
      frequency: 'weekly',
      stopLoss: undefined,
      takeProfit: undefined,
      autoCompound: false,
    },
  };
  showCreateModal.value = true;
}

function resetForm() {
  formData.value = {
    name: '',
    description: '',
    type: 'yield_farming',
    riskLevel: 'medium',
    chains: [],
    protocols: [],
    expectedApy: 10,
    isActive: true,
    parameters: {
      inputToken: 'ETH',
      outputToken: '',
      amount: 1,
      slippageTolerance: 0.5,
      frequency: 'weekly',
      stopLoss: undefined,
      takeProfit: undefined,
      autoCompound: false,
    },
  };
}

onMounted(loadData);
</script>

<style scoped>
.defi-strategy-builder {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.tab {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab.active {
  background: #2563eb;
  color: white;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.strategies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.strategy-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.strategy-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.strategy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.risk-badge.low { background: #dcfce7; color: #166534; }
.risk-badge.medium { background: #fef3c7; color: #92400e; }
.risk-badge.high { background: #fee2e2; color: #991b1b; }

.chain-tags {
  display: flex;
  gap: 4px;
}

.chain-tag {
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 11px;
  color: #6b7280;
}

.strategy-card h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.description {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.strategy-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat {
  text-align: center;
}

.stat .label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat .value {
  font-weight: 600;
}

.stat .value.success { color: #16a34a; }
.stat .value.danger { color: #dc2626; }
.stat .value.muted { color: #6b7280; }

.strategy-actions {
  display: flex;
  gap: 8px;
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover { background: #1d4ed8; }

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover { background: #e5e7eb; }

.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.template-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #2563eb;
  transform: translateY(-2px);
}

.template-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.template-card h3 {
  margin: 0 0 8px 0;
}

.template-card p {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.template-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.risk-tag {
  padding: 4px 8px;
  border-radius: 4px;
}

.risk-tag.low { background: #dcfce7; color: #166534; }
.risk-tag.medium { background: #fef3c7; color: #92400e; }
.risk-tag.high { background: #fee2e2; color: #991b1b; }

.backtest-panel, .risk-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.backtest-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.period-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
}

.metric-value.success { color: #16a34a; }
.metric-value.danger { color: #dc2626; }

.chart-container {
  margin-top: 24px;
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 200px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #2563eb, #60a5fa);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: all 0.3s;
}

.chart-bar:hover {
  background: #1d4ed8;
}

.risk-score {
  text-align: center;
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.risk-score.low { background: #dcfce7; }
.risk-score.medium { background: #fef3c7; }
.risk-score.high { background: #fee2e2; }

.score-circle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: white;
  justify-content: center;
  margin-bottom: 16px;
}

.score {
  font-size: 36px;
  font-weight: 700;
}

.risk-score.low .score { color: #16a34a; }
.risk-score.medium .score { color: #d97706; }
.risk-score.high .score { color: #dc2626; }

.risk-factors, .recommendations {
  margin-bottom: 24px;
}

.risk-factor {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.factor-impact {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.factor-impact.high { background: #fee2e2; color: #991b1b; }
.factor-impact.medium { background: #fef3c7; color: #92400e; }
.factor-impact.low { background: #dcfce7; color: #166534; }

.factor-score {
  margin-left: auto;
  font-weight: 600;
  color: #dc2626;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: normal;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #6b7280;
}
</style>
