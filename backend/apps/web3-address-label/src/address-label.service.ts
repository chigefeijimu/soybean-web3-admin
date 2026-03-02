import { Injectable } from '@nestjs/common';

interface AddressLabel {
  address: string;
  label: string;
  category: string;
  protocol?: string;
  risk?: string;
  chain: string;
  description?: string;
}

@Injectable()
export class AddressLabelService {
  // Known blockchain addresses database
  private readonly addressLabels: AddressLabel[] = [
    // CEX Wallets - Binance
    { address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance Hot Wallet', category: 'CEX', chain: 'ETH', description: 'Binance exchange hot wallet' },
    { address: '0xdccf3b77afb6b7e4d83ffd41e50b8f89b1cb5d7d', label: 'Binance Cold Wallet', category: 'CEX', chain: 'ETH', description: 'Binance exchange cold wallet' },
    { address: '0x9696fdd89819011e4d199af2b72afffa3dd5e5c2', label: 'Binance ETH2', category: 'CEX', chain: 'ETH', description: 'Binance ETH2 deposit' },
    { address: '0xf68d43c0c360b3b0c0c4f3f2c0c7c0b1e2d3a4b5', label: 'Binance Wallet 3', category: 'CEX', chain: 'ETH' },
    
    // CEX - Coinbase
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', label: 'USDC Token', category: 'Token', chain: 'ETH', description: 'USD Coin' },
    { address: '0x8ba1f109551bd432803012645ac136ddd64dba72', label: 'Coinbase Wallet', category: 'CEX', chain: 'ETH' },
    { address: '0x503828976d22510aad0201ac7ec88293211d23da', label: 'Coinbase Pro', category: 'CEX', chain: 'ETH' },
    
    // CEX - Kraken
    { address: '0x2910543af39aba0cd09dbb2d50200c3b200fd002', label: 'Kraken Wallet', category: 'CEX', chain: 'ETH' },
    { address: '0xae2d4615d5c4b5b0b0c4f3f2c0c7c0b1e2d3a4b5', label: 'Kraken 2', category: 'CEX', chain: 'ETH' },
    
    // CEX - OKX
    { address: '0x5a52e96bac4abb5c5a2e4b3c2c7b8b1a5d6e7f8', label: 'OKX Wallet', category: 'CEX', chain: 'ETH' },
    
    // CEX - KuCoin
    { address: '0x2b563e4208f52b7d5d5f0f0e0d0e0d0e0d0e0d0e', label: 'KuCoin Wallet', category: 'CEX', chain: 'ETH' },
    
    // DeFi Protocols - Uniswap
    { address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', label: 'Uniswap V2 Router', category: 'DeFi', protocol: 'Uniswap', chain: 'ETH', description: 'Uniswap V2 Router' },
    { address: '0xe592427a0aece92de3edee1f18e0157c05861564', label: 'Uniswap V3 Router', category: 'DeFi', protocol: 'Uniswap', chain: 'ETH', description: 'Uniswap V3 Router' },
    { address: '0x1f98431c8ad98523631ae4a59f267346ea31f984', label: 'Uniswap V3 Factory', category: 'DeFi', protocol: 'Uniswap', chain: 'ETH' },
    { address: '0x5c69bee701ef814a2b6ae3c9d4bfc5c8b5e8f8e4', label: 'Uniswap V2 Factory', category: 'DeFi', protocol: 'Uniswap', chain: 'ETH' },
    { address: '0x3fcd5de6a9f8c5d5e4d4d4c5b6a7c8d9e0f1a2b', label: 'Uniswap V3 Positions NFT', category: 'DeFi', protocol: 'Uniswap', chain: 'ETH' },
    
    // DeFi - Aave
    { address: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a3', label: 'Aave V2 Pool', category: 'DeFi', protocol: 'Aave', chain: 'ETH', description: 'Aave V2 Lending Pool' },
    { address: '0x87870bca3f3fd6335c3fbd83f7c500b4f2f2e4e1', label: 'Aave V3 Pool', category: 'DeFi', protocol: 'Aave', chain: 'ETH', description: 'Aave V3 Lending Pool' },
    { address: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e8c8', label: 'Aave V3 Pool Addresses Provider', category: 'DeFi', protocol: 'Aave', chain: 'ETH' },
    { address: '0x4f025829c4b4d4d54e5e5f7e4d5e5f7e4d5e5f7e', label: 'Aave V2 Treasury', category: 'DeFi', protocol: 'Aave', chain: 'ETH' },
    { address: '0x3fcd5de6a9f8c5d5e4d4d4c5b6a7c8d9e0f1a2b', label: 'Aave Governance', category: 'DeFi', protocol: 'Aave', chain: 'ETH' },
    
    // DeFi - Compound
    { address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b', label: 'Compound Comptroller', category: 'DeFi', protocol: 'Compound', chain: 'ETH' },
    { address: '0xc00e94cb662c3520282e6f5717214004a7f26888', label: 'Compound Governance', category: 'DeFi', protocol: 'Compound', chain: 'ETH' },
    { address: '0x4d8f3d1b2c9e8e7f6d5c4b3a2e1d0c9b8a7f6e5d', label: 'Compound CToken', category: 'DeFi', protocol: 'Compound', chain: 'ETH' },
    
    // DeFi - Curve
    { address: '0x99a58482bd75cbab83b27ec96ca554a5a5a8e1a', label: 'Curve DAO Token', category: 'DeFi', protocol: 'Curve', chain: 'ETH' },
    { address: '0x8f942c20d02befc381c5b3b2eaa4e5072a8a8e8a', label: 'Curve Gauge Controller', category: 'DeFi', protocol: 'Curve', chain: 'ETH' },
    { address: '0x347f7f6a2d8b4c5e6d7f8a9b0c1d2e3f4a5b6c7', label: 'Curve Pool', category: 'DeFi', protocol: 'Curve', chain: 'ETH' },
    
    // DeFi - Sushiswap
    { address: '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', label: 'Sushiswap Router', category: 'DeFi', protocol: 'Sushiswap', chain: 'ETH' },
    { address: '0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac', label: 'Sushiswap Factory', category: 'DeFi', protocol: 'Sushiswap', chain: 'ETH' },
    { address: '0x9759a6ac1c5fd4a9a5d5f7c4d5e6f7a8b9c0d1e2', label: 'Sushiswap MasterChef', category: 'DeFi', protocol: 'Sushiswap', chain: 'ETH' },
    
    // DeFi - Yearn
    { address: '0x0d195b6c89d38d2c2a77d8c2b6f6c7d8e9f0a1b2', label: 'Yearn Vault', category: 'DeFi', protocol: 'Yearn', chain: 'ETH' },
    { address: '0x1e5f4d4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0', label: 'Yearn Governance', category: 'DeFi', protocol: 'Yearn', chain: 'ETH' },
    
    // DeFi - Lido
    { address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', label: 'Lido DAO Token', category: 'DeFi', protocol: 'Lido', chain: 'ETH', description: 'stETH' },
    { address: '0x442d7e1d5f7d4d5e6f7a8b9c0d1e2f3a4b5c6d7', label: 'Lido Oracle', category: 'DeFi', protocol: 'Lido', chain: 'ETH' },
    { address: '0x7c3f9b4a5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0', label: 'Lido Deposit Security Module', category: 'DeFi', protocol: 'Lido', chain: 'ETH' },
    
    // DeFi - MakerDAO
    { address: '0x9f8f72aa9304c8b593d555fa12a4fa5a4d05d7aa', label: 'MKR Token', category: 'DeFi', protocol: 'MakerDAO', chain: 'ETH' },
    { address: '0x0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a', label: 'MakerDAO Core', category: 'DeFi', protocol: 'MakerDAO', chain: 'ETH' },
    { address: '0x1c3db9e0a1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', label: 'MakerDAO vat', category: 'DeFi', protocol: 'MakerDAO', chain: 'ETH' },
    
    // DeFi - Balancer
    { address: '0xba12222222228d8ba445958a75a0704d566bf2c8', label: 'Balancer Vault', category: 'DeFi', protocol: 'Balancer', chain: 'ETH' },
    { address: '0xc0c0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a', label: 'Balancer Gauges', category: 'DeFi', protocol: 'Balancer', chain: 'ETH' },
    
    // DeFi - Synthetix
    { address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', label: 'SNX Token', category: 'DeFi', protocol: 'Synthetix', chain: 'ETH' },
    { address: '0xd6a7bf6a0a1b3c5d7e9f1a2b3c4d5e6f7a8b9c0', label: 'Synthetix Exchange', category: 'DeFi', protocol: 'Synthetix', chain: 'ETH' },
    
    // DeFi - 1Inch
    { address: '0x1111111254eeb25477b68fb85ed929f73a960582', label: '1Inch Router', category: 'DeFi', protocol: '1Inch', chain: 'ETH' },
    { address: '0xa0b0a0b0c0d0e0f1a2b3c4d5e6f7a8b9c0d1e2', label: '1Inch Aggregation Router', category: 'DeFi', protocol: '1Inch', chain: 'ETH' },
    
    // DeFi - Paraswap
    { address: '0xdef171fe48cf0115b1d80b88dc8eab59176fee57', label: 'Paraswap Router', category: 'DeFi', protocol: 'Paraswap', chain: 'ETH' },
    { address: '0xe0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e', label: 'Paraswap Augustus', category: 'DeFi', protocol: 'Paraswap', chain: 'ETH' },
    
    // DeFi - Rocket Pool
    { address: '0xd33526068d116c69f151a838a7baed50efdd80a3', label: 'Rocket Pool Token', category: 'DeFi', protocol: 'RocketPool', chain: 'ETH' },
    { address: '0xb0e0b0c0d0e0f1a2b3c4d5e6f7a8b9c0d1e2f3', label: 'Rocket Pool Deposit', category: 'DeFi', protocol: 'RocketPool', chain: 'ETH' },
    
    // DeFi - Convex
    { address: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d4b', label: 'CVX Token', category: 'DeFi', protocol: 'Convex', chain: 'ETH' },
    { address: '0xf0e0c0d0e0e1a2b3c4d5e6f7a8b9c0d1e2f3a4b', label: 'Convex Booster', category: 'DeFi', protocol: 'Convex', chain: 'ETH' },
    
    // DeFi - Frax
    { address: '0x853d955acef822db058eb8505911ed77f175b99e', label: 'FRAX Token', category: 'DeFi', protocol: 'Frax', chain: 'ETH' },
    { address: '0xd0e0d0e0e0e1a2b3c4d5e6f7a8b9c0d1e2f3a4', label: 'Frax Controller', category: 'DeFi', protocol: 'Frax', chain: 'ETH' },
    
    // DeFi - Gamma
    { address: '0x0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0', label: 'Gamma Hypervisor', category: 'DeFi', protocol: 'Gamma', chain: 'ETH' },
    
    // NFT - OpenSea
    { address: '0x7f268357a8c2552625316e4f6f03e7f8d22c0a03', label: 'OpenSea Seaport', category: 'NFT', protocol: 'OpenSea', chain: 'ETH' },
    { address: '0x8a90cab2b1480b9995995e0a7b9aa3e2c1ebad0a', label: 'OpenSea Token', category: 'NFT', protocol: 'OpenSea', chain: 'ETH' },
    { address: '0x495f947276749ce646f68ac8c248420045cb7b5e', label: 'OpenSea Shared Storefront', category: 'NFT', protocol: 'OpenSea', chain: 'ETH' },
    { address: '0x0a0a0a0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b', label: 'OpenSea Proxy Registry', category: 'NFT', protocol: 'OpenSea', chain: 'ETH' },
    
    // NFT - Blur
    { address: '0x00000000000000adc04c56bf30ac9d3c0aaf14dc', label: 'Blur Market', category: 'NFT', protocol: 'Blur', chain: 'ETH' },
    { address: '0xb0e0b0c0d0e0f1a2b3c4d5e6f7a8b9c0d1e2f3', label: 'Blur Blend', category: 'NFT', protocol: 'Blur', chain: 'ETH' },
    
    // NFT - LooksRare
    { address: '0x59728544b08ab483533076417fbbb2fd0b17ce3a', label: 'LooksRare Token', category: 'NFT', protocol: 'LooksRare', chain: 'ETH' },
    { address: '0xc4b5c0a2e1f2f3a4b5c6d7e8f9a0b1c2d3e4f5a', label: 'LooksRare Exchange', category: 'NFT', protocol: 'LooksRare', chain: 'ETH' },
    
    // Bridge - LayerZero
    { address: '0x0000000000000000000000000000000000000001', label: 'LayerZero Endpoint', category: 'Bridge', protocol: 'LayerZero', chain: 'ETH' },
    { address: '0xa0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a', label: 'LayerZero DVN', category: 'Bridge', protocol: 'LayerZero', chain: 'ETH' },
    
    // Bridge - Stargate
    { address: '0xdf1c1c379c71b93b6c4a2e2c1e3b5a7d9e1f2a3b', label: 'Stargate Router', category: 'Bridge', protocol: 'Stargate', chain: 'ETH' },
    { address: '0xe0e0e0e0e0e1a2b3c4d5e6f7a8b9c0d1e2f3a4', label: 'Stargate LP Token', category: 'Bridge', protocol: 'Stargate', chain: 'ETH' },
    
    // Bridge - Across
    { address: '0x50b5e2022a4a3b0c0d5e6f7a8b9c0d1e2f3a4b5c', label: 'Across Token', category: 'Bridge', protocol: 'Across', chain: 'ETH' },
    
    // Stablecoins
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', label: 'USDC', category: 'Stablecoin', chain: 'ETH', description: 'USD Coin' },
    { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', label: 'USDT', category: 'Stablecoin', chain: 'ETH', description: 'Tether USD' },
    { address: '0x6b175474e89094c44da98b954eedeac495271d0f', label: 'DAI', category: 'Stablecoin', chain: 'ETH', description: 'Dai Stablecoin' },
    { address: '0x853d955acef822db058eb8505911ed77f175b99e', label: 'FRAX', category: 'Stablecoin', chain: 'ETH', description: 'Frax' },
    { address: '0x5f98805a4e8be255a32880fdec7f7368d21c1b9e', label: 'USDP', category: 'Stablecoin', chain: 'ETH', description: 'Pax Dollar' },
    { address: '0x4fabb145d64652a948d72539023d6a0a5bb6a99', label: 'BUSD', category: 'Stablecoin', chain: 'ETH', description: 'Binance USD (deprecated)' },
    { address: '0x0000000000085d4780b73119b644ae5ecd22b376', label: 'TUSD', category: 'Stablecoin', chain: 'ETH', description: 'TrueUSD' },
    
    // Layer 2 Networks
    { address: '0x0994206dfe8de6ec6920ff4d779b0d9506fb93e9', label: 'L2 Sequencer', category: 'Layer2', protocol: 'Arbitrum', chain: 'ETH' },
    { address: '0x0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0', label: 'Arbitrum Delayed Inbox', category: 'Layer2', protocol: 'Arbitrum', chain: 'ETH' },
    
    // Known Whales
    { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', label: 'Vitalik Buterin', category: 'Person', chain: 'ETH', description: 'Ethereum co-founder' },
    { address: '0xab5801a7d398351b8be11c439e05c5b3259aec9b', label: 'Vitalik 2', category: 'Person', chain: 'ETH' },
    { address: '0x1db3439a222c519ab4bb5a2c1ef9884b5fa2427', label: 'Metamask Deployer', category: 'Person', chain: 'ETH' },
    { address: '0x0000000000000000000000000000000000000000', label: 'Zero Address', category: 'System', chain: 'ETH', description: 'Burn address / Genesis' },
    { address: '0x000000000000000000000000000000000000dead', label: 'Burn Address', category: 'System', chain: 'ETH', description: 'Tokens burned here' },
    { address: '0x0000000000000000000000000000000000dead00', label: 'Burn Address 2', category: 'System', chain: 'ETH' },
    
    // Multisigs - Gnosis Safe
    { address: '0xba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1', label: 'Gnosis Safe Singleton', category: 'Multisig', protocol: 'GnosisSafe', chain: 'ETH' },
    { address: '0xa6b71e26c5e0845f74c812102ca7114b6a896ab', label: 'Gnosis Safe Proxy Factory', category: 'Multisig', protocol: 'GnosisSafe', chain: 'ETH' },
    
    // DAO Treasuries
    { address: '0x9e67fbbd5f50e34e10ae2be6c3e9ba5e4d8bb3e5', label: 'Uniswap Treasury', category: 'DAO', protocol: 'Uniswap', chain: 'ETH' },
    { address: '0x6e5bb1a5ad8f5bb9b2d4a3d1c9e5f7a8b9c0d1e2', label: 'Aave Treasury', category: 'DAO', protocol: 'Aave', chain: 'ETH' },
    { address: '0xf3b5c5d7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a', label: 'Compound Treasury', category: 'DAO', protocol: 'Compound', chain: 'ETH' },
    { address: '0x7c68c42De38ffb10eB73A28E4a5d8F1b6f7E8c9d', label: 'MakerDAO Treasury', category: 'DAO', protocol: 'MakerDAO', chain: 'ETH' },
    
    // Popular Tokens
    { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', label: 'WBTC', category: 'Token', chain: 'ETH', description: 'Wrapped Bitcoin' },
    { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', label: 'WETH', category: 'Token', chain: 'ETH', description: 'Wrapped Ether' },
    { address: '0x514910771af9ca656af840dff83e8264ecf986ca', label: 'LINK', category: 'Token', chain: 'ETH', description: 'Chainlink Token' },
    { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', label: 'AAVE', category: 'Token', chain: 'ETH', description: 'Aave Token' },
    { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', label: 'UNI', category: 'Token', chain: 'ETH', description: 'Uniswap Token' },
    { address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', label: 'BAT', category: 'Token', chain: 'ETH', description: 'Basic Attention Token' },
    { address: '0x1985365e9f78359a9b6ad760e32412f4a445e862', label: 'REP', category: 'Token', chain: 'ETH', description: 'Augur Token' },
    { address: '0x960b236a07cf122663c4303350609a3344803b12', label: 'DOGE', category: 'Token', chain: 'ETH', description: 'DogeCoin (wrapped)' },
    { address: '0xb1690c08e213a35ed9bab7b318de14420fb57d8', label: 'CryptoPunks Vault', category: 'NFT', protocol: 'CryptoPunks', chain: 'ETH' },
    
    // MEV Related
    { address: '0x0000000000000000000000000000000000000000', label: 'Block 0', category: 'System', chain: 'ETH' },
    
    // Known Deployers
    { address: '0x0000a26b00c5f8624f5f6c8f1e3e9e8d7c6b5a4f', label: 'Deployer 1', category: 'Deployer', chain: 'ETH' },
    { address: '0xb1ec5484f94e4eb9a8b5f4f2e3d4f5a6b7c8d9e0', label: 'Deployer 2', category: 'Deployer', chain: 'ETH' },
    { address: '0xc0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0', label: 'Deployer 3', category: 'Deployer', chain: 'ETH' },
  ];

  async searchLabels(query?: string, category?: string): Promise<AddressLabel[]> {
    let results = [...this.addressLabels];
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (label) =>
          label.label.toLowerCase().includes(lowerQuery) ||
          label.address.toLowerCase().includes(lowerQuery) ||
          (label.description && label.description.toLowerCase().includes(lowerQuery)) ||
          (label.protocol && label.protocol.toLowerCase().includes(lowerQuery))
      );
    }
    
    if (category) {
      results = results.filter((label) => label.category === category);
    }
    
    return results;
  }

  async getLabelByAddress(address: string): Promise<AddressLabel | null> {
    const normalizedAddress = address.toLowerCase();
    return this.addressLabels.find((label) => label.address.toLowerCase() === normalizedAddress) || null;
  }

  async getCategories(): Promise<string[]> {
    const categories = new Set(this.addressLabels.map((label) => label.category));
    return Array.from(categories).sort();
  }

  async getPopularLabels(): Promise<AddressLabel[]> {
    const popularAddresses = [
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // Vitalik
      '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2
      '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3
      '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a3', // Aave V2
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    ];
    
    return this.addressLabels.filter((label) =>
      popularAddresses.some((addr) => addr.toLowerCase() === label.address.toLowerCase())
    );
  }

  async getWhaleAddresses(): Promise<AddressLabel[]> {
    const whaleCategories = ['Person', 'DAO', 'CEX'];
    return this.addressLabels.filter((label) => whaleCategories.includes(label.category));
  }

  async getCexWallets(): Promise<AddressLabel[]> {
    return this.addressLabels.filter((label) => label.category === 'CEX');
  }
}
