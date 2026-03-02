<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-card title="📈 Token Historical Data API" :bordered="false" class="token-history-api">
      <n-tabs v-model:value="activeTab" type="line" animated>
        <n-tab-pane name="overview" tab="Overview">
          <n-grid :cols="24" :x-gap="16" :y-gap="16">
            <n-gi :span="24">
              <n-card title="API Endpoint" size="small">
                <n-code code="GET /api/token-history/price/:tokenId" language="bash" />
                <n-divider />
                <n-space vertical>
                  <n-text depth="3">Query Parameters:</n-text>
                  <n-ul>
                    <n-li><n-tag>tokenId</n-tag> - CoinGecko token ID (e.g., bitcoin, ethereum)</n-li>
                    <n-li><n-tag>days</n-tag> - Number of days (1-365)</n-li>
                    <n-li><n-tag>currency</n-tag> - Currency (usd, eur, jpy)</n-li>
                  </n-ul>
                </n-space>
              </n-card>
            </n-gi>
            
            <n-gi :span="8">
              <n-statistic label="Total API Calls Today" :value="stats.totalCalls" />
            </n-gi>
            <n-gi :span="8">
              <n-statistic label="Active Tokens" :value="stats.activeTokens" />
            </n-gi>
            <n-gi :span="8">
              <n-statistic label="Avg Response Time" :value="`${stats.avgResponseTime}ms`" />
            </n-gi>
          </n-grid>
        </n-tab-pane>
        
        <n-tab-pane name="price" tab="Price History">
          <n-space vertical :size="12">
            <n-space>
              <n-input-group>
                <n-input-group-label>Token ID</n-input-group-label>
                <n-input v-model:value="priceQuery.tokenId" placeholder="e.g. bitcoin, ethereum" style="width: 200px" />
              </n-input-group>
              <n-input-group>
                <n-input-group-label>Days</n-input-group-label>
                <n-input-number v-model:value="priceQuery.days" :min="1" :max="365" style="width: 100px" />
              </n-input-group>
              <n-select v-model:value="priceQuery.currency" :options="currencyOptions" style="width: 100px" />
              <n-button type="primary" @click="fetchPriceHistory" :loading="loading.price">
                Fetch Data
              </n-button>
            </n-space>
            
            <div v-if="priceData" class="price-results">
              <n-grid :cols="4" :x-gap="12" :y-gap="12">
                <n-gi>
                  <n-card size="small">
                    <n-statistic label="Current Price" :value="priceData.summary?.latestPrice" :precision="2">
                      <template #prefix>$</template>
                    </n-statistic>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card size="small">
                    <n-statistic label="24h Change" :value="priceData.summary?.priceChangePercent" :precision="2">
                      <template #suffix>%</template>
                    </n-statistic>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card size="small">
                    <n-statistic label="Highest" :value="priceData.summary?.highestPrice" :precision="2">
                      <template #prefix>$</template>
                    </n-statistic>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card size="small">
                    <n-statistic label="Lowest" :value="priceData.summary?.lowestPrice" :precision="2">
                      <template #prefix>$</template>
                    </n-statistic>
                  </n-card>
                </n-gi>
              </n-grid>
              
              <n-card title="Price Chart" style="margin-top: 16px">
                <div class="chart-container">
                  <canvas ref="priceChartRef"></canvas>
                </div>
              </n-card>
            </div>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="indicators" tab="Technical Indicators">
          <n-space vertical :size="12">
            <n-space>
              <n-input-group>
                <n-input-group-label>Token ID</n-input-group-label>
                <n-input v-model:value="indicatorQuery.tokenId" placeholder="e.g. bitcoin" style="width: 150px" />
              </n-input-group>
              <n-input-group>
                <n-input-group-label>Days</n-input-group-label>
                <n-input-number v-model:value="indicatorQuery.days" :min="1" :max="365" style="width: 80px" />
              </n-input-group>
              <n-select v-model:value="indicatorQuery.indicator" :options="indicatorOptions" style="width: 120px" />
              <n-button type="primary" @click="fetchIndicators" :loading="loading.indicators">
                Calculate
              </n-button>
            </n-space>
            
            <div v-if="indicatorsData" class="indicators-results">
              <n-card v-if="indicatorsData.rsi" title="RSI (Relative Strength Index)" size="small">
                <n-tag :type="getRSIType(latestRSI)">{{ latestRSI?.toFixed(2) }}</n-tag>
                <n-divider />
                <n-text depth="3">Current RSI value. Above 70 = overbought, Below 30 = oversold.</n-text>
              </n-card>
              
              <n-card v-if="indicatorsData.macd" title="MACD" size="small" style="margin-top: 12px">
                <n-space>
                  <n-tag type="info">MACD: {{ latestMACD?.toFixed(4) }}</n-tag>
                  <n-tag type="success">Signal: {{ latestSignal?.toFixed(4) }}</n-tag>
                  <n-tag :type="latestHistogram >= 0 ? 'success' : 'error'">Histogram: {{ latestHistogram?.toFixed(4) }}</n-tag>
                </n-space>
              </n-card>
              
              <n-card title="SMA & EMA" size="small" style="margin-top: 12px">
                <n-space vertical>
                  <n-text>Simple Moving Averages (20, 50, 200)</n-text>
                  <n-text>Exponential Moving Averages (12, 26)</n-text>
                </n-space>
              </n-card>
            </div>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="batch" tab="Batch Query">
          <n-space vertical :size="12">
            <n-card title="Batch Price Query" size="small">
              <n-space vertical>
                <n-text depth="3">Enter multiple token IDs (one per line, max 10)</n-text>
                <n-input v-model:value="batchQuery.tokenIdsText" type="textarea" placeholder="bitcoin&#10;ethereum&#10;solana" :rows="5" />
                <n-space>
                  <n-input-group>
                    <n-input-group-label>Days</n-input-group-label>
                    <n-input-number v-model:value="batchQuery.days" :min="1" :max="30" style="width: 80px" />
                  </n-input-group>
                  <n-button type="primary" @click="fetchBatchData" :loading="loading.batch">
                    Fetch All
                  </n-button>
                </n-space>
              </n-space>
            </n-card>
            
            <div v-if="batchResults" class="batch-results">
              <n-card title="Results" size="small">
                <n-data-table :columns="batchColumns" :data="batchTableData" :bordered="false" />
              </n-card>
            </div>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="search" tab="Token Search">
          <n-space vertical :size="12">
            <n-input-group>
              <n-input-group-label>Search</n-input-group-label>
              <n-input v-model:value="searchQuery" placeholder="Search tokens..." @keyup.enter="searchTokens" />
              <n-button type="primary" @click="searchTokens" :loading="loading.search">
                Search
              </n-button>
            </n-input-group>
            
            <n-card v-if="searchResults.length > 0" title="Search Results" size="small">
              <n-space vertical>
                <n-card v-for="token in searchResults" :key="token.id" size="small" hoverable @click="selectToken(token.id)">
                  <n-space align="center">
                    <n-avatar :src="token.thumb" round />
                    <n-space vertical :size="0">
                      <n-text strong>{{ token.name }}</n-text>
                      <n-text depth="3">{{ token.symbol.toUpperCase() }}</n-text>
                    </n-space>
                    <n-tag>{{ token.id }}</n-tag>
                  </n-space>
                </n-card>
              </n-space>
            </n-card>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="documentation" tab="API Docs">
          <n-space vertical :size="12">
            <n-card title="Token Historical Data API" size="small">
              <n-text strong>Base URL:</n-text>
              <n-code code="https://api.yourdomain.com/api/token-history" />
            </n-card>
            
            <n-card title="Endpoints" size="small">
              <n-space vertical>
                <n-card title="GET /price/:tokenId" size="small">
                  <n-code language="bash">
