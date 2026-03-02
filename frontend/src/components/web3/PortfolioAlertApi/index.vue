<template>
  <n-card title="📡 Web3 Portfolio Alert API" :bordered="false" class="h-full">
    <n-tabs type="line" animated>
      <!-- 价格查询 -->
      <n-tab-pane name="price" tab="💰 Price Query">
        <n-space vertical :size="16">
          <n-space align="center">
            <n-input-group>
              <n-input-group-label>Token</n-input-group-label>
              <n-input v-model:value="priceQuery.symbol" placeholder="e.g. ETH, BTC" style="width: 120px" />
            </n-input-group>
            <n-select
              v-model:value="priceQuery.chain"
              :options="chainOptions"
              style="width: 140px"
            />
            <n-button type="primary" @click="queryPrice" :loading="loading.price">
              查询价格
            </n-button>
          </n-space>

          <n-card v-if="priceData" title="Token Price" size="small">
            <n-descriptions :column="3" label-placement="left">
              <n-descriptions-item label="Symbol">{{ priceData.symbol }}</n-descriptions-item>
              <n-descriptions-item label="Name">{{ priceData.name }}</n-descriptions-item>
              <n-descriptions-item label="Price">
                <n-text :type="priceData.change24h >= 0 ? 'success' : 'error'">
                  ${{ priceData.price?.toLocaleString() }}
                </n-text>
              </n-descriptions-item>
              <n-descriptions-item label="24h Change">
                <n-text :type="priceData.change24h >= 0 ? 'success' : 'error'">
                  {{ priceData.change24h >= 0 ? '+' : '' }}{{ priceData.change24h }}%
                </n-text>
              </n-descriptions-item>
              <n-descriptions-item label="7d Change">
                <n-text :type="(priceData.change7d || 0) >= 0 ? 'success' : 'error'">
                  {{ (priceData.change7d || 0) >= 0 ? '+' : '' }}{{ priceData.change7d }}%
                </n-text>
              </n-descriptions-item>
              <n-descriptions-item label="Volume 24h">
                ${{ (priceData.volume24h / 1e9).toFixed(2) }}B
              </n-descriptions-item>
            </n-descriptions>
          </n-card>
        </n-space>
      </n-tab-pane>

      <!-- 批量价格查询 -->
      <n-tab-pane name="batch" tab="📊 Batch Prices">
        <n-space vertical :size="16">
          <n-card title="Batch Token Prices" size="small">
            <n-checkbox-group v-model:value="batchQuery.symbols">
              <n-space vertical>
                <n-space>
                  <n-checkbox value="ETH" label="ETH - Ethereum" />
                  <n-checkbox value="BTC" label="BTC - Bitcoin" />
                  <n-checkbox value="BNB" label="BNB - BNB" />
                  <n-checkbox value="SOL" label="SOL - Solana" />
                </n-space>
                <n-space>
                  <n-checkbox value="ARB" label="ARB - Arbitrum" />
                  <n-checkbox value="OP" label="OP - Optimism" />
                  <n-checkbox value="MATIC" label="MATIC - Polygon" />
                  <n-checkbox value="AVAX" label="AVAX - Avalanche" />
                </n-space>
                <n-space>
                  <n-checkbox value="LINK" label="LINK - Chainlink" />
                  <n-checkbox value="UNI" label="UNI - Uniswap" />
                  <n-checkbox value="AAVE" label="AAVE - Aave" />
                  <n-checkbox value="USDC" label="USDC - USD Coin" />
                </n-space>
              </n-space>
            </n-checkbox-group>
            <n-button type="primary" @click="queryBatchPrices" :loading="loading.batch" style="margin-top: 16px">
              查询选中代币
            </n-button>
          </n-card>

          <n-data-table
            v-if="batchPrices.length"
            :columns="batchPriceColumns"
            :data="batchPrices"
            :bordered="false"
            size="small"
          />
        </n-space>
      </n-tab-pane>

      <!-- 持仓查询 -->
      <n-tab-pane name="portfolio" tab="💼 Portfolio">
        <n-space vertical :size="16">
          <n-space align="center">
            <n-input-group>
              <n-input-group-label>Wallet</n-input-group-label>
              <n-input v-model:value="portfolioQuery.address" placeholder="0x..." style="width: 400px" />
            </n-input-group>
            <n-select
              v-model:value="portfolioQuery.chain"
              :options="chainOptions"
              style="width: 140px"
            />
            <n-button type="primary" @click="queryPortfolio" :loading="loading.portfolio">
              查询持仓
            </n-button>
          </n-space>

          <n-card v-if="portfolioData" title="Portfolio Summary" size="small">
            <n-statistic label="Total Value" :value="'$' + portfolioData.totalValueUsd.toLocaleString()" />
          </n-card>

          <n-data-table
            v-if="portfolioData?.holdings"
            :columns="holdingColumns"
            :data="portfolioData.holdings"
            :bordered="false"
            size="small"
          />
        </n-space>
      </n-tab-pane>

      <!-- 提醒管理 -->
      <n-tab-pane name="alerts" tab="🔔 Alerts">
        <n-space vertical :size="16">
          <!-- 创建提醒 -->
          <n-card title="Create Alert" size="small">
            <n-space vertical :size="12">
              <n-space align="center">
                <n-select
                  v-model:value="alertForm.type"
                  :options="alertTypeOptions"
                  style="width: 160px"
                />
                <n-input-group v-if="alertForm.type !== 'gas'">
                  <n-input-group-label>Token</n-input-group-label>
                  <n-input v-model:value="alertForm.token" placeholder="ETH" style="width: 100px" />
                </n-input-group>
                <n-select
                  v-model:value="alertForm.chain"
                  :options="chainOptions"
                  style="width: 140px"
                />
              </n-space>
              <n-space align="center">
                <n-radio-group v-model:value="alertForm.condition">
                  <n-radio value="above">Above</n-radio>
                  <n-radio value="below">Below</n-radio>
                </n-radio-group>
                <n-input-number v-model:value="alertForm.threshold" :min="0" placeholder="Threshold" style="width: 120px" />
                <n-input v-model:value="alertForm.webhookUrl" placeholder="Webhook URL (optional)" style="width: 300px" />
                <n-button type="primary" @click="createAlert" :loading="loading.createAlert">
                  Create Alert
                </n-button>
              </n-space>
            </n-space>
          </n-card>

          <!-- 提醒列表 -->
          <n-card title="Your Alerts" size="small">
            <n-data-table
              :columns="alertColumns"
              :data="userAlerts"
              :bordered="false"
              size="small"
            />
          </n-card>
        </n-space>
      </n-tab-pane>

      <!-- Gas价格 -->
      <n-tab-pane name="gas" tab="⛽ Gas Prices">
        <n-space vertical :size="16">
          <n-space align="center">
            <n-select
              v-model:value="gasQuery.chain"
              :options="chainOptions"
              style="width: 140px"
            />
            <n-button type="primary" @click="queryGas" :loading="loading.gas">
              查询Gas
            </n-button>
            <n-button @click="queryAllGas" :loading="loading.gas">
              查询所有链
            </n-button>
          </n-space>

          <n-card v-if="gasData" title="Gas Price" size="small">
            <n-descriptions :column="4" label-placement="left">
              <n-descriptions-item label="Chain">{{ gasData.chain }}</n-descriptions-item>
              <n-descriptions-item label="Slow">{{ gasData.slow }} {{ gasData.unit }}</n-descriptions-item>
              <n-descriptions-item label="Normal">{{ gasData.normal }} {{ gasData.unit }}</n-descriptions-item>
              <n-descriptions-item label="Fast">{{ gasData.fast }} {{ gasData.unit }}</n-descriptions-item>
            </n-descriptions>
          </n-card>

          <n-data-table
            v-if="allGasData.length"
            :columns="gasColumns"
            :data="allGasData"
            :bordered="false"
            size="small"
          />
        </n-space>
      </n-tab-pane>

      <!-- API文档 -->
      <n-tab-pane name="docs" tab="📚 API Docs">
        <n-card title="API Endpoints" size="small">
          <n-space vertical>
            <n-card title="GET /api/price/:symbol" size="small" embedded>
              <n-text depth="3">Get token price by symbol</n-text>
              <n-divider />
              <n-text depth="2">Query params: chain (optional, default: eth)</n-text>
              <n-divider />
              <n-text depth="2">Example: /api/price/ETH?chain=eth</n-text>
            </n-card>

            <n-card title="GET /api/portfolio/:address" size="small" embedded>
              <n-text depth="3">Get wallet portfolio holdings</n-text>
              <n-divider />
              <n-text depth="2">Query params: chain (optional, default: eth)</n-text>
              <n-divider />
              <n-text depth="2">Example: /api/portfolio/0x123... ?chain=eth</n-text>
            </n-card>

            <n-card title="POST /api/alerts/price" size="small" embedded>
              <n-text depth="3">Create price alert</n-text>
              <n-divider />
              <n-text depth="2">Body: {"userId": "user1", "token": "ETH", "chain": "eth", "condition": "above", "threshold": 2000}</n-text>
            </n-card>

            <n-card title="GET /api/gas/:chain" size="small" embedded>
              <n-text depth="3">Get gas price for chain</n-text>
              <n-divider />
              <n-text depth="2">Example: /api/gas/eth</n-text>
            </n-card>

            <n-card title="GET /api/trending" size="small" embedded>
              <n-text depth="3">Get trending tokens</n-text>
              <n-divider />
              <n-text depth="2">Query params: limit (optional, default: 10)</n-text>
            </n-card>

            <n-card title="GET /api/info" size="small" embedded>
              <n-text depth="3">Get API information</n-text>
            </n-card>
          </n-space>
        </n-card>
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, h } from 'vue';
import { NButton, NText, useMessage } from 'naive-ui';

