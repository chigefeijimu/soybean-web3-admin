<script setup lang="ts">
import { ref } from 'vue';

interface EnsRecord {
  name: string;
  address: string;
  avatar: string;
  email?: string;
  url?: string;
}

const searchQuery = ref('');
const isLoading = ref(false);
const result = ref<EnsRecord | null>(null);
const error = ref('');

// Mock ENS data
const mockEns: Record<string, EnsRecord> = {
  'vitalik.eth': {
    name: 'vitalik.eth',
    address: '0xd8dA6BF26964aF9D7eEd09eE47c44cBda2CCECEC',
    avatar: 'https://metadata.ens.domains/mainnet/avatar/vitalik.eth',
    url: 'https://vitalik.eth'
  },
  'uniswap.eth': {
    name: 'uniswap.eth',
    address: '0x1a7b0a5c2b0e5d7d8c9b0a5c2b0e5d7d8c9b0a5c',
    avatar: 'https://metadata.ens.domains/mainnet/avatar/uniswap.eth',
    url: 'https://uniswap.org'
  },
  'aave.eth': {
    name: 'aave.eth',
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    avatar: 'https://metadata.ens.domains/mainnet/avatar/aave.eth',
    url: 'https://aave.com'
  }
};

const search = async () => {
  if (!searchQuery.value) return;

  isLoading.value = true;
  error.value = '';
  result.value = null;

  try {
    await new Promise(resolve => {
      setTimeout(resolve, 500);
    });

    const key = searchQuery.value.toLowerCase();
    if (mockEns[key]) {
      result.value = mockEns[key];
    } else if (key.includes('0x')) {
      // Reverse lookup - mock
      result.value = {
        name: '0x1234...abcd.eth',
        address: key,
        avatar: ''
      };
    } else {
      error.value = 'Name not found';
    }
  } finally {
    isLoading.value = false;
  }
};

const copyAddress = () => {
  if (result.value?.address) {
    navigator.clipboard.writeText(result.value.address);
  }
};

const formatAddress = (addr: string) => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};
</script>

<template>
  <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
    <h2 class="mb-6 text-xl font-semibold">ENS Lookup</h2>

    <!-- Search -->
    <div class="mb-6 flex gap-2">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Enter ENS name or address..."
        class="flex-1 border border-slate-700 rounded-xl bg-slate-900/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
        @keyup.enter="search"
      />
      <button
        :disabled="isLoading"
        class="rounded-xl bg-purple-500 px-6 py-3 font-medium transition-colors hover:bg-purple-600 disabled:opacity-50"
        @click="search"
      >
        {{ isLoading ? '...' : 'Search' }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 border border-red-500/50 rounded-xl bg-red-500/20 p-4 text-red-300">
      {{ error }}
    </div>

    <!-- Result -->
    <div v-if="result" class="space-y-4">
      <div class="rounded-xl bg-slate-900/50 p-4">
        <div class="flex items-center gap-4">
          <div
            class="h-16 w-16 flex items-center justify-center rounded-full from-purple-500 to-pink-500 bg-gradient-to-br text-2xl"
          >
            {{ result.avatar ? '👤' : '🔷' }}
          </div>
          <div class="flex-1">
            <p class="text-lg font-semibold">{{ result.name }}</p>
            <div class="mt-1 flex items-center gap-2">
              <code class="text-sm text-slate-400">{{ formatAddress(result.address) }}</code>
              <button class="text-slate-400 hover:text-white" @click="copyAddress">📋</button>
            </div>
          </div>
        </div>

        <div v-if="result.url" class="mt-4 border-t border-slate-700 pt-4">
          <a :href="result.url" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:underline">
            🌐 {{ result.url }}
          </a>
        </div>
      </div>
    </div>

    <!-- Popular -->
    <div class="mt-6 border-t border-slate-700 pt-6">
      <h3 class="mb-3 text-sm text-slate-400 font-medium">Popular Names</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="name in Object.keys(mockEns)"
          :key="name"
          class="rounded-lg bg-slate-700 px-3 py-1 text-sm transition-colors hover:bg-slate-600"
          @click="
            searchQuery = name;
            search();
          "
        >
          {{ name }}
        </button>
      </div>
    </div>
  </div>
</template>
