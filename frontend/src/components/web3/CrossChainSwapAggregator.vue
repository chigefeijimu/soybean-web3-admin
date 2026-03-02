<template>
  <div class="cross-chain-swap">
    <div class="header">
      <h2>🔄 器</h2>
      <p class="subtitle">聚合多个跨链桥跨链Swap聚合，找到最佳兑换路径</p>
    </div>

    <!-- 热门路线快捷选择 -->
    <div v-if="popularRoutes.length" class="popular-routes">
      <span class="label">热门路线:</span>
      <n-button v-for="route in popularRoutes" :key="route.name" size="small" quaternary @click="selectRoute(route)">
        {{ route.name }}
      </n-button>
    </div>

    <!-- 兑换表单 -->
    <div class="swap-form">
      <div class="chain-selector">
        <div class="chain-group">
          <label>从</label>
          <n-select v-model:value="fromChain" :options="chainOptions" @update:value="onChainChange('from')" />
        </div>
        <n-button quaternary circle @click="swapChains">
          <template #icon>
            <span>⇄</span>
          </template>
        </n-button>
        <div class="chain-group">
          <label>到</label>
          <n-select v-model:value="toChain" :options="chainOptions" @update:value="onChainChange('to')" />
        </div>
      </div>

      <div class="token-row">
        <div class="token-group">
          <label>支付</label>
          <n-select v-model:value="fromToken" :options="fromTokenOptions" />
        </div>
        <n-input-number
          v-model:value="amount"
          :min="0"
          :precision="6"
          placeholder="输入数量"
          class="amount-input"
        >
          <template #suffix>
            <span class="max-btn" @click="setMaxBalance">MAX</span>
          </template>
        </n-input-number>
      </div>

      <div class="token-row">
        <div class="token-group">
          <label>接收</label>
          <n-select v-model:value="toToken" :options="toTokenOptions" />
        </div>
        <div class="received-amount">
          {{ receivedAmount || '—' }}
        </div>
      </div>

      <n-button type="primary" block size="large" :loading="loading" @click="fetchQuotes">
        获取报价
      </n-button>
    </div>

    <!-- 报价结果 -->
    <div v-if="quotes.length" class="quotes-section">
      <h3>最佳报价</h3>
      <div class="quotes-list">
        <div
          v-for="(quote, index) in quotes"
          :key="quote.bridge"
          class="quote-card"
          :class="{ 'best': index === 0 }"
          @click="selectQuote(quote)"
        >
          <div class="quote-header">
            <span class="bridge-name">{{ quote.bridge }}</span>
            <n-tag v-if="index === 0" type="success" size="small">最佳</n-tag>
          </div>
          <div class="quote-details">
            <div class="quote-amount">
              <span class="value">{{ quote.toAmount }}</span>
              <span class="symbol">{{ quote.toToken }}</span>
            </div>
            <div class="quote-meta">
              <span>Gas: ~${{ quote.gasCost }}</span>
              <span>时间: {{ quote.estimatedTime }}</span>
              <span>滑点: {{ quote.slippage.toFixed(2) }}%</span>
            </div>
          </div>
          <div class="quote-rate">
            汇率: 1 {{ quote.fromToken }} = {{ quote.price }} {{ quote.toToken }}
          </div>
        </div>
      </div>
    </div>

    <!-- 已选报价详情 -->
    <div v-if="selectedQuote" class="selected-quote">
      <h3>兑换详情</h3>
      <n-descriptions :column="2" bordered size="small">
        <n-descriptions-item label="跨链桥">{{ selectedQuote.bridge }}</n-descriptions-item>
        <n-descriptions-item label="预计时间">{{ selectedQuote.estimatedTime }}</n-descriptions-item>
        <n-descriptions-item label="支付金额">{{ selectedQuote.fromAmount }} {{ selectedQuote.fromToken }}</n-descriptions-item>
        <n-descriptions-item label="预计到账">{{ selectedQuote.toAmount }} {{ selectedQuote.toToken }}</n-descriptions-item>
        <n-descriptions-item label="Gas费用">~${{ selectedQuote.gasCost }}</n-descriptions-item>
        <n-descriptions-item label="预估滑点">{{ selectedQuote.slippage.toFixed(2) }}%</n-descriptions-item>
      </n-descriptions>
      <n-button type="primary" block class="swap-btn" @click="executeSwap">
        开始兑换
      </n-button>
    </div>

    <!-- 支持的桥 -->
    <div class="bridges-section">
      <h3>支持的跨链桥</h3>
      <div class="bridges-grid">
        <div v-for="bridge in bridges" :key="bridge.id" class="bridge-item">
          <span class="bridge-name">{{ bridge.name }}</span>
          <span class="bridge-fee">费率: {{ (bridge.fee * 100).toFixed(1) }}%</span>
          <span class="bridge-time">{{ bridge.avgTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { 
  NSelect, NButton, NInputNumber, NTag, NDescriptions, NDescriptionsItem, useMessage 
} from 'naive-ui';
import { 
  fetchCrossChainChains, fetchCrossChainTokens, fetchBridgeList, fetchPopularRoutes, fetchSwapQuotes,
  type ChainInfo, type TokenInfo, type BridgeInfo, type SwapQuote, type PopularRoute 
} from '@/service/api/web3';

const message = useMessage();

// 状态
const chains = ref<ChainInfo[]>([]);
const fromTokens = ref<TokenInfo[]>([]);
const toTokens = ref<TokenInfo[]>([]);
const bridges = ref<BridgeInfo[]>([]);
const popularRoutes = ref<PopularRoute[]>([]);
const quotes = ref<SwapQuote[]>([]);
const loading = ref(false);

// 表单数据
const fromChain = ref('eth');
const toChain = ref('arb');
const fromToken = ref('ETH');
const toToken = ref('ETH');
const amount = ref<number | null>(1);
const selectedQuote = ref<SwapQuote | null>(null);

// 计算属性
const chainOptions = computed(() => 
  chains.value.map(c => ({ label: c.name, value: c.id }))
);

const fromTokenOptions = computed(() => 
  fromTokens.value.map(t => ({ label: `${t.symbol} - ${t.name}`, value: t.symbol }))
);

const toTokenOptions = computed(() => 
  toTokens.value.map(t => ({ label: `${t.symbol} - ${t.name}`, value: t.symbol }))
);

const receivedAmount = computed(() => {
  if (!quotes.value.length) return null;
  return `${quotes.value[0].toAmount} ${quotes.value[0].toToken}`;
});

// 方法
const loadChains = async () => {
  try {
    chains.value = await fetchCrossChainChains();
  } catch (e) {
    message.error('加载链列表失败');
  }
};

const loadTokens = async (chain: string, type: 'from' | 'to') => {
  try {
    const tokens = await fetchCrossChainTokens(chain);
    if (type === 'from') {
      fromTokens.value = tokens;
      if (tokens.length && !tokens.find(t => t.symbol === fromToken.value)) {
        fromToken.value = tokens[0].symbol;
      }
    } else {
      toTokens.value = tokens;
      if (tokens.length && !tokens.find(t => t.symbol === toToken.value)) {
        toToken.value = tokens[0].symbol;
      }
    }
  } catch (e) {
    message.error('加载代币列表失败');
  }
};

const loadBridges = async () => {
  try {
    bridges.value = await fetchBridgeList();
  } catch (e) {
    message.error('加载跨链桥列表失败');
  }
};

const loadPopularRoutes = async () => {
  try {
    popularRoutes.value = await fetchPopularRoutes();
  } catch (e) {
    console.error('加载热门路线失败', e);
  }
};

const onChainChange = (type: 'from' | 'to') => {
  if (type === 'from') {
    loadTokens(fromChain.value, 'from');
  } else {
    loadTokens(toChain.value, 'to');
  }
  quotes.value = [];
  selectedQuote.value = null;
};

const swapChains = () => {
  const tempChain = fromChain.value;
  fromChain.value = toChain.value;
  toChain.value = tempChain;
  
  const tempToken = fromToken.value;
  fromToken.value = toToken.value;
  toToken.value = tempToken;
  
  onChainChange('from');
  onChainChange('to');
};

const selectRoute = (route: PopularRoute) => {
  fromChain.value = route.from;
  toChain.value = route.to;
  fromToken.value = route.fromToken;
  toToken.value = route.toToken;
  onChainChange('from');
  onChainChange('to');
};

const setMaxBalance = () => {
  amount.value = 10; // 模拟最大值
};

const fetchQuotes = async () => {
  if (!amount.value || amount.value <= 0) {
    message.warning('请输入有效数量');
    return;
  }
  
  loading.value = true;
  try {
    quotes.value = await fetchSwapQuotes({
      fromChain: fromChain.value,
      toChain: toChain.value,
      fromToken: fromToken.value,
      toToken: toToken.value,
      amount: amount.value.toString()
    });
    if (quotes.value.length) {
      selectedQuote.value = quotes.value[0];
    }
  } catch (e) {
    message.error('获取报价失败');
  } finally {
    loading.value = false;
  }
};

const selectQuote = (quote: SwapQuote) => {
  selectedQuote.value = quote;
};

const executeSwap = () => {
  if (!selectedQuote.value) return;
  message.info('正在跳转到跨链桥执行兑换...');
  // 这里可以添加实际跳转逻辑
};

// 初始化
onMounted(async () => {
  await loadChains();
  await loadBridges();
  await loadPopularRoutes();
  await loadTokens(fromChain.value, 'from');
  await loadTokens(toChain.value, 'to');
});
</script>

<style scoped>
.cross-chain-swap {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.subtitle {
  color: #666;
  margin-top: 8px;
}

.popular-routes {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.popular-routes .label {
  font-weight: 500;
}

.swap-form {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.chain-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.chain-group {
  flex: 1;
}

.chain-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.token-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 16px;
}

.token-group {
  flex: 1;
}

.token-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.amount-input {
  width: 200px;
}

.max-btn {
  cursor: pointer;
  color: #2080f0;
  font-size: 12px;
}

.max-btn:hover {
  text-decoration: underline;
}

.received-amount {
  flex: 1;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 600;
  min-height: 42px;
  display: flex;
  align-items: center;
}

.quotes-section {
  margin-bottom: 24px;
}

.quotes-section h3 {
  margin-bottom: 16px;
}

.quotes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quote-card {
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.quote-card:hover {
  border-color: #2080f0;
}

.quote-card.best {
  border-color: #18a058;
  background: #f0fff4;
}

.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bridge-name {
  font-weight: 600;
  font-size: 16px;
}

.quote-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.quote-amount {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.quote-amount .value {
  font-size: 24px;
  font-weight: 700;
  color: #18a058;
}

.quote-amount .symbol {
  color: #666;
}

.quote-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.quote-rate {
  font-size: 13px;
  color: #666;
}

.selected-quote {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.selected-quote h3 {
  margin-bottom: 16px;
}

.swap-btn {
  margin-top: 20px;
}

.bridges-section h3 {
  margin-bottom: 16px;
}

.bridges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.bridge-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.bridge-item .bridge-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.bridge-item .bridge-fee,
.bridge-item .bridge-time {
  font-size: 12px;
  color: #666;
}
</style>
