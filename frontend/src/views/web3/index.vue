<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAccount } from 'wagmi'
import { NCard, NGrid, NGridItem, NTabs, NTabPane } from 'naive-ui'
import ContractList from '@/views/web3/contract/index.vue'
import ContractCall from '@/components/web3/ContractCall.vue'
import TransactionHistory from '@/components/web3/TransactionHistory.vue'
import WalletConnect from '@/components/web3/WalletConnect.vue'
import { getContractList } from '@/service/api/web3'

const { address, isConnected, chainId } = useAccount()

interface Contract {
  id: string
  name: string
  contractAddress: string
  chainId: number
  abi: string | null
  description: string | null
}

const contracts = ref<Contract[]>([])
const selectedContract = ref<Contract | null>(null)
const activeTab = ref('contracts')

const chainNames: Record<number, string> = {
  1: 'Ethereum',
  5: 'Goerli',
  11155111: 'Sepolia',
  56: 'BSC',
  97: 'BSC Test',
  137: 'Polygon'
}

const fetchContracts = async () => {
  try {
    const res = await getContractList()
    contracts.value = res.data.data || []
    if (contracts.value.length > 0 && !selectedContract.value) {
      selectedContract.value = contracts.value[0]
    }
  } catch (error) {
    console.error('Failed to fetch contracts:', error)
  }
}

const selectContract = (contract: Contract) => {
  selectedContract.value = contract
}

onMounted(() => {
  fetchContracts()
})
</script>

<template>
  <div class="web3-page">
    <NCard title="Web3 Management" :bordered="false">
      <template #header-extra>
        <WalletConnect />
      </template>

      <div v-if="isConnected" class="connected-info">
        <span class="chain-badge">{{ chainNames[chainId!] || `Chain ${chainId}` }}</span>
      </div>

      <NTabs v-model:value="activeTab" type="line" animated>
        <NTabPane name="contracts" tab="Contracts">
          <ContractList @refresh="fetchContracts" />
        </NTabPane>
        
        <NTabPane name="interact" tab="Interact">
          <div v-if="!isConnected" class="connect-prompt">
            Please connect your wallet first
          </div>
          <div v-else-if="contracts.length === 0" class="connect-prompt">
            No contracts available. Please add a contract first.
          </div>
          <div v-else class="interact-area">
            <div class="contract-selector">
              <h4>Select Contract</h4>
              <div class="contract-list">
                <div 
                  v-for="contract in contracts" 
                  :key="contract.id"
                  class="contract-item"
                  :class="{ active: selectedContract?.id === contract.id }"
                  @click="selectContract(contract)"
                >
                  <div class="contract-name">{{ contract.name }}</div>
                  <div class="contract-address">
                    {{ contract.contractAddress.slice(0, 10) }}...{{ contract.contractAddress.slice(-8) }}
                  </div>
                </div>
              </div>
            </div>
            <div class="contract-interact" v-if="selectedContract">
              <ContractCall 
                :contract="selectedContract" 
                @success="fetchContracts" 
              />
            </div>
          </div>
        </NTabPane>
        
        <NTabPane name="history" tab="History">
          <TransactionHistory />
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<style scoped>
.web3-page {
  padding: 16px;
}

.connected-info {
  margin-bottom: 16px;
}

.chain-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #52c41a;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.connect-prompt {
  padding: 48px;
  text-align: center;
  color: #999;
}

.interact-area {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  margin-top: 16px;
}

.contract-selector h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
}

.contract-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contract-item {
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.contract-item:hover {
  border-color: #1890ff;
}

.contract-item.active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.contract-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.contract-address {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}
</style>
