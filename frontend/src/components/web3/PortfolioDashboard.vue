<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { getTokenBalances, getTokenPrices } from '@/service/api/web3';
import { useWeb3 } from '@/composables/web3/useWeb3';

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  value: number;
  logo?: string;
}

// Common token addresses (ETH mainnet)
const COMMON_TOKENS = [
  { address: '0x0000000000000000000000000000000000000000', name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'Tether USD', symbol: 'USDT', decimals: 6 },
  { address: '0x6B175474E89094C44Da98b954Eebc90fE31f3a2a', name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18 },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', name: 'Wrapped Bitcoin', symbol: 'WBTC', decimals: 8 }
];

const ethPrice = ref(0); // Fetched from CoinGecko API

// Local state
const sortBy = ref<'value' | 'balance' | 'name'>('value');
const tokens = ref<Token[]>([]);
const totalValue = ref(0);
const isLoading = ref(false);

// Get account and chainId from composable
const { account, chainId } = useWeb3();

// Fetch real prices from backend
const fetchPrices = async () => {
  try {
    const response = await getTokenPrices();
    if (response.data?.success && response.data?.data) {
      const prices = response.data.data;
      // Get ETH price (could be in different formats)
      ethPrice.value = prices.ethereum?.usd || prices.ETH?.usd || prices.eth?.usd || 0;
    }
  } catch (e) {
    console.error('Failed to fetch prices:', e);
    // Fallback to a default if API fails
    ethPrice.value = 2500;
  }
};

const loadPortfolio = async () => {
  if (!account.value) return;

  isLoading.value = true;
  try {
    // Get token balances from backend
    const tokenAddresses = COMMON_TOKENS.map(t => t.address);

    const response = await getTokenBalances({
      ownerAddress: account.value,
      tokenAddresses,
      chainId: chainId.value || 1
    });

    if (response.data?.success && response.data?.data?.balances) {
      const balances = response.data.data.balances;

      // Map to tokens with price data
      tokens.value = balances
        .map((bal: any, index: number) => {
          const tokenInfo = COMMON_TOKENS[index] || { name: 'Unknown', symbol: '???', decimals: 18 };
          const balance = Number.parseFloat(bal.formatted_balance || '0');

          // Get token-specific price
          let tokenPrice = ethPrice.value; // Default to ETH price
          const symbol = tokenInfo.symbol.toLowerCase();
          if (symbol === 'usdc' || symbol === 'usdt' || symbol === 'dai') {
            tokenPrice = 1; // Stablecoins
          } else if (symbol === 'wbtc') {
            tokenPrice = ethPrice.value * 60; // Approximate BTC/ETH ratio
          }

          const value = balance * tokenPrice;

          return {
            address: bal.token_address,
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            decimals: bal.decimals || tokenInfo.decimals,
            balance: bal.formatted_balance || '0',
            value,
            logo: `https://cryptologos.cc/logos/${tokenInfo.symbol.toLowerCase()}-${tokenInfo.symbol.toLowerCase()}-logo.svg`
          };
        })
        .filter((t: Token) => t.value > 0); // Filter out zero balances

      totalValue.value = tokens.value.reduce((sum, t) => sum + t.value, 0);
    } else {
      // Fallback to mock data if API fails
      console.warn('API call failed, using mock data');
      tokens.value = getMockTokens();
      totalValue.value = tokens.value.reduce((sum, t) => sum + t.value, 0);
    }
  } catch (e) {
    console.error('Failed to load portfolio:', e);
    // Fallback to mock data
    tokens.value = getMockTokens();
    totalValue.value = tokens.value.reduce((sum, t) => sum + t.value, 0);
  } finally {
    isLoading.value = false;
  }
};

