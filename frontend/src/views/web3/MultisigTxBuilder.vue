<template>
  <div class="multisig-tx-builder">
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold">🔐 Multi-sig Transaction Builder</h2>
      </div>
      
      <!-- Messages -->
      <div v-if="message" :class="['mb-4 rounded-lg p-3', messageType === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300']">
        {{ message }}
        <button class="ml-2 text-red-400" @click="message = ''">✕</button>
      </div>

      <el-tabs v-model="activeTab" class="multisig-tabs">
        <!-- Wallet Management Tab -->
        <el-tab-pane label="Wallets" name="wallets">
          <el-button type="primary" @click="showCreateWallet = true" class="mb-4">
            + Create Wallet
          </el-button>
          
          <el-table :data="wallets" v-loading="loadingWallets" stripe>
            <el-table-column prop="name" label="Name" width="150" />
            <el-table-column prop="address" label="Address" min-width="200">
              <template #default="{ row }">
                <el-tooltip :content="row.address">
                  <span class="address-text">{{ formatAddress(row.address) }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="threshold" label="Threshold" width="100" />
            <el-table-column prop="owners" label="Owners" width="80">
              <template #default="{ row }">
                {{ row.owners.length }}
              </template>
            </el-table-column>
            <el-table-column prop="nonce" label="Nonce" width="80" />
            <el-table-column label="Actions" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="selectWallet(row)">View</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Create Transaction Tab -->
        <el-tab-pane label="Create TX" name="create">
          <el-form :model="txForm" label-width="140px" class="tx-form">
            <el-form-item label="Wallet Address">
              <el-input v-model="txForm.walletAddress" placeholder="0x..." />
            </el-form-item>
            <el-form-item label="To Address">
              <el-input v-model="txForm.to" placeholder="0x..." />
            </el-form-item>
            <el-form-item label="Value (ETH)">
              <el-input v-model="txForm.value" type="number" placeholder="0" />
            </el-form-item>
            <el-form-item label="Data">
              <el-input v-model="txForm.data" type="textarea" placeholder="0x..." :rows="2" />
            </el-form-item>
            <el-form-item label="Nonce">
              <el-input-number v-model="txForm.nonce" :min="0" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="createTransaction" :loading="creating">
                Create Transaction
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Transactions Tab -->
        <el-tab-pane label="Transactions" name="transactions">
          <el-form inline class="filter-form mb-4">
            <el-form-item label="Wallet">
              <el-input v-model="txFilter.walletAddress" placeholder="Wallet address" />
            </el-form-item>
            <el-form-item label="Status">
              <el-select v-model="txFilter.status" placeholder="All" clearable>
                <el-option label="Pending" value="pending" />
                <el-option label="Executed" value="executed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadTransactions">Search</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="transactions" v-loading="loadingTxs" stripe>
            <el-table-column prop="txHash" label="TX Hash" min-width="180">
              <template #default="{ row }">
                <el-tooltip :content="row.txHash">
                  <span class="address-text">{{ formatAddress(row.txHash) }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="to" label="To" min-width="160">
              <template #default="{ row }">
                <span class="address-text">{{ formatAddress(row.to) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="value" label="Value" width="120">
              <template #default="{ row }">
                {{ formatValue(row.value) }} ETH
              </template>
            </el-table-column>
            <el-table-column prop="nonce" label="Nonce" width="80" />
            <el-table-column prop="signatures" label="Signatures" width="100">
              <template #default="{ row }">
                {{ row.signatures.length }}
              </template>
            </el-table-column>
            <el-table-column prop="executed" label="Status" width="100">
              <template #default="{ row }">
                <el-tag :type="row.executed ? 'success' : 'warning'">
                  {{ row.executed ? 'Executed' : 'Pending' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="viewTransaction(row)">View</el-button>
                <el-button size="small" type="success" @click="simulateTx(row)" :disabled="row.executed">
                  Simulate
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Sign Transaction Tab -->
        <el-tab-pane label="Sign TX" name="sign">
          <el-form :model="signForm" label-width="140px" class="tx-form">
            <el-form-item label="Transaction Hash">
              <el-input v-model="signForm.txHash" placeholder="0x..." />
            </el-form-item>
            <el-form-item label="Signer Address">
              <el-input v-model="signForm.signerAddress" placeholder="0x..." />
            </el-form-item>
            <el-form-item label="Signature">
              <el-input v-model="signForm.signature" type="textarea" placeholder="0x..." :rows="3" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="signTransaction" :loading="signing">
                Sign Transaction
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Create Wallet Dialog -->
    <el-dialog v-model="showCreateWallet" title="Create Multisig Wallet" width="500px">
      <el-form :model="walletForm" label-width="120px">
        <el-form-item label="Wallet Name">
          <el-input v-model="walletForm.name" placeholder="My Multisig Wallet" />
        </el-form-item>
        <el-form-item label="Threshold">
          <el-input-number v-model="walletForm.threshold" :min="1" :max="10" />
          <span class="form-hint">Minimum signatures required</span>
        </el-form-item>
        <el-form-item label="Owners">
          <div v-for="(owner, idx) in walletForm.owners" :key="idx" class="owner-input">
            <el-input v-model="walletForm.owners[idx]" placeholder="0x..." />
            <el-button type="danger" size="small" @click="removeOwner(idx)" v-if="walletForm.owners.length > 1">
              Remove
            </el-button>
          </div>
          <el-button size="small" @click="addOwner">+ Add Owner</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateWallet = false">Cancel</el-button>
        <el-button type="primary" @click="createWallet" :loading="creatingWallet">Create</el-button>
      </template>
    </el-dialog>

    <!-- Transaction Detail Dialog -->
    <el-dialog v-model="showTxDetail" title="Transaction Details" width="600px">
      <div v-if="selectedTx" class="tx-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="TX Hash">
            <span class="address-text">{{ selectedTx.txHash }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="To">
            <span class="address-text">{{ selectedTx.to }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="Value">
            {{ formatValue(selectedTx.value) }} ETH
          </el-descriptions-item>
          <el-descriptions-item label="Data">
            <span class="data-text">{{ selectedTx.data }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="Nonce">{{ selectedTx.nonce }}</el-descriptions-item>
          <el-descriptions-item label="Signatures">
            <div v-if="selectedTx.signatures.length">
              <el-tag v-for="(sig, idx) in selectedTx.signatures" :key="idx" class="sig-tag">
                {{ sig.split(':')[0]?.slice(0, 10) }}...
              </el-tag>
            </div>
            <span v-else>No signatures yet</span>
          </el-descriptions-item>
          <el-descriptions-item label="Status">
            <el-tag :type="selectedTx.executed ? 'success' : 'warning'">
              {{ selectedTx.executed ? 'Executed' : 'Pending' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Created">
            {{ formatDate(selectedTx.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showTxDetail = false">Close</el-button>
        <el-button type="success" @click="executeSelectedTx" :loading="executing" :disabled="!canExecute">
          Execute
        </el-button>
      </template>
    </el-dialog>

    <!-- Simulation Result Dialog -->
    <el-dialog v-model="showSimulation" title="Simulation Result" width="500px">
      <div v-if="simulationResult" class="simulation-result">
        <el-alert :type="simulationResult.canExecute ? 'success' : 'warning'" :title="simulationResult.canExecute ? 'Ready to Execute' : 'Not Enough Signatures'" />
        <el-descriptions :column="1" border class="mt-4">
          <el-descriptions-item label="Required">
            {{ simulationResult.requiredSignatures }}
          </el-descriptions-item>
          <el-descriptions-item label="Current">
            {{ simulationResult.currentSignatures }}
          </el-descriptions-item>
          <el-descriptions-item label="Missing">
            {{ simulationResult.missingSignatures }}
          </el-descriptions-item>
          <el-descriptions-item label="Signers">
            <el-tag v-for="signer in simulationResult.signers" :key="signer" size="small" class="mr-2">
              {{ formatAddress(signer) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { multisigTxBuilder } from '@/service/api/web3';

const activeTab = ref('wallets');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
  message.value = msg;
  messageType.value = type;
};

// Wallet management
const wallets = ref<any[]>([]);
const loadingWallets = ref(false);
const showCreateWallet = ref(false);
const creatingWallet = ref(false);

const walletForm = reactive({
  name: '',
  threshold: 2,
  owners: ['', '', '']
});

// Transaction management
const transactions = ref<any[]>([]);
const loadingTxs = ref(false);
const creating = ref(false);
const signing = ref(false);
const executing = ref(false);

const txForm = reactive({
  walletAddress: '',
  to: '',
  value: '',
  data: '0x',
  nonce: 0
});

const txFilter = reactive({
  walletAddress: '',
  status: ''
});

const signForm = reactive({
  txHash: '',
  signerAddress: '',
  signature: ''
});

// Dialogs
const showTxDetail = ref(false);
const showSimulation = ref(false);
const selectedTx = ref<any>(null);
const simulationResult = ref<any>(null);
const canExecute = ref(false);

const executeForm = reactive({
  executorAddress: ''
});

onMounted(() => {
  loadWallets();
});

const loadWallets = async () => {
  loadingWallets.value = true;
  try {
    const res = await multisigTxBuilder.listWallets();
    wallets.value = res.data || [];
  } catch (error: any) {
    showMessage('Failed to load wallets', 'error');
  } finally {
    loadingWallets.value = false;
  }
};

const createWallet = async () => {
  const validOwners = walletForm.owners.filter(o => o.trim());
  if (validOwners.length < walletForm.threshold) {
    showMessage('Threshold must be <= number of owners', 'error');
    return;
  }
  
  creatingWallet.value = true;
  try {
    const res = await multisigTxBuilder.createWallet({
      name: walletForm.name,
      threshold: walletForm.threshold,
      owners: validOwners
    });
    showMessage('Wallet created successfully', 'success');
    showCreateWallet.value = false;
    loadWallets();
    resetWalletForm();
  } catch (error: any) {
    showMessage(error.message || 'Failed to create wallet', 'error');
  } finally {
    creatingWallet.value = false;
  }
};

const resetWalletForm = () => {
  walletForm.name = '';
  walletForm.threshold = 2;
  walletForm.owners = ['', '', ''];
};

const addOwner = () => {
  walletForm.owners.push('');
};

const removeOwner = (idx: number) => {
  walletForm.owners.splice(idx, 1);
};

const selectWallet = (wallet: any) => {
  txFilter.walletAddress = wallet.address;
  activeTab.value = 'transactions';
  loadTransactions();
};

const loadTransactions = async () => {
  if (!txFilter.walletAddress) {
    showMessage('Please enter wallet address', 'error');
    return;
  }
  
  loadingTxs.value = true;
  try {
    const res = await multisigTxBuilder.getTransactions({
      walletAddress: txFilter.walletAddress,
      status: txFilter.status as any || undefined,
      limit: 20
    });
    transactions.value = res.data || [];
  } catch (error: any) {
    showMessage('Failed to load transactions', 'error');
  } finally {
    loadingTxs.value = false;
  }
};

const createTransaction = async () => {
  if (!txForm.walletAddress || !txForm.to) {
    showMessage('Please fill required fields', 'error');
    return;
  }
  
  creating.value = true;
  try {
    const res = await multisigTxBuilder.createTransaction({
      walletAddress: txForm.walletAddress,
      to: txForm.to,
      value: txForm.value || '0',
      data: txForm.data || '0x',
      nonce: txForm.nonce || undefined
    });
    showMessage('Transaction created successfully', 'success');
    resetTxForm();
  } catch (error: any) {
    showMessage(error.message || 'Failed to create transaction', 'error');
  } finally {
    creating.value = false;
  }
};

const resetTxForm = () => {
  txForm.to = '';
  txForm.value = '';
  txForm.data = '0x';
  txForm.nonce = 0;
};

const viewTransaction = (tx: any) => {
  selectedTx.value = tx;
  showTxDetail.value = true;
  checkCanExecute(tx);
};

const checkCanExecute = async (tx: any) => {
  try {
    const res = await multisigTxBuilder.simulateExecution(tx.txHash);
    simulationResult.value = res.data;
    canExecute.value = res.data?.canExecute || false;
  } catch (error) {
    canExecute.value = false;
  }
};

const simulateTx = async (tx: any) => {
  try {
    const res = await multisigTxBuilder.simulateExecution(tx.txHash);
    simulationResult.value = res.data;
    showSimulation.value = true;
  } catch (error: any) {
    showMessage('Simulation failed', 'error');
  }
};

const signTransaction = async () => {
  if (!signForm.txHash || !signForm.signerAddress || !signForm.signature) {
    showMessage('Please fill all fields', 'error');
    return;
  }
  
  signing.value = true;
  try {
    const res = await multisigTxBuilder.signTransaction({
      txHash: signForm.txHash,
      signerAddress: signForm.signerAddress,
      signature: signForm.signature
    });
    showMessage('Transaction signed successfully', 'success');
    resetSignForm();
    if (txFilter.walletAddress) {
      loadTransactions();
    }
  } catch (error: any) {
    showMessage(error.message || 'Failed to sign transaction', 'error');
  } finally {
    signing.value = false;
  }
};

const resetSignForm = () => {
  signForm.txHash = '';
  signForm.signerAddress = '';
  signForm.signature = '';
};

const executeSelectedTx = async () => {
  if (!selectedTx.value) return;
  
  executing.value = true;
  try {
    const res = await multisigTxBuilder.executeTransaction({
      txHash: selectedTx.value.txHash,
      executorAddress: '0x0000000000000000000000000000000000000000'
    });
    showMessage('Transaction executed successfully', 'success');
    showTxDetail.value = false;
    loadTransactions();
  } catch (error: any) {
    showMessage(error.message || 'Failed to execute transaction', 'error');
  } finally {
    executing.value = false;
  }
};

// Utility functions
const formatAddress = (addr: string) => {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

const formatValue = (val: string) => {
  if (!val) return '0';
  return (parseFloat(val) / 1e18).toFixed(6);
};

const formatDate = (date: string) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};
</script>

<style scoped>
.multisig-tx-builder {
  padding: 20px;
}

.multisig-tabs {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.mr-2 {
  margin-right: 8px;
}

.tx-form {
  max-width: 600px;
}

.address-text {
  font-family: monospace;
  font-size: 12px;
}

.data-text {
  font-family: monospace;
  font-size: 11px;
  word-break: break-all;
}

.owner-input {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.sig-tag {
  margin: 2px;
}

.form-hint {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

.filter-form {
  margin-bottom: 16px;
}
</style>
