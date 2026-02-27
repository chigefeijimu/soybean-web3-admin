import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/vue'
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

// Get projectId at https://cloud.walletconnect.com
const projectId = 'YOUR_PROJECT_ID'

const metadata = {
  name: 'Soybean Admin',
  description: 'Web3 Admin Panel',
  url: 'https://soybean-admin.com',
  icons: ['https://avatars.mywebsite.com/']
}

// Wagmi chains
const chains = [mainnet, sepolia]

// Create config
export const config = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http()
  },
  ...defaultConfig({ metadata })
})

// Create modal
createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  projectId,
  chains,
  enableAnalytics: true
})

export function initWeb3() {
  return {
    config,
    projectId
  }
}
