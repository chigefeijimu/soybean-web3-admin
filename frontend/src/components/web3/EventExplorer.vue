<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

const { getLogs, chainId } = useWeb3();

// State
const contractAddress = ref('');
const eventSignature = ref('Transfer(address,address,uint256)');
const fromBlock = ref('latest');
const toBlock = ref('latest');
const isLoading = ref(false);
const error = ref('');
const logs = ref<any[]>([]);

// Common event signatures
const commonEvents = [
  { name: 'Transfer', signature: 'Transfer(address,address,uint256)', description: 'Token transfer' },
  { name: 'Approval', signature: 'Approval(address,address,uint256)', description: 'Token approval' },
  { name: 'Swap', signature: 'Swap(address,uint256,uint256,uint256,uint256,address)', description: 'Uniswap swap' },
  { name: 'Mint', signature: 'Mint(address,uint256)', description: 'Token mint' },
  { name: 'Burn', signature: 'Burn(address,uint256)', description: 'Token burn' },
  { name: 'Deposit', signature: 'Deposit(address,uint256)', description: 'ETH deposit' },
  { name: 'Withdrawal', signature: 'Withdrawal(address,uint256)', description: 'ETH withdrawal' },
  { name: 'OrderFilled', signature: 'OrderFilled(bytes32,address,address,uint256,uint256)', description: 'Order filled' },
  { name: 'Trade', signature: 'Trade(bytes32,address,address,uint256,uint256,address,address)', description: 'Trade event' },
  { name: 'OwnershipTransferred', signature: 'OwnershipTransferred(address,address)', description: 'Ownership transfer' },
];

// Parse log data
const parsedLogs = computed(() => {
  return logs.value.map((log, index) => {
    try {
      return {
        ...log,
        parsed: true,
        topics: log.topics || [],
        data: log.data || '0x',
      };
    } catch (e) {
      return { ...log, parsed: false };
    }
  });
});

// Fetch logs
const fetchLogs = async () => {
  if (!contractAddress.value) {
    error.value = 'Please enter a contract address';
    return;
  }

  error.value = '';
  isLoading.value = true;
  logs.value = [];

  try {
    // Use the web3 composable to fetch logs
    const result = await getLogs(contractAddress.value, eventSignature.value, fromBlock.value, toBlock.value);
    logs.value = result || [];
    
    if (logs.value.length === 0) {
      error.value = 'No events found for the specified criteria';
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch logs';
    console.error('Error fetching logs:', e);
  } finally {
    isLoading.value = false;
  }
};

// Select event
const selectEvent = (event: typeof commonEvents[0]) => {
  eventSignature.value = event.signature;
};

// Clear results
const clearResults = () => {
  logs.value = [];
  error.value = '';
};

// Export logs as JSON
const exportLogs = () => {
  const data = JSON.stringify(parsedLogs.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Get block number display
const formatBlockNumber = (block: string | number) => {
  if (block === 'latest' || block === 'earliest' || block === 'pending') {
    return block;
  }
  return Number(block).toLocaleString();
};

// Copy address
const copyAddress = (address: string) => {
  navigator.clipboard.writeText(address);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-3xl">📡</span>
        <div>
          <h2 class="text-xl font-semibold">Event Explorer</h2>
          <p class="text-sm text-slate-400">Query smart contract event logs on-chain</p>
        </div>
      </div>
      
      <!-- Input Form -->
      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Contract Address -->
        <div>
          <label class="mb-1 block text-sm text-slate-400">Contract Address</label>
          <input
            v-model="contractAddress"
            type="text"
            placeholder="0x..."
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <!-- Event Signature -->
        <div>
          <label class="mb-1 block text-sm text-slate-400">Event Signature</label>
          <input
            v-model="eventSignature"
            type="text"
            placeholder="Event(address,uint256)"
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <!-- From Block -->
        <div>
          <label class="mb-1 block text-sm text-slate-400">From Block</label>
          <input
            v-model="fromBlock"
            type="text"
            placeholder="latest or block number"
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <!-- To Block -->
        <div>
          <label class="mb-1 block text-sm text-slate-400">To Block</label>
          <input
            v-model="toBlock"
            type="text"
            placeholder="latest or block number"
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-4 flex gap-3">
        <button
          :disabled="isLoading"
          class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-2.5 font-semibold transition-all hover:scale-105 disabled:opacity-50"
          @click="fetchLogs"
        >
          <span v-if="isLoading" class="animate-spin">⏳</span>
          <span v-else>🔍</span>
          {{ isLoading ? 'Fetching...' : 'Fetch Events' }}
        </button>
        
        <button
          class="rounded-xl border border-slate-600 bg-slate-700/50 px-6 py-2.5 font-semibold transition-all hover:bg-slate-600"
          @click="clearResults"
        >
          🗑️ Clear
        </button>

        <button
          v-if="logs.length > 0"
          class="rounded-xl border border-slate-600 bg-slate-700/50 px-6 py-2.5 font-semibold transition-all hover:bg-slate-600"
          @click="exportLogs"
        >
          📥 Export JSON
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-4 border border-red-500/50 rounded-lg bg-red-500/20 p-4 text-red-300">
        {{ error }}
      </div>
    </div>

    <!-- Common Events -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <h3 class="mb-3 text-lg font-semibold">⚡ Common Events</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="event in commonEvents"
          :key="event.name"
          class="rounded-lg bg-slate-900/50 px-3 py-1.5 text-sm transition-colors hover:bg-purple-500/20"
          :class="eventSignature === event.signature ? 'bg-purple-500/30 text-purple-400' : 'text-slate-400'"
          @click="selectEvent(event)"
          :title="event.description"
        >
          {{ event.name }}
        </button>
      </div>
    </div>

    <!-- Results -->
    <div v-if="parsedLogs.length > 0" class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          📊 Results <span class="text-purple-400">({{ parsedLogs.length }} events)</span>
        </h3>
      </div>

      <!-- Logs Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-700 text-slate-400">
              <th class="pb-3 text-left font-medium">#</th>
              <th class="pb-3 text-left font-medium">Block</th>
              <th class="pb-3 text-left font-medium">Tx Hash</th>
              <th class="pb-3 text-left font-medium">Topics</th>
              <th class="pb-3 text-left font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(log, index) in parsedLogs"
              :key="index"
              class="border-b border-slate-700/50 hover:bg-slate-700/30"
            >
              <td class="py-3 text-slate-400">{{ index + 1 }}</td>
              <td class="py-3 font-mono text-blue-400">{{ formatBlockNumber(log.blockNumber || log.block_number || 'N/A') }}</td>
              <td class="py-3 font-mono text-green-400">
                <button
                  class="hover:text-purple-400"
                  @click="copyAddress(log.transactionHash || log.transaction_hash)"
                  :title="log.transactionHash || log.transaction_hash"
                >
                  {{ (log.transactionHash || log.transaction_hash || '').slice(0, 10) }}...
                </button>
              </td>
              <td class="py-3 font-mono text-xs">
                <div class="space-y-1">
                  <div v-for="(topic, i) in log.topics" :key="i" class="text-yellow-400 truncate max-w-[200px]">
                    {{ topic }}
                  </div>
                </div>
              </td>
              <td class="py-3 font-mono text-xs text-slate-500 max-w-[150px] truncate">
                {{ log.data }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading && !error" class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-12 text-center backdrop-blur-xl">
      <div class="mb-4 text-5xl">📡</div>
      <p class="text-slate-400">Enter a contract address and event signature to query events</p>
    </div>
  </div>
</template>