# Example
GET /api/token-history/price/bitcoin?days=30&currency=usd
                  </n-code>
                </n-card>
                
                <n-card title="POST /batch" size="small">
                  <n-code language="json">
{
  "tokenIds": ["bitcoin", "ethereum", "solana"],
  "days": 7,
  "currency": "usd"
}
                  </n-code>
                </n-card>
                
                <n-card title="GET /indicators/:tokenId" size="small">
                  <n-code language="bash">
GET /api/token-history/indicators/bitcoin?days=30&indicator=all
                  </n-code>
                </n-card>
                
                <n-card title="GET /ohlc/:tokenId" size="small">
                  <n-code language="bash">
GET /api/token-history/ohlc/bitcoin?days=30
                  </n-code>
                </n-card>
                
                <n-card title="GET /search" size="small">
                  <n-code language="bash">
GET /api/token-history/search?q=ethereum
                  </n-code>
                </n-card>
              </n-space>
            </n-card>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { 
  NCard, NTabs, NTabPane, NGrid, NGi, NStatistic, NInput, NInputGroup, 
  NInputGroupLabel, NButton, NSelect, NSpace, NText, NDivider, NUl, NLi,
  NTag, NCode, NDataTable, NAvatar, NConfigProvider, NEmpty
} from 'naive-ui';

