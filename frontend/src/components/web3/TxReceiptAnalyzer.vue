<script setup lang="ts">
import { ref, computed } from 'vue';
// import removed;

interface TxAnalysis {
  txHash: string;
  chain: string;
  status: 'success' | 'failure';
  blockNumber: number;
  gasUsed: number;
  gasPrice: number;
  effectiveGasPrice: number;
  totalFee: string;
  from: string;
  to: string;
  contractAddress: string | null;
  logs: Array<{
    name: string;
    signature: string;
    params: Array<{ name: string; value: string; type: string }>;
  }>;
  decodedInput: {
    methodId: string;
    functionName: string;
    params: Array<{ name: string; value: string; type: string }>;
  } | null;
  timestamp: string;
  isContractCreation: boolean;
  isEIP1559: boolean;
  transactionType: string;
}

const chains = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'bsc', label: 'BSC' },
  { value: 'avalanche', label: 'Avalanche' },
  { value: 'base', label: 'Base' },
];

const txHash = ref('');
const selectedChain = ref('ethereum');
const isLoading = ref(false);
const result = ref<TxAnalysis | null>(null);
const error = ref('');

async function analyzeTx() {
  if (!txHash.value) {
    message.warning('Please enter transaction hash');
    return;
  }
  
  if (!txHash.value.startsWith('0x') || txHash.value.length !== 66) {
    message.error('Invalid transaction hash format');
    return;
  }

  isLoading.value = true;
  error.value = '';
  result.value = null;

  try {
    const response = await fetch(
      `/api/web3/tx-receipt-analyzer/analyze?txHash=${txHash.value}&chain=${selectedChain.value}`
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to analyze transaction');
    }
    result.value = await response.json();
    message.success('Transaction analyzed successfully');
  } catch (err: any) {
    error.value = err.message;
    message.error(err.message);
  } finally {
    isLoading.value = false;
  }
}

function formatAddress(addr: string): string {
  if (!addr) return '-';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  message.success('Copied to clipboard');
}

const statusColor = computed(() => {
  if (!result.value) return '';
  return result.value.status === 'success' ? '#52c41a' : '#ff4d4f';
});

const statusText = computed(() => {
  if (!result.value) return '';
  return result.value.status === 'success' ? 'Success' : 'Failed';
});
</script>

