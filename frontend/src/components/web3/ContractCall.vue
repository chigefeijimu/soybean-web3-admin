<script setup lang="ts">
import { computed, ref } from 'vue';
import { type Address, type Hex, decodeFunctionResult, encodeFunctionData, formatEther, parseEther } from 'viem';
import { callContractDirect } from '@/service/api/web3';
import { useWeb3 } from '@/composables/web3/useWeb3';

const props = defineProps<{
  contractAddress?: string;
  abi?: any[];
}>();

const emit = defineEmits<{
  (e: 'success', data: any): void;
  (e: 'error', error: string): void;
}>();

const { account, chainId } = useWeb3();

const contractAddress = ref(props.contractAddress || '');
const selectedMethod = ref('');
const params = ref<string[]>([]);
const result = ref<any>(null);
const isLoading = ref(false);
const error = ref('');
const useBackendApi = ref(false); // New: toggle between browser wallet and backend API

// Sample ABI methods
const sampleMethods = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', outputs: [{ type: 'uint256' }] },
  { name: 'name', type: 'function', stateMutability: 'view', outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', outputs: [{ type: 'uint8' }] },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  }
];

const currentMethod = computed(() => sampleMethods.find(m => m.name === selectedMethod.value));

const paramInputs = computed(() => {
  if (!currentMethod.value?.inputs) return [];
  return currentMethod.value.inputs.map((input, index) => ({
    name: input.name || `param${index}`,
    type: input.type,
    value: params.value[index] || ''
  }));
});

const isWriteMethod = computed(() => currentMethod.value?.type === 'function' && !currentMethod.value.outputs?.length);

const validateAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const validateUint = (value: string): boolean => {
  return /^\d+$/.test(value);
};

const validateParams = (): boolean => {
  if (!contractAddress.value || !validateAddress(contractAddress.value)) {
    error.value = 'Invalid contract address';
    return false;
  }

  for (const param of paramInputs.value) {
    if (param.type === 'address' && !validateAddress(param.value)) {
      error.value = `Invalid ${param.name}: must be a valid address`;
      return false;
    }
    if (param.type.startsWith('uint') && !validateUint(param.value)) {
      error.value = `Invalid ${param.name}: must be a positive integer`;
      return false;
    }
  }

  return true;
};

const encodeFunctionCall = (): Hex => {
  if (!currentMethod.value) return '0x';

  try {
    // Build ABI parameters from current method
    const abiItem = {
      name: currentMethod.value.name,
      type: 'function',
      inputs: currentMethod.value.inputs || [],
      outputs: currentMethod.value.outputs || [],
      stateMutability: currentMethod.value.stateMutability || 'view'
    };

    // Parse parameters based on type
    const parsedParams = params.value.map((p, i) => {
      const type = currentMethod.value?.inputs?.[i]?.type || 'uint256';
      if (type === 'address') {
        return p as Address;
      }
      if (type.startsWith('uint')) {
        return BigInt(p);
      }
      if (type.startsWith('int')) {
        return BigInt(p);
      }
      if (type === 'bool') {
        return p === 'true' || p === '1';
      }
      if (type === 'bytes') {
        return p as Hex;
      }
      return p;
    });

    // Use viem's encodeFunctionData for proper ABI encoding
    return encodeFunctionData({
      abi: [abiItem],
      functionName: currentMethod.value.name,
      args: parsedParams
    });
  } catch (e) {
    console.error('Failed to encode function call:', e);
    return '0x';
  }
};

