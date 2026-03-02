<template>
  <div class="tx-failure-analyzer">
    <n-card title="🔍 Transaction Failure Analyzer" :bordered="false">
      <n-space vertical>
        <!-- 分析表单 -->
        <div class="analyze-form">
          <n-form>
            <n-form-item label="Transaction Hash">
              <n-input 
                v-model:value="txHash" 
                placeholder="0x..." 
              />
            </n-form-item>
            
            <n-form-item label="Error Message">
              <n-input 
                v-model:value="errorMessage" 
                type="textarea"
                placeholder="输入错误信息，如: insufficient funds, gas too low, execution reverted..."
                :rows="3"
              />
            </n-form-item>

            <n-grid :cols="2" :x-gap="16">
              <n-gi>
                <n-form-item label="Gas Used (Optional)">
                  <n-input-number 
                    v-model:value="gasUsed" 
                    placeholder="21000"
                    style="width: 100%"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Revert Data (Optional)">
                  <n-input 
                    v-model:value="revertData" 
                    placeholder="0x..."
                  />
                </n-form-item>
              </n-gi>
            </n-grid>

            <n-button type="primary" @click="analyzeFailure" :loading="loading" block>
              分析失败原因
            </n-button>
          </n-form>
        </div>

        <!-- 分析结果 -->
        <div v-if="analysis" class="analysis-result">
          <n-space justify="space-between" align="center" style="margin-bottom: 16px">
            <n-h3 style="margin: 0">分析结果</n-h3>
            <n-tag :type="getSeverityType(analysis.severity)">
              {{ getSeverityLabel(analysis.severity) }}
            </n-tag>
          </n-space>

          <n-descriptions :column="2" label-placement="left" bordered>
            <n-descriptions-item label="失败类型">
              {{ getFailureTypeLabel(analysis.failureType) }}
            </n-descriptions-item>
            <n-descriptions-item label="交易哈希">
              <n-text code>{{ analysis.txHash }}</n-text>
            </n-descriptions-item>
            <n-descriptions-item v-if="analysis.gasUsed" label="Gas消耗">
              {{ analysis.gasUsed.toLocaleString() }}
            </n-descriptions-item>
            <n-descriptions-item v-if="analysis.revertReason" label="Revert原因">
              {{ analysis.revertReason }}
            </n-descriptions-item>
          </n-descriptions>

          <!-- 解决方案 -->
          <div class="solutions" style="margin-top: 16px">
            <n-h4>💡 解决方案</n-h4>
            <n-space vertical>
              <n-card v-for="(solution, index) in analysis.solutions" :key="index" size="small">
                <n-space justify="space-between" align="center">
                  <n-text strong>{{ solution.title }}</n-text>
                  <n-tag v-if="solution.estimatedCost" type="warning" size="small">
                    💰 {{ solution.estimatedCost }}
                  </n-tag>
                </n-space>
                <p style="margin: 8px 0; color: #666">{{ solution.description }}</p>
                <n-tag type="success" size="small">{{ solution.actionType }}</n-tag>
              </n-card>
            </n-space>
          </div>
        </div>

        <!-- 批量分析 -->
        <div class="batch-section" style="margin-top: 24px">
          <n-h3>📊 批量分析</n-h3>
          <p style="color: #666; margin-bottom: 16px">分析多个交易失败的原因</p>
          
          <n-input
            v-model:value="batchInput"
            type="textarea"
            placeholder="每行一个交易，格式: txHash|errorMessage|gasUsed|revertData"
            :rows="5"
            style="margin-bottom: 16px"
          />
          
          <n-button type="success" @click="analyzeBatch" :loading="loadingBatch" block>
            批量分析
          </n-button>

          <!-- 批量结果 -->
          <div v-if="batchResult" class="batch-result" style="margin-top: 16px">
            <n-grid :cols="3" :x-gap="16" :y-gap="16">
              <n-gi>
                <n-statistic label="总失败数" :value="batchResult.statistics.totalFailures" />
              </n-gi>
              <n-gi>
                <n-statistic label="平均Gas浪费" :value="batchResult.statistics.averageGasWasted.toLocaleString()" />
              </n-gi>
              <n-gi>
                <n-statistic label="最常见失败">{{ batchResult.statistics.mostCommonFailure }}</n-statistic>
              </n-gi>
            </n-grid>

            <div class="failure-types" style="margin-top: 16px">
              <n-h4>失败类型分布</n-h4>
              <n-space vertical>
                <div v-for="(count, type) in batchResult.statistics.failureTypes" :key="type" style="display: flex; align-items: center; gap: 12px">
                  <span style="width: 150px; font-size: 12px">{{ type }}</span>
                  <n-progress 
                    type="line" 
                    :percentage="Math.round(count / batchResult.statistics.totalFailures * 100)"
                    :height="8"
                    style="flex: 1"
                  />
                  <span style="font-size: 12px; color: #666">{{ count }}</span>
                </div>
              </n-space>
            </div>
          </div>
        </div>

        <!-- 常见错误参考 -->
        <div class="common-errors" style="margin-top: 24px">
          <n-h4>📚 常见错误参考</n-h4>
          <n-space>
            <n-button v-for="(item, key) in errorExamples" :key="key" @click="fillExample(key)" tertiary>
              {{ item.label }}
            </n-button>
          </n-space>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  NCard, NButton, NInput, NInputNumber, NForm, NFormItem, 
  NSpace, NH3, NH4, NTag, NText, NDescriptions, NDescriptionsItem,
  NGrid, NGi, NStatistic, NProgress, useMessage 
} from 'naive-ui';

