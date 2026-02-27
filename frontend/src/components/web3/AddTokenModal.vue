<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NModal, NCard, useMessage, NDivider } from 'naive-ui'
import { TokenOutlined } from '@vicons/antd'
import { createContract } from '@/service/api/web3'
import { ERC20_ABI, POPULAR_TOKENS, BSC_TOKENS } from '@/constants/tokens'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'added'): void
}>()

const message = useMessage()
const loading = ref(false)

const addToken = async (token: typeof POPULAR_TOKENS.USDT) => {
  loading.value = true
  try {
    await createContract({
      name: `${token.symbol} (Token)`,
      contractAddress: token.address,
      chainId: token.chainId,
      abi: JSON.stringify(ERC20_ABI),
      description: `Popular ${token.symbol} token on ${token.chainId === 1 ? 'Ethereum' : 'BSC'}`
    })
    message.success(`${token.symbol} added successfully!`)
    emit('added')
    emit('update:show', false)
  } catch (error: any) {
    message.error(error.message || 'Failed to add token')
  } finally {
    loading.value = false
  }
}

const addAllPopular = async () => {
  loading.value = true
  try {
    for (const token of Object.values(POPULAR_TOKENS)) {
      await createContract({
        name: `${token.symbol} (Token)`,
        contractAddress: token.address,
        chainId: token.chainId,
        abi: JSON.stringify(ERC20_ABI),
        description: `Popular ${token.symbol} token`
      })
    }
    message.success('All popular tokens added!')
    emit('added')
    emit('update:show', false)
  } catch (error: any) {
    message.error(error.message || 'Failed to add tokens')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="Add Popular Tokens"
    style="width: 500px;"
    @update:show="emit('update:show', $event)"
  >
    <div class="token-list">
      <div class="section">
        <div class="section-title">Ethereum Mainnet</div>
        <NSpace>
          <NButton 
            v-for="token in Object.values(POPULAR_TOKENS)" 
            :key="token.address"
            :loading="loading"
            @click="addToken(token)"
          >
            {{ token.symbol }}
          </NButton>
        </NSpace>
      </div>

      <NDivider />

      <div class="section">
        <div class="section-title">Quick Actions</div>
        <NSpace>
          <NButton type="primary" :loading="loading" @click="addAllPopular">
            Add All Popular Tokens
          </NButton>
        </NSpace>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.token-list {
  padding: 8px 0;
}

.section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}
</style>