<template>
  <div class="tx-receipt-analyzer">
    <a-card title="Transaction Receipt Analyzer" :bordered="false">
      <template #extra>
        <span color="blue">Multi-chain</span>
      </template>

      <a-space direction="vertical" :size="16" style="width: 100%">
        <!-- Input Section -->
        <a-space :size="12">
          <a-select
            v-model:value="selectedChain"
            :options="chains"
            style="width: 140px"
            placeholder="Select Chain"
          />
          <a-input
            v-model:value="txHash"
            placeholder="Enter transaction hash (0x...)"
            style="width: 400px"
            @pressEnter="analyzeTx"
          />
          <a-button type="primary" :loading="isLoading" @click="analyzeTx">
            Analyze
          </a-button>
        </a-space>

        <!-- Sample Transactions -->
        <a-space>
          <span class="text-gray-500">Sample:</span>
          <span 
            class="cursor-pointer" 
            @click="txHash = '0xd0c30e6bc8c5ebdd3b16b4c3a7b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b'; selectedChain = 'ethereum'"
          >
            ETH Transfer
          </span>
          <span 
            class="cursor-pointer"
            @click="txHash = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d000000000000000000000000'; selectedChain = 'ethereum'"
          >
            Uniswap Swap
          </span>
        </a-space>

        <!-- Error Display -->
        <a-alert v-if="error" type="error" :message="error" show-icon closable />

        <!-- Results -->
        <template v-if="result">
          <!-- Status Banner -->
          <a-alert
            :type="result.status === 'success' ? 'success' : 'error'"
            :message="`Transaction ${statusText}`"
            show-icon
          >
            <template #description>
              <a-descriptions :column="4" size="small">
                <a-descriptions-item label="Tx Hash">
                  <a-tooltip :title="result.txHash">
                    <span class="font-mono cursor-pointer" @click="copyToClipboard(result.txHash)">
                      {{ formatAddress(result.txHash) }}
                    </span>
                  </a-tooltip>
                </a-descriptions-item>
                <a-descriptions-item label="Block">
                  #{{ formatNumber(result.blockNumber) }}
                </a-descriptions-item>
                <a-descriptions-item label="Chain">
                  {{ result.chain }}
                </a-descriptions-item>
                <a-descriptions-item label="Time">
                  {{ new Date(result.timestamp).toLocaleString() }}
                </a-descriptions-item>
              </a-descriptions>
            </template>
          </a-alert>

          <!-- Transaction Details -->
          <a-row :gutter="16">
            <!-- Basic Info -->
            <a-col :span="12">
              <a-card title="Transaction Details" size="small">
                <a-descriptions :column="2" size="small" bordered>
                  <a-descriptions-item label="From">
                    <a-tooltip :title="result.from">
                      <span 
                        class="font-mono cursor-pointer" 
                        @click="copyToClipboard(result.from)"
                      >
                        {{ formatAddress(result.from) }}
                      </span>
                    </a-tooltip>
                  </a-descriptions-item>
                  <a-descriptions-item label="To">
                    <a-tooltip :title="result.to">
                      <span 
                        class="font-mono cursor-pointer" 
                        @click="copyToClipboard(result.to)"
                      >
                        {{ formatAddress(result.to) }}
                      </span>
                    </a-tooltip>
                  </a-descriptions-item>
                  <a-descriptions-item label="Gas Used">
                    {{ formatNumber(result.gasUsed) }}
                  </a-descriptions-item>
                  <a-descriptions-item label="Gas Price">
                    {{ result.gasPrice.toFixed(2) }} Gwei
                  </a-descriptions-item>
                  <a-descriptions-item label="Total Fee">
                    {{ result.totalFee }} ETH
                  </a-descriptions-item>
                  <a-descriptions-item label="Tx Type">
                    <span :color="result.isEIP1559 ? 'blue' : 'default'">
                      {{ result.isEIP1559 ? 'EIP-1559' : 'Legacy' }}
                    </span>
                  </a-descriptions-item>
                  <a-descriptions-item v-if="result.contractAddress" label="Contract">
                    <a-tooltip :title="result.contractAddress">
                      <span 
                        class="font-mono cursor-pointer" 
                        @click="copyToClipboard(result.contractAddress!)"
                      >
                        {{ formatAddress(result.contractAddress!) }}
                      </span>
                    </a-tooltip>
                  </a-descriptions-item>
                </a-descriptions>
              </a-card>
            </a-col>

            <!-- Decoded Input -->
            <a-col :span="12">
              <a-card title="Decoded Input" size="small">
                <template v-if="result.decodedInput">
                  <a-descriptions :column="2" size="small" bordered>
                    <a-descriptions-item label="Method ID">
                      <span color="purple">{{ result.decodedInput.methodId }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="Function">
                      <span color="cyan">{{ result.decodedInput.functionName }}</span>
                    </a-descriptions-item>
                  </a-descriptions>
                  
                  <a-divider>Parameters</a-divider>
                  <a-table
                    :dataSource="result.decodedInput.params"
                    :columns="[
                      { title: 'Name', dataIndex: 'name', key: 'name' },
                      { title: 'Value', dataIndex: 'value', key: 'value' },
                      { title: 'Type', dataIndex: 'type', key: 'type' },
                    ]"
                    :pagination="false"
                    size="small"
                    bordered
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'value'">
                        <span 
                          class="font-mono cursor-pointer" 
                          @click="copyToClipboard(record.value)"
                        >
                          {{ record.value.length > 20 ? formatAddress(record.value) : record.value }}
                        </span>
                      </template>
                    </template>
                  </a-table>
                </template>
                <a-empty v-else description="No input data to decode" />
              </a-card>
            </a-col>
          </a-row>

          <!-- Events Log -->
          <a-card title="Events Log" size="small" class="mt-4">
            <a-table
              :dataSource="result.logs"
              :columns="[
                { title: 'Event', dataIndex: 'name', key: 'name' },
                { title: 'Signature', dataIndex: 'signature', key: 'signature' },
                { title: 'Parameters', key: 'params' },
              ]"
              :pagination="{ pageSize: 10 }"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <span color="blue">{{ record.name }}</span>
                </template>
                <template v-if="column.key === 'signature'">
                  <span class="text-xs font-mono">{{ record.signature }}</span>
                </template>
                <template v-if="column.key === 'params'">
                  <a-space direction="vertical" :size="4">
                    <template v-for="(param, i) in record.params" :key="i">
                      <span>
                        <strong>{{ param.name }}:</strong>
                        <span 
                          class="font-mono ml-1 cursor-pointer" 
                          @click="copyToClipboard(param.value)"
                        >
                          {{ param.value.length > 20 ? formatAddress(param.value) : param.value }}
                        </span>
                      </span>
                    </template>
                  </a-space>
                </template>
              </template>
            </a-table>
            <a-empty v-if="result.logs.length === 0" description="No events in this transaction" />
          </a-card>

          <!-- Raw Data -->
          <a-card title="Raw Receipt Data" size="small" class="mt-4">
            <a-descriptions :column="2" size="small" bordered>
              <a-descriptions-item label="Block Hash">
                <span class="font-mono text-xs">{{ result.blockHash || '-' }}</span>
              </a-descriptions-item>
              <a-descriptions-item label="Transaction Index">
                {{ result.transactionIndex || '-' }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </template>

        <!-- Empty State -->
        <a-empty v-if="!result && !error && !isLoading" description="Enter a transaction hash to analyze" />
      </a-space>
    </a-card>
  </div>
</template>

<style scoped>
.tx-receipt-analyzer {
  width: 100%;
}

.font-mono {
  font-family: 'Monaco', 'Menlo', monospace;
}

.cursor-pointer {
  cursor: pointer;
}

.text-gray-500 {
  color: #8c8c8c;
}

.text-xs {
  font-size: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.ml-1 {
  margin-left: 4px;
}
</style>
