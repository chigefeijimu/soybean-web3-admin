<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  NCard, NButton, NModal, NForm, NFormItem, NInput, 
  NInputNumber, NSelect, NDataTable, NTag, NDivider,
  NAlert, NSpace, NAvatar, NPopconfirm, useMessage 
} from 'naive-ui'

interface MultisigWallet {
  id: string
  name: string
  address: string
  owners: string[]
  threshold: number
  chainId: number
  createdAt: string
  balance: string
  pendingTransactions: PendingTransaction[]
}

interface PendingTransaction {
  id: string
  to: string
  value: string
  data: string
  signatures: string[]
  executed: boolean
  createdAt: string
}

const message = useMessage()
const loading = ref(false)
const wallets = ref<MultisigWallet[]>([])
const showCreateModal = ref(false)
const showTxModal = ref(false)
const selectedWallet = ref<MultisigWallet | null>(null)

// Form data
const createForm = ref({
  name: '',
  owners: [] as string[],
  threshold: 2,
  chainId: 1
})

const txForm = ref({
  to: '',
  value: '0',
  data: '0x',
  signer: ''
})

const chainOptions = [
  { label: 'Ethereum', value: 1 },
  { label: 'BSC', value: 56 },
  { label: 'Polygon', value: 137 },
  { label: 'Arbitrum', value: 42161 },
  { label: 'Optimism', value: 10 }
]

const columns = [
  {
    title: 'Name',
    key: 'name',
    width: 120
  },
  {
    title: 'Address',
    key: 'address',
    width: 180,
    render: (row: MultisigWallet) => 
      `${row.address.slice(0, 6)}...${row.address.slice(-4)}`
  },
  {
    title: 'Owners',
    key: 'owners',
    width: 200,
    render: (row: MultisigWallet) => 
      `${row.owners.length} owners`
  },
  {
    title: 'Threshold',
    key: 'threshold',
    width: 100,
    render: (row: MultisigWallet) => 
      `${row.threshold}/${row.owners.length}`
  },
  {
    title: 'Chain',
    key: 'chainId',
    width: 100,
    render: (row: MultisigWallet) => {
      const chain = chainOptions.find(c => c.value === row.chainId)
      return chain?.label || 'Unknown'
    }
  },
  {
    title: 'Balance',
    key: 'balance',
    width: 120,
    render: (row: MultisigWallet) => 
      `${(parseFloat(row.balance) / 1e18).toFixed(4)} ETH`
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 200,
    render: (row: MultisigWallet) => {
      return [
        h(NButton, {
          size: 'small',
          onClick: () => viewWallet(row)
        }, { default: () => 'View' }),
        h(NButton, {
          size: 'small',
          style: 'margin-left: 8px',
          onClick: () => openTxModal(row)
        }, { default: () => 'New Tx' })
      ]
    }
  }
]

const txColumns = [
  {
    title: 'ID',
    key: 'id',
    width: 120,
    render: (row: PendingTransaction) => 
      `#${row.id.slice(-6)}`
  },
  {
    title: 'To',
    key: 'to',
    width: 160,
    render: (row: PendingTransaction) => 
      `${row.to.slice(0, 6)}...${row.to.slice(-4)}`
  },
  {
    title: 'Value',
    key: 'value',
    width: 100,
    render: (row: PendingTransaction) => 
      `${(parseFloat(row.value) / 1e18).toFixed(4)} ETH`
  },
  {
    title: 'Signatures',
    key: 'signatures',
    width: 150,
    render: (row: PendingTransaction, rowData: MultisigWallet) => {
      const threshold = rowData.threshold
      const received = row.signatures.length
      return `${received}/${threshold}`
    }
  },
  {
    title: 'Status',
    key: 'executed',
    width: 100,
    render: (row: PendingTransaction) => 
      h(NTag, { 
        type: row.executed ? 'success' : 'warning',
        size: 'small'
      }, { default: () => row.executed ? 'Executed' : 'Pending' })
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 180,
    render: (row: PendingTransaction) => {
      const actions = []
      if (!row.executed) {
        actions.push(
          h(NButton, {
            size: 'small',
            onClick: () => signTransaction(row)
          }, { default: () => 'Sign' })
        )
        actions.push(
          h(NButton, {
            size: 'small',
            type: 'primary',
            style: 'margin-left: 8px',
            onClick: () => executeTransaction(row)
          }, { default: () => 'Execute' })
        )
      }
      return actions
    }
  }
]

