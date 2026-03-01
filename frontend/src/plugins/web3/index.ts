// Web3 Plugin using wagmi v3 + viem
import { QueryClient } from '@tanstack/vue-query';
import { createConfig, http } from 'wagmi';
import { arbitrum, bsc, mainnet, optimism, polygon, sepolia } from 'wagmi/chains';
import { createWeb3Modal } from '@web3modal/ethers/vue';

// Create wagmi config - cast chains to any to avoid v3 type issues
export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, optimism, bsc] as any,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http()
  },
  connectors: []
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
});

// Project ID for WalletConnect (can be empty for local)
export const projectId = '';

// Web3Modal setup
export function setupWeb3Modal() {
  if (!projectId) {
    // No project ID configured, MetaMask-only mode
    return null;
  }

  try {
    const modal = createWeb3Modal({
      ethersConfig: {} as any,
      projectId,
      chains: [mainnet, sepolia, polygon, arbitrum, optimism, bsc] as any,
      enableAnalytics: false
    });
    return modal;
  } catch {
    // Web3Modal setup failed, falling back to MetaMask-only
    return null;
  }
}

// Export config for use
export const web3Config = config;
export const web3QueryClient = queryClient;
