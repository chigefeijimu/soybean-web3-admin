<template>
  <div class="gas-optimizer">
    <div class="header">
      <h2>⛽ Gas Optimizer</h2>
      <p>AI-powered gas price prediction and cross-chain optimization</p>
    </div>

    <!-- Chain Selection -->
    <div class="section chain-selector">
      <el-select v-model="selectedChain" placeholder="Select Chain" @change="loadGasData">
        <el-option v-for="chain in chains" :key="chain.id" :label="chain.name" :value="chain.name">
          <span>{{ chain.name }}</span>
        </el-option>
      </el-select>
      <el-button type="primary" @click="loadGasData" :loading="loading">
        <el-icon><Refresh /></el-icon> Refresh
      </el-button>
    </div>

    <!-- Current Gas Prices -->
    <div class="section" v-if="gasPrices.length > 0">
      <h3>📊 Current Gas Prices</h3>
      <el-row :gutter="20">
        <el-col :span="8" v-for="price in gasPrices" :key="price.chain">
          <el-card class="gas-card" :body-style="{ padding: '20px' }">
            <div class="chain-name">{{ price.chain }}</div>
            <div class="gas-values">
              <div class="gas-row slow">
                <span class="label">🐢 Slow</span>
                <span class="value">{{ price.slow }} {{ price.unit }}</span>
              </div>
              <div class="gas-row normal">
                <span class="label">🚶 Normal</span>
                <span class="value">{{ price.normal }} {{ price.unit }}</span>
              </div>
              <div class="gas-row fast">
                <span class="label">🚀 Fast</span>
                <span class="value">{{ price.fast }} {{ price.unit }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Gas Prediction -->
    <div class="section" v-if="prediction">
      <h3>🔮 Gas Price Prediction</h3>
      <el-card>
        <div class="prediction-header">
          <div class="current-price">
            <span class="label">Current:</span>
            <span class="value">{{ prediction.current }} Gwei</span>
          </div>
          <div class="recommendation" :class="getRecommendationClass(prediction.recommendation)">
            {{ prediction.recommendation }}
          </div>
        </div>
        
        <div class="prediction-chart">
          <el-row :gutter="20">
            <el-col :span="6" v-for="(pred, time) in prediction.prediction" :key="time">
              <div class="prediction-card">
                <div class="time-label">{{ time }}</div>
                <div class="pred-price">{{ pred.price }} Gwei</div>
                <div class="trend" :class="pred.trend">
                  {{ pred.trend === 'up' ? '⬆️' : pred.trend === 'down' ? '⬇️' : '➡️' }}
                  {{ pred.trend }}
                </div>
                <div class="confidence">Confidence: {{ pred.confidence.toFixed(0) }}%</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="best-time" v-if="prediction.bestTimeToTransact">
          <el-alert :title="`Best Time: ${prediction.bestTimeToTransact.time}`" type="success" :closable="false">
            <template #default>
              Average price: {{ prediction.bestTimeToTransact.avgPrice }} Gwei
              <br>
              Potential savings: {{ prediction.bestTimeToTransact.savings }}%
            </template>
          </el-alert>
        </div>
      </el-card>
    </div>

    <!-- Gas Comparison -->
    <div class="section">
      <h3>⚖️ Cross-chain Gas Comparison</h3>
      <el-card>
        <div class="comparison-controls">
          <el-select v-model="comparisonTxType" placeholder="Transaction Type" style="width: 200px">
            <el-option label="ETH Transfer" value="transfer" />
            <el-option label="ERC20 Transfer" value="erc20_transfer" />
            <el-option label="DEX Swap" value="swap" />
            <el-option label="NFT Transfer" value="nft_transfer" />
            <el-option label="Contract Deploy" value="contract_deploy" />
          </el-select>
          <el-button type="primary" @click="loadComparison">Compare</el-button>
        </div>

        <el-table :data="comparisonData" style="width: 100%" v-if="comparisonData.length > 0">
          <el-table-column prop="rank" label="#" width="60" />
          <el-table-column prop="chain" label="Chain" />
          <el-table-column prop="gasPrice" label="Gas Price">
            <template #default="{ row }">
              {{ row.gasPrice }} {{ row.unit }}
            </template>
          </el-table-column>
          <el-table-column label="Estimated Fee">
            <template #default="{ row }">
              {{ row.estimatedFee.eth.toFixed(6) }} ETH
              <span class="usd">(~${{ row.estimatedFee.usd.toFixed(2) }})</span>
            </template>
          </el-table-column>
          <el-table-column label="Savings" width="150">
            <template #default="{ row }">
              <el-tag v-if="row.savings" type="success">
                {{ row.savings.vsMostExpensive }}% off
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- Fee Estimates -->
    <div class="section">
      <h3>💰 Fee Estimates</h3>
      <el-card>
        <el-table :data="feeEstimates" style="width: 100%" v-if="feeEstimates.length > 0">
          <el-table-column prop="description" label="Transaction Type" />
          <el-table-column prop="gasLimit" label="Gas Limit" />
          <el-table-column label="Slow">
            <template #default="{ row }">
              {{ row.estimatedFee.slow.eth.toFixed(6) }} ETH
              <span class="usd">(~${{ row.estimatedFee.slow.usd.toFixed(2) }})</span>
            </template>
          </el-table-column>
          <el-table-column label="Normal">
            <template #default="{ row }">
              {{ row.estimatedFee.normal.eth.toFixed(6) }} ETH
              <span class="usd">(~${{ row.estimatedFee.normal.usd.toFixed(2) }})</span>
            </template>
          </el-table-column>
          <el-table-column label="Fast">
            <template #default="{ row }">
              {{ row.estimatedFee.fast.eth.toFixed(6) }} ETH
              <span class="usd">(~${{ row.estimatedFee.fast.usd.toFixed(2) }})</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- Best Time to Transact -->
    <div class="section">
      <h3>⏰ Best Time to Transact</h3>
      <el-card v-if="bestTimeData">
        <div class="best-time-info">
          <div class="current-time">
            Current Hour (UTC): {{ bestTimeData.currentHour }}:00
          </div>
          <div class="global-best" v-if="bestTimeData.globalBestTime">
            <el-tag type="success" size="large">
              Best Chain: {{ bestTimeData.globalBestTime.chain }}
              <br>
              Best Time: {{ bestTimeData.globalBestTime.bestTimeToTransact }}
              <br>
              Avg Price: {{ bestTimeData.globalBestTime.avgPrice }} Gwei
            </el-tag>
          </div>
        </div>
        <div class="hourly-chart">
          <div v-for="rec in bestTimeData.recommendations" :key="rec.chain" class="chain-schedule">
            <h4>{{ rec.chain }}</h4>
            <div class="hour-bars">
              <div 
                v-for="hour in rec.hourlyPrices" 
                :key="hour.hour"
                class="hour-bar"
                :class="{
                  'best': hour.hour === rec.bestTimeToTransact,
                  'worst': hour.hour === rec.worstTimeToTransact,
                  'current': hour.hour === `${bestTimeData.currentHour.toString().padStart(2, '0')}:00`
                }"
                :title="`${hour.hour}: ${hour.price} Gwei`"
              >
                <span class="hour-label">{{ hour.hour.split(':')[0] }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Gas Savings Calculator -->
    <div class="section">
      <h3>💡 Gas Savings Calculator</h3>
      <el-card>
        <div class="savings-controls">
          <el-select v-model="savingsFromChain" placeholder="From Chain" style="width: 150px">
            <el-option v-for="chain in chains" :key="chain.id" :label="chain.name" :value="chain.name" />
          </el-select>
          <span>→</span>
          <el-select v-model="savingsTxType" placeholder="Transaction Type" style="width: 150px">
            <el-option label="ETH Transfer" value="transfer" />
            <el-option label="ERC20 Transfer" value="erc20_transfer" />
            <el-option label="DEX Swap" value="swap" />
            <el-option label="NFT Transfer" value="nft_transfer" />
          </el-select>
          <el-input-number v-model="savingsGasAmount" :min="21000" :max="2000000" placeholder="Gas" style="width: 150px" />
          <el-button type="primary" @click="calculateSavings">Calculate</el-button>
        </div>

        <div v-if="savingsData" class="savings-results">
          <el-alert :title="`Current Fee on ${savingsData.fromChain}`" type="info" :closable="false">
            {{ savingsData.fromFee.eth.toFixed(6) }} ETH (~${{ savingsData.fromFee.usd.toFixed(2) }})
          </el-alert>
          
          <el-table :data="savingsData.alternatives" style="width: 100%; margin-top: 20px">
            <el-table-column prop="chain" label="Alternative Chain" />
            <el-table-column label="Fee">
              <template #default="{ row }">
                {{ row.estimatedFee.eth.toFixed(6) }} ETH
                <span class="usd">(~${{ row.estimatedFee.usd.toFixed(2) }})</span>
              </template>
            </el-table-column>
            <el-table-column label="Savings">
              <template #default="{ row }">
                <el-tag type="success">
                  {{ row.savings.eth.toFixed(6) }} ETH
                  <br>
                  ({{ row.savings.percentage }}%)
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <el-alert 
            v-if="savingsData.bestOption" 
            :title="`Best Option: ${savingsData.bestOption.chain}`" 
            type="success" 
            :closable="false"
            style="margin-top: 20px"
          >
            Save {{ savingsData.bestOption.savings.eth.toFixed(6) }} ETH 
            ({{ savingsData.bestOption.savings.percentage }}% savings)
          </el-alert>
        </div>
      </el-card>
    </div>

    <!-- Gas History Chart -->
    <div class="section">
      <h3>📈 Gas Price History</h3>
      <el-card>
        <div class="history-controls">
          <el-radio-group v-model="historyRange" @change="loadHistory">
            <el-radio-button label="24h">24h</el-radio-button>
            <el-radio-button label="7d">7d</el-radio-button>
            <el-radio-button label="30d">30d</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="historyData" class="history-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-label">Min</div>
                <div class="stat-value">{{ historyData.statistics.min }} Gwei</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-label">Max</div>
                <div class="stat-value">{{ historyData.statistics.max }} Gwei</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-label">Average</div>
                <div class="stat-value">{{ historyData.statistics.avg }} Gwei</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-label">Change</div>
                <div class="stat-value" :class="historyData.statistics.change >= 0 ? 'positive' : 'negative'">
                  {{ historyData.statistics.change }}%
                </div>
              </div>
            </el-col>
          </el-row>
          <div class="chart-container">
            <div class="simple-chart">
              <div 
                v-for="(point, index) in historyData.dataPoints" 
                :key="index"
                class="chart-bar"
                :style="{ height: `${(point.price / historyData.statistics.max) * 100}%` }"
                :title="`${point.date}: ${point.price} Gwei`"
              />
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const loading = ref(false);
const selectedChain = ref('Ethereum');
const comparisonTxType = ref('transfer');
const historyRange = ref('24h');
const savingsFromChain = ref('Ethereum');
const savingsTxType = ref('transfer');
const savingsGasAmount = ref(21000);

const chains = ref([
  { id: 1, name: 'Ethereum' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10, name: 'Optimism' },
  { id: 56, name: 'BSC' },
  { id: 8453, name: 'Base' },
  { id: 43114, name: 'Avalanche' },
]);

const gasPrices = ref([]);
const prediction = ref(null);
const comparisonData = ref([]);
const feeEstimates = ref([]);
const bestTimeData = ref(null);
const savingsData = ref(null);
const historyData = ref(null);

const API_BASE = '/api/gas-optimizer';

const loadGasData = async () => {
  loading.value = true;
  try {
    const [pricesRes, predRes, feeRes, bestTimeRes] = await Promise.all([
      fetch(`${API_BASE}/prices`),
      fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain: selectedChain.value }),
      }),
      fetch(`${API_BASE}/fee-estimate?chain=${selectedChain.value}`),
      fetch(`${API_BASE}/best-time?chain=${selectedChain.value}`),
    ]);

    const pricesData = await pricesRes.json();
    const predData = await predRes.json();
    const feeData = await feeRes.json();
    const bestTime = await bestTimeRes.json();

    if (pricesData.success) gasPrices.value = pricesData.data;
    if (predData.success) prediction.value = predData.data;
    if (feeData.success) feeEstimates.value = feeData.data.transactionTypes;
    if (bestTime.success) bestTimeData.value = bestTime.data;
  } catch (error) {
    console.error('Error loading gas data:', error);
    ElMessage.error('Failed to load gas data');
  } finally {
    loading.value = false;
  }
};