const message = useMessage();

interface Solution {
  title: string;
  description: string;
  actionType: string;
  estimatedCost?: string;
}

interface TransactionFailureAnalysis {
  txHash: string;
  failureType: string;
  severity: string;
  errorMessage: string;
  solutions: Solution[];
  gasUsed?: number;
  revertReason?: string;
}

interface FailureStatistics {
  totalFailures: number;
  failureTypes: Record<string, number>;
  averageGasWasted: number;
  mostCommonFailure: string;
  recommendedGasPrice: string;
}

interface BatchResult {
  analyses: TransactionFailureAnalysis[];
  statistics: FailureStatistics;
}

const txHash = ref('');
const errorMessage = ref('');
const gasUsed = ref<number | undefined>(undefined);
const revertData = ref('');
const loading = ref(false);
const analysis = ref<TransactionFailureAnalysis | null>(null);

// Batch
const batchInput = ref('');
const loadingBatch = ref(false);
const batchResult = ref<BatchResult | null>(null);

const errorExamples: Record<string, { label: string; hash: string; error: string; gas?: number }> = {
  insufficient: { label: '💰 Insufficient Funds', hash: '0x1234567890abcdef1234567890abcdef12345678', error: 'insufficient funds for transfer', gas: 21000 },
  gas: { label: '⛽ Gas Too Low', hash: '0xabcdef1234567890abcdef1234567890abcdef12', error: 'gas too low for transaction', gas: 21000 },
  nonce: { label: '#️⃣ Nonce Error', hash: '0x9876543210fedcba9876543210fedcba98765432', error: 'nonce too low', gas: 21000 },
  revert: { label: '🔄 Execution Reverted', hash: '0xfedcba9876543210fedcba9876543210fedcba98', error: 'execution reverted: INSUFFICIENT_OUTPUT_AMOUNT', gas: 150000 },
  slippage: { label: '📉 Slippage Exceeded', hash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', error: 'price impact too high: slippage exceeded', gas: 200000 },
};

const analyzeFailure = async () => {
  if (!txHash.value || !errorMessage.value) {
    message.warning('请输入交易哈希和错误信息');
    return;
  }

  loading.value = true;
  try {
    const response = await fetch('/api/web3/transaction/analyze-failure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txHash: txHash.value,
        errorMessage: errorMessage.value,
        gasUsed: gasUsed.value,
        revertData: revertData.value || null,
      }),
    });
    
    const result = await response.json();
    if (result.success) {
      analysis.value = result.data;
      message.success('分析完成');
    } else {
      message.error(result.msg || '分析失败');
    }
  } catch (error) {
    message.error('请求失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const analyzeBatch = async () => {
  if (!batchInput.value.trim()) {
    message.warning('请输入批量数据');
    return;
  }

  loadingBatch.value = true;
  try {
    const transactions = batchInput.value.trim().split('\n').map(line => {
      const parts = line.split('|');
      return {
        txHash: parts[0]?.trim() || '',
        errorMessage: parts[1]?.trim() || '',
        gasUsed: parts[2] ? parseInt(parts[2]) : undefined,
        revertData: parts[3]?.trim() || null,
      };
    }).filter(t => t.txHash && t.errorMessage);

    const response = await fetch('/api/web3/transaction/analyze-batch-failures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions }),
    });
    
    const result = await response.json();
    if (result.success) {
      batchResult.value = result.data;
      message.success('批量分析完成');
    } else {
      message.error(result.msg || '分析失败');
    }
  } catch (error) {
    message.error('请求失败');
    console.error(error);
  } finally {
    loadingBatch.value = false;
  }
};