// 模拟API调用
const API_BASE = '/api';

const message = useMessage();

// 状态管理
const loading = reactive({
  price: false,
  batch: false,
  portfolio: false,
  createAlert: false,
  gas: false,
});

// 查询表单
const priceQuery = reactive({
  symbol: 'ETH',
  chain: 'eth',
});

const batchQuery = reactive({
  symbols: ['ETH', 'BTC', 'SOL'],
});

const portfolioQuery = reactive({
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
  chain: 'eth',
});

const alertForm = reactive({
  type: 'price',
  token: 'ETH',
  chain: 'eth',
  condition: 'above',
  threshold: 2000,
  webhookUrl: '',
});

const gasQuery = reactive({
  chain: 'eth',
});

// 数据存储
const priceData = ref<any>(null);
const batchPrices = ref<any[]>([]);
const portfolioData = ref<any>(null);
const gasData = ref<any>(null);
const allGasData = ref<any[]>([]);
const userAlerts = ref<any[]>([]);
const currentUserId = 'demo_user';

// 选项配置
const chainOptions = [
  { label: 'Ethereum', value: 'eth' },
  { label: 'Arbitrum', value: 'arb' },
  { label: 'Optimism', value: 'opt' },
  { label: 'Polygon', value: 'pol' },
  { label: 'Avalanche', value: 'avax' },
  { label: 'BSC', value: 'bsc' },
  { label: 'Base', value: 'base' },
];