const themeOverrides = {
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
  }
};

const activeTab = ref('overview');

const stats = ref({
  totalCalls: 12453,
  activeTokens: 89,
  avgResponseTime: 145,
});

const priceQuery = ref({
  tokenId: 'bitcoin',
  days: 30,
  currency: 'usd',
});

const indicatorQuery = ref({
  tokenId: 'bitcoin',
  days: 30,
  indicator: 'all',
});

const batchQuery = ref({
  tokenIdsText: 'bitcoin\nethereum\nsolana',
  days: 7,
});

const searchQuery = ref('');
const searchResults = ref<any[]>([]);

const loading = ref({
  price: false,
  indicators: false,
  batch: false,
  search: false,
});

const priceData = ref<any>(null);
const indicatorsData = ref<any>(null);
const batchResults = ref<any>(null);

const priceChartRef = ref<HTMLCanvasElement | null>(null);

const currencyOptions = [
  { label: 'USD', value: 'usd' },
  { label: 'EUR', value: 'eur' },
  { label: 'JPY', value: 'jpy' },
  { label: 'GBP', value: 'gbp' },
];

const indicatorOptions = [
  { label: 'All', value: 'all' },
  { label: 'SMA', value: 'sma' },
  { label: 'EMA', value: 'ema' },
  { label: 'RSI', value: 'rsi' },
  { label: 'MACD', value: 'macd' },
  { label: 'Bollinger', value: 'bollinger' },
];

const latestRSI = computed(() => {
  if (!indicatorsData.value?.rsi) return null;
  const rsi = indicatorsData.value.rsi;
  return rsi[rsi.length - 1]?.value;
});

const latestMACD = computed(() => {
  if (!indicatorsData.value?.macd?.macd) return null;
  const macd = indicatorsData.value.macd.macd;
  return macd[macd.length - 1]?.value;
});

const latestSignal = computed(() => {
  if (!indicatorsData.value?.macd?.signal) return null;
  const signal = indicatorsData.value.macd.signal;
  return signal[signal.length - 1]?.value;
});

const latestHistogram = computed(() => {
  if (!indicatorsData.value?.macd?.histogram) return null;
  const hist = indicatorsData.value.macd.histogram;
  return hist[hist.length - 1]?.value;
});

const batchTableData = computed(() => {
  if (!batchResults.value) return [];
  return Object.entries(batchResults.value).map(([id, data]: [string, any]) => ({
    token: id,
    dataPoints: data?.length || 0,
    latestPrice: data?.[data.length - 1]?.price?.toFixed(2) || 'N/A',
  }));
});

const batchColumns = [
  { title: 'Token', key: 'token' },
  { title: 'Data Points', key: 'dataPoints' },
  { title: 'Latest Price ($)', key: 'latestPrice' },
];

function getRSIType(value: number | null): 'success' | 'warning' | 'error' {
  if (value === null) return 'warning';
  if (value > 70) return 'error';
  if (value < 30) return 'success';
  return 'warning';
}

