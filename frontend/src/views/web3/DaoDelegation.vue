<template>
  <div class="dao-delegation-manager">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>DAO Delegation Manager</h2>
      </el-col>
    </el-row>

    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalDelegations }}</div>
            <div class="stat-label">Total Delegations</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.activeDaos }}</div>
            <div class="stat-label">Active DAOs</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(stats.totalVotingPower) }}</div>
            <div class="stat-label">Total Voting Power</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.alerts }}</div>
            <div class="stat-label">Active Alerts</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- My Delegations Tab -->
      <el-tab-pane label="My Delegations" name="delegations">
        <el-card>
          <div class="toolbar">
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon> New Delegation
            </el-button>
            <el-input
              v-model="searchQuery"
              placeholder="Search delegations..."
              style="width: 300px; margin-left: 10px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <el-table :data="filteredDelegations" style="width: 100%; margin-top: 20px" stripe>
            <el-table-column prop="daoName" label="DAO" width="150">
              <template #default="{ row }">
                <el-tag>{{ row.daoName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="tokenSymbol" label="Token" width="100" />
            <el-table-column prop="delegateAddress" label="Delegate Address" min-width="200">
              <template #default="{ row }">
                <el-tooltip :content="row.delegateAddress">
                  <span class="address">{{ shortenAddress(row.delegateAddress) }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="votingPower" label="Voting Power" width="150">
              <template #default="{ row }">
                {{ formatNumber(row.votingPower) }}
              </template>
            </el-table-column>
            <el-table-column prop="chain" label="Chain" width="120">
              <template #default="{ row }">
                <el-tag :type="getChainType(row.chain)">{{ row.chain }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="Status" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="180" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="fetchChainData(row)">Refresh</el-button>
                <el-button size="small" type="danger" @click="revokeDelegation(row)">Revoke</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalDelegations"
            layout="total, prev, pager, next"
            style="margin-top: 20px; justify-content: center"
          />
        </el-card>
      </el-tab-pane>

      <!-- Supported DAOs Tab -->
      <el-tab-pane label="Supported DAOs" name="daos">
        <el-row :gutter="20">
          <el-col
            v-for="dao in supportedDaos"
            :key="dao.name"
            :span="8"
            style="margin-bottom: 20px"
          >
            <el-card shadow="hover" class="dao-card">
              <div class="dao-info">
                <h3>{{ dao.name }}</h3>
                <p class="token">Token: {{ dao.token }}</p>
                <p class="chain">Chain: {{ dao.chain }}</p>
                <el-button
                  type="primary"
                  size="small"
                  @click="createDelegation(dao)"
                >
                  Delegate
                </el-button>
                <el-button size="small" @click="viewDaoStats(dao)">
                  Stats
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Recommendations Tab -->
      <el-tab-pane label="Recommendations" name="recommendations">
        <el-card>
          <div v-if="!selectedDaoForRecs" class="select-dao">
            <p>Select a DAO to view delegate recommendations:</p>
            <el-select v-model="selectedDaoForRecs" placeholder="Select DAO" @change="loadRecommendations">
              <el-option
                v-for="dao in supportedDaos"
                :key="dao.name"
                :label="dao.name"
                :value="dao.name"
              />
            </el-select>
          </div>

          <div v-else>
            <div class="rec-header">
              <h3>Top Delegates for {{ selectedDaoForRecs }}</h3>
              <el-button @click="selectedDaoForRecs = null">Change DAO</el-button>
            </div>

            <el-table :data="recommendations" style="width: 100%; margin-top: 20px">
              <el-table-column prop="address" label="Delegate Address" min-width="200">
                <template #default="{ row }">
                  <el-tooltip :content="row.address">
                    <span class="address">{{ shortenAddress(row.address) }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="Name" width="180" />
              <el-table-column prop="votingPower" label="Voting Power" width="150">
                <template #default="{ row }">
                  {{ formatNumber(row.votingPower) }}
                </template>
              </el-table-column>
              <el-table-column prop="reputation" label="Reputation" width="120">
                <template #default="{ row }">
                  <el-progress
                    :percentage="row.reputation"
                    :color="getReputationColor(row.reputation)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="Action" width="150">
                <template #default="{ row }">
                  <el-button size="small" type="primary" @click="delegateTo(row)">
                    Delegate
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- History Tab -->
      <el-tab-pane label="History" name="history">
        <el-card>
          <div class="toolbar">
            <el-input
              v-model="historyWallet"
              placeholder="Enter wallet address"
              style="width: 400px"
              clearable
            >
              <template #prefix>
                <el-icon><Wallet /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="loadHistory" style="margin-left: 10px">
              Load History
            </el-button>
          </div>

          <el-table
            :data="delegationHistory"
            style="width: 100%; margin-top: 20px"
            v-if="delegationHistory.length > 0"
          >
            <el-table-column prop="daoName" label="DAO" width="120" />
            <el-table-column prop="action" label="Action" width="120">
              <template #default="{ row }">
                <el-tag :type="getActionType(row.action)">{{ row.action }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="fromDelegate" label="From" min-width="180">
              <template #default="{ row }">
                <span class="address">{{ shortenAddress(row.fromDelegate) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="toDelegate" label="To" min-width="180">
              <template #default="{ row }">
                <span class="address">{{ shortenAddress(row.toDelegate) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="votingPower" label="Voting Power" width="150">
              <template #default="{ row }">
                {{ formatNumber(row.votingPower) }}
              </template>
            </el-table-column>
            <el-table-column prop="timestamp" label="Time" width="180">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="No history yet" />
        </el-card>
      </el-tab-pane>

      <!-- Alerts Tab -->
      <el-tab-pane label="Alerts" name="alerts">
        <el-card>
          <div class="toolbar">
            <el-button type="primary" @click="showAlertDialog = true">
              <el-icon><Bell /></el-icon> Create Alert
            </el-button>
          </div>

          <el-table :data="alerts" style="width: 100%; margin-top: 20px">
            <el-table-column prop="daoName" label="DAO" width="120" />
            <el-table-column prop="alertType" label="Alert Type" width="180" />
            <el-table-column prop="condition" label="Condition" width="120">
              <template #default="{ row }">
                {{ row.condition }} {{ row.threshold ? formatNumber(row.threshold) : '' }}
              </template>
            </el-table-column>
            <el-table-column prop="webhookUrl" label="Webhook" min-width="150">
              <template #default="{ row }">
                <span v-if="row.webhookUrl" class="address">{{ shortenAddress(row.webhookUrl) }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="Status" width="100">
              <template #default="{ row }">
                <el-switch
                  v-model="row.enabled"
                  @change="toggleAlert(row.id, row.enabled)"
                />
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="100">
              <template #default="{ row }">
                <el-button size="small" type="danger" @click="deleteAlert(row.id)">
                  Delete
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- Create Delegation Dialog -->
    <el-dialog v-model="showCreateDialog" title="Create Delegation" width="500px">
      <el-form :model="delegationForm" label-width="120px">
        <el-form-item label="Wallet Address">
          <el-input v-model="delegationForm.walletAddress" placeholder="0x..." />
        </el-form-item>
        <el-form-item label="DAO">
          <el-select v-model="delegationForm.daoName" placeholder="Select DAO">
            <el-option
              v-for="dao in supportedDaos"
              :key="dao.name"
              :label="dao.name"
              :value="dao.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Delegate Address">
          <el-input v-model="delegationForm.delegateAddress" placeholder="0x..." />
        </el-form-item>
        <el-form-item label="Chain">
          <el-select v-model="delegationForm.chain" placeholder="Select Chain">
            <el-option label="Ethereum" value="ethereum" />
            <el-option label="Optimism" value="optimism" />
            <el-option label="Arbitrum" value="arbitrum" />
            <el-option label="Polygon" value="polygon" />
          </el-select>
        </el-form-item>
        <el-form-item label="Notes">
          <el-input v-model="delegationForm.notes" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" @click="submitDelegation">Create</el-button>
      </template>
    </el-dialog>

    <!-- Create Alert Dialog -->
    <el-dialog v-model="showAlertDialog" title="Create Alert" width="500px">
      <el-form :model="alertForm" label-width="120px">
        <el-form-item label="Wallet Address">
          <el-input v-model="alertForm.walletAddress" placeholder="0x..." />
        </el-form-item>
        <el-form-item label="DAO">
          <el-select v-model="alertForm.daoName" placeholder="Select DAO">
            <el-option
              v-for="dao in supportedDaos"
              :key="dao.name"
              :label="dao.name"
              :value="dao.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Alert Type">
          <el-select v-model="alertForm.alertType" placeholder="Select Type">
            <el-option label="Voting Power Change" value="voting_power_change" />
            <el-option label="New Delegate" value="new_delegate" />
            <el-option label="Delegation Revoked" value="delegation_revoked" />
          </el-select>
        </el-form-item>
        <el-form-item label="Condition">
          <el-select v-model="alertForm.condition" placeholder="Select Condition">
            <el-option label="Above" value="above" />
            <el-option label="Below" value="below" />
            <el-option label="Changed" value="changed" />
          </el-select>
        </el-form-item>
        <el-form-item label="Threshold">
          <el-input-number v-model="alertForm.threshold" :min="0" />
        </el-form-item>
        <el-form-item label="Webhook URL">
          <el-input v-model="alertForm.webhookUrl" placeholder="https://..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAlertDialog = false">Cancel</el-button>
        <el-button type="primary" @click="submitAlert">Create</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Search, Wallet, Bell } from '@element-plus/icons-vue';

// State
const activeTab = ref('delegations');
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalDelegations = ref(0);

const delegations = ref<any[]>([]);
const supportedDaos = ref<any[]>([]);
const recommendations = ref<any[]>([]);
const delegationHistory = ref<any[]>([]);
const alerts = ref<any[]>([]);

const showCreateDialog = ref(false);
const showAlertDialog = ref(false);
const selectedDaoForRecs = ref<string | null>(null);
const historyWallet = ref('');

// Form data
const delegationForm = ref({
  walletAddress: '',
  daoName: '',
  delegateAddress: '',
  chain: 'ethereum',
  notes: '',
});

const alertForm = ref({
  walletAddress: '',
  daoName: '',
  alertType: '',
  condition: '',
  threshold: 0,
  webhookUrl: '',
});

// Stats
const stats = computed(() => ({
  totalDelegations: delegations.value.length,
  activeDaos: new Set(delegations.value.map(d => d.daoName)).size,
  totalVotingPower: delegations.value.reduce((sum, d) => sum + parseFloat(d.votingPower || '0'), 0),
  alerts: alerts.value.filter(a => a.enabled).length,
}));

const filteredDelegations = computed(() => {
  if (!searchQuery.value) return delegations.value;
  const query = searchQuery.value.toLowerCase();
  return delegations.value.filter(
    d => d.daoName.toLowerCase().includes(query) ||
         d.delegateAddress?.toLowerCase().includes(query) ||
         d.tokenSymbol?.toLowerCase().includes(query)
  );
});

// Methods
const formatNumber = (num: string | number) => {
  if (!num) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return n.toLocaleString();
};

const formatTime = (timestamp: string) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString();
};

const shortenAddress = (addr: string) => {
  if (!addr) return '-';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const getChainType = (chain: string) => {
  const types: Record<string, string> = {
    ethereum: '',
    optimism: 'warning',
    arbitrum: 'success',
    polygon: 'info',
  };
  return types[chain] || '';
};

const getActionType = (action: string) => {
  const types: Record<string, string> = {
    delegate: 'success',
    revoke: 'danger',
    redelegate: 'warning',
  };
  return types[action] || '';
};

const getReputationColor = (reputation: number) => {
  if (reputation >= 90) return '#67c23a';
  if (reputation >= 70) return '#e6a23c';
  return '#f56c6c';
};

// API calls
const loadDelegations = async () => {
  try {
    const response = await fetch('/api/dao-delegation?pageSize=100');
    const data = await response.json();
    delegations.value = data.data || [];
    totalDelegations.value = data.total || 0;
  } catch (error) {
    console.error('Failed to load delegations:', error);
  }
};

const loadSupportedDaos = async () => {
  try {
    const response = await fetch('/api/dao-delegation/daos/list');
    supportedDaos.value = await response.json();
  } catch (error) {
    console.error('Failed to load DAOs:', error);
  }
};

const loadAlerts = async () => {
  try {
    const response = await fetch('/api/dao-delegation/alerts');
    alerts.value = await response.json();
  } catch (error) {
    console.error('Failed to load alerts:', error);
  }
};

const submitDelegation = async () => {
  try {
    await fetch('/api/dao-delegation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(delegationForm.value),
    });
    ElMessage.success('Delegation created successfully');
    showCreateDialog.value = false;
    loadDelegations();
    delegationForm.value = {
      walletAddress: '',
      daoName: '',
      delegateAddress: '',
      chain: 'ethereum',
      notes: '',
    };
  } catch (error) {
    ElMessage.error('Failed to create delegation');
  }
};

const submitAlert = async () => {
  try {
    await fetch('/api/dao-delegation/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertForm.value),
    });
    ElMessage.success('Alert created successfully');
    showAlertDialog.value = false;
    loadAlerts();
  } catch (error) {
    ElMessage.error('Failed to create alert');
  }
};

const fetchChainData = async (row: any) => {
  try {
    const response = await fetch(`/api/dao-delegation/chain/${row.walletAddress}/${row.daoName}`);
    const data = await response.json();
    row.votingPower = data.votingPower;
    row.delegateAddress = data.delegateAddress;
    ElMessage.success('Chain data updated');
  } catch (error) {
    ElMessage.error('Failed to fetch chain data');
  }
};

const revokeDelegation = async (row: any) => {
  try {
    await fetch('/api/dao-delegation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, status: 'revoked' }),
    });
    ElMessage.success('Delegation revoked');
    loadDelegations();
  } catch (error) {
    ElMessage.error('Failed to revoke delegation');
  }
};

const createDelegation = (dao: any) => {
  delegationForm.value.daoName = dao.name;
  delegationForm.value.chain = dao.chain;
  showCreateDialog.value = true;
};

const viewDaoStats = async (dao: any) => {
  try {
    const response = await fetch(`/api/dao-delegation/stats/${dao.name}`);
    const stats = await response.json();
    ElMessage.info(`Total Delegators: ${stats.totalDelegators}, Active: ${stats.activeDelegations}`);
  } catch (error) {
    ElMessage.error('Failed to load stats');
  }
};

const loadRecommendations = async () => {
  if (!selectedDaoForRecs.value) return;
  try {
    const response = await fetch(`/api/dao-delegation/recommendations/0x0000000000000000000000000000000000000000/${selectedDaoForRecs.value}`);
    recommendations.value = await response.json();
  } catch (error) {
    console.error('Failed to load recommendations:', error);
  }
};

const delegateTo = (row: any) => {
  delegationForm.value.delegateAddress = row.address;
  showCreateDialog.value = true;
};

const loadHistory = async () => {
  if (!historyWallet.value) return;
  try {
    const response = await fetch(`/api/dao-delegation/history/${historyWallet.value}`);
    delegationHistory.value = await response.json();
  } catch (error) {
    console.error('Failed to load history:', error);
  }
};

const toggleAlert = async (id: number, enabled: boolean) => {
  try {
    await fetch(`/api/dao-delegation/alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
  } catch (error) {
    ElMessage.error('Failed to update alert');
  }
};

const deleteAlert = async (id: number) => {
  try {
    await fetch(`/api/dao-delegation/alerts/${id}`, { method: 'DELETE' });
    ElMessage.success('Alert deleted');
    loadAlerts();
  } catch (error) {
    ElMessage.error('Failed to delete alert');
  }
};

// Initialize
onMounted(() => {
  loadDelegations();
  loadSupportedDaos();
  loadAlerts();
});
</script>

<style scoped>
.dao-delegation-manager {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.main-tabs {
  margin-top: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
}

.dao-card {
  height: 180px;
}

.dao-info h3 {
  margin: 0 0 10px 0;
}

.dao-info .token,
.dao-info .chain {
  font-size: 14px;
  color: #606266;
  margin: 5px 0;
}

.select-dao {
  text-align: center;
  padding: 40px;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address {
  font-family: monospace;
  font-size: 12px;
}

:deep(.el-table) {
  font-size: 13px;
}
</style>
