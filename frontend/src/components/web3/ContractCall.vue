<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWeb3 } from '@/composables/web3/useWeb3'
import { encodeFunctionData, decodeFunctionResult, parseEther, formatEther, type Address, type Hex } from 'viem'

const props = defineProps<{
  contractAddress?: string
  abi?: any[]
}>()

const emit = defineEmits<{
  (e: 'success', data: any): void
  (e: 'error', error: string): void
}>()

const { account, chainId } = useWeb3()

const contractAddress = ref(props.contractAddress || '')
const selectedMethod = ref('')
const params = ref<string[]>([])
const result = ref<any>(null)
const isLoading = ref(false)
const error = ref('')

// Sample ABI methods
const sampleMethods = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', outputs: [{ type: 'uint256' }] },
  { name: 'name', type: 'function', stateMutability: 'view', outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', outputs: [{ type: 'uint8' }] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
]

const currentMethod = computed(() => 
  sampleMethods.find(m => m.name === selectedMethod.value)
)

const paramInputs = computed(() => {
  if (!currentMethod.value?.inputs) return []
  return currentMethod.value.inputs.map((input, index) => ({
    name: input.name || `param${index}`,
    type: input.type,
    value: params.value[index] || '',
  }))
})

const isWriteMethod = computed(() => 
  currentMethod.value?.type === 'function' && 
  !currentMethod.value.outputs?.length
)

const validateAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

const validateUint = (value: string): boolean => {
  return /^\d+$/.test(value)
}

const validateParams = (): boolean => {
  if (!contractAddress.value || !validateAddress(contractAddress.value)) {
    error.value = 'Invalid contract address'
    return false
  }
  
  for (const param of paramInputs.value) {
    if (param.type === 'address' && !validateAddress(param.value)) {
      error.value = `Invalid ${param.name}: must be a valid address`
      return false
    }
    if (param.type.startsWith('uint') && !validateUint(param.value)) {
      error.value = `Invalid ${param.name}: must be a positive integer`
      return false
    }
  }
  
  return true
}

const encodeFunctionCall = (): Hex => {
  if (!currentMethod.value) return '0x'
  
  try {
    // Build ABI parameters from current method
    const abiItem = {
      name: currentMethod.value.name,
      type: 'function',
      inputs: currentMethod.value.inputs || [],
      outputs: currentMethod.value.outputs || [],
      stateMutability: currentMethod.value.stateMutability || 'view'
    }
    
    // Parse parameters based on type
    const parsedParams = params.value.map((p, i) => {
      const type = currentMethod.value?.inputs?.[i]?.type || 'uint256'
      if (type === 'address') {
        return p as Address
      }
      if (type.startsWith('uint')) {
        return BigInt(p)
      }
      if (type.startsWith('int')) {
        return BigInt(p)
      }
      if (type === 'bool') {
        return p === 'true' || p === '1'
      }
      if (type === 'bytes') {
        return p as Hex
      }
      return p
    })
    
    // Use viem's encodeFunctionData for proper ABI encoding
    return encodeFunctionData({
      abi: [abiItem],
      functionName: currentMethod.value.name,
      args: parsedParams
    })
  } catch (e) {
    console.error('Failed to encode function call:', e)
    return '0x'
  }
}

const executeRead = async () => {
  if (!validateParams()) return
  
  isLoading.value = true
  error.value = ''
  result.value = null
  
  try {
    if (!(window as any).ethereum) {
      throw new Error('No Ethereum provider found')
    }
    
    const data = encodeFunctionCall()
    
    const response = await (window as any).ethereum.request({
      method: 'eth_call',
      params: [{
        to: contractAddress.value,
        data: data,
      }, 'latest']
    })
    
    // Parse result using viem's decoder
    try {
      const decoded = decodeFunctionResult({
        abi: [currentMethod.value],
        functionName: currentMethod.value.name,
        data: response
      })
      // Format the result for display
      if (typeof decoded === 'bigint') {
        result.value = decoded.toString()
      } else if (Array.isArray(decoded)) {
        result.value = decoded.map(d => typeof d === 'bigint' ? d.toString() : d).join(', ')
      } else {
        result.value = String(decoded)
      }
    } catch (e) {
      // Fallback to manual parsing if decode fails
      console.warn('Failed to decode result, using raw response:', e)
      if (currentMethod.value?.outputs?.[0]) {
        const outputType = currentMethod.value.outputs[0].type
        if (outputType === 'uint256' || outputType.startsWith('uint')) {
          result.value = BigInt(response).toString()
        } else {
          result.value = response
        }
      } else {
        result.value = response
      }
    }
    
    emit('success', { method: selectedMethod.value, result: result.value })
  } catch (e: any) {
    error.value = e.message || 'Call failed'
    emit('error', error.value)
  } finally {
    isLoading.value = false
  }
}

