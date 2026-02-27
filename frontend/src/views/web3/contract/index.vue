<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { 
  NButton, NCard, NDataTable, NModal, NForm, NFormItem, 
  NInput, NInputNumber, NSpace, NTag, NPopconfirm, useMessage, NEmpty
} from 'naive-ui'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@vicons/antd'
import { 
  getContractList, createContract, updateContract, deleteContract
} from '@/service/api/web3'

interface Contract {
  id: string
  name: string
  contractAddress: string
  chainId: number
  abi: string | null
  description: string | null
  createdAt: string
}

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const message = useMessage()
const loading = ref(false)
const contracts = ref<Contract[]>([])
const showModal = ref(false)
const isEdit = ref(false)
const currentContract = ref<Partial<Contract>>({})

const chainOptions = [
  { label: 'Ethereum Mainnet (1)', value: 1 },
  { label: 'Goerli Testnet (5)', value: 5 },
  { label: 'Sepolia Testnet (11155111)', value: 11155111 },
  { label: 'BSC Mainnet (56)', value: 56 },
  { label: 'BSC Testnet (97)', value: 97 },
  { label: 'Polygon Mainnet (137)', value: 137 },
  { label: 'Mumbai Testnet (80001)', value: 80001 }
]

const chainNames: Record<number, string> = {
  1: 'ETH',
  5: 'Goerli',
  11155111: 'Sepolia',
  56: 'BSC',
  97: 'BSC Test',
  137: 'Polygon',
  80001: 'Mumbai'
}

const columns = [
  {
    title: 'Name',
    key: 'name',
    width: 150
  },
  {
    title: 'Address',
    key: 'contractAddress',
    width: 200,
    render: (row: Contract) => h('span', { class: 'address-cell' }, 
      `${row.contractAddress.slice(0, 10)}...${row.contractAddress.slice(-8)}`)
  },
  {
    title: 'Chain',
    key: 'chainId',
    width: 100,
    render: (row: Contract) => h(NTag, { type: 'info', size: 'small' }, 
      () => chainNames[row.chainId] || row.chainId)
  },
  {
    title: 'Description',
    key: 'description',
    ellipsis: { tooltip: true }
  },
  {
    title: 'Created',
    key: 'createdAt',
    width: 180
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 150,
    render: (row: Contract) => h(NSpace, { size: 'small' }, () => [
      h(NButton, { 
        size: 'small', 
        quaternary: true,
        onClick: () => handleEdit(row) 
      }, () => h(EditOutlined)),
      h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
        default: () => 'Confirm delete?',
        trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' }, 
          () => h(DeleteOutlined))
      })
    ])
  }
]

const fetchContracts = async () => {
  loading.value = true
  try {
    const res = await getContractList()
    contracts.value = res.data.data || []
  } catch (error: any) {
    message.error(error.message || 'Failed to fetch contracts')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  currentContract.value = {
    name: '',
    contractAddress: '',
    chainId: 1,
    abi: '[]',
    description: ''
  }
  isEdit.value = false
  showModal.value = true
}

const handleEdit = (contract: Contract) => {
  currentContract.value = { ...contract }
  isEdit.value = true
  showModal.value = true
}

const handleSave = async () => {
  if (!currentContract.value.name || !currentContract.value.contractAddress) {
    message.warning('Please fill in required fields')
    return
  }
  
  try {
    if (isEdit.value) {
      await updateContract(currentContract.value as Contract)
      message.success('Contract updated successfully')
    } else {
      await createContract(currentContract.value as Contract)
      message.success('Contract created successfully')
    }
    showModal.value = false
    fetchContracts()
    emit('refresh')
  } catch (error: any) {
    message.error(error.message || 'Operation failed')
  }
}

const handleDelete = async (id: string) => {
  try {
    await deleteContract(id)
    message.success('Contract deleted successfully')
    fetchContracts()
    emit('refresh')
  } catch (error: any) {
    message.error(error.message || 'Delete failed')
  }
}

onMounted(() => {
  fetchContracts()
})

defineExpose({ refresh: fetchContracts })
</script>

<template>
  <div class="contract-page">
    <NCard :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <NSpace>
          <NButton quaternary @click="fetchContracts">
            <template #icon><ReloadOutlined /></template>
          </NButton>
          <NButton type="primary" @click="handleAdd">
            <template #icon><PlusOutlined /></template>
            Add Contract
          </NButton>
        </NSpace>
      </template>

      <NDataTable
        :columns="columns"
        :data="contracts"
        :loading="loading"
        :bordered="false"
      />
      
      <NEmpty v-if="!loading && contracts.length === 0" description="No contracts yet">
        <template #extra>
          <NButton type="primary" @click="handleAdd">Add Your First Contract</NButton>
        </template>
      </NEmpty>
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="isEdit ? 'Edit Contract' : 'Add Contract'"
      preset="card"
      style="width: 600px;"
    >
      <NForm label-placement="left" label-width="100px">
        <NFormItem label="Name" required>
          <NInput v-model:value="currentContract.name" placeholder="Contract name" />
        </NFormItem>
        <NFormItem label="Address" required>
          <NInput v-model:value="currentContract.contractAddress" placeholder="0x..." />
        </NFormItem>
        <NFormItem label="Chain" required>
          <NSelect
            v-model:value="currentContract.chainId"
            :options="chainOptions"
            placeholder="Select chain"
          />
        </NFormItem>
        <NFormItem label="ABI">
          <NInput
            v-model:value="currentContract.abi"
            type="textarea"
            :rows="6"
            placeholder='[{"type": "function", ...}]'
          />
        </NFormItem>
        <NFormItem label="Description">
          <NInput
            v-model:value="currentContract.description"
            type="textarea"
            :rows="3"
            placeholder="Contract description"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">Cancel</NButton>
          <NButton type="primary" @click="handleSave">Save</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.contract-page {
  padding: 0;
}

.address-cell {
  font-family: monospace;
  font-size: 12px;
}
</style>
