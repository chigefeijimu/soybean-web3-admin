<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { 
  NDataTable, NTag, NButton, NSpace, NEmpty, NSpin 
} from 'naive-ui'
import { getTransactionList } from '@/service/api/web3'

interface Transaction {
  id: string
  contractId: string
  methodName: string
  params: string | null
  txHash: string | null
  status: string
  fromAddress: string | null
  errorMessage: string | null
  createdAt: string
}

const loading = ref(false)
const transactions = ref<Transaction[]>([])

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  pending: 'warning',
  confirmed: 'success',
  failed: 'error'
}

const columns = [
  {
    title: 'Time',
    key: 'createdAt',
    width: 180
  },
  {
    title: 'Method',
    key: 'methodName',
    width: 150
  },
  {
    title: 'From',
    key: 'fromAddress',
    width: 160,
    render: (row: Transaction) => h('span', { class: 'address-cell' }, 
      row.fromAddress ? `${row.fromAddress.slice(0, 10)}...${row.fromAddress.slice(-8)}` : '-')
  },
  {
    title: 'Tx Hash',
    key: 'txHash',
    width: 180,
    render: (row: Transaction) => row.txHash 
      ? h('a', { 
          class: 'tx-link', 
          href: `https://etherscan.io/tx/${row.txHash}`,
          target: '_blank'
        }, `${row.txHash.slice(0, 10)}...${row.txHash.slice(-8)}`)
      : '-'
  },
  {
    title: 'Status',
    key: 'status',
    width: 100,
    render: (row: Transaction) => h(NTag, { 
      type: statusColors[row.status] || 'default',
      size: 'small'
    }, () => row.status)
  },
  {
    title: 'Error',
    key: 'errorMessage',
    ellipsis: { tooltip: true },
    render: (row: Transaction) => row.errorMessage 
      ? h('span', { style: 'color: #ff4d4f' }, row.errorMessage)
      : '-'
  }
]

const fetchTransactions = async () => {
  loading.value = true
  try {
    const res = await getTransactionList()
    transactions.value = res.data.data || []
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
  } finally {
    loading.value = false
  }
}

const viewOnExplorer = (txHash: string) => {
  window.open(`https://etherscan.io/tx/${txHash}`, '_blank')
}

onMounted(() => {
  fetchTransactions()
})

defineExpose({ refresh: fetchTransactions })
</script>

<template>
  <div class="transaction-history">
    <div class="table-header">
      <h3>Transaction History</h3>
      <NButton size="small" @click="fetchTransactions">Refresh</NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable
        :columns="columns"
        :data="transactions"
        :bordered="false"
        :pagination="false"
        :max-height="400"
      />
      
      <NEmpty v-if="!loading && transactions.length === 0" description="No transactions yet" />
    </NSpin>
  </div>
</template>

<style scoped>
.transaction-history {
  margin-top: 16px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.address-cell, .tx-link {
  font-family: monospace;
  font-size: 12px;
}

.tx-link {
  color: #1890ff;
  text-decoration: none;
  cursor: pointer;
}

.tx-link:hover {
  text-decoration: underline;
}
</style>
