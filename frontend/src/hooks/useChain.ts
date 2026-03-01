/** Chain configuration for multi-chain support */
export interface ChainConfig {
  id: number;
  name: string;
  shortName: string;
  symbol: string;
  rpcUrl: string;
  explorer: string;
  color: string;
}

/** Supported chains */
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  1: {
    id: 1,
    name: 'Ethereum Mainnet',
    shortName: 'ETH',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    color: '#627EEA'
  },
  5: {
    id: 5,
    name: 'Goerli Testnet',
    shortName: 'Goerli',
    symbol: 'ETH',
    rpcUrl: 'https://goerli.infura.io/v3/public',
    explorer: 'https://goerli.etherscan.io',
    color: '#F6C343'
  },
  11155111: {
    id: 11155111,
    name: 'Sepolia Testnet',
    shortName: 'Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.infura.io/v3/public',
    explorer: 'https://sepolia.etherscan.io',
    color: '#C0C0C0'
  },
  56: {
    id: 56,
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorer: 'https://bscscan.com',
    color: '#F3BA2F'
  },
  97: {
    id: 97,
    name: 'BNB Testnet',
    shortName: 'BSC Test',
    symbol: 'BNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorer: 'https://testnet.bscscan.com',
    color: '#F3BA2F'
  },
  137: {
    id: 137,
    name: 'Polygon Mainnet',
    shortName: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    color: '#8247E5'
  },
  80001: {
    id: 80001,
    name: 'Mumbai Testnet',
    shortName: 'Mumbai',
    symbol: 'MATIC',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorer: 'https://mumbai.polygonscan.com',
    color: '#8247E5'
  }
};

/** Get chain config by chain ID */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId];
}

/** Get chain name by chain ID */
export function getChainName(chainId: number): string {
  return SUPPORTED_CHAINS[chainId]?.name || `Chain ${chainId}`;
}

/** Get chain short name by chain ID */
export function getChainShortName(chainId: number): string {
  return SUPPORTED_CHAINS[chainId]?.shortName || `${chainId}`;
}

/** Get explorer URL for transaction */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const explorer = SUPPORTED_CHAINS[chainId]?.explorer;
  return explorer ? `${explorer}/tx/${txHash}` : `#`;
}

/** Get explorer URL for address */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const explorer = SUPPORTED_CHAINS[chainId]?.explorer;
  return explorer ? `${explorer}/address/${address}` : `#`;
}

/** Format address for display */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/** Format transaction hash for display */
export function formatTxHash(txHash: string): string {
  return formatAddress(txHash, 10, 8);
}
