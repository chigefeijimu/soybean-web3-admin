<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

const { provider } = useWeb3();

// State
const txHash = ref('');
const inputData = ref('');
const mode = ref<'tx' | 'input' | 'storage'>('tx');
const storageSlot = ref('0');
const storageValue = ref('');
const isLoading = ref(false);
const result = ref<any>(null);
const error = ref('');

// Common function selectors (4bytes)
const knownSelectors: Record<string, { name: string; signature: string }> = {
  '0xa9059cbb': { name: 'transfer', signature: 'transfer(address to, uint256 amount)' },
  '0x23b872dd': { name: 'transferFrom', signature: 'transferFrom(address from, address to, uint256 amount)' },
  '0x095ea7b3': { name: 'approve', signature: 'approve(address spender, uint256 amount)' },
  '0x095ea7b3000000000000000000000000': { name: 'approve (packed)', signature: 'approve(address spender, uint256 amount)' },
  '0x313ce567': { name: 'decimals', signature: 'decimals()' },
  '0x06fdde03': { name: 'name', signature: 'name()' },
  '0x95d89b41': { name: 'symbol', signature: 'symbol()' },
  '0x18160ddd': { name: 'totalSupply', signature: 'totalSupply()' },
  '0x70a08231': { name: 'balanceOf', signature: 'balanceOf(address account)' },
  '0x8c5be1e5': { name: 'Approval', signature: 'Approval(address owner, address spender, uint256 value)' },
  '0xddf252ad': { name: 'Transfer', signature: 'Transfer(address from, address to, uint256 amount)' },
  '0x1f4f0780': { name: 'setApprovalForAll', signature: 'setApprovalForAll(address operator, bool approved)' },
  '0xe985e9c5': { name: 'setApprovalForAll (event)', signature: 'SetApprovalForAll(address owner, address operator, bool approved)' },
  '0xb88d4fde': { name: 'safeTransferFrom', signature: 'safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)' },
  '0xf242432a': { name: 'safeTransferFrom (1155)', signature: 'safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)' },
  '0x2eb2c2d6': { name: 'Swap', signature: 'Swap(address sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address to)' },
  '0x4f3786d2': { name: 'Mint', signature: 'Mint(address sender, uint256 amount0, uint256 amount1)' },
  '0x0dfe1681': { name: 'Sync', signature: 'Sync(uint112 reserve0, uint112 reserve1)' },
  '0xd78ad95f': { name: 'uniswapV3Swap', signature: 'uniswapV3Swap(uint256 amountOutMinimum, path[], address to)' },
  '0x414bf389': { name: 'exactInputSingle', signature: 'exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,address,uint256))' },
  '0x04e45aaf': { name: 'exactInput', signature: 'exactInput((bytes,address,uint256,uint256,uint256))' },
  '0x5c60da1b': { name: 'initialize', signature: 'initialize(address)' },
  '0x026e9ced': { name: 'factory', signature: 'factory()' },
  '0xfc0c546a': { name: 'token0', signature: 'token0()' },
  '0x0d4cd7c1': { name: 'token1', signature: 'token1()' },
  '0x8907b2a4': { name: 'getReserves', signature: 'getReserves()' }
};

// Decode input data
function decodeInputData(data: string): any {
  if (!data || data === '0x') {
    return { type: 'empty', description: 'Empty data' };
  }

  const cleanData = data.startsWith('0x') ? data : '0x' + data;
  
  if (cleanData.length < 10) {
    return { type: 'insufficient', description: 'Data too short for function selector' };
  }

  const selector = cleanData.substring(0, 10);
  const params = cleanData.substring(10);

  // Check known selectors
  const known = knownSelectors[selector];
  if (known) {
    const decodedParams = decodeParameters(params, known.signature);
    return {
      type: 'known',
      selector,
      function: known.name,
      signature: known.signature,
      parameters: decodedParams
    };
  }

  // Try to decode as generic
  return {
    type: 'unknown',
    selector,
    rawData: params,
    description: 'Unknown function selector'
  };
}

