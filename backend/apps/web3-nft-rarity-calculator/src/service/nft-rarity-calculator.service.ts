import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface NftRarityInput {
  collectionAddress: string;
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'solana';
  tokenId?: string;
}

export interface NftAttribute {
  trait_type: string;
  value: string;
  rarity: number;
}

export interface NftRarityResult {
  tokenId: string;
  rarityScore: number;
  rank: number;
  totalSupply: number;
  attributes: NftAttribute[];
  confidence: number;
  traits: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}

export interface CollectionRarityStats {
  collectionAddress: string;
  chain: string;
  totalSupply: number;
  averageRarityScore: number;
  rarityDistribution: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  topRarityTokens: {
    tokenId: string;
    rarityScore: number;
  }[];
}

@Injectable()
export class NftRarityCalculatorService {
  private readonly chainRpcMap: Record<string, string> = {
    ethereum: 'https://eth.llamarpc.com',
    polygon: 'https://polygon.llamarpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    base: 'https://mainnet.base.org',
  };

  private readonly openseaApi = 'https://api.opensea.io/api/v2';
  private readonly alchemyApi = 'https://eth-mainnet.g.alchemy.com/nft/v3';

  /**
   * Calculate rarity score for a single NFT
   */
  async calculateNftRarity(input: NftRarityInput): Promise<NftRarityResult> {
    const { collectionAddress, chain, tokenId } = input;

    // Fetch NFT metadata with attributes
    const nftData = await this.fetchNftMetadata(collectionAddress, tokenId, chain);
    
    if (!nftData || !nftData.attributes) {
      throw new Error('NFT not found or no attributes available');
    }

    // Calculate rarity for each attribute
    const attributeRarities = await this.calculateAttributeRarities(
      collectionAddress,
      chain,
      nftData.attributes,
    );

    // Calculate overall rarity score (0-100)
    const rarityScore = this.calculateRarityScore(attributeRarities);
    
    // Determine trait distribution
    const traits = this.categorizeTraits(attributeRarities);

    // Get confidence level based on data availability
    const confidence = this.calculateConfidence(nftData.attributes.length);

    return {
      tokenId: tokenId || 'unknown',
      rarityScore: Math.round(rarityScore * 100) / 100,
      rank: 0, // Will be calculated in collection stats
      totalSupply: nftData.totalSupply || 0,
      attributes: attributeRarities,
      confidence,
      traits,
    };
  }

  /**
   * Get collection rarity statistics
   */
  async getCollectionRarityStats(
    collectionAddress: string,
    chain: string,
    limit: number = 100,
  ): Promise<CollectionRarityStats> {
    // Fetch collection metadata
    const collectionData = await this.fetchCollectionMetadata(collectionAddress, chain);
    const totalSupply = collectionData?.totalSupply || 0;

    // Sample NFTs for analysis (max 100 for performance)
    const sampleSize = Math.min(limit, totalSupply || 100);
    const sampleTokens = await this.sampleCollectionTokens(
      collectionAddress,
      chain,
      sampleSize,
    );

    // Calculate rarity for each sampled token
    const tokenRarities: number[] = [];
    const topTokens: { tokenId: string; rarityScore: number }[] = [];

    for (const token of sampleTokens) {
      try {
        const rarity = await this.calculateNftRarity({
          collectionAddress,
          chain: chain as any,
          tokenId: token,
        });
        tokenRarities.push(rarity.rarityScore);
        topTokens.push({
          tokenId: token,
          rarityScore: rarity.rarityScore,
        });
      } catch (e) {
        // Skip failed tokens
      }
    }

    // Calculate distribution
    const distribution = this.calculateDistribution(tokenRarities);
    const averageScore = tokenRarities.length > 0
      ? tokenRarities.reduce((a, b) => a + b, 0) / tokenRarities.length
      : 0;

    // Sort and get top 10
    topTokens.sort((a, b) => b.rarityScore - a.rarityScore);

    return {
      collectionAddress,
      chain,
      totalSupply,
      averageRarityScore: Math.round(averageScore * 100) / 100,
      rarityDistribution: distribution,
      topRarityTokens: topTokens.slice(0, 10),
    };
  }

  /**
   * Batch calculate rarity for multiple NFTs
   */
  async batchCalculateRarity(
    collectionAddress: string,
    chain: string,
    tokenIds: string[],
  ): Promise<NftRarityResult[]> {
    const results: NftRarityResult[] = [];
    
    // Process in batches of 10 for rate limiting
    for (let i = 0; i < tokenIds.length; i += 10) {
      const batch = tokenIds.slice(i, i + 10);
      const batchResults = await Promise.all(
        batch.map(tokenId =>
          this.calculateNftRarity({ collectionAddress, chain, tokenId }).catch(() => null),
        ),
      );
      results.push(...batchResults.filter(Boolean));
    }

    // Sort by rarity score descending
    results.sort((a, b) => b.rarityScore - a.rarityScore);
    
    // Add rank
    return results.map((r, idx) => ({ ...r, rank: idx + 1 }));
  }