const executeRead = async () => {
  if (!validateParams()) return;

  isLoading.value = true;
  error.value = '';
  result.value = null;

  try {
    if (useBackendApi.value) {
      // Use backend API (no wallet needed)
      const response = await callContractDirect({
        contractAddress: contractAddress.value,
        chainId: chainId.value || 1,
        methodName: selectedMethod.value,
        params: params.value[0] || undefined,
        fromAddress: account.value || undefined
      });

      if (response.data.success) {
        result.value = response.data.data.result;
        emit('success', { method: selectedMethod.value, result: result.value });
      } else {
        throw new Error(response.data.msg || 'Backend call failed');
      }
    } else {
      // Use browser wallet directly
      if (!(window as any).ethereum) {
        throw new Error('No Ethereum provider found');
      }

      const data = encodeFunctionCall();

      const response = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: contractAddress.value,
            data
          },
          'latest'
        ]
      });

      // Parse result using viem's decoder
      try {
        const method = currentMethod.value;
        if (!method) {
          result.value = response;
          return;
        }
        const decoded = decodeFunctionResult({
          abi: [method],
          functionName: method.name,
          data: response
        });
        // Format the result for display
        if (typeof decoded === 'bigint') {
          result.value = decoded.toString();
        } else if (Array.isArray(decoded)) {
          result.value = decoded.map(d => (typeof d === 'bigint' ? d.toString() : d)).join(', ');
        } else {
          result.value = String(decoded);
        }
      } catch (e) {
        // Fallback to manual parsing if decode fails
        console.warn('Failed to decode result, using raw response:', e);
        if (currentMethod.value?.outputs?.[0]) {
          const outputType = currentMethod.value.outputs[0].type;
          if (outputType === 'uint256' || outputType.startsWith('uint')) {
            result.value = BigInt(response).toString();
          } else {
            result.value = response;
          }
        } else {
          result.value = response;
        }
      }

      emit('success', { method: selectedMethod.value, result: result.value });
    }
  } catch (e: any) {
    error.value = e.message || 'Call failed';
    emit('error', error.value);
  } finally {
    isLoading.value = false;
  }
};

const executeWrite = async () => {
  if (!account.value) {
    error.value = 'Please connect wallet first';
    return;
  }

  if (!validateParams()) return;

  isLoading.value = true;
  error.value = '';

  try {
    if (!(window as any).ethereum) {
      throw new Error('No Ethereum provider found');
    }

    const data = encodeFunctionCall();

    // Get gas estimate
    const gasEstimate = await (window as any).ethereum.request({
      method: 'eth_estimateGas',
      params: [
        {
          from: account.value,
          to: contractAddress.value,
          data
        }
      ]
    });

    // Send transaction
    const txHash = await (window as any).ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: account.value,
          to: contractAddress.value,
          data,
          gas: BigInt((Number(gasEstimate) * 120) / 100).toString(16) // Add 20% buffer
        }
      ]
    });

    result.value = { transactionHash: txHash };
    emit('success', { method: selectedMethod.value, txHash });
  } catch (e: any) {
    error.value = e.message || 'Transaction failed';
    emit('error', error.value);
  } finally {
    isLoading.value = false;
  }
};

const addParam = () => {
  params.value.push('');
};

const removeParam = (index: number) => {
  params.value.splice(index, 1);
};

const reset = () => {
  selectedMethod.value = '';
  params.value = [];
  result.value = null;
  error.value = '';
};
</script>