const alertTypeOptions = [
  { label: 'Price Alert', value: 'price' },
  { label: 'Gas Alert', value: 'gas' },
];

// 表格列配置
const batchPriceColumns = [
  { title: 'Symbol', key: 'symbol' },
  { title: 'Name', key: 'name' },
  { 
    title: 'Price', 
    key: 'price',
    render: (row: any) => h('span', { style: { color: row.change24h >= 0 ? '#18a058' : '#d03050' } }, 
      `$${row.price?.toLocaleString()}`
    )
  },
  { 
    title: '24h %', 
    key: 'change24h',
    render: (row: any) => h(NText, { type: row.change24h >= 0 ? 'success' : 'error' }, 
      () => `${row.change24h >= 0 ? '+' : ''}${row.change24h}%`
    )
  },
  { title: 'Volume 24h', key: 'volume24h', render: (row: any) => `$${(row.volume24h / 1e9).toFixed(2)}B` },
];

const holdingColumns = [
  { title: 'Token', key: 'symbol' },
  { title: 'Name', key: 'name' },
  { title: 'Balance', key: 'balance' },
  { 
    title: 'Value (USD)', 
    key: 'balanceUsd',
    render: (row: any) => `$${row.balanceUsd.toLocaleString()}`
  },
  { 
    title: '24h %', 
    key: 'change24h',
    render: (row: any) => h(NText, { type: row.change24h >= 0 ? 'success' : 'error' }, 
      () => `${row.change24h >= 0 ? '+' : ''}${row.change24h}%`
    )
  },
];