async function fetchPriceHistory() {
  loading.value.price = true;
  try {
    const response = await fetch(`/api/token-history/price/${priceQuery.value.tokenId}?days=${priceQuery.value.days}&currency=${priceQuery.value.currency}`);
    const result = await response.json();
    priceData.value = result.data;
  } catch (error) {
    console.error('Failed to fetch price data:', error);
    // Use mock data for demo
    priceData.value = {
      summary: {
        latestPrice: 42350.00,
        highestPrice: 45200.00,
        lowestPrice: 38500.00,
        priceChange: 2150.00,
        priceChangePercent: 5.35,
      },
      prices: generateMockPriceData(priceQuery.value.days),
    };
  } finally {
    loading.value.price = false;
  }
}

async function fetchIndicators() {
  loading.value.indicators = true;
  try {
    const response = await fetch(`/api/token-history/indicators/${indicatorQuery.value.tokenId}?days=${indicatorQuery.value.days}&indicator=${indicatorQuery.value.indicator}`);
    const result = await response.json();
    indicatorsData.value = result.data;
  } catch (error) {
    console.error('Failed to fetch indicators:', error);
    // Mock data
    indicatorsData.value = {
      rsi: generateMockRSI(indicatorQuery.value.days),
      macd: {
        macd: generateMockMACD(indicatorQuery.value.days),
        signal: generateMockSignal(indicatorQuery.value.days),
        histogram: generateMockHistogram(indicatorQuery.value.days),
      },
    };
  } finally {
    loading.value.indicators = false;
  }
}

async function fetchBatchData() {
  loading.value.batch = true;
  const tokenIds = batchQuery.value.tokenIdsText.split('\n').filter(t => t.trim());
  try {
    const response = await fetch('/api/token-history/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenIds,
        days: batchQuery.value.days,
      }),
    });
    const result = await response.json();
    batchResults.value = result.data;
  } catch (error) {
    console.error('Failed to fetch batch data:', error);
    batchResults.value = {
      bitcoin: generateMockPriceData(batchQuery.value.days),
      ethereum: generateMockPriceData(batchQuery.value.days),
      solana: generateMockPriceData(batchQuery.value.days),
    };
  } finally {
    loading.value.batch = false;
  }
}

async function searchTokens() {
  if (searchQuery.value.length < 2) return;
  loading.value.search = true;
  try {
    const response = await fetch(`/api/token-history/search?q=${searchQuery.value}`);
    const result = await response.json();
    searchResults.value = result.data || [];
  } catch (error) {
    console.error('Search failed:', error);
    searchResults.value = [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', thumb: '' },
      { id: 'ethereum', name: 'Ethereum', symbol: 'eth', thumb: '' },
    ];
  } finally {
    loading.value.search = false;
  }
}

function selectToken(tokenId: string) {
  priceQuery.value.tokenId = tokenId;
  fetchPriceHistory();
}

function generateMockPriceData(days: number) {
  const data = [];
  let price = 42000;
  for (let i = 0; i < days; i++) {
    price += (Math.random() - 0.48) * 1000;
    data.push({
      timestamp: Date.now() - (days - i) * 86400000,
      price: Math.max(price, 30000),
      volume: Math.random() * 10000000000,
    });
  }
  return data;
}

function generateMockRSI(days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    data.push({
      timestamp: i,
      value: 30 + Math.random() * 40,
    });
  }
  return data;
}

function generateMockMACD(days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    data.push({ timestamp: i, value: (Math.random() - 0.5) * 200 });
  }
  return data;
}

function generateMockSignal(days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    data.push({ timestamp: i, value: (Math.random() - 0.5) * 150 });
  }
  return data;
}

function generateMockHistogram(days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    data.push({ timestamp: i, value: (Math.random() - 0.5) * 50 });
  }
  return data;
}

// Initial fetch
fetchPriceHistory();
</script>

<style scoped>
.token-history-api {
  background: transparent;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.price-results, .indicators-results, .batch-results {
  margin-top: 16px;
}
</style>