const executeWrite = async () => {
  if (!account.value) {
    error.value = 'Please connect wallet first'
    return
  }
  
  if (!validateParams()) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    if (!(window as any).ethereum) {
      throw new Error('No Ethereum provider found')
    }
    
    const data = encodeFunctionCall()
    
    // Get gas estimate
    const gasEstimate = await (window as any).ethereum.request({
      method: 'eth_estimateGas',
      params: [{
        from: account.value,
        to: contractAddress.value,
        data: data,
      }]
    })
    
    // Send transaction
    const txHash = await (window as any).ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: account.value,
        to: contractAddress.value,
        data: data,
        gas: BigInt(Number(gasEstimate) * 120 / 100).toString(16), // Add 20% buffer
      }]
    })
    
    result.value = { transactionHash: txHash }
    emit('success', { method: selectedMethod.value, txHash })
  } catch (e: any) {
    error.value = e.message || 'Transaction failed'
    emit('error', error.value)
  } finally {
    isLoading.value = false
  }
}

const addParam = () => {
  params.value.push('')
}

const removeParam = (index: number) => {
  params.value.splice(index, 1)
}

const reset = () => {
  selectedMethod.value = ''
  params.value = []
  result.value = null
  error.value = ''
}
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Contract Call</h2>
      <button 
        @click="reset"
        class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
      >
        Reset
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex justify-between items-center">
      <span class="text-red-300 text-sm">{{ error }}</span>
      <button @click="error = ''" class="text-red-400 hover:text-white">✕</button>
    </div>

    <!-- Contract Address -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-slate-400 mb-2">
        Contract Address
      </label>
      <input 
        v-model="contractAddress"
        type="text"
        placeholder="0x..."
        class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
      />
    </div>

    <!-- Method Selector -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-slate-400 mb-2">
        Select Method
      </label>
      <select 
        v-model="selectedMethod"
        class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="">Choose a method...</option>
        <option v-for="method in sampleMethods" :key="method.name" :value="method.name">
          {{ method.name }} ({{ method.type }})
        </option>
      </select>
    </div>

    <!-- Parameters -->
    <div v-if="paramInputs.length > 0" class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-medium text-slate-400">Parameters</label>
        <button 
          @click="addParam"
          class="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
        >
          + Add Param
        </button>
      </div>
      
      <div class="space-y-3">
        <div 
          v-for="(param, index) in paramInputs" 
          :key="index"
          class="flex items-center gap-3"
        >
          <div class="flex-1">
            <input 
              v-model="params[index]"
              :type="param.type === 'uint256' ? 'number' : 'text'"
              :placeholder="`${param.name} (${param.type})`"
              class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
          </div>
          <button 
            @click="removeParam(index)"
            class="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
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
        @click="executeRead"
        :disabled="isLoading || !selectedMethod"
        class="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
      >
        {{ isLoading ? 'Reading...' : 'Read' }}
      </button>
      
      <button 
        v-else
        @click="executeWrite"
        :disabled="isLoading || !selectedMethod || !account"
        class="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
      >
        {{ isLoading ? 'Confirming...' : 'Write' }}
      </button>
    </div>

    <!-- Result -->
    <div v-if="result" class="mt-6 p-4 bg-slate-900/50 rounded-xl">
      <label class="block text-sm font-medium text-slate-400 mb-2">Result</label>
      <div class="font-mono text-sm break-all text-green-400">
        <pre>{{ JSON.stringify(result, null, 2) }}</pre>
      </div>
    </div>

    <!-- Quick Contract Templates -->
    <div class="mt-6 pt-6 border-t border-slate-700">
      <h3 class="text-sm font-medium text-slate-400 mb-3">Quick Templates</h3>
      <div class="grid grid-cols-2 gap-2">
        <button 
          @click="contractAddress = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'; selectedMethod = 'balanceOf'"
          class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-left transition-colors"
        >
          🟡 WBTC
        </button>
        <button 
          @click="contractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; selectedMethod = 'balanceOf'"
          class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-left transition-colors"
        >
          🔵 USDC
        </button>
        <button 
          @click="contractAddress = '0x6B175474E89094C44Da98b954Eebc90fE31f3a2a'; selectedMethod = 'balanceOf'"
          class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-left transition-colors"
        >
          🟠 DAI
        </button>
        <button 
          @click="contractAddress = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'; selectedMethod = 'balanceOf'"
          class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-left transition-colors"
        >
          🟣 AAVE
        </button>
      </div>
    </div>
  </div>
</template>
