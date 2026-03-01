<script setup lang="ts">
import { computed, ref } from 'vue';

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
}

const emit = defineEmits<{
  (e: 'add', token: Token): void;
  (e: 'close'): void;
}>();

const searchQuery = ref('');
const customAddress = ref('');
const isAddingCustom = ref(false);

// Popular tokens list
const popularTokens: Token[] = [
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  { address: '0x6B175474E89094C44Da98b954Eebc90fE31f3a2a', name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18 },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', name: 'Wrapped Bitcoin', symbol: 'WBTC', decimals: 8 },
  { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', name: 'Aave', symbol: 'AAVE', decimals: 18 },
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', name: 'Uniswap', symbol: 'UNI', decimals: 18 },
  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', name: 'Chainlink', symbol: 'LINK', decimals: 18 },
  { address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfe5B6', name: 'Polkadot', symbol: 'DOT', decimals: 18 },
  { address: '0x4EED0fa8dE12D5a86517f214C2f11586Ba2ED88D', name: 'Polygon', symbol: 'MATIC', decimals: 18 },
  { address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF', name: 'Basic Attention', symbol: 'BAT', decimals: 18 },
  { address: '0x1985365e9f78359a9B6AD760e32412f4a445E862', name: 'Augur', symbol: 'REP', decimals: 18 }
];

const defiTokens: Token[] = [
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', name: 'Uniswap', symbol: 'UNI', decimals: 18 },
  { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', name: 'Aave', symbol: 'AAVE', decimals: 18 },
  { address: '0x80fB784B7eD6678eFC61B830f6B111A9812E2B80', name: 'Aave (OLD)', symbol: 'LEND', decimals: 18 },
  { address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF', name: 'Basic Attention', symbol: 'BAT', decimals: 18 },
  { address: '0x1985365e9f78359a9B6AD760e32412f4a445E862', name: 'Augur', symbol: 'REP', decimals: 18 }
];

const filteredTokens = computed(() => {
  const query = searchQuery.value.toLowerCase();
  if (!query) return popularTokens;
  return popularTokens.filter(t => t.name.toLowerCase().includes(query) || t.symbol.toLowerCase().includes(query));
});

const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const handleAddToken = (token: Token) => {
  emit('add', token);
};

const handleAddCustom = () => {
  if (!isValidAddress(customAddress.value)) {
    return;
  }

  // In production, fetch token info from blockchain
  const token: Token = {
    address: customAddress.value,
    name: 'Unknown Token',
    symbol: '???',
    decimals: 18
  };

  emit('add', token);
};

const validateAndProceed = () => {
  if (isValidAddress(customAddress.value)) {
    handleAddCustom();
  }
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div class="max-w-lg w-full overflow-hidden border border-slate-700 rounded-2xl bg-slate-800">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-700 p-6">
        <h2 class="text-xl font-semibold">Add Token</h2>
        <button class="rounded-lg p-2 transition-colors hover:bg-slate-700" @click="emit('close')">✕</button>
      </div>

      <!-- Search -->
      <div class="border-b border-slate-700 p-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tokens..."
          class="w-full border border-slate-700 rounded-xl bg-slate-900/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <!-- Custom Token Toggle -->
      <div class="border-b border-slate-700 p-4">
        <button
          class="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-700 py-3 text-sm font-medium transition-colors hover:bg-slate-600"
          @click="isAddingCustom = !isAddingCustom"
        >
          <span>{{ isAddingCustom ? '▼' : '▶' }}</span>
          Add Custom Token
        </button>

        <!-- Custom Token Input -->
        <div v-if="isAddingCustom" class="mt-4 space-y-3">
          <input
            v-model="customAddress"
            type="text"
            placeholder="Token Contract Address (0x...)"
            class="w-full border border-slate-700 rounded-xl bg-slate-900/50 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            :disabled="!isValidAddress(customAddress)"
            class="w-full rounded-xl bg-purple-500 py-3 font-medium transition-colors disabled:cursor-not-allowed hover:bg-purple-600 disabled:opacity-50"
            @click="validateAndProceed"
          >
            Add Custom Token
          </button>
        </div>
      </div>

      <!-- Popular Tokens -->
      <div class="max-h-96 overflow-y-auto">
        <div class="p-4">
          <h3 class="mb-3 text-sm text-slate-400 font-medium">Popular Tokens</h3>
          <div class="space-y-2">
            <button
              v-for="token in filteredTokens"
              :key="token.address"
              class="w-full flex items-center justify-between rounded-xl bg-slate-900/50 p-3 transition-colors hover:bg-slate-700"
              @click="handleAddToken(token)"
            >
              <div class="flex items-center gap-3">
                <div
                  class="h-10 w-10 flex items-center justify-center rounded-full from-purple-500 to-pink-500 bg-gradient-to-br text-white font-bold"
                >
                  {{ token.symbol.charAt(0) }}
                </div>
                <div class="text-left">
                  <p class="font-medium">{{ token.name }}</p>
                  <p class="text-sm text-slate-400">{{ token.symbol }}</p>
                </div>
              </div>
              <span class="text-slate-500">+</span>
            </button>
          </div>
        </div>

        <!-- DeFi Tokens -->
        <div class="border-t border-slate-700 p-4">
          <h3 class="mb-3 text-sm text-slate-400 font-medium">DeFi Tokens</h3>
          <div class="space-y-2">
            <button
              v-for="token in defiTokens"
              :key="token.address"
              class="w-full flex items-center justify-between rounded-xl bg-slate-900/50 p-3 transition-colors hover:bg-slate-700"
              @click="handleAddToken(token)"
            >
              <div class="flex items-center gap-3">
                <div
                  class="h-10 w-10 flex items-center justify-center rounded-full from-green-500 to-emerald-500 bg-gradient-to-br text-white font-bold"
                >
                  {{ token.symbol.charAt(0) }}
                </div>
                <div class="text-left">
                  <p class="font-medium">{{ token.name }}</p>
                  <p class="text-sm text-slate-400">{{ token.symbol }}</p>
                </div>
              </div>
              <span class="text-slate-500">+</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-slate-700 bg-slate-900/50 p-4">
        <p class="text-center text-xs text-slate-500">Token prices and balances are fetched from blockchain</p>
      </div>
    </div>
  </div>
</template>