const alertColumns = [
  { title: 'Type', key: 'type' },
  { title: 'Token', key: 'token' },
  { title: 'Chain', key: 'chain' },
  { title: 'Condition', key: 'condition' },
  { title: 'Threshold', key: 'threshold' },
  { 
    title: 'Status', 
    key: 'enabled',
    render: (row: any) => h(NText, { type: row.enabled ? 'success' : 'default' }, 
      () => row.enabled ? 'Active' : 'Disabled'
    )
  },
  {
    title: 'Action',
    key: 'actions',
    render: (row: any) => h(NButton, { 
      size: 'small', 
      type: 'error',
      onClick: () => deleteAlert(row.id)
    }, () => 'Delete')
  },
];

const gasColumns = [
  { title: 'Chain', key: 'chain' },
  { title: 'Slow', key: 'slow', render: (row: any) => `${row.slow} ${row.unit}` },
  { title: 'Normal', key: 'normal', render: (row: any) => `${row.normal} ${row.unit}` },
  { title: 'Fast', key: 'fast', render: (row: any) => `${row.fast} ${row.unit}` },
  { title: 'Updated', key: 'timestamp', render: (row: any) => new Date(row.timestamp).toLocaleTimeString() },
];

// API调用函数
async function queryPrice() {
  loading.price = true;
  try {
    // 模拟API响应
    const prices: Record<string, any> = {
      ETH: { symbol: 'ETH', name: 'Ethereum', price: 1850.5, change24h: 2.3, change7d: 5.8, volume24h: 15e9 },
      BTC: { symbol: 'BTC', name: 'Bitcoin', price: 43500, change24h: 1.5, change7d: 4.2, volume24h: 28e9 },
      BNB: { symbol: 'BNB', name: 'BNB', price: 312.8, change24h: -0.5, change7d: 2.1, volume24h: 1.2e9 },
      SOL: { symbol: 'SOL', name: 'Solana', price: 98.5, change24h: 5.2, change7d: 12.3, volume24h: 3.5e9 },
      ARB: { symbol: 'ARB', name: 'Arbitrum', price: 1.15, change24h: 3.1, change7d: 8.5, volume24h: 450e6 },
      OP: { symbol: 'OP', name: 'Optimism', price: 2.35, change24h: 2.8, change7d: 6.2, volume24h: 320e6 },
      MATIC: { symbol: 'MATIC', name: 'Polygon', price: 0.78, change24h: -1.2, change7d: -3.5, volume24h: 580e6 },
      AVAX: { symbol: 'AVAX', name: 'Avalanche', price: 35.5, change24h: 1.8, change7d: 4.5, volume24h: 850e6 },
      LINK: { symbol: 'LINK', name: 'Chainlink', price: 14.2, change24h: 4.5, change7d: 9.8, volume24h: 620e6 },
      UNI: { symbol: 'UNI', name: 'Uniswap', price: 6.85, change24h: 2.1, change7d: 5.5, volume24h: 280e6 },
      AAVE: { symbol: 'AAVE', name: 'Aave', price: 95.5, change24h: 3.2, change7d: 7.8, volume24h: 180e6 },
      USDC: { symbol: 'USDC', name: 'USD Coin', price: 1.0, change24h: 0, change7d: 0, volume24h: 35e9 },
    };
    
    priceData.value = prices[priceQuery.symbol.toUpperCase()] || null;
    if (!priceData.value) {
      message.warning('Token not found');
    }
  } finally {
    loading.price = false;
  }
}

async function queryBatchPrices() {
  loading.batch = true;
  try {
    const prices: Record<string, any> = {
      ETH: { symbol: 'ETH', name: 'Ethereum', price: 1850.5, change24h: 2.3, volume24h: 15e9 },
      BTC: { symbol: 'BTC', name: 'Bitcoin', price: 43500, change24h: 1.5, volume24h: 28e9 },
      BNB: { symbol: 'BNB', name: 'BNB', price: 312.8, change24h: -0.5, volume24h: 1.2e9 },
      SOL: { symbol: 'SOL', name: 'Solana', price: 98.5, change24h: 5.2, volume24h: 3.5e9 },
      ARB: { symbol: 'ARB', name: 'Arbitrum', price: 1.15, change24h: 3.1, volume24h: 450e6 },
      OP: { symbol: 'OP', name: 'Optimism', price: 2.35, change24h: 2.8, volume24h: 320e6 },
      MATIC: { symbol: 'MATIC', name: 'Polygon', price: 0.78, change24h: -1.2, volume24h: 580e6 },
      AVAX: { symbol: 'AVAX', name: 'Avalanche', price: 35.5, change24h: 1.8, volume24h: 850e6 },
      LINK: { symbol: 'LINK', name: 'Chainlink', price: 14.2, change24h: 4.5, volume24h: 620e6 },
      UNI: { symbol: 'UNI', name: 'Uniswap', price: 6.85, change24h: 2.1, volume24h: 280e6 },
      AAVE: { symbol: 'AAVE', name: 'Aave', price: 95.5, change24h: 3.2, volume24h: 180e6 },
      USDC: { symbol: 'USDC', name: 'USD Coin', price: 1.0, change24h: 0, volume24h: 35e9 },
    };
    
    batchPrices.value = batchQuery.symbols.map(s => prices[s]).filter(Boolean);
  } finally {
    loading.batch = false;
  }
}

