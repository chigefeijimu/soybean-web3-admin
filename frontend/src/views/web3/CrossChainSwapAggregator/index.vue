<template>
  <div class="cross-chain-swap-aggregator">
    <n-card title="Cross-chain DEX Swap Aggregator" :bordered="false" class="mb-4">
      <n-space vertical>
        <n-alert v-if="loading" type="info">Loading market data...</n-alert>
        
        <!-- Market Overview -->
        <n-grid :cols="4" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-statistic label="24h Volume" :value="marketOverview.totalVolume24h">
              <template #prefix>$</template>
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="Active Swappers" :value="marketOverview.activeSwappers" />
          </n-gi>
          <n-gi>
            <n-statistic label="Avg Slippage" :value="marketOverview.avgSlippage">
              <template #suffix>%</template>
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="Avg Gas Cost" :value="marketOverview.avgGasCost">
              <template #prefix>$</template>
            </n-statistic>
          </n-gi>
        </n-grid>

        <!-- Swap Form -->
        <n-card title="Swap Tokens" size="small">
          <n-space vertical>
            <n-grid :cols="2" :x-gap="16">
              <n-gi>
                <n-form-item label="From Chain">
                  <n-select v-model:value="swapForm.fromChain" :options="chainOptions" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="To Chain">
                  <n-select v-model:value="swapForm.toChain" :options="chainOptions" />
                </n-form-item>
              </n-gi>
            </n-grid>
            
            <n-grid :cols="2" :x-gap="16">
              <n-gi>
                <n-form-item label="From Token">
                  <n-select v-model:value="swapForm.fromToken" :options="tokenOptions" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="To Token">
                  <n-select v-model:value="swapForm.toToken" :options="tokenOptions" />
                </n-form-item>
              </n-gi>
            </n-grid>

            <n-form-item label="Amount">
              <n-input-number v-model:value="swapForm.amount" :min="0" :precision="6" style="width: 100%">
                <template #suffix>{{ swapForm.fromToken }}</template>
              </n-input-number>
            </n-form-item>

            <n-space>
              <n-button type="primary" @click="getQuote" :loading="quoting">
                Get Quote
              </n-button>
              <n-button @click="compareRoutes" :loading="comparing">
                Compare Routes
              </n-button>
              <n-button @click="findBestRoute" :loading="finding">
                Find Best Route
              </n-button>
            </n-space>
          </n-space>
        </n-card>

        <!-- Quote Result -->
        <n-card v-if="quoteResult" title="Quote Result" size="small">
          <n-descriptions :column="3" label-placement="left">
            <n-descriptions-item label="Amount In">
              {{ quoteResult.amountIn }} {{ quoteResult.fromToken }}
            </n-descriptions-item>
            <n-descriptions-item label="Amount Out">
              {{ quoteResult.amountOut }} {{ quoteResult.toToken }}
            </n-descriptions-item>
            <n-descriptions-item label="Price Impact">
              {{ quoteResult.priceImpact }}%
            </n-descriptions-item>
            <n-descriptions-item label="Gas Cost">
              ${{ quoteResult.gasCost }}
            </n-descriptions-item>
            <n-descriptions-item label="Slippage">
              {{ quoteResult.slippage }}%
            </n-descriptions-item>
            <n-descriptions-item label="Est. Duration">
              {{ quoteResult.estimatedDuration }}s
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <!-- Routes Comparison -->
        <n-card v-if="routesResult" title="Route Comparison" size="small">
          <n-table :single-line="false">
            <thead>
              <tr>
                <th>Rank</th>
                <th>DEX</th>
                <th>Amount Out</th>
                <th>Gas Cost</th>
                <th>Duration</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="route in routesResult.routes" :key="route.routeId">
                <td>#{{ route.rank }}</td>
                <td>{{ route.dex }}</td>
                <td>{{ route.amountOut }}</td>
                <td>${{ route.gasCost }}</td>
                <td>{{ route.duration.toFixed(0) }}s</td>
                <td>{{ route.confidence.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </n-table>
        </n-card>

        <!-- Best Route -->
        <n-card v-if="bestRouteResult" title="Best Route" size="small">
          <n-space vertical>
            <n-alert v-if="bestRouteResult.bestRoute" type="success">
              <template #header>Recommended Route</template>
              <n-space vertical>
                <div><strong>DEX:</strong> {{ bestRouteResult.bestRoute.dex }}</div>
                <div><strong>Output:</strong> {{ bestRouteResult.bestRoute.amountOut }} {{ bestRouteResult.toToken }}</div>
                <div><strong>Gas:</strong> ${{ bestRouteResult.bestRoute.gasCost }}</div>
                <div><strong>Duration:</strong> {{ bestRouteResult.bestRoute.duration.toFixed(0) }}s</div>
              </n-space>
            </n-alert>
            
            <n-collapse v-if="bestRouteResult.alternatives && bestRouteResult.alternatives.length">
              <n-collapse-item title="Alternative Routes" name="alternatives">
                <n-space vertical>
                  <div v-for="(alt, idx) in bestRouteResult.alternatives" :key="idx">
                    <strong>{{ idx + 2 }}. {{ alt.dex }}</strong> - {{ alt.amountOut }} ({{ alt.gasCost }})
                  </div>
                </n-space>
              </n-collapse-item>
            </n-collapse>
          </n-space>
        </n-card>

        <!-- Popular Routes -->
        <n-card title="Popular Routes" size="small">
          <n-table :single-line="false">
            <thead>
              <tr>
                <th>From Chain</th>
                <th>To Chain</th>
                <th>Pair</th>
                <th>24h Swaps</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="route in popularRoutes" :key="`${route.fromChain}-${route.toChain}`">
                <td>{{ route.fromChain }}</td>
                <td>{{ route.toChain }}</td>
                <td>{{ route.fromToken }} - {{ route.toToken }}</td>
                <td>{{ route.swaps.toLocaleString() }}</td>
              </tr>
            </tbody>
          </n-table>
        </n-card>

        <!-- Supported Chains -->
        <n-card title="Supported Chains and DEXs" size="small">
          <n-tabs type="segment">
            <n-tab-pane name="chains" tab="Chains">
              <n-grid :cols="4" :x-gap="12" :y-gap="12">
                <n-gi v-for="chain in supportedChains" :key="chain.id">
                  <n-card size="small">
                    <n-space vertical>
                      <div><strong>{{ chain.name }}</strong></div>
                      <div class="text-gray">{{ chain.symbol }}</div>
                    </n-space>
                  </n-card>
                </n-gi>
              </n-grid>
            </n-tab-pane>
            <n-tab-pane name="dexs" tab="DEXs">
              <n-table size="small">
                <thead>
                  <tr>
                    <th>DEX</th>
                    <th>Chain</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="dex in supportedDexs" :key="dex.id">
                    <td>{{ dex.name }}</td>
                    <td>{{ dex.chain }}</td>
                    <td>{{ dex.type }}</td>
                  </tr>
                </tbody>
              </n-table>
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  NCard, NSpace, NGrid, NGi, NStatistic, NAlert, NButton,
  NFormItem, NSelect, NInputNumber, NDescriptions, NDescriptionsItem,
  NTable, NTabs, NTabPane, NCollapse, NCollapseItem
} from 'naive-ui';

const loading = ref(false);
const quoting = ref(false);
const comparing = ref(false);
const finding = ref(false);

const supportedChains = ref<any[]>([]);
const supportedDexs = ref<any[]>([]);
const popularRoutes = ref<any[]>([]);
const marketOverview = ref<any>({
  totalVolume24h: '0',
  activeSwappers: 0,
  avgSlippage: '0',
  avgGasCost: '0'
});

const swapForm = ref({
  fromChain: 'ethereum',
  toChain: 'polygon',
  fromToken: 'ETH',
  toToken: 'MATIC',
  amount: 1
});

const quoteResult = ref<any>(null);
const routesResult = ref<any>(null);
const bestRouteResult = ref<any>(null);

const chainOptions = computed(() => 
  supportedChains.value.map(c => ({ label: c.name, value: c.id }))
);

const tokenOptions = computed(() => [
  { label: 'ETH', value: 'ETH' },
  { label: 'USDC', value: 'USDC' },
  { label: 'USDT', value: 'USDT' },
  { label: 'WBTC', value: 'WBTC' },
  { label: 'MATIC', value: 'MATIC' },
  { label: 'BNB', value: 'BNB' },
  { label: 'AVAX', value: 'AVAX' },
  { label: 'SOL', value: 'SOL' },
  { label: 'LINK', value: 'LINK' },
  { label: 'AAVE', value: 'AAVE' },
]);

async function loadData() {
  loading.value = true;
  try {
    supportedChains.value = [
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
      { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
      { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH' },
      { id: 'optimism', name: 'Optimism', symbol: 'ETH' },
      { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
      { id: 'base', name: 'Base', symbol: 'ETH' },
      { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
      { id: 'solana', name: 'Solana', symbol: 'SOL' },
    ];
    
    supportedDexs.value = [
      { id: 'uniswap_v3', name: 'Uniswap V3', chain: 'ethereum', type: 'AMM' },
      { id: 'sushiswap', name: 'SushiSwap', chain: 'ethereum', type: 'AMM' },
      { id: 'curve', name: 'Curve', chain: 'ethereum', type: 'StableSwap' },
      { id: 'pancakeswap', name: 'PancakeSwap', chain: 'bsc', type: 'AMM' },
      { id: 'quickswap', name: 'QuickSwap', chain: 'polygon', type: 'AMM' },
    ];
    
    popularRoutes.value = [
      { fromChain: 'ethereum', toChain: 'polygon', fromToken: 'ETH', toToken: 'MATIC', swaps: 12500 },
      { fromChain: 'ethereum', toChain: 'arbitrum', fromToken: 'ETH', toToken: 'ETH', swaps: 10200 },
      { fromChain: 'ethereum', toChain: 'bsc', fromToken: 'ETH', toToken: 'BNB', swaps: 8900 },
      { fromChain: 'polygon', toChain: 'avalanche', fromToken: 'MATIC', toToken: 'AVAX', swaps: 6700 },
    ];
    
    marketOverview.value = {
      totalVolume24h: '2,850,000,000',
      activeSwappers: 185000,
      avgSlippage: '0.35',
      avgGasCost: '12.50'
    };
  } finally {
    loading.value = false;
  }
}

async function getQuote() {
  quoting.value = true;
  try {
    quoteResult.value = {
      fromChain: swapForm.value.fromChain,
      toChain: swapForm.value.toChain,
      fromToken: swapForm.value.fromToken,
      toToken: swapForm.value.toToken,
      amountIn: swapForm.value.amount.toString(),
      amountOut: (swapForm.value.amount * 2800).toFixed(6),
      priceImpact: '0.25',
      gasCost: '8.50',
      slippage: 0.5,
      estimatedDuration: 45
    };
  } finally {
    quoting.value = false;
  }
}

async function compareRoutes() {
  comparing.value = true;
  try {
    routesResult.value = {
      fromChain: swapForm.value.fromChain,
      toChain: swapForm.value.toChain,
      fromToken: swapForm.value.fromToken,
      toToken: swapForm.value.toToken,
      amount: swapForm.value.amount.toString(),
      routes: [
        { rank: 1, routeId: '1', dex: 'Uniswap V3', amountOut: (swapForm.value.amount * 2800).toFixed(6), gasCost: '5.20', duration: 30, confidence: 95 },
        { rank: 2, routeId: '2', dex: 'SushiSwap', amountOut: (swapForm.value.amount * 2785).toFixed(6), gasCost: '6.10', duration: 45, confidence: 92 },
        { rank: 3, routeId: '3', dex: 'Curve', amountOut: (swapForm.value.amount * 2770).toFixed(6), gasCost: '8.50', duration: 60, confidence: 88 },
      ]
    };
  } finally {
    comparing.value = false;
  }
}

async function findBestRoute() {
  finding.value = true;
  try {
    bestRouteResult.value = {
      fromChain: swapForm.value.fromChain,
      toChain: swapForm.value.toChain,
      fromToken: swapForm.value.fromToken,
      toToken: swapForm.value.toToken,
      amount: swapForm.value.amount.toString(),
      preference: 'best',
      bestRoute: {
        dex: 'Uniswap V3',
        amountOut: (swapForm.value.amount * 2800).toFixed(6),
        gasCost: '5.20',
        duration: 30
      },
      alternatives: [
        { dex: 'SushiSwap', amountOut: (swapForm.value.amount * 2785).toFixed(6), gasCost: '6.10', duration: 45 },
        { dex: 'Curve', amountOut: (swapForm.value.amount * 2770).toFixed(6), gasCost: '8.50', duration: 60 }
      ]
    };
  } finally {
    finding.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.cross-chain-swap-aggregator {
  padding: 16px;
}
.mb-4 {
  margin-bottom: 16px;
}
.text-gray {
  color: #666;
  font-size: 12px;
}
</style>
