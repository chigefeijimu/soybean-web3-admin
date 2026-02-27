<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { Button, Card, Input, Select, Space, Tag, Message, Modal } from 'naive-ui'
import { callContractMethod } from '@/service/api/web3'
import { parseEther, formatEther } from 'viem'

interface Contract {
  id: string
  name: string
  contractAddress: string
  chainId: number
  abi: string | null
  description: string | null
}

const props = defineProps<{
  contract: Contract
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const { address, isConnected, chainId: currentChainId } = useAccount()
const { writeContractAsync, isPending } = useWriteContract()

const methodName = ref('')
const params = ref('')
const value = ref('')
const loading = ref(false)
const txHash = ref('')

// Parse ABI to extract function names
const functions = computed(() => {
  try {
    if (!props.contract.abi) return []
    const abi = JSON.parse(props.contract.abi)
    return abi.filter((item: any) => item.type === 'function' && item.stateMutability !== 'view')
  } catch {
    return []
  }
})

const viewFunctions = computed(() => {
  try {
    if (!props.contract.abi) return []
    const abi = JSON.parse(props.contract.abi)
    return abi.filter((item: any) => item.type === 'function' && item.stateMutability === 'view')
  } catch {
    return []
  }
})

// Read contract (view functions)
const { data: readResult, isLoading: isReading, refetch: readContract } = useReadContract({
  address: props.contract.contractAddress as `0x${string}`,
  abi: props.contract.abi ? JSON.parse(props.contract.abi) : [],
  functionName: methodName.value,
  args: params.value ? JSON.parse(`[${params.value}]`) : undefined,
  query: {
    enabled: false
  }
})

const handleRead = async () => {
  if (!methodName.value) {
    Message.warning('Please select a method')
    return
  }
  
  try {
    await readContract()
    Message.success('Read successful')
  } catch (error: any) {
    Message.error(error.message || 'Read failed')
  }
}

// Write contract
const handleWrite = async () => {
  if (!isConnected.value) {
    Message.warning('Please connect wallet first')
    return
  }

  if (!methodName.value) {
    Message.warning('Please select a method')
    return
  }

  if (props.contract.chainId !== currentChainId.value) {
    Message.warning(`Please switch to chain ${props.contract.chainId}`)
    return
  }

  loading.value = true
  
  try {
    let args: any[] = []
    if (params.value) {
      args = JSON.parse(`[${params.value}]`)
    }
    
    const hash = await writeContractAsync({
      address: props.contract.contractAddress as `0x${string}`,
      abi: props.contract.abi ? JSON.parse(props.contract.abi) : [],
      functionName: methodName.value,
      args,
      value: value.value ? parseEther(value.value) : undefined
    })
    
    txHash.value = hash
    Message.success('Transaction submitted!')
    
    // Save to backend
    await callContractMethod(props.contract.id, {
      methodName: methodName.value,
      params: params.value,
      fromAddress: address.value,
      value: value.value
    })
    
    emit('success')
  } catch (error: any) {
    Message.error(error.message || 'Transaction failed')
  } finally {
    loading.value = false
  }
}

const copyTxHash = () => {
  if (txHash.value) {
    navigator.clipboard.writeText(txHash.value)
    Message.success('Copied!')
  }
}

const formatResult = (result: any) => {
  if (result === null || result === undefined) return 'null'
  if (typeof result === 'object') return JSON.stringify(result)
  if (typeof result === 'bigint') return result.toString()
  return String(result)
}
</script>

<template>
  <Card :title="contract.name" size="small" :bordered="false">
    <template #header-extra>
      <Tag :type="contract.chainId === currentChainId ? 'success' : 'warning'">
        Chain: {{ contract.chainId }}
      </Tag>
    </template>

    <div class="contract-call">
      <!-- Method Selection -->
      <div class="form-item">
        <label>Method:</label>
        <Select v-model:value="methodName" placeholder="Select method">
          <Select.Option v-for="fn in functions" :key="fn.name" :value="fn.name">
            {{ fn.name }} ({{ fn.stateMutability }})
          </Select.Option>
        </Select>
      </div>

      <!-- View Functions -->
      <div v-if="viewFunctions.length > 0" class="view-functions">
        <div class="section-title">View Functions</div>
        <Space vertical style="width: 100%">
          <Select v-model:value="methodName" placeholder="Select view method">
            <Select.Option v-for="fn in viewFunctions" :key="fn.name" :value="fn.name">
              {{ fn.name }}
            </Select.Option>
          </Select>
          <Button :loading="isReading" @click="handleRead">Read</Button>
        </Space>
        
        <div v-if="readResult !== undefined" class="result">
          <div class="result-label">Result:</div>
          <div class="result-value">{{ formatResult(readResult) }}</div>
        </div>
      </div>

      <!-- Write Function -->
      <div class="form-item">
        <label>Params (JSON array):</label>
        <Input 
          v-model:value="params" 
          placeholder='["param1", "param2"]' 
          :disabled="!isConnected"
        />
      </div>

      <div class="form-item">
        <label>Value (ETH):</label>
        <Input 
          v-model:value="value" 
          placeholder="0.0" 
          type="number"
          :disabled="!isConnected"
        />
      </div>

      <Button 
        type="primary" 
        block 
        :loading="loading || isPending"
        :disabled="!isConnected"
        @click="handleWrite"
      >
        {{ isConnected ? (isPending ? 'Confirm in Wallet...' : 'Send Transaction') : 'Connect Wallet First' }}
      </Button>

      <!-- Transaction Hash -->
      <div v-if="txHash" class="tx-hash">
        <div class="tx-label">Transaction Hash:</div>
        <div class="tx-value" @click="copyTxHash">
          {{ txHash.slice(0, 10) }}...{{ txHash.slice(-8) }}
        </div>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.contract-call {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.view-functions {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.section-title {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.result {
  margin-top: 12px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.result-label, .tx-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.result-value {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}

.tx-hash {
  margin-top: 8px;
  padding: 8px;
  background: #e6f7ff;
  border-radius: 4px;
}

.tx-value {
  font-family: monospace;
  font-size: 12px;
  cursor: pointer;
  word-break: break-all;
}

.tx-value:hover {
  color: #1890ff;
}
</style>