// Decode parameters based on signature
function decodeParameters(params: string, signature: string): Record<string, any> {
  const result: Record<string, any> = {};
  
  // Extract parameter types from signature
  const paramTypes = signature.replace(/^[^\(]+\(/, '').replace(/\).*$/, '').split(',').map(s => s.trim());
  
  let offset = 0;
  paramTypes.forEach((type, index) => {
    if (offset * 2 >= params.length) return;
    
    const value = params.substring(offset * 2, (offset + 1) * 2);
    
    if (type.includes('address')) {
      result[`param${index}`] = '0x' + params.substring(offset * 2 + 24, (offset + 1) * 2);
      offset += 12; // 12 bytes for address
    } else if (type.includes('uint256') || type.includes('uint128') || type.includes('uint64')) {
      const hexValue = params.substring(offset * 2, (offset + 32) * 2);
      result[`param${index}`] = {
        hex: '0x' + hexValue,
        decimal: BigInt('0x' + hexValue).toString(),
        formatted: (Number(BigInt('0x' + hexValue)) / 1e18).toFixed(6)
      };
      offset += 32;
    } else if (type.includes('uint8')) {
      result[`param${index}`] = parseInt(params.substring(offset * 2, (offset + 1) * 2), 16);
      offset += 1;
    } else if (type.includes('bool')) {
      result[`param${index}`] = params.substring(offset * 2, (offset + 1) * 2) !== '00';
      offset += 1;
    } else if (type.includes('bytes')) {
      // For bytes, read length first
      const lenOffset = offset + 32;
      if (lenOffset * 2 <= params.length) {
        const len = parseInt(params.substring(lenOffset * 2, lenOffset * 2 + 64), 16);
        const dataStart = offset + 64;
        result[`param${index}`] = '0x' + params.substring(dataStart * 2, (dataStart + len) * 2);
        offset += 32 + Math.ceil(len / 32) * 32;
      } else {
        offset += 32;
      }
    } else {
      result[`param${index}`] = '0x' + params.substring(offset * 2, (offset + 32) * 2);
      offset += 32;
    }
  });

  return result;
}

// Format address
function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
}

// Format hex value
function formatHex(hex: string): string {
  if (!hex) return '';
  const value = BigInt(hex);
  return value.toString();
}

// Decode transaction
async function decodeTransaction() {
  error.value = '';
  result.value = null;
  isLoading.value = true;

  try {
    let dataToDecode = '';

    if (mode.value === 'tx' && txHash.value) {
      if (!provider.value) {
        throw new Error('Provider not available');
      }
      
      const tx = await provider.value.getTransaction(txHash.value);
      if (!tx) {
        throw new Error('Transaction not found');
      }
      
      dataToDecode = tx.data || tx.input || '0x';
      result.value = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value?.toString(),
        gasPrice: tx.gasPrice?.toString(),
        gasLimit: tx.gas?.toString(),
        nonce: tx.nonce,
        chainId: tx.chainId,
        data: tx.data || tx.input || '0x'
      };
    } else if (mode.value === 'input') {
      dataToDecode = inputData.value;
    } else {
      // Storage mode - handled separately
      isLoading.value = false;
      return;
    }

    const decoded = decodeInputData(dataToDecode);
    if (result.value) {
      result.value.decoded = decoded;
    } else {
      result.value = decoded;
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to decode';
  } finally {
    isLoading.value = false;
  }
}

// Query storage
async function queryStorage() {
  error.value = '';
  result.value = null;
  isLoading.value = true;

  try {
    if (!provider.value) {
      throw new Error('Provider not available');
    }

    const slot = storageSlot.value.startsWith('0x') ? storageSlot.value : '0x' + storageSlot.value;
    const value = await provider.value.getStorageAt(txHash.value || undefined, slot);
    storageValue.value = value || '0x';
    
    result.value = {
      type: 'storage',
      contract: txHash.value,
      slot: slot,
      value: value,
      decoded: {
        hex: value,
        bytes32: value
      }
    };
  } catch (e: any) {
    error.value = e.message || 'Failed to query storage';
  } finally {
    isLoading.value = false;
  }
}