import { h } from 'vue'

const fetchWallets = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/web3/multisig/wallets')
    wallets.value = await response.json()
  } catch (error) {
    message.error('Failed to fetch wallets')
  } finally {
    loading.value = false
  }
}

const createWallet = async () => {
  if (!createForm.value.name || createForm.value.owners.length < 2) {
    message.warning('Please fill in wallet name and add at least 2 owners')
    return
  }
  
  loading.value = true
  try {
    const response = await fetch('/api/web3/multisig/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm.value)
    })
    
    if (response.ok) {
      message.success('Wallet created successfully')
      showCreateModal.value = false
      createForm.value = { name: '', owners: [], threshold: 2, chainId: 1 }
      fetchWallets()
    }
  } catch (error) {
    message.error('Failed to create wallet')
  } finally {
    loading.value = false
  }
}

const viewWallet = async (wallet: MultisigWallet) => {
  loading.value = true
  try {
    const response = await fetch(`/api/web3/multisig/wallets/${wallet.id}`)
    selectedWallet.value = await response.json()
  } catch (error) {
    message.error('Failed to fetch wallet details')
  } finally {
    loading.value = false
  }
}

const openTxModal = (wallet: MultisigWallet) => {
  selectedWallet.value = wallet
  txForm.value = { to: '', value: '0', data: '0x', signer: '' }
  showTxModal.value = true
}

const createTransaction = async () => {
  if (!selectedWallet.value) return
  
  loading.value = true
  try {
    const response = await fetch(`/api/web3/multisig/wallets/${selectedWallet.value.id}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txForm.value)
    })
    
    if (response.ok) {
      message.success('Transaction created')
      showTxModal.value = false
      viewWallet(selectedWallet.value)
    }
  } catch (error) {
    message.error('Failed to create transaction')
  } finally {
    loading.value = false
  }
}

const signTransaction = async (tx: PendingTransaction) => {
  if (!selectedWallet.value) return
  
  // In real app, use wallet connection to get signer
  const signer = txForm.value.signer || selectedWallet.value.owners[0]
  
  try {
    const response = await fetch(
      `/api/web3/multisig/wallets/${selectedWallet.value.id}/transactions/${tx.id}/sign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signer })
      }
    )
    
    const result = await response.json()
    message.success(`Signed! ${result.signaturesReceived}/${result.signaturesRequired} signatures`)
    viewWallet(selectedWallet.value)
  } catch (error) {
    message.error('Failed to sign transaction')
  }
}

const executeTransaction = async (tx: PendingTransaction) => {
  if (!selectedWallet.value) return
  
  try {
    const response = await fetch(
      `/api/web3/multisig/wallets/${selectedWallet.value.id}/transactions/${tx.id}/execute`,
      { method: 'POST' }
    )
    
    const result = await response.json()
    message.success(`Transaction executed! Hash: ${result.hash.slice(0, 10)}...`)
    viewWallet(selectedWallet.value)
  } catch (error: any) {
    message.error(error.message || 'Failed to execute transaction')
  }
}

const deleteWallet = async (id: string) => {
  try {
    const response = await fetch(`/api/web3/multisig/wallets/${id}`, {
      method: 'DELETE'
    })
    
    if (response.ok) {
      message.success('Wallet deleted')
      fetchWallets()
    }
  } catch (error) {
    message.error('Failed to delete wallet')
  }
}

const addOwner = () => {
  const owner = createForm.value.owners[createForm.value.owners.length - 1]
  if (owner && owner.startsWith('0x') && owner.length === 42) {
    createForm.value.owners = [...createForm.value.owners, '']
  }
}

onMounted(() => {
  fetchWallets()
})
</script>

