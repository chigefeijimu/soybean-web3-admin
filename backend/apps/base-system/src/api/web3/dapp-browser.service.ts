import { Injectable, NotFoundException } from '@nestjs/common';

interface Dapp {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  logo?: string;
  chains: number[];
  isCustom?: boolean;
  visits?: number;
}

@Injectable()
export class DappBrowserService {
  private dapps: Dapp[] = [
    // DeFi
    { id: 'uniswap', name: 'Uniswap', url: 'https://app.uniswap.org', category: 'DeFi', description: 'Decentralized trading protocol', logo: '🦄', chains: [1, 137, 42161, 8453], visits: 1500 },
    { id: 'aave', name: 'Aave', url: 'https://app.aave.com', category: 'DeFi', description: 'Non-custodial liquidity protocol', logo: '🦇', chains: [1, 137, 42161], visits: 1200 },
    { id: 'compound', name: 'Compound', url: 'https://app.compound.finance', category: 'DeFi', description: 'Algorithmic money market', logo: '🟡', chains: [1, 137], visits: 900 },
    { id: 'curve', name: 'Curve', url: 'https://curve.fi', category: 'DeFi', description: 'Stable asset swapping', logo: '🔵', chains: [1, 137, 42161, 8453], visits: 1100 },
    { id: 'balancer', name: 'Balancer', url: 'https://app.balancer.fi', category: 'DeFi', description: 'Automated portfolio manager', logo: '⚖️', chains: [1, 137, 42161], visits: 700 },
    { id: 'yearn', name: 'Yearn Finance', url: 'https://yearn.finance', category: 'DeFi', description: 'Automated yield strategies', logo: '📈', chains: [1, 137, 42161], visits: 850 },
    { id: 'sushiswap', name: 'SushiSwap', url: 'https://www.sushi.com', category: 'DeFi', description: 'Decentralized exchange', logo: '🍣', chains: [1, 137, 42161, 8453], visits: 950 },
    { id: 'pancakeswap', name: 'PancakeSwap', url: 'https://pancakeswap.finance', category: 'DeFi', description: 'Multi-chain DEX', logo: '🥞', chains: [56, 97], visits: 1400 },
    
    // Lending
    { id: 'morpho', name: 'Morpho', url: 'https://app.morpho.org', category: 'Lending', description: 'Peer-to-peer lending protocol', logo: '🟣', chains: [1, 42161], visits: 650 },
    { id: 'liquity', name: 'Liquity', url: 'https://liquity.org', category: 'Lending', description: 'Non-collateralized lending', logo: '🔴', chains: [1], visits: 450 },
    { id: 'radiant', name: 'Radiant', url: 'https://app.radiant.capital', category: 'Lending', description: 'Cross-margin lending', logo: '💎', chains: [42161, 1], visits: 380 },
    
    // NFTs
    { id: 'opensea', name: 'OpenSea', url: 'https://opensea.io', category: 'NFTs', description: 'NFT marketplace', logo: '🌊', chains: [1, 137, 42161, 8453], visits: 1800 },
    { id: 'blur', name: 'Blur', url: 'https://blur.io', category: 'NFTs', description: 'NFT marketplace for pro traders', logo: '👁️', chains: [1], visits: 1100 },
    { id: 'foundation', name: 'Foundation', url: 'https://foundation.app', category: 'NFTs', description: 'Curated NFT marketplace', logo: '🎨', chains: [1], visits: 750 },
    { id: 'rarible', name: 'Rarible', url: 'https://rarible.com', category: 'NFTs', description: 'NFT creation and trading', logo: '🎭', chains: [1, 137, 42161], visits: 600 },
    { id: 'looksrare', name: 'LooksRare', url: 'https://looksrare.org', category: 'NFTs', description: 'NFT marketplace with $LOOKS', logo: '👀', chains: [1], visits: 550 },
    
    // Bridges
    { id: 'layerzero', name: 'LayerZero', url: 'https://layerzero.network', category: 'Bridges', description: 'Omnichain messaging', logo: '🕸️', chains: [1, 137, 42161, 8453], visits: 900 },
    { id: 'stargate', name: 'Stargate', url: 'https://stargate.finance', category: 'Bridges', description: 'Cross-chain liquidity', logo: '🌉', chains: [1, 137, 42161, 8453], visits: 850 },
    { id: 'across', name: 'Across', url: 'https://across.to', category: 'Bridges', description: 'Fast cross-chain bridging', logo: '➡️', chains: [1, 137, 42161, 8453], visits: 650 },
    { id: 'orbiter', name: 'Orbiter', url: 'https://www.orbiter.finance', category: 'Bridges', description: 'Cross-rollup bridge', logo: '🛸', chains: [1, 42161, 10, 8453], visits: 550 },
    
    // Yield
    { id: 'lido', name: 'Lido', url: 'https://lido.fi', category: 'Yield', description: 'Liquid staking for ETH', logo: '💧', chains: [1, 137, 42161], visits: 1300 },
    { id: 'rocketpool', name: 'Rocket Pool', url: 'https://rocketpool.net', category: 'Yield', description: 'Decentralized ETH staking', logo: '🚀', chains: [1], visits: 750 },
    { id: 'frax', name: 'Frax', url: 'https://frax.finance', category: 'Yield', description: 'Hybrid stablecoin & staking', logo: '⚪', chains: [1, 42161], visits: 650 },
    { id: 'stakewise', name: 'Stakewise', url: 'https://stakewise.io', category: 'Yield', description: 'Liquid staking platform', logo: '🏆', chains: [1, 42161], visits: 450 },
    
    // Governance
    { id: 'tally', name: 'Tally', url: 'https://www.tally.xyz', category: 'Governance', description: 'On-chain governance', logo: '📋', chains: [1, 42161, 10, 8453], visits: 550 },
    { id: 'snapshot', name: 'Snapshot', url: 'https://snapshot.org', category: 'Governance', description: 'Off-chain voting', logo: '📸', chains: [1], visits: 700 },
    
    // Wallets
    { id: 'metamask', name: 'MetaMask', url: 'https://metamask.io', category: 'Wallets', description: 'Crypto wallet browser extension', logo: '🦊', chains: [1, 137, 42161, 8453], visits: 2000 },
    { id: 'rainbow', name: 'Rainbow', url: 'https://rainbow.me', category: 'Wallets', description: 'Fun & easy wallet', logo: '🌈', chains: [1, 137, 42161], visits: 650 },
    { id: 'argent', name: 'Argent', url: 'https://www.argent.xyz', category: 'Wallets', description: 'Smart wallet', logo: '⚡', chains: [1, 137, 42161], visits: 550 },
    { id: 'brave', name: 'Brave Wallet', url: 'https://brave.com/wallet', category: 'Wallets', description: 'Native crypto wallet', logo: '🦁', chains: [1, 137, 42161], visits: 480 },
    
    // Analytics
    { id: 'dune', name: 'Dune', url: 'https://dune.com', category: 'Analytics', description: 'Blockchain data platform', logo: '🏜️', chains: [1, 137, 42161], visits: 1100 },
    { id: 'nansen', name: 'Nansen', url: 'https://www.nansen.ai', category: 'Analytics', description: 'On-chain analytics', logo: '🔍', chains: [1, 137, 42161], visits: 850 },
    { id: 'defillama', name: 'DeFi Llama', url: 'https://defillama.com', category: 'Analytics', description: 'DeFi TVL aggregator', logo: '🦙', chains: [1, 137, 42161, 8453], visits: 950 },
    { id: 'coinmarketcap', name: 'CoinMarketCap', url: 'https://coinmarketcap.com', category: 'Analytics', description: 'Crypto market data', logo: '📊', chains: [], visits: 1700 },
    { id: 'coingecko', name: 'CoinGecko', url: 'https://www.coingecko.com', category: 'Analytics', description: 'Crypto price tracker', logo: '🦎', chains: [], visits: 1600 },
    
    // Gaming
    { id: 'axie', name: 'Axie Infinity', url: 'https://axieinfinity.com', category: 'Gaming', description: 'Web3 gaming platform', logo: '👾', chains: [1, 137], visits: 900 },
    { id: 'gala', name: 'Gala Games', url: 'https://gala.com', category: 'Gaming', description: 'Web3 gaming ecosystem', logo: '🎮', chains: [1], visits: 650 },
    { id: 'immutable', name: 'Immutable', url: 'https://www.immutable.com', category: 'Gaming', description: 'NFT gaming platform', logo: '🛡️', chains: [1, 42161], visits: 750 },
    
    // Launchpad
    { id: 'poloniex', name: 'Poloniex', url: 'https://poloniex.com', category: 'CEX', description: 'Crypto exchange', logo: '🐧', chains: [], visits: 850 },
    { id: 'binance', name: 'Binance', url: 'https://www.binance.com', category: 'CEX', description: 'Crypto exchange', logo: '💰', chains: [], visits: 2000 },
    { id: 'kucoin', name: 'KuCoin', url: 'https://www.kucoin.com', category: 'CEX', description: 'Crypto exchange', logo: '🥒', chains: [], visits: 750 },
    
    // Social
    { id: 'lens', name: 'Lens Protocol', url: 'https://lens.xyz', category: 'Social', description: 'Web3 social graph', logo: '📚', chains: [1], visits: 650 },
    { id: 'farcaster', name: 'Farcaster', url: 'https://farcaster.xyz', category: 'Social', description: 'Decentralized social', logo: '🗳️', chains: [1, 10], visits: 550 },
    { id: 'mirror', name: 'Mirror', url: 'https://mirror.xyz', category: 'Social', description: 'Web3 publishing', logo: '🪞', chains: [1], visits: 450 },
  ];