async function queryPortfolio() {
  loading.portfolio = true;
  try {
    portfolioData.value = {
      address: portfolioQuery.address,
      chain: portfolioQuery.chain,
      totalValueUsd: 11046.25,
      holdings: [
        { symbol: 'ETH', name: 'Ethereum', balance: '2.5', balanceUsd: 4626.25, price: 1850.5, change24h: 2.3 },
        { symbol: 'USDC', name: 'USD Coin', balance: '5000', balanceUsd: 5000, price: 1.0, change24h: 0 },
        { symbol: 'LINK', name: 'Chainlink', balance: '100', balanceUsd: 1420, price: 14.2, change24h: 4.5 },
      ],
      timestamp: Date.now(),
    };
  } finally {
    loading.portfolio = false;
  }
}

async function createAlert() {
  loading.createAlert = true;
  try {
    const newAlert = {
      id: `alert_${Date.now()}`,
      type: alertForm.type === 'price' ? 'price_above' : 'gas_high',
      token: alertForm.token,
      chain: alertForm.chain,
      condition: `${alertForm.condition} ${alertForm.threshold}`,
      threshold: alertForm.threshold,
      enabled: true,
      createdAt: Date.now(),
    };
    userAlerts.value.push(newAlert);
    message.success('Alert created successfully');
  } finally {
    loading.createAlert = false;
  }
}

async function deleteAlert(id: string) {
  userAlerts.value = userAlerts.value.filter(a => a.id !== id);
  message.success('Alert deleted');
}

async function queryGas() {
  loading.gas = true;
  try {
    const gasDataMap: Record<string, any> = {
      eth: { chain: 'ETH', slow: 15, normal: 25, fast: 40, unit: 'Gwei' },
      arb: { chain: 'ARB', slow: 0.01, normal: 0.05, fast: 0.15, unit: 'Gwei' },
      opt: { chain: 'OPT', slow: 0.001, normal: 0.005, fast: 0.02, unit: 'Gwei' },
      pol: { chain: 'POL', slow: 30, normal: 50, fast: 80, unit: 'Gwei' },
      avax: { chain: 'AVAX', slow: 20, normal: 35, fast: 60, unit: 'Gwei' },
      bsc: { chain: 'BSC', slow: 3, normal: 5, fast: 8, unit: 'Gwei' },
      base: { chain: 'BASE', slow: 0.01, normal: 0.05, fast: 0.2, unit: 'Gwei' },
    };
    
    gasData.value = { ...gasDataMap[gasQuery.chain], timestamp: Date.now() };
  } finally {
    loading.gas = false;
  }
}

async function queryAllGas() {
  loading.gas = true;
  try {
    allGasData.value = [
      { chain: 'ETH', slow: 15, normal: 25, fast: 40, unit: 'Gwei', timestamp: Date.now() },
      { chain: 'ARB', slow: 0.01, normal: 0.05, fast: 0.15, unit: 'Gwei', timestamp: Date.now() },
      { chain: 'OPT', slow: 0.001, normal: 0.005, fast: 0.02, unit: 'Gwei', timestamp: Date.now() },
      { chain: 'POL', slow: 30, normal: 50, fast: 80, unit: 'Gwei', timestamp: Date.now() },
      { chain: 'AVAX', slow: 20, normal: 35, fast: 60, unit: 'Gwei', timestamp: Date.now() },
      { chain: 'BSC', slow: 3, normal: 5, fast: 8, unit: 'Gwei', timestamp: Date.now() },
      { chain: 'BASE', slow: 0.01, normal: 0.05, fast: 0.2, unit: 'Gwei', timestamp: Date.now() },
    ];
  } finally {
    loading.gas = false;
  }
}
</script>

<style scoped>
.h-full {
  height: 100%;
}
</style>