// Get decoded data for display
const decodedData = computed(() => {
  if (!result.value) return null;
  
  if (result.value.decoded) {
    return result.value.decoded;
  }
  
  return result.value;
});
</script>

<template>
  <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
    <div class="mb-6 flex items-center gap-3">
      <span class="text-2xl">🔓</span>
      <div>
        <h2 class="text-xl font-bold text-white">Transaction Decoder</h2>
        <p class="text-sm text-slate-400">Decode transaction data, function selectors & storage</p>
      </div>
    </div>

    <!-- Mode Selection -->
    <div class="mb-4 flex gap-2">
      <button
        v-for="m in [{ id: 'tx', label: 'Transaction' }, { id: 'input', label: 'Input Data' }, { id: 'storage', label: 'Storage' }]"
        :key="m.id"
        :class="[
          'rounded-lg px-4 py-2 text-sm font-medium transition-all',
          mode === m.id
            ? 'bg-purple-600 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        ]"
        @click="mode = m.id as any; result = null; error = ''"
      >
        {{ m.label }}
      </button>
    </div>

    <!-- Transaction Hash Input -->
    <div v-if="mode !== 'input'" class="mb-4">
      <label class="mb-2 block text-sm text-slate-400">Contract/Transaction Address</label>
      <input
        v-model="txHash"
        placeholder="0x... (tx hash or contract address for storage)"
        class="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      />
    </div>

    <!-- Input Data Input -->
    <div v-if="mode === 'input'" class="mb-4">
      <label class="mb-2 block text-sm text-slate-400">Input Data (hex)</label>
      <textarea
        v-model="inputData"
        placeholder="0xa9059cbb000000000000000000000000..."
        rows="3"
        class="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white font-mono text-sm placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      />
    </div>

    <!-- Storage Slot Input -->
    <div v-if="mode === 'storage'" class="mb-4">
      <label class="mb-2 block text-sm text-slate-400">Storage Slot (hex)</label>
      <input
        v-model="storageSlot"
        placeholder="0x0, 0x1, 0x..."
        class="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white font-mono placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      />
    </div>

    <!-- Decode Button -->
    <button
      :disabled="isLoading || (mode !== 'storage' && !txHash && !inputData)"
      class="mb-6 w-full rounded-lg bg-purple-600 py-3 font-medium text-white transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
      @click="mode === 'storage' ? queryStorage() : decodeTransaction()"
    >
      {{ isLoading ? 'Decoding...' : mode === 'storage' ? 'Query Storage' : 'Decode Transaction' }}
    </button>

    <!-- Error -->
    <div v-if="error" class="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400">
      {{ error }}
    </div>

    <!-- Result -->
    <div v-if="result" class="space-y-4">
      <!-- Transaction Details -->
      <div v-if="result.hash" class="rounded-lg border border-slate-600 bg-slate-700/30 p-4">
        <h3 class="mb-3 text-sm font-semibold text-purple-400">Transaction Details</h3>
        <div class="grid gap-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-400">Hash:</span>
            <span class="font-mono text-white">{{ formatAddress(result.hash) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">From:</span>
            <span class="font-mono text-white">{{ formatAddress(result.from) }}</span>
          </div>
          <div v-if="result.to" class="flex justify-between">
            <span class="text-slate-400">To:</span>
            <span class="font-mono text-white">{{ formatAddress(result.to) }}</span>
          </div>
          <div v-if="result.value" class="flex justify-between">
            <span class="text-slate-400">Value:</span>
            <span class="text-white">{{ (Number(result.value) / 1e18).toFixed(6) }} ETH</span>
          </div>
          <div v-if="result.gasPrice" class="flex justify-between">
            <span class="text-slate-400">Gas Price:</span>
            <span class="text-white">{{ (Number(result.gasPrice) / 1e9).toFixed(4) }} Gwei</span>
          </div>
          <div v-if="result.nonce" class="flex justify-between">
            <span class="text-slate-400">Nonce:</span>
            <span class="text-white">{{ result.nonce }}</span>
          </div>
        </div>
      </div>

      <!-- Decoded Data -->
      <div v-if="decodedData" class="rounded-lg border border-slate-600 bg-slate-700/30 p-4">
        <h3 class="mb-3 text-sm font-semibold text-purple-400">
          {{ decodedData.type === 'storage' ? 'Storage Value' : 'Decoded Data' }}
        </h3>

        <!-- Storage Result -->
        <div v-if="decodedData.type === 'storage'" class="font-mono text-sm">
          <div class="mb-2">
            <span class="text-slate-400">Slot:</span>
            <span class="ml-2 text-white">{{ decodedData.slot }}</span>
          </div>
          <div>
            <span class="text-slate-400">Value:</span>
            <span class="ml-2 break-all text-green-400">{{ decodedData.value }}</span>
          </div>
        </div>

        <!-- Known Function -->
        <div v-else-if="decodedData.type === 'known'" class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="rounded bg-green-500/20 px-2 py-1 text-xs font-bold text-green-400">KNOWN</span>
            <span class="font-mono text-white">{{ decodedData.function }}</span>
          </div>
          <div class="text-xs text-slate-400">{{ decodedData.signature }}</div>
          <div class="font-mono text-sm">
            <div class="mb-2">
              <span class="text-slate-400">Selector:</span>
              <span class="ml-2 text-yellow-400">{{ decodedData.selector }}</span>
            </div>
            <div v-if="decodedData.parameters" class="mt-3 space-y-2">
              <div class="text-slate-400">Parameters:</div>
              <div v-for="(value, key) in decodedData.parameters" :key="key" class="ml-4 flex flex-wrap items-center gap-2">
                <span class="text-purple-400">{{ key }}:</span>
                <span v-if="typeof value === 'object' && value.hex" class="text-white">
                  {{ value.hex }} ({{ value.formatted }})
                </span>
                <span v-else-if="typeof value === 'object'" class="text-white">{{ JSON.stringify(value) }}</span>
                <span v-else class="text-white">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Unknown Function -->
        <div v-else-if="decodedData.type === 'unknown'" class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="rounded bg-yellow-500/20 px-2 py-1 text-xs font-bold text-yellow-400">UNKNOWN</span>
          </div>
          <div class="font-mono text-sm">
            <div class="mb-2">
              <span class="text-slate-400">Selector:</span>
              <span class="ml-2 text-yellow-400">{{ decodedData.selector }}</span>
            </div>
            <div v-if="decodedData.rawData" class="break-all">
              <span class="text-slate-400">Raw Data:</span>
              <div class="mt-1 text-white">{{ decodedData.rawData }}</div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="decodedData.type === 'empty'" class="text-slate-400">
          {{ decodedData.description }}
        </div>
      </div>

      <!-- Raw Data -->
      <div v-if="result.data && mode !== 'storage'" class="rounded-lg border border-slate-600 bg-slate-700/30 p-4">
        <h3 class="mb-3 text-sm font-semibold text-purple-400">Raw Data</h3>
        <pre class="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-slate-300">{{ result.data }}</pre>
      </div>
    </div>

    <!-- Known Selectors Reference -->
    <div class="mt-6 border-t border-slate-700 pt-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-400">Common Function Selectors</h3>
      <div class="grid gap-2 text-xs font-mono sm:grid-cols-2">
        <div v-for="(info, selector) in knownSelectors" :key="selector" class="rounded bg-slate-700/30 p-2">
          <span class="text-yellow-400">{{ selector }}</span>
          <span class="ml-2 text-purple-400">{{ info.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