  private customDapps: Map<string, Dapp> = new Map();

  getDappList(category?: string): Dapp[] {
    let allDapps = [...this.dapps, ...Array.from(this.customDapps.values())];
    if (category && category !== 'all') {
      allDapps = allDapps.filter(d => d.category.toLowerCase() === category.toLowerCase());
    }
    return allDapps;
  }

  getCategories(): string[] {
    const categories = new Set(this.dapps.map(d => d.category));
    return Array.from(categories).sort();
  }

  getDapp(id: string): Dapp {
    const dapp = this.dapps.find(d => d.id === id) || this.customDapps.get(id);
    if (!dapp) {
      throw new NotFoundException(`DApp with id ${id} not found`);
    }
    // Increment visits
    if (dapp.visits !== undefined) {
      dapp.visits++;
    }
    return dapp;
  }

  addCustomDapp(dapp: Partial<Dapp>): Dapp {
    const id = `custom_${Date.now()}`;
    const newDapp: Dapp = {
      id,
      name: dapp.name || 'Custom DApp',
      url: dapp.url || '',
      category: dapp.category || 'Custom',
      description: dapp.description || '',
      logo: dapp.logo || '🔗',
      chains: dapp.chains || [],
      isCustom: true,
      visits: 0,
    };
    this.customDapps.set(id, newDapp);
    return newDapp;
  }

  removeCustomDapp(id: string): { success: boolean } {
    if (this.customDapps.has(id)) {
      this.customDapps.delete(id);
      return { success: true };
    }
    throw new NotFoundException(`Custom DApp with id ${id} not found`);
  }

  searchDapps(query: string): Dapp[] {
    const q = query.toLowerCase();
    const allDapps = [...this.dapps, ...Array.from(this.customDapps.values())];
    return allDapps.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.description.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q)
    );
  }

  getTrendingDapps(): Dapp[] {
    const allDapps = [...this.dapps, ...Array.from(this.customDapps.values())];
    return allDapps.sort((a, b) => (b.visits || 0) - (a.visits || 0)).slice(0, 10);
  }
}