const fillExample = (type: string) => {
  const example = errorExamples[type];
  if (example) {
    txHash.value = example.hash;
    errorMessage.value = example.error;
    gasUsed.value = example.gas;
  }
};

const getSeverityType = (severity: string): 'success' | 'warning' | 'error' | 'info' => {
  const types: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    Low: 'success',
    Medium: 'warning',
    High: 'error',
    Critical: 'error',
  };
  return types[severity] || 'info';
};

const getSeverityLabel = (severity: string): string => {
  const labels: Record<string, string> = {
    Low: '🟢 低风险',
    Medium: '🟡 中等风险',
    High: '🟠 高风险',
    Critical: '🔴 严重',
  };
  return labels[severity] || severity;
};

const getFailureTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    InsufficientFunds: '资金不足',
    GasTooLow: 'Gas太低',
    GasTooHigh: 'Gas太高',
    NonceTooLow: 'Nonce太低',
    NonceTooHigh: 'Nonce太高',
    ContractReverted: '合约Revert',
    TokenInsufficientBalance: '代币余额不足',
    AllowanceExceeded: '授权额度超限',
    SlippageExceeded: '滑点超限',
    DeadlineExceeded: '超过截止时间',
    InsufficientLiquidity: '流动性不足',
    InvalidChainId: '链ID无效',
    Unknown: '未知错误',
  };
  return labels[type] || type;
};
</script>

<style scoped>
.tx-failure-analyzer {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.analyze-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.input, .textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.input:focus, .textarea:focus {
  outline: none;
  border-color: #165dff;
}

.btn-primary {
  background: #165dff;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #4080ff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #00b42a;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.analysis-result {
  background: white;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-header h4 {
  margin: 0;
}

.severity-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.severity-badge.low {
  background: #d9f7be;
  color: #389e0d;
}

.severity-badge.medium {
  background: #fff1b8;
  color: #d48806;
}

.severity-badge.high {
  background: #ffbb96;
  color: #d46b08;
}

.severity-badge.critical {
  background: #ffccc7;
  color: #cf1322;
}

.failure-info {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item .label {
  width: 100px;
  color: #666;
}

.info-item .value {
  flex: 1;
  color: #333;
}

.info-item .value.mono {
  font-family: monospace;
  font-size: 12px;
}

.solutions h5 {
  margin: 0 0 12px 0;
}

.solution-card {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.solution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.solution-title {
  font-weight: 500;
  color: #333;
}

.solution-cost {
  color: #d46b08;
  font-size: 12px;
}

.solution-desc {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 13px;
}

.action-type {
  display: inline-block;
  padding: 2px 8px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  font-size: 11px;
}

.batch-section {
  background: white;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.batch-section h4 {
  margin: 0 0 8px 0;
}

.hint {
  color: #666;
  font-size: 13px;
  margin: 0 0 16px 0;
}

.batch-input {
  margin-bottom: 16px;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 16px 0;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #165dff;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.failure-types h5 {
  margin: 16px 0 12px 0;
}

.type-bar {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.type-name {
  width: 150px;
  font-size: 12px;
  color: #333;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  margin: 0 12px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #165dff, #4080ff);
  border-radius: 4px;
  transition: width 0.3s;
}

.type-count {
  font-size: 12px;
  color: #666;
}

.common-errors {
  background: white;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 20px;
}

.common-errors h4 {
  margin: 0 0 16px 0;
}

.error-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.error-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.error-item:hover {
  background: #e8f5e9;
}

.error-name {
  font-weight: 500;
  color: #333;
  font-size: 13px;
}

.error-desc {
  color: #666;
  font-size: 12px;
}
</style>
