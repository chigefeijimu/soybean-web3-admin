<template>
  <div class="signature-verifier">
    <n-card title="🔐 签名验证器" :bordered="false" class="card-wrap">
      <n-tabs type="line" animated>
        <n-tab-pane name="verify" tab="验证签名">
          <n-space vertical :size="16">
            <n-form-item label="消息内容" required>
              <n-input
                v-model:value="verifyForm.message"
                type="textarea"
                placeholder="输入要验证的消息内容"
                :rows="3"
              />
            </n-form-item>

            <n-form-item label="签名" required>
              <n-input
                v-model:value="verifyForm.signature"
                placeholder="0x..."
              />
            </n-form-item>

            <n-button type="primary" @click="handleVerify" :loading="verifying" block>
              验证签名
            </n-button>

            <n-alert v-if="verifyResult" :type="verifyResult.valid ? 'success' : 'error'" v-bind="verifyResult.valid ? { title: '✅ 签名验证成功' } : { title: '❌ 签名验证失败' }">
              <template #default>
                <div v-if="verifyResult.valid">
                  <p><strong>签名者地址:</strong> {{ verifyResult.signer }}</p>
                  <p><strong>算法:</strong> {{ verifyResult.algorithm }}</p>
                </div>
                <div v-else>
                  <p>无法验证该签名，请检查消息和签名是否正确</p>
                </div>
              </template>
            </n-alert>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="sign" tab="生成签名">
          <n-space vertical :size="16">
            <n-form-item label="消息内容" required>
              <n-input
                v-model:value="signForm.message"
                type="textarea"
                placeholder="输入要签名的消息"
                :rows="3"
              />
            </n-form-item>

            <n-form-item label="私钥（可选）">
              <n-input
                v-model:value="signForm.privateKey"
                placeholder="不填则自动生成测试钱包"
                show-password-on="click"
              />
            </n-form-item>

            <n-button type="info" @click="handleSign" :loading="signing" block>
              生成签名
            </n-button>

            <n-alert v-if="signResult" type="success" title="✅ 签名生成成功">
              <template #default>
                <p><strong>签名者:</strong> {{ signResult.signer }}</p>
                <p><strong>签名:</strong> <n-text code>{{ signResult.signature }}</n-text></p>
                <p v-if="signResult.privateKey"><strong>私钥:</strong> <n-text code>{{ signResult.privateKey }}</n-text></p>
                <p class="warning-text">⚠️ 私钥仅用于测试，请勿在生产环境使用真实私钥</p>
              </template>
            </n-alert>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="test" tab="测试示例">
          <n-space vertical :size="16">
            <n-button @click="loadTestSignatures" :loading="loadingTest" block>
              加载测试签名
            </n-button>

            <template v-if="testExamples.length">
              <n-card v-for="(item, index) in testExamples" :key="index" size="small" embedded>
                <n-descriptions :column="1" label-placement="left">
                  <n-descriptions-item label="消息">
                    <n-text code>{{ item.message }}</n-text>
                  </n-descriptions-item>
                  <n-descriptions-item label="签名者">
                    <n-text code>{{ item.signer }}</n-text>
                  </n-descriptions-item>
                  <n-descriptions-item label="签名">
                    <n-text code>{{ item.signature.slice(0, 50) }}...</n-text>
                  </n-descriptions-item>
                </n-descriptions>
                <n-space style="margin-top: 12px">
                  <n-button size="small" @click="useAsVerify(item)">
                    使用验证
                  </n-button>
                </n-space>
              </n-card>
            </template>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="chains" tab="支持链">
          <n-space vertical :size="16">
            <n-alert type="info">
              以下链均支持 Ethereum 签名标准 (EIP-191)
            </n-alert>
            <n-data-table
              :columns="chainColumns"
              :data="supportedChains"
              :bordered="false"
            />
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NSpace, NCard, NTabs, NTabPane, NFormItem, NInput, NButton, NAlert, NText, NDescriptions, NDescriptionsItem, NDataTable, useMessage } from 'naive-ui'

const message = useMessage()

const verifyForm = reactive({
  message: '',
  signature: ''
})

const signForm = reactive({
  message: 'Hello, Web3!',
  privateKey: ''
})

const verifying = ref(false)
const signing = ref(false)
const loadingTest = ref(false)

const verifyResult = ref<any>(null)
const signResult = ref<any>(null)
const testExamples = ref<any[]>([])
const supportedChains = ref<any[]>([])

const chainColumns = [
  { title: '链名称', key: 'name' },
  { title: 'Chain ID', key: 'chainId' },
  { title: '代币符号', key: 'symbol' }
]

const apiBase = '/api/web3-signature-verifier'

async function handleVerify() {
  if (!verifyForm.message || !verifyForm.signature) {
    message.warning('请填写消息和签名')
    return
  }
  
  verifying.value = true
  verifyResult.value = null
  
  try {
    const res = await fetch(`${apiBase}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyForm)
    })
    const data = await res.json()
    verifyResult.value = data
  } catch (e: any) {
    message.error('验证失败: ' + e.message)
  } finally {
    verifying.value = false
  }
}

async function handleSign() {
  if (!signForm.message) {
    message.warning('请填写消息内容')
    return
  }
  
  signing.value = true
  signResult.value = null
  
  try {
    const res = await fetch(`${apiBase}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signForm)
    })
    const data = await res.json()
    if (data.error) {
      message.error(data.error)
    } else {
      signResult.value = data
    }
  } catch (e: any) {
    message.error('签名失败: ' + e.message)
  } finally {
    signing.value = false
  }
}

async function loadTestSignatures() {
  loadingTest.value = true
  try {
    const res = await fetch(`${apiBase}/test-signatures`)
    const data = await res.json()
    testExamples.value = data.examples || []
    
    const chainRes = await fetch(`${apiBase}/supported-chains`)
    const chainData = await chainRes.json()
    supportedChains.value = chainData.chains || []
  } catch (e: any) {
    message.error('加载失败: ' + e.message)
  } finally {
    loadingTest.value = false
  }
}

function useAsVerify(item: any) {
  verifyForm.message = item.message
  verifyForm.signature = item.signature
  message.success('已填充到验证表单')
}

// 加载支持的链
loadTestSignatures()
</script>

<style scoped>
.signature-verifier {
  padding: 16px;
}

.card-wrap {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 8px;
}

.card-wrap :deep(.n-card) {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
}

.warning-text {
  color: #d03050;
  font-size: 12px;
  margin-top: 8px;
}
</style>