const loadComparison = async () => {
  try {
    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txType: comparisonTxType.value }),
    });
    const data = await res.json();
    if (data.success) {
      comparisonData.value = data.data.prices;
    }
  } catch (error) {
    console.error('Error loading comparison:', error);
    ElMessage.error('Failed to load comparison');
  }
};

const loadHistory = async () => {
  try {
    const res = await fetch(`${API_BASE}/history?chain=${selectedChain.value}&range=${historyRange.value}`);
    const data = await res.json();
    if (data.success) {
      historyData.value = data.data;
    }
  } catch (error) {
    console.error('Error loading history:', error);
    ElMessage.error('Failed to load history');
  }
};

const calculateSavings = async () => {
  try {
    const res = await fetch(`${API_BASE}/savings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromChain: savingsFromChain.value,
        txType: savingsTxType.value,
        gasAmount: savingsGasAmount.value,
      }),
    });
    const data = await res.json();
    if (data.success) {
      savingsData.value = data.data;
    }
  } catch (error) {
    console.error('Error calculating savings:', error);
    ElMessage.error('Failed to calculate savings');
  }
};

const getRecommendationClass = (recommendation) => {
  if (recommendation?.includes('below average') || recommendation?.includes('stable')) return 'success';
  if (recommendation?.includes('rising') || recommendation?.includes('wait')) return 'warning';
  return 'info';
};

onMounted(() => {
  loadGasData();
  loadComparison();
  loadHistory();
});
</script>

<style scoped>
.gas-optimizer {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.header p {
  color: #666;
  margin: 5px 0 0;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  margin-bottom: 15px;
  font-size: 18px;
}

.chain-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.gas-card {
  margin-bottom: 15px;
}

.chain-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 15px;
  text-align: center;
}

.gas-values {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gas-row {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-radius: 4px;
}

.gas-row.slow {
  background: #e6f7e6;
}

.gas-row.normal {
  background: #fff8e6;
}

.gas-row.fast {
  background: #ffe6e6;
}

.gas-row .label {
  font-weight: 500;
}

.gas-row .value {
  font-weight: bold;
}

.prediction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.current-price .label {
  color: #666;
  margin-right: 10px;
}

.current-price .value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.recommendation {
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 14px;
}

.recommendation.success {
  background: #e6f7e6;
  color: #67c23a;
}

.recommendation.warning {
  background: #fff8e6;
  color: #e6a23c;
}

.recommendation.info {
  background: #f0f9ff;
  color: #409eff;
}

.prediction-chart {
  margin: 20px 0;
}

.prediction-card {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.prediction-card .time-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.prediction-card .pred-price {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.prediction-card .trend {
  font-size: 14px;
  margin-bottom: 5px;
}

.prediction-card .trend.up {
  color: #f56c6c;
}

.prediction-card .trend.down {
  color: #67c23a;
}

.prediction-card .confidence {
  font-size: 12px;
  color: #999;
}

.best-time {
  margin-top: 20px;
}

.comparison-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.usd {
  color: #999;
  font-size: 12px;
}

.best-time-info {
  margin-bottom: 20px;
}

.current-time {
  font-size: 16px;
  margin-bottom: 10px;
}

.global-best {
  margin-top: 10px;
}

.hourly-chart {
  overflow-x: auto;
}

.chain-schedule {
  margin-bottom: 20px;
}

.chain-schedule h4 {
  margin: 10px 0;
}

.hour-bars {
  display: flex;
  gap: 2px;
  height: 60px;
}

.hour-bar {
  flex: 1;
  background: #409eff;
  min-width: 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.hour-bar:hover {
  background: #66b1ff;
}

.hour-bar.best {
  background: #67c23a;
}

.hour-bar.worst {
  background: #f56c6c;
}

.hour-bar.current {
  border: 2px solid #000;
}

.hour-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #666;
}

.savings-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.savings-results {
  margin-top: 20px;
}

.history-controls {
  margin-bottom: 20px;
}

.history-stats {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
}

.stat-value.positive {
  color: #f56c6c;
}

.stat-value.negative {
  color: #67c23a;
}

.chart-container {
  margin-top: 20px;
  height: 150px;
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 100%;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #409eff, #66b1ff);
  min-width: 5px;
  border-radius: 2px 2px 0 0;
  transition: all 0.2s;
}

.chart-bar:hover {
  background: linear-gradient(to top, #66b1ff, #409eff);
}
</style>