<template>
  <div class="multisig-wallet">
    <NCard title="🏛️ Multisig Wallet Manager" :bordered="false" class="card-wrapper">
      <template #header-extra>
        <NButton type="primary" @click="showCreateModal = true">
          + Create Wallet
        </NButton>
      </template>
      
      <NAlert v-if="wallets.length === 0" type="info" :show-icon="false">
        No multisig wallets yet. Create one to get started!
      </NAlert>
      
      <NDataTable
        v-else
        :columns="columns"
        :data="wallets"
        :loading="loading"
        :bordered="false"
      />
    </NCard>

    <!-- Create Wallet Modal -->
    <NModal
      v-model:show="showCreateModal"
      preset="card"
      title="Create Multisig Wallet"
      style="width: 500px"
    >
      <NForm label-placement="left" label-width="100">
        <NFormItem label="Wallet Name">
          <NInput v-model:value="createForm.name" placeholder="My DAO Treasury" />
        </NFormItem>
        
        <NFormItem label="Chain">
          <NSelect v-model:value="createForm.chainId" :options="chainOptions" />
        </NFormItem>
        
        <NFormItem label="Threshold">
          <NInputNumber 
            v-model:value="createForm.threshold" 
            :min="2" 
            :max="createForm.owners.length || 10"
            style="width: 100%"
          />
          <template #feedback>
            Number of signatures required to execute a transaction
          </template>
        </NFormItem>
        
        <NFormItem label="Owners">
          <NSpace vertical style="width: 100%">
            <NInput
              v-for="(owner, index) in createForm.owners"
              :key="index"
              v-model:value="createForm.owners[index]"
              placeholder="0x..."
            >
              <template #suffix>
                <NButton text @click="createForm.owners.splice(index, 1)" type="error">
                  ✕
                </NButton>
              </template>
            </NInput>
            <NButton dashed block @click="createForm.owners.push('')">
              + Add Owner
            </NButton>
          </NSpace>
        </NFormItem>
      </NForm>
      
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreateModal = false">Cancel</NButton>
          <NButton type="primary" :loading="loading" @click="createWallet">
            Create
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Wallet Detail Modal -->
    <NModal
      :show="!!selectedWallet"
      preset="card"
      :title="selectedWallet?.name || 'Wallet Details'"
      style="width: 700px"
      @update:show="(show: boolean) => !show && (selectedWallet = null)"
    >
      <template v-if="selectedWallet">
        <NDivider>Wallet Info</NDivider>
        <NSpace vertical>
          <div><strong>Address:</strong> <code>{{ selectedWallet.address }}</code></div>
          <div><strong>Chain:</strong> {{ chainOptions.find(c => c.value === selectedWallet.chainId)?.label }}</div>
          <div><strong>Threshold:</strong> {{ selectedWallet.threshold }} of {{ selectedWallet.owners.length }} signatures</div>
          <div><strong>Balance:</strong> {{ (parseFloat(selectedWallet.balance) / 1e18).toFixed(4) }} ETH</div>
        </NSpace>
        
        <NDivider>Owners</NDivider>
        <NSpace>
          <NTag v-for="owner in selectedWallet.owners" :key="owner" type="info">
            {{ owner.slice(0, 6) }}...{{ owner.slice(-4) }}
          </NTag>
        </NSpace>
        
        <NDivider>Pending Transactions</NDivider>
        <NDataTable
          v-if="selectedWallet.pendingTransactions.length > 0"
          :columns="txColumns"
          :data="selectedWallet.pendingTransactions"
          :row-key="(row: PendingTransaction) => row.id"
          :bordered="false"
          size="small"
        />
        <NAlert v-else type="success" :show-icon="false">
          No pending transactions
        </NAlert>
      </template>
      
      <template #footer>
        <NSpace justify="end">
          <NPopconfirm @positive-click="selectedWallet && deleteWallet(selectedWallet.id)">
            <template #trigger>
              <NButton type="error">Delete Wallet</NButton>
            </template>
            Are you sure you want to delete this wallet?
          </NPopconfirm>
          <NButton @click="selectedWallet = null">Close</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Create Transaction Modal -->
    <NModal
      v-model:show="showTxModal"
      preset="card"
      title="Create Transaction"
      style="width: 500px"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="To">
          <NInput v-model:value="txForm.to" placeholder="0x..." />
        </NFormItem>
        <NFormItem label="Value (ETH)">
          <NInput v-model:value="txForm.value" type="number" />
        </NFormItem>
        <NFormItem label="Data">
          <NInput v-model:value="txForm.data" type="textarea" :rows="2" />
        </NFormItem>
        <NFormItem label="Signer">
          <NInput v-model:value="txForm.signer" placeholder="Your wallet address" />
        </NFormItem>
      </NForm>
      
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showTxModal = false">Cancel</NButton>
          <NButton type="primary" :loading="loading" @click="createTransaction">
            Create Transaction
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.multisig-wallet {
  padding: 16px;
}

.card-wrapper {
  margin-bottom: 16px;
}

code {
  background: var(--n-color-hover);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