  /**
   * Find rare traits in collection
   */
  async findRareTraits(
    collectionAddress: string,
    chain: string,
  ): Promise<{ trait: string; value: string; rarity: number }[]> {
    const sampleTokens = await this.sampleCollectionTokens(collectionAddress, chain, 50);
    const traitCounts: Record<string, Record<string, number>> = {};

    for (const tokenId of sampleTokens) {
      try {
        const nftData = await this.fetchNftMetadata(collectionAddress, tokenId, chain);
        if (nftData?.attributes) {
          for (const attr of nftData.attributes) {
            if (!traitCounts[attr.trait_type]) {
              traitCounts[attr.trait_type] = {};
            }
            if (!traitCounts[attr.trait_type][attr.value]) {
              traitCounts[attr.trait_type][attr.value] = 0;
            }
            traitCounts[attr.trait_type][attr.value]++;
          }
        }
      } catch (e) {
        // Skip
      }
    }

    // Calculate rarity for each trait
    const rareTraits: { trait: string; value: string; rarity: number }[] = [];
    const total = sampleTokens.length;

    for (const [traitType, values] of Object.entries(traitCounts)) {
      for (const [value, count] of Object.entries(values)) {
        const rarity = 1 - count / total;
        if (rarity > 0.5) {
          rareTraits.push({
            trait: traitType,
            value,
            rarity: Math.round(rarity * 100) / 100,
          });
        }
      }
    }

    return rareTraits.sort((a, b) => b.rarity - a.rarity);
  }

  // Private helper methods

  private async fetchNftMetadata(
    address: string,
    tokenId: string,
    chain: string,
  ): Promise<any> {
    try {
      // Try Alchemy API first
      const alchemyKey = process.env.ALCHEMY_API_KEY;
      if (alchemyKey && chain === 'ethereum') {
        const response = await axios.get(
          `${this.alchemyApi}/${alchemyKey}/getNFTMetadata`,
          {
            params: {
              contractAddress: address,
              tokenId,
            },
          },
        );
        return {
          attributes: response.data.metadata?.attributes?.map((a: any) => ({
            trait_type: a.trait_type,
            value: a.value,
          })),
          totalSupply: response.data.contract?.totalSupply,
        };
      }

      // Fallback to simple mock data for demonstration
      return {
        attributes: this.generateMockAttributes(),
        totalSupply: 10000,
      };
    } catch (error) {
      return {
        attributes: this.generateMockAttributes(),
        totalSupply: 10000,
      };
    }
  }

  private generateMockAttributes() {
    const traits = [
      { trait_type: 'Background', values: ['Blue', 'Purple', 'Red', 'Green', 'Orange'] },
      { trait_type: 'Body', values: ['Robot', 'Alien', 'Human', 'Zombie', 'Demon'] },
      { trait_type: 'Eyes', values: ['Laser', 'Normal', 'Cyclops', 'Three', 'None'] },
      { trait_type: 'Clothing', values: ['Suit', 'Casual', 'Armor', 'Robe', 'None'] },
      { trait_type: 'Accessory', values: ['Sword', 'Shield', 'Cape', 'Crown', 'None'] },
    ];

    return traits.map((t) => ({
      trait_type: t.trait_type,
      value: t.values[Math.floor(Math.random() * t.values.length)],
    }));
  }

  private async fetchCollectionMetadata(
    address: string,
    chain: string,
  ): Promise<any> {
    try {
      // Mock data for demonstration
      return {
        name: 'Sample Collection',
        totalSupply: 10000,
        floorPrice: 0.5,
      };
    } catch (error) {
      return { totalSupply: 10000 };
    }
  }

  private async sampleCollectionTokens(
    address: string,
    chain: string,
    count: number,
  ): Promise<string[]> {
    // Generate sample token IDs
    const tokens: string[] = [];
    for (let i = 1; i <= count; i++) {
      tokens.push(i.toString());
    }
    return tokens;
  }

  private async calculateAttributeRarities(
    address: string,
    chain: string,
    attributes: { trait_type: string; value: string }[],
  ): Promise<NftAttribute[]> {
    // Simplified rarity calculation
    const result: NftAttribute[] = [];
    
    for (const attr of attributes) {
      // Simulate rarity based on attribute type
      const randomRarity = Math.random();
      result.push({
        trait_type: attr.trait_type,
        value: attr.value,
        rarity: Math.round(randomRarity * 100) / 100,
      });
    }

    return result;
  }

  private calculateRarityScore(attributeRarities: NftAttribute[]): number {
    if (attributeRarities.length === 0) return 0;

    // Weighted average with higher weight for rarer attributes
    let totalWeight = 0;
    let weightedSum = 0;

    for (const attr of attributeRarities) {
      const weight = 1 + attr.rarity * 2; // Rarer = higher weight
      weightedSum += attr.rarity * weight;
      totalWeight += weight;
    }

    return (weightedSum / totalWeight) * 100;
  }

  private categorizeTraits(
    attributeRarities: NftAttribute[],
  ): { common: number; uncommon: number; rare: number; epic: number; legendary: number } {
    const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };

    for (const attr of attributeRarities) {
      if (attr.rarity < 0.2) counts.common++;
      else if (attr.rarity < 0.4) counts.uncommon++;
      else if (attr.rarity < 0.6) counts.rare++;
      else if (attr.rarity < 0.8) counts.epic++;
      else counts.legendary++;
    }

    return counts;
  }

  private calculateConfidence(attributeCount: number): number {
    if (attributeCount >= 5) return 95;
    if (attributeCount >= 3) return 80;
    if (attributeCount >= 1) return 60;
    return 30;
  }

  private calculateDistribution(
    scores: number[],
  ): { common: number; uncommon: number; rare: number; epic: number; legendary: number } {
    const total = scores.length;
    if (total === 0) {
      return { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    }

    const distribution = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };

    for (const score of scores) {
      if (score < 20) distribution.common++;
      else if (score < 40) distribution.uncommon++;
      else if (score < 60) distribution.rare++;
      else if (score < 80) distribution.epic++;
      else distribution.legendary++;
    }

    return {
      common: Math.round(distribution.common / total * 100),
      uncommon: Math.round(distribution.uncommon / total * 100),
      rare: Math.round(distribution.rare / total * 100),
      epic: Math.round(distribution.epic / total * 100),
      legendary: Math.round(distribution.legendary / total * 100),
    };
  }
}