<template>
  <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold">Contract Call</h2>
      <button class="rounded-lg bg-slate-700 px-4 py-2 text-sm transition-colors hover:bg-slate-600" @click="reset">
        Reset
      </button>
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="mb-6 flex items-center justify-between border border-red-500/50 rounded-lg bg-red-500/20 p-4"
    >
      <span class="text-sm text-red-300">{{ error }}</span>
      <button class="text-red-400 hover:text-white" @click="error = ''">✕</button>
    </div>

    <!-- Backend API Toggle -->
    <div class="mb-4 flex items-center justify-between rounded-xl bg-slate-900/30 p-4">
      <div>
        <label class="text-sm text-slate-300 font-medium">Use Backend API</label>
        <p class="text-xs text-slate-500">Call via server (no wallet needed for read)</p>
      </div>
      <button
        :class="useBackendApi ? 'bg-green-500' : 'bg-slate-600'"
        class="relative h-6 w-11 inline-flex items-center rounded-full transition-colors"
        @click="useBackendApi = !useBackendApi"
      >
        <span
          :class="useBackendApi ? 'translate-x-6' : 'translate-x-1'"
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        />
      </button>
    </div>

    <!-- Contract Address -->
    <div class="mb-4">
      <label class="mb-2 block text-sm text-slate-400 font-medium">Contract Address</label>
      <input
        v-model="contractAddress"
        type="text"
        placeholder="0x..."
        class="w-full border border-slate-700 rounded-xl bg-slate-900/50 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>

    <!-- Method Selector -->
    <div class="mb-4">
      <label class="mb-2 block text-sm text-slate-400 font-medium">Select Method</label>
      <select
        v-model="selectedMethod"
        class="w-full border border-slate-700 rounded-xl bg-slate-900/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="">Choose a method...</option>
        <option v-for="method in sampleMethods" :key="method.name" :value="method.name">
          {{ method.name }} ({{ method.type }})
        </option>
      </select>
    </div>

    <!-- Parameters -->
    <div v-if="paramInputs.length > 0" class="mb-6">
      <div class="mb-2 flex items-center justify-between">
        <label class="text-sm text-slate-400 font-medium">Parameters</label>
        <button
          class="rounded-lg bg-purple-500/20 px-3 py-1 text-sm text-purple-400 transition-colors hover:bg-purple-500/30"
          @click="addParam"
        >
          + Add Param
        </button>
      </div>

      <div class="space-y-3">
        <div v-for="(param, index) in paramInputs" :key="index" class="flex items-center gap-3">
          <div class="flex-1">
            <input
              v-model="params[index]"
              :type="param.type === 'uint256' ? 'number' : 'text'"
              :placeholder="`${param.name} (${param.type})`"
              class="w-full border border-slate-700 rounded-xl bg-slate-900/50 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            class="rounded-xl bg-red-500/20 p-3 text-red-400 transition-colors hover:bg-red-500/30"
            @click="removeParam(index)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Execute Button -->
    <div class="flex gap-3">
      <button
        v-if="!isWriteMethod"
        :disabled="isLoading || !selectedMethod"
        class="flex-1 rounded-xl bg-blue-500 py-3 font-semibold transition-colors disabled:cursor-not-allowed hover:bg-blue-600 disabled:opacity-50"
        @click="executeRead"
      >
        {{ isLoading ? 'Reading...' : useBackendApi ? 'Call API' : 'Read' }}
      </button>

      <button
        v-else
        :disabled="isLoading || !selectedMethod || !account"
        class="flex-1 rounded-xl bg-green-500 py-3 font-semibold transition-colors disabled:cursor-not-allowed hover:bg-green-600 disabled:opacity-50"
        @click="executeWrite"
      >
        {{ isLoading ? 'Confirming...' : 'Write' }}
      </button>
    </div>

    <!-- Result -->
    <div v-if="result" class="mt-6 rounded-xl bg-slate-900/50 p-4">
      <label class="mb-2 block text-sm text-slate-400 font-medium">Result</label>
      <div class="break-all text-sm text-green-400 font-mono">
        <pre>{{ JSON.stringify(result, null, 2) }}</pre>
      </div>
    </div>

    <!-- Quick Contract Templates -->
    <div class="mt-6 border-t border-slate-700 pt-6">
      <h3 class="mb-3 text-sm text-slate-400 font-medium">Quick Templates</h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          class="rounded-lg bg-slate-700 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-600"
          @click="
            contractAddress = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
            selectedMethod = 'balanceOf';
          "
        >
          🟡 WBTC
        </button>
        <button
          class="rounded-lg bg-slate-700 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-600"
          @click="
            contractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
            selectedMethod = 'balanceOf';
          "
        >
          🔵 USDC
        </button>
        <button
          class="rounded-lg bg-slate-700 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-600"
          @click="
            contractAddress = '0x6B175474E89094C44Da98b954Eebc90fE31f3a2a';
            selectedMethod = 'balanceOf';
          "
        >
          🟠 DAI
        </button>
        <button
          class="rounded-lg bg-slate-700 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-600"
          @click="
            contractAddress = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';
            selectedMethod = 'balanceOf';
          "
        >
          🟣 AAVE
        </button>
      </div>
    </div>
  </div>
</template>