// Add sortedTokens computed
const sortedTokens = computed(() => {
  const list = [...tokens.value];
  if (sortBy.value === 'value') {
    return list.sort((a, b) => b.value - a.value);
  }
  if (sortBy.value === 'balance') {
    return list.sort((a, b) => Number.parseFloat(b.balance) - Number.parseFloat(a.balance));
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
});

function getMockTokens(): Token[] {
  return [
    {
      address: '0x0000000000000000000000000000000000000000',
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      balance: '2.5',
      value: 6250,
      logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg'
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      balance: '5000',
      value: 5000,
      logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg'
    },
    {
      address: '0x6B175474E89094C44Da98b954Eebc90fE31f3a2a',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18,
      balance: '2500',
      value: 2500,
      logo: 'https://cryptologos.cc/logos/dai-dai-logo.svg'
    }
  ];
}

const formatBalance = (balance: string, decimals: number): string => {
  const num = Number.parseFloat(balance);
  if (num >= 1000) return num.toLocaleString();
  if (num >= 1) return num.toFixed(2);
  return num.toFixed(6);
};

const formatValue = (value: number): string => {
  return `$${value.toLocaleString()}`;
};

const getTokenUrl = (address: string): string => {
  if (address === '0x0000000000000000000000000000000000000000') return '';
  return `https://etherscan.io/token/${address}`;
};

const getPercentage = (value: number): string => {
  if (totalValue.value === 0) return '0%';
  return `${((value / totalValue.value) * 100).toFixed(1)}%`;
};

const getTokenColor = (index: number): string => {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500'
  ];
  return colors[index % colors.length];
};

onMounted(async () => {
  // Fetch prices first
  await fetchPrices();
  if (account.value) {
    loadPortfolio();
  }
});

// Reload when account changes
watch(account, newAccount => {
  if (newAccount) {
    loadPortfolio();
  } else {
    tokens.value = [];
    totalValue.value = 0;
  }
});
</script>

<template>
  <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold">Portfolio</h2>
      <select v-model="sortBy" class="rounded-lg bg-slate-700 px-3 py-2 text-sm focus:outline-none">
        <option value="value">Sort by Value</option>
        <option value="balance">Sort by Balance</option>
        <option value="name">Sort by Name</option>
      </select>
    </div>

    <!-- Total Value -->
    <div class="mb-6 border border-purple-500/30 rounded-xl from-purple-500/20 to-blue-500/20 bg-gradient-to-r p-4">
      <p class="text-sm text-slate-400">Total Portfolio Value</p>
      <p class="mt-1 text-3xl font-bold">{{ formatValue(totalValue) }}</p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-8 text-center">
      <div class="mx-auto h-8 w-8 animate-spin border-2 border-purple-500 border-t-transparent rounded-full"></div>
      <p class="mt-2 text-slate-400">Loading portfolio...</p>
    </div>

    <!-- Token List -->
    <div v-else class="space-y-3">
      <div
        v-for="(token, index) in sortedTokens"
        :key="token.address"
        class="rounded-xl bg-slate-900/50 p-4 transition-colors hover:bg-slate-800/50"
      >
        <div class="flex items-center justify-between">
          <!-- Token Info -->
          <div class="flex items-center gap-3">
            <!-- Token Icon -->
            <div
              class="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold"
              :class="[getTokenColor(index)]"
            >
              {{ token.symbol.charAt(0) }}
            </div>

            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ token.name }}</span>
                <span class="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                  {{ token.symbol }}
                </span>
              </div>
              <p class="mt-0.5 text-sm text-slate-400">
                {{ formatBalance(token.balance, token.decimals) }} {{ token.symbol }}
              </p>
            </div>
          </div>

          <!-- Value -->
          <div class="text-right">
            <p class="font-semibold">{{ formatValue(token.value) }}</p>
            <div class="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-700">
              <div
                class="h-full bg-gradient-to-r"
                :class="[getTokenColor(index)]"
                :style="{ width: getPercentage(token.value) }"
              ></div>
            </div>
            <p class="mt-1 text-xs text-slate-500">{{ getPercentage(token.value) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && tokens.length === 0" class="py-8 text-center text-slate-400">
      <div class="mb-3 text-4xl">💰</div>
      <p>No assets found</p>
      <p class="mt-1 text-sm">Connect wallet to view portfolio</p>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex gap-3 border-t border-slate-700 pt-6">
      <button class="flex-1 rounded-xl bg-slate-700 py-3 text-sm font-medium transition-colors hover:bg-slate-600">
        + Add Token
      </button>
      <button class="flex-1 rounded-xl bg-slate-700 py-3 text-sm font-medium transition-colors hover:bg-slate-600">
        📊 Analytics
      </button>
    </div>
  </div>
</template>
