import { Injectable } from '@nestjs/common';

export interface TokenMapping {
  symbol: string;
  name: string;
  decimals: number;
  addresses: {
    [chain: string]: string;
  };
  isNative: boolean;
  coingeckoId?: string;
}

export interface TokenBalance {
  chain: string;
  address: string;
  balance: string;
  balanceUsd: number;
  price: number;
  lastUpdated: string;
}

@Injectable()
export class CrossChainTokenMapperService {
  // Known cross-chain token mappings
  private readonly tokenMappings: TokenMapping[] = [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      addresses: {
        ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d997Ff82',
        base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        avalanche: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        bsc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      },
      isNative: false,
      coingeckoId: 'usd-coin',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      addresses: {
        ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        arbitrum: '0xFd086b7Be5C75C9f22895f351f6A27dFea4CE4a8',
        optimism: '0x94b008a79c1307B0EF2cA005499aD98a8ce58e58',
        base: '0x04d5F0eF0a3cDDD9C7C3ad6a3a7B4b4b6d3C8c8E',
        avalanche: '0x9702230A8Ea53601f5cD2dc00f3c15d46ab1bf19',
        bsc: '0x55d398326f99059fF775485246999027B3197955',
      },
      isNative: false,
      coingeckoId: 'tether',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      addresses: {
        ethereum: '0x0000000000000000000000000000000000000000',
        polygon: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        arbitrum: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        optimism: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        base: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        avalanche: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        bsc: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      },
      isNative: true,
      coingeckoId: 'ethereum',
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      addresses: {
        ethereum: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        polygon: '0x1BFD67037B42Cf73acF2047067bd4F2C47d9BfD6',
        arbitrum: '0x2f2a2543B76A4166549F7aaB2e75BFOa5aBF3B6C',
        optimism: '0x68f180fcCe6836688e9084f035309eCe96c3a05c',
        base: '0xcbB7e00085314B4B9CD6d9d9e2346783d2A83a1f',
        avalanche: '0x50b7545627a5162F82A992c33b87aC7519D0DF4E',
        bsc: '0x7130d2A12B9BCbDAe0978D17ce76e9846f2B80Cd',
      },
      isNative: false,
      coingeckoId: 'wrapped-bitcoin',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      addresses: {
        ethereum: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        polygon: '0x53f0c1B45dD2E1b8D8c8f9C8f5F6d5c4b3a2E1f0',
        arbitrum: '0xDA10009cBd5D07ddfe49BD27D4DC5F1fBF31b500',
        optimism: '0xDA10009cBd5D07ddfe49BD27D4DC5F1fBF31b500',
        base: '0x50b7545627a5162F82A992c33b87aC7519D0DF4E',
        avalanche: '0x584D13C7C8497D5Cb18202Cb7B0b9Eb6E5d6f3d8',
        bsc: '0x1AF3F329e8BEc1540803A4c25420A76cB0f6d0bF',
      },
      isNative: false,
      coingeckoId: 'dai',
    },
    {
      symbol: 'LINK',
      name: 'Chainlink Token',
      decimals: 18,
      addresses: {
        ethereum: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        polygon: '0x53E0bca35eC356bd5ddDFEbdD1Fc0fD03FaBad39',
        arbitrum: '0xf97f4df75117a78c1A5a0dB97eBC2b6e8388495E',
        optimism: '0x350a791Bfc2C21F9Ed5d10980Dad2cC8DD16caB7',
        base: '0xE4aB69C0779D4bE28c33dBCA5Dc56b7F5B80DBc0',
        avalanche: '0x5947BB275c521040051D82396192181b41368A52',
        bsc: '0xF8A0BF9cF54Ea92A58EA1745F7C42910DE4fbb8E',
      },
      isNative: false,
      coingeckoId: 'chainlink',
    },
    {
      symbol: 'UNI',
      name: 'Uniswap',
      decimals: 18,
      addresses: {
        ethereum: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        polygon: '0xb33eaad8d922b108344fc1e4f2d1ba55cd721854',
        arbitrum: '0xfa7f8980b0f981e59da55f2b8fb03f6f4c9b6fd1',
        optimism: '0x6fd9d7ADa42b9BBF2f6e2D84c6f8E0d0c9c3c5e8',
        base: '0x4e4c4f4e490000000000000000000000000000000',
        avalanche: '0x8eBAf22B6F053d8eE55d5d0A0f2a9b7a7c4E2F3A',
        bsc: '0xBf5140A22578168FD562DC5F81E30007aFe20C69',
      },
      isNative: false,
      coingeckoId: 'uniswap',
    },
    {
      symbol: 'AAVE',
      name: 'Aave Token',
      decimals: 18,
      addresses: {
        ethereum: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        polygon: '0xD6DF932A45C0f255f85123f0aB9BA81B5fEa5C5',
        arbitrum: '0xba5DdD1f9d7F570dc94a51479a33E8b158D5b4b8',
        optimism: '0x76FB31fb4af568984AbaF4f53f1b2e8B76dD9b63',
        base: '0x4e4c4f4e490000000000000000000000000000000',
        avalanche: '0x8C6bf84611e27E66B6a5D8fE5e96E7F9E7e2C8D1',
        bsc: '0x44C21af7F9d5b6A15e0Fe6B93B3c6F4b3e4D8c9F',
      },
      isNative: false,
      coingeckoId: 'aave',
    },
    {
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      addresses: {
        ethereum: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608779CDe33',
        polygon: '0x0000000000000000000000000000000000000000',
        arbitrum: '0x561877B6E7c203d75623C8CB2A9fBBd0c3Ddc5F',
        optimism: '0xE5e711e5c7Cf4E1D2d1c3aF0C2f7E8D9C1B2A3F4',
        base: '0xE5e711e5c7Cf4E1D2d1c3aF0C2f7E8D9C1B2A3F4',
        avalanche: '0xE5e711e5c7Cf4E1D2d1c3aF0C2f7E8D9C1B2A3F4',
        bsc: '0xCC42724C6683B7E5732c4D5f3Fb0b7A8B9E8D3F5',
      },
      isNative: true,
      coingeckoId: 'matic-network',
    },
    {
      symbol: 'ARB',
      name: 'Arbitrum',
      decimals: 18,
      addresses: {
        ethereum: '0x912CE59144191C1204E64563FE0B2eD423661621',
        polygon: '0x912CE59144191C1204E64563FE0B2eD423661621',
        arbitrum: '0x0000000000000000000000000000000000000000',
        optimism: '0xE5e711e5c7Cf4E1D2d1c3aF0C2f7E8D9C1B2A3F4',
        base: '0xE5e711e5c7Cf4E1D2d1c3aF0C2f7E8D9C1B2A3F4',
        avalanche: '0xE5e711e5c7Cf4E1D2d1c3aF0C2f7E8D9C1B2A3F4',
        bsc: '0xE5e711e5c7Cf4E1D2d1c3aF0C2f7E8D9C1B2A3F4',
      },
      isNative: true,
      coingeckoId: 'arbitrum',
    },
    {
      symbol: 'OP',
      name: 'Optimism',
      decimals: 18,
      addresses: {
        ethereum: '0x4200000000000000000000000000000000000042',
        polygon: '0x4200000000000000000000000000000000000042',
        arbitrum: '0x4200000000000000000000000000000000000042',
        optimism: '0x0000000000000000000000000000000000000000',
        base: '0x0000000000000000000000000000000000000000',
        avalanche: '0x4200000000000000000000000000000000000042',
        bsc: '0x4200000000000000000000000000000000000042',
      },
      isNative: true,
      coingeckoId: 'optimism',
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      addresses: {
        ethereum: '0xD31a59c85aE9D546ed2E1b1eBE4C5B3d1e5D8E9F',
        polygon: '0xD31a59c85aE9D546ed2E1b1eBE4C5B3d1e5D8E9F',
        arbitrum: '0xD31a59c85aE9D546ed2E1b1eBE4C5B3d1e5D8E9F',
        optimism: '0xD31a59c85aE9D546ed2E1b1eBE4C5B3d1e5D8E9F',
        base: '0xD31a59c85aE9D546ed2E1b1eBE4C5B3d1e5D8E9F',
        avalanche: '0xD31a59c85aE9D546ed2E1b1eBE4C5B3d1e5D8E9F',
        bsc: '0xD31a59c85aE9D546ed2E1b1eBE4C5B3d1e5D8E9F',
      },
      isNative: false,
      coingeckoId: 'solana',
    },
    {
      symbol: 'CRV',
      name: 'Curve DAO Token',
      decimals: 18,
      addresses: {
        ethereum: '0xD533a949740bb3306d119CC777fa900bA034cd52',
        polygon: '0xD533a949740bb3306d119CC777fa900bA034cd52',
        arbitrum: '0x11cDb42B0EB46D95f7E2C271626F4B4b2d4e5A6B',
        optimism: '0xC5C3f6B0a7e5D5F3E5D4C3B2A1E0D9F8C7B6A5D',
        base: '0xC5C3f6B0a7e5D5F3E5D4C3B2A1E0D9F8C7B6A5D',
        avalanche: '0xD533a949740bb3306d119CC777fa900bA034cd52',
        bsc: '0x8440F0ce4a88D2A8D3E2F5B6C4A3D2E1F0D9C8B7',
      },
      isNative: false,
      coingeckoId: 'curve-dao-token',
    },
    {
      symbol: 'MKR',
      name: 'Maker',
      decimals: 18,
      addresses: {
        ethereum: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
        polygon: '0x1f3Afd2B5E1d6D7A8C3E5F4D2A1B0C9D8E7F6A5B',
        arbitrum: '0x1f3Afd2B5E1d6D7A8C3E5F4D2A1B0C9D8E7F6A5B',
        optimism: '0x1f3Afd2B5E1d6D7A8C3E5F4D2A1B0C9D8E7F6A5B',
        base: '0x1f3Afd2B5E1d6D7A8C3E5F4D2A1B0C9D8E7F6A5B',
        avalanche: '0x1f3Afd2B5E1d6D7A8C3E5F4D2A1B0C9D8E7F6A5B',
        bsc: '0x1f3Afd2B5E1d6D7A8C3E5F4D2A1B0C9D8E7F6A5B',
      },
      isNative: false,
      coingeckoId: 'maker',
    },
    {
      symbol: 'LDO',
      name: 'Lido DAO Token',
      decimals: 18,
      addresses: {
        ethereum: '0x5A98FcBEA516Cf06857215779Fd812CA3beF4B32',
        polygon: '0x2B1D36b16b3E4D5c7A8C3E5F4D2A1B0C9D8E7F6A5',
        arbitrum: '0x2B1D36b16b3E4D5c7A8C3E5F4D2A1B0C9D8E7F6A5',
        optimism: '0x2B1D36b16b3E4D5c7A8C3E5F4D2A1B0C9D8E7F6A5',
        base: '0x2B1D36b16b3E4D5c7A8C3E5F4D2A1B0C9D8E7F6A5',
        avalanche: '0x2B1D36b16b3E4D5c7A8C3E5F4D2A1B0C9D8E7F6A5',
        bsc: '0x2B1D36b16b3E4D5c7A8C3E5F4D2A1B0C9D8E7F6A5',
      },
      isNative: false,
      coingeckoId: 'lido-dao',
    },
  ];

  // Chain IDs mapping
  private readonly chainIds: { [key: string]: number } = {
    ethereum: 1,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
    base: 8453,
    avalanche: 43114,
    bsc: 56,
  };

  // Mock price data (in real implementation, fetch from API)
  private readonly mockPrices: { [symbol: string]: number } = {
    ETH: 2450.0,
    WBTC: 68500.0,
    USDC: 1.0,
    USDT: 1.0,
    DAI: 1.0,
    LINK: 18.5,
    UNI: 7.2,
    AAVE: 180.0,
    MATIC: 0.85,
    ARB: 1.15,
    OP: 2.1,
    SOL: 95.0,
    CRV: 0.45,
    MKR: 1500.0,
    LDO: 2.3,
  };

  getSupportedChains(): string[] {
    return Object.keys(this.chainIds);
  }

  getAllTokenMappings(): TokenMapping[] {
    return this.tokenMappings;
  }

  getTokenBySymbol(symbol: string): TokenMapping | null {
    return (
      this.tokenMappings.find(
        (t) => t.symbol.toUpperCase() === symbol.toUpperCase(),
      ) || null
    );
  }

  getTokenByAddress(address: string): TokenMapping | null {
    const normalizedAddress = address.toLowerCase();
    return (
      this.tokenMappings.find((t) =>
        Object.values(t.addresses).some(
          (a) => a.toLowerCase() === normalizedAddress,
        ),
      ) || null
    );
  }

  getTokenMappingsByChain(chain: string): TokenMapping[] {
    return this.tokenMappings.filter((t) => t.addresses[chain]);
  }

  searchTokens(query: string): TokenMapping[] {
    const lowerQuery = query.toLowerCase();
    return this.tokenMappings.filter(
      (t) =>
        t.symbol.toLowerCase().includes(lowerQuery) ||
        t.name.toLowerCase().includes(lowerQuery),
    );
  }

  getChainId(chain: string): number {
    return this.chainIds[chain] || 0;
  }

  getTokenPrice(symbol: string): number {
    return this.mockPrices[symbol.toUpperCase()] || 0;
  }

  // Get token mapping with price data
  getTokenMappingWithPrices(symbol: string): any {
    const token = this.getTokenBySymbol(symbol);
    if (!token) return null;

    const price = this.getTokenPrice(token.symbol);
    const chainData = Object.entries(token.addresses).map(([chain, address]) => ({
      chain,
      chainId: this.chainIds[chain],
      address,
      isNative: token.isNative,
    }));

    return {
      ...token,
      price,
      chains: chainData,
    };
  }

  // Get cross-chain token comparison
  getCrossChainComparison(symbol: string): any {
    const token = this.getTokenBySymbol(symbol);
    if (!token) return null;

    const price = this.getTokenPrice(token.symbol);
    const comparisons = Object.entries(token.addresses).map(
      ([chain, address]) => ({
        chain,
        chainId: this.chainIds[chain],
        address,
        isNative: token.isNative,
        price,
        priceUsd: price,
      }),
    );

    return {
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      coingeckoId: token.coingeckoId,
      isNative: token.isNative,
      chains: comparisons,
    };
  }

  // Get popular tokens (most chains)
  getPopularTokens(): any[] {
    return this.tokenMappings
      .map((t) => ({
        symbol: t.symbol,
        name: t.name,
        chainCount: Object.keys(t.addresses).length,
        chains: Object.keys(t.addresses),
        price: this.getTokenPrice(t.symbol),
        coingeckoId: t.coingeckoId,
      }))
      .sort((a, b) => b.chainCount - a.chainCount);
  }

  // Get tokens by chain
  getTokensByChain(chain: string): any[] {
    return this.tokenMappings
      .filter((t) => t.addresses[chain])
      .map((t) => ({
        symbol: t.symbol,
        name: t.name,
        address: t.addresses[chain],
        decimals: t.decimals,
        isNative: t.isNative,
        price: this.getTokenPrice(t.symbol),
        coingeckoId: t.coingeckoId,
      }));
  }
}
