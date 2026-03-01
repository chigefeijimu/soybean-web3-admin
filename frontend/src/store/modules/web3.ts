import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Address } from 'viem';

interface Web3Account {
  address: Address;
  chainId: number;
  isConnected: boolean;
}

interface Web3State {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

export const useWeb3Store = defineStore('web3', () => {
  const isConnected = ref(false);
  const address = ref<string | null>(null);
  const chainId = ref<number | null>(null);
  const balance = ref<string | null>(null);

  const shortAddress = computed(() => {
    if (!address.value) return '';
    return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`;
  });

  function setAccount(account: Web3Account | null) {
    if (account) {
      isConnected.value = account.isConnected;
      address.value = account.address;
      chainId.value = account.chainId;
    } else {
      isConnected.value = false;
      address.value = null;
      chainId.value = null;
      balance.value = null;
    }
  }

  function setBalance(bal: string) {
    balance.value = bal;
  }

  return {
    isConnected,
    address,
    chainId,
    balance,
    shortAddress,
    setAccount,
    setBalance
  };
});
