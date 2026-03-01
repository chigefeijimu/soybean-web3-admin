// Web3 Composable - Wallet connection and chain management
import { computed, ref } from 'vue';

// Global state
const isConnected = ref(false);
const account = ref('');
const chainId = ref<number>(1);
const balance = ref('0');
const isConnecting = ref(false); // eslint-disable-line @typescript-eslint/no-unused-vars

// Chain information
const CHAIN_INFO: Record<number, { name: string; symbol: string; explorer: string; chainId: number }> = {
  1: { name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io', chainId: 1 },
  11155111: { name: 'Sepolia', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io', chainId: 11155111 },
  137: { name: 'Polygon', symbol: 'MATIC', explorer: 'https://polygonscan.com', chainId: 137 },
  42161: { name: 'Arbitrum', symbol: 'ETH', explorer: 'https://arbiscan.io', chainId: 42161 },
  10: { name: 'Optimism', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io', chainId: 10 },
  56: { name: 'BSC', symbol: 'BNB', explorer: 'https://bscscan.com', chainId: 56 }
};

export function useWeb3() {
  // Update balance
  const updateBalance = async () => {
    if (!account.value || !window.ethereum) return;

    try {
      const balanceHex = await (window as any).ethereum.request({
        method: 'eth_getBalance',
        params: [account.value, 'latest']
      });
      // Convert from wei to ETH
      balance.value = (Number.parseInt(balanceHex, 16) / 1e18).toFixed(4);
    } catch (error) {
      console.error('Failed to get balance:', error); // eslint-disable-line no-console
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    account.value = '';
    chainId.value = 1;
    balance.value = '0';
    isConnected.value = false;
  };

  // Connect with MetaMask
  const connectWallet = async () => {
    if (typeof window === 'undefined') return;

    isConnecting.value = true;
    try {
      // Check if MetaMask is installed
      if (!(window as any).ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account connection
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        account.value = accounts[0];
        isConnected.value = true;

        // Get chain ID
        const chainIdHex = await (window as any).ethereum.request({
          method: 'eth_chainId'
        });
        chainId.value = Number.parseInt(chainIdHex, 16);

        // Get balance
        await updateBalance();

        // Listen for account changes
        (window as any).ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length > 0) {
            account.value = newAccounts[0];
          } else {
            disconnectWallet();
          }
        });

        // Listen for chain changes
        (window as any).ethereum.on('chainChanged', (newChainId: string) => {
          chainId.value = Number.parseInt(newChainId, 16);
          updateBalance();
        });
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error); // eslint-disable-line no-console
      throw error;
    } finally {
      isConnecting.value = false;
    }
  };

  // Switch chain
  const switchChain = async (targetChainId: number) => {
    if (!window.ethereum) return;

    const chainHex = `0x${targetChainId.toString(16)}`;

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainHex }]
      });
      chainId.value = targetChainId;
    } catch (error: any) {
      // Chain not added, user needs to add it
      console.error('Failed to switch chain:', error); // eslint-disable-line no-console
      throw error;
    }
  };

  // Get chain info
  const chainInfo = computed(() => CHAIN_INFO[chainId.value] || CHAIN_INFO[1]);

  // Format address
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    // State
    isConnected: computed(() => isConnected.value),
    account: computed(() => account.value),
    chainId: computed(() => chainId.value),
    balance: computed(() => balance.value),
    isConnecting: computed(() => isConnecting.value),
    chainInfo,

    // Methods
    connectWallet,
    disconnectWallet,
    switchChain,
    updateBalance,
    formatAddress,

    // Constants
    CHAIN_INFO
  };
}

// ERC20 Token ABI (minimal)
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

// Common token addresses
export const COMMON_TOKENS: Record<number, { address: string; symbol: string; name: string }[]> = {
  1: [
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin' },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin' },
    { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave' }
  ],
  137: [
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin (Polygon)' },
    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', name: 'Wrapped Bitcoin' }
  ]
};
