<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Button, Card, Input, Message, Modal } from 'naive-ui'
import { useWeb3Store } from '@/store/modules/web3'

const web3Store = useWeb3Store()

const { address, isConnected, chainId } = useAccount()
const { connect } = useConnect()
const { disconnect } = useDisconnect()

const showModal = ref(false)
const walletAddress = computed(() => address.value ? `${address.value.slice(0, 6)}...${address.value.slice(-4)}` : '')

const chainNames: Record<number, string> = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  56: 'BSC Mainnet',
  97: 'BSC Testnet',
  137: 'Polygon Mainnet',
  80001: 'Mumbai Testnet'
}

const connectWallet = async () => {
  try {
    await connect({ connector: injected() })
    showModal.value = false
    Message.success('Wallet connected successfully')
  } catch (error: any) {
    Message.error(error.message || 'Failed to connect wallet')
  }
}

const disconnectWallet = () => {
  disconnect()
  Message.info('Wallet disconnected')
}

const formatAddress = (addr: string) => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
</script>

<template>
  <div class="wallet-connect">
    <div v-if="isConnected" class="wallet-info">
      <div class="wallet-status">
        <span class="status-dot connected"></span>
        <span>Connected</span>
      </div>
      <div class="wallet-details">
        <div class="wallet-address">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
          </svg>
          {{ formatAddress(address!) }}
        </div>
        <div class="wallet-chain">
          {{ chainNames[chainId!] || `Chain: ${chainId}` }}
        </div>
      </div>
      <Button type="error" size="small" @click="disconnectWallet">
        Disconnect
      </Button>
    </div>
    <Button v-else type="primary" @click="showModal = true">
      Connect Wallet
    </Button>

    <Modal v-model:show="showModal" title="Connect Wallet" preset="card" style="width: 400px;">
      <div class="connect-options">
        <div class="option-item" @click="connectWallet">
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" />
          <span>MetaMask</span>
        </div>
        <div class="option-item disabled">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/52/WalletConnect.svg" alt="WalletConnect" />
          <span>WalletConnect (Coming Soon)</span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.wallet-connect {
  display: inline-block;
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wallet-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #52c41a;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #52c41a;
}

.wallet-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wallet-address {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.wallet-address .icon {
  width: 16px;
  height: 16px;
}

.wallet-chain {
  font-size: 12px;
  color: #999;
}

.connect-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover:not(.disabled) {
  border-color: #1890ff;
  background: #f5f5f5;
}

.option-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.option-item img {
  width: 32px;
  height: 32px;
}
</style>
