<template>
  <div class="defi-auto-compound">
    <div class="page-header">
      <h1>🎯 DeFi Auto-Compound Scheduler</h1>
      <p class="subtitle">自动复利您的DeFi头寸，省时省力</p>
    </div>

    <!-- Dashboard Stats -->
    <div class="stats-grid" v-if="dashboardStats">
      <div class="stat-card">
        <div class="stat-label">总头寸价值</div>
        <div class="stat-value">${{ dashboardStats.totalValue.toLocaleString() }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均APY</div>
        <div class="stat-value highlight">{{ dashboardStats.averageApy }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">活跃计划</div>
        <div class="stat-value">{{ dashboardStats.activeSchedules }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">执行成功率</div>
        <div class="stat-value success">{{ dashboardStats.successRate }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">累计复利收益</div>
        <div class="stat-value highlight">${{ dashboardStats.totalRewardsReinvested }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">累计Gas费用</div>
        <div class="stat-value gas">${{ dashboardStats.totalGasFees }}</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button class="btn-primary" @click="showCreateDialog = true">
        + 创建复利计划
      </button>
      <button class="btn-secondary" @click="loadData">
        ↻ 刷新数据
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Schedules Tab -->
      <div v-show="activeTab === 'schedules'" class="schedules-list">
        <div v-for="schedule in schedules" :key="schedule.id" class="schedule-card">
          <div class="schedule-header">
            <div class="schedule-info">
              <h3>{{ schedule.name }}</h3>
              <span class="tag">{{ schedule.protocol }}</span>
              <span class="tag" :class="getChainClass(schedule.chainId)">
                {{ schedule.chainName }}
              </span>
            </div>
            <span class="tag" :class="getStatusClass(schedule.status)">
              {{ getStatusText(schedule.status) }}
            </span>
          </div>
          
          <div class="schedule-details">
            <div class="detail-row">
              <span class="label">池地址:</span>
              <span class="value mono">{{ shortenAddress(schedule.poolAddress) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">头寸价值:</span>
              <span class="value">${{ parseFloat(schedule.positionValue).toLocaleString() }}</span>
            </div>
            <div class="detail-row">
              <span class="label">预计APY:</span>
              <span class="value highlight">{{ schedule.estimatedApy }}%</span>
            </div>
            <div class="detail-row">
              <span class="label">复利频率:</span>
              <span class="value">{{ getFrequencyText(schedule.compoundFrequency) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">下次执行:</span>
              <span class="value">{{ formatTime(schedule.nextExecutionTime) }}</span>
            </div>
          </div>

          <div class="schedule-actions">
            <button class="btn-small" @click="simulateCompound(schedule.id)">
              模拟复利
            </button>
            <button 
              v-if="schedule.status === 'active'" 
              class="btn-small warning"
              @click="pauseSchedule(schedule.id)"
            >
              暂停
            </button>
            <button 
              v-if="schedule.status === 'paused'" 
              class="btn-small success"
              @click="resumeSchedule(schedule.id)"
            >
              恢复
            </button>
            <button class="btn-small danger" @click="deleteSchedule(schedule.id)">
              删除
            </button>
          </div>
        </div>

        <div v-if="schedules.length === 0" class="empty-state">
          <p>暂无复利计划</p>
        </div>
      </div>

      <!-- Executions Tab -->
      <div v-show="activeTab === 'executions'" class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>执行时间</th>
              <th>状态</th>
              <th>交易哈希</th>
              <th>获得收益</th>
              <th>再投资</th>
              <th>Gas费用</th>
              <th>新头寸价值</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exec in allExecutions" :key="exec.id">
              <td>{{ formatTime(exec.executedAt) }}</td>
              <td>
                <span class="tag" :class="exec.status === 'success' ? 'success' : 'danger'">
                  {{ exec.status === 'success' ? '成功' : '失败' }}
                </span>
              </td>
              <td class="mono">{{ shortenAddress(exec.txHash) }}</td>
              <td>${{ exec.rewardsClaimed }}</td>
              <td class="highlight">${{ exec.rewardsReinvested }}</td>
              <td>${{ exec.gasFee }}</td>
              <td>${{ exec.newPositionValue }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Positions Tab -->
      <div v-show="activeTab === 'positions'" class="positions-grid">
        <div v-for="pos in positions" :key="pos.id" class="position-card">
          <div class="position-header">
            <h4>{{ pos.token0 }}/{{ pos.token1 }}</h4>
            <span class="tag">{{ pos.protocol }}</span>
          </div>
          <div class="position-details">
            <div class="detail">
              <span class="label">价值</span>
              <span class="value">${{ parseFloat(pos.value).toLocaleString() }}</span>
            </div>
            <div class="detail">
              <span class="label">APY</span>
              <span class="value highlight">{{ pos.apy }}%</span>
            </div>
            <div class="detail">
              <span class="label">7日手续费</span>
              <span class="value">${{ pos.fees7d }}</span>
            </div>
            <div class="detail">
              <span class="label">待收奖励</span>
              <span class="value reward">${{ pos.rewards }}</span>
            </div>
          </div>
          <button class="btn-primary btn-full">
            创建复利计划
          </button>
        </div>
      </div>
    </div>

    <!-- Create Dialog -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h2>创建复利计划</h2>
          <button class="close-btn" @click="showCreateDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>计划名称</label>
            <input v-model="newSchedule.name" placeholder="例如: ETH-USDC LP Compound" />
          </div>
          <div class="form-group">
            <label>协议</label>
            <select v-model="newSchedule.protocol">
              <option v-for="p in protocols" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>链</label>
            <select v-model="newSchedule.chainId">
              <option v-for="c in chains" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>池地址</label>
            <input v-model="newSchedule.poolAddress" placeholder="流动性池合约地址" />
          </div>
          <div class="form-group">
            <label>复利频率</label>
            <select v-model="newSchedule.compoundFrequency">
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="biweekly">每两周</option>
              <option value="monthly">每月</option>
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="newSchedule.autoCompound" />
              自动复利
            </label>
          </div>
          <div class="form-group">
            <label>滑点容忍度: {{ newSchedule.slippageTolerance }}%</label>
            <input 
              type="range" 
              v-model.number="newSchedule.slippageTolerance" 
              min="0.1" 
              max="5" 
              step="0.1" 
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showCreateDialog = false">取消</button>
          <button class="btn-primary" @click="createSchedule">创建</button>
        </div>
      </div>
    </div>

    <!-- Simulate Dialog -->
    <div v-if="showSimulateDialog" class="dialog-overlay" @click.self="showSimulateDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h2>复利模拟结果</h2>
          <button class="close-btn" @click="showSimulateDialog = false">×</button>
        </div>
        <div v-if="simulateResult" class="dialog-body simulate-result">
          <div class="result-row">
            <span class="label">当前价值:</span>
            <span class="value">${{ simulateResult.currentValue }}</span>
          </div>
          <div class="result-row">
            <span class="label">预计收益:</span>
            <span class="value">${{ simulateResult.estimatedRewards }}</span>
          </div>
          <div class="result-row">
            <span class="label">Gas估算:</span>
            <span class="value gas">${{ simulateResult.gasEstimate }}</span>
          </div>
          <div class="result-row highlight">
            <span class="label">净收益:</span>
            <span class="value">${{ simulateResult.netRewards }}</span>
          </div>
          <div class="result-row">
            <span class="label">复利后价值:</span>
            <span class="value big">${{ simulateResult.newValue }}</span>
          </div>
          <div class="result-row">
            <span class="label">APY提升:</span>
            <span class="value success">{{ simulateResult.apyImprovement }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '@/service/request'

interface Schedule {
  id: string
  name: string
  protocol: string
  chainId: number
  chainName: string
  poolAddress: string
  positionValue: string
  estimatedApy: string
  compoundFrequency: string
  nextExecutionTime: string
  status: string
  autoCompound: boolean
}

interface Execution {
  id: string
  scheduleId: string
  executedAt: string
  status: string
  txHash: string
  gasFee: string
  rewardsClaimed: string
  rewardsReinvested: string
  newPositionValue: string
}

interface Position {
  id: string
  protocol: string
  chainId: number
  poolAddress: string
  token0: string
  token1: string
  value: string
  apy: string
  fees7d: string
  rewards: string
}

const tabs = [
  { id: 'schedules', label: '复利计划' },
  { id: 'executions', label: '执行历史' },
  { id: 'positions', label: '协议头寸' },
]

const activeTab = ref('schedules')
const schedules = ref<Schedule[]>([])
const allExecutions = ref<Execution[]>([])
const positions = ref<Position[]>([])
const dashboardStats = ref<any>(null)
const protocols = ref<any[]>([])
const chains = ref<any[]>([])

const showCreateDialog = ref(false)
const showSimulateDialog = ref(false)
const simulateResult = ref<any>(null)

const newSchedule = ref({
  name: '',
  protocol: '',
  chainId: 1,
  poolAddress: '',
  compoundFrequency: 'daily',
  autoCompound: true,
  slippageTolerance: 0.5,
})

const loadData = async () => {
  try {
    const [statsRes, schedulesRes, executionsRes, positionsRes, protocolsRes, chainsRes] = await Promise.all([
      request({ url: '/web3/auto-compound/dashboard', method: 'get' }),
      request({ url: '/web3/auto-compound/schedules', method: 'get' }),
      request({ url: '/web3/auto-compound/executions', method: 'get' }),
      request({ url: '/web3/auto-compound/positions', method: 'get' }),
      request({ url: '/web3/auto-compound/protocols', method: 'get' }),
      request({ url: '/web3/auto-compound/chains', method: 'get' }),
    ])
    
    dashboardStats.value = statsRes
    schedules.value = schedulesRes
    allExecutions.value = executionsRes
    positions.value = positionsRes
    protocols.value = protocolsRes
    chains.value = chainsRes
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

const createSchedule = async () => {
  try {
    await request({
      url: '/web3/auto-compound/schedules',
      method: 'post',
      data: newSchedule.value,
    })
    alert('复利计划创建成功')
    showCreateDialog.value = false
    loadData()
    newSchedule.value = {
      name: '',
      protocol: '',
      chainId: 1,
      poolAddress: '',
      compoundFrequency: 'daily',
      autoCompound: true,
      slippageTolerance: 0.5,
    }
  } catch (error) {
    alert('创建失败')
  }
}

const pauseSchedule = async (id: string) => {
  try {
    await request({
      url: `/web3/auto-compound/schedules/${id}/pause`,
      method: 'post',
    })
    alert('计划已暂停')
    loadData()
  } catch (error) {
    alert('操作失败')
  }
}

const resumeSchedule = async (id: string) => {
  try {
    await request({
      url: `/web3/auto-compound/schedules/${id}/resume`,
      method: 'post',
    })
    alert('计划已恢复')
    loadData()
  } catch (error) {
    alert('操作失败')
  }
}

const deleteSchedule = async (id: string) => {
  try {
    await request({
      url: `/web3/auto-compound/schedules/${id}`,
      method: 'delete',
    })
    alert('计划已删除')
    loadData()
  } catch (error) {
    alert('删除失败')
  }
}

const simulateCompound = async (id: string) => {
  try {
    simulateResult.value = await request({
      url: `/web3/auto-compound/simulate/${id}`,
      method: 'get',
    })
    showSimulateDialog.value = true
  } catch (error) {
    alert('模拟失败')
  }
}

const shortenAddress = (addr: string) => {
  if (!addr) return ''
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

const formatTime = (time: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    active: 'success',
    paused: 'warning',
    completed: 'info',
    failed: 'danger',
  }
  return classes[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '运行中',
    paused: '已暂停',
    completed: '已完成',
    failed: '失败',
  }
  return texts[status] || status
}

const getChainClass = (chainId: number) => {
  const classes: Record<number, string> = {
    1: '',
    42161: 'success',
    10: 'warning',
    8453: 'info',
    137: 'danger',
  }
  return classes[chainId] || 'info'
}

const getFrequencyText = (frequency: string) => {
  const texts: Record<string, string> = {
    daily: '每日',
    weekly: '每周',
    biweekly: '每两周',
    monthly: '每月',
  }
  return texts[frequency] || frequency
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.defi-auto-compound {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
}

.subtitle {
  color: #666;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-value.highlight {
  color: #409eff;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.gas {
  color: #909399;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.btn-primary {
  background: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-secondary {
  background: #f4f4f5;
  color: #606266;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #e9e9eb;
}

.btn-small {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  background: #f4f4f5;
}

.btn-small.warning {
  background: #e6a23c;
  color: white;
}

.btn-small.success {
  background: #67c23a;
  color: white;
}

.btn-small.danger {
  background: #f56c6c;
  color: white;
}

.btn-full {
  width: 100%;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.tab-btn {
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.tab-btn.active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.tab-content {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.schedule-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.schedule-info h3 {
  margin: 0 0 8px 0;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #f4f4f5;
  margin-right: 8px;
}

.tag.success {
  background: #f0f9eb;
  color: #67c23a;
}

.tag.warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.tag.danger {
  background: #fef0f0;
  color: #f56c6c;
}

.tag.info {
  background: #f4f4f5;
  color: #909399;
}

.schedule-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.detail-row {
  display: flex;
  flex-direction: column;
}

.detail-row .label {
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.detail-row .value {
  font-size: 14px;
}

.detail-row .value.highlight {
  color: #409eff;
  font-weight: 600;
}

.mono {
  font-family: monospace;
  font-size: 12px;
}

.schedule-actions {
  display: flex;
  gap: 8px;
}

.positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.position-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.position-header h4 {
  margin: 0;
}

.position-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.detail {
  display: flex;
  flex-direction: column;
}

.detail .label {
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.detail .value {
  font-size: 16px;
  font-weight: 500;
}

.detail .value.highlight {
  color: #409eff;
}

.detail .value.reward {
  color: #67c23a;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e4e7ed;
}

.data-table th {
  background: #f5f7fa;
  font-weight: 600;
}

.data-table .highlight {
  color: #409eff;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.dialog-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
}

.dialog-body {
  padding: 20px;
}

.dialog-footer {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input[type="range"] {
  width: 100%;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.simulate-result {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.result-row .label {
  color: #606266;
}

.result-row .value {
  font-weight: 600;
}

.result-row .value.gas {
  color: #909399;
}

.result-row .value.big {
  font-size: 20px;
  color: #409eff;
}

.result-row .value.success {
  color: #67c23a;
}

.result-row.highlight {
  background: #ecf5ff;
  margin: 0 -20px;
  padding: 12px 20px;
}
</style>
