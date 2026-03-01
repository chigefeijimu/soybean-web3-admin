import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class Web3EnsService {
  private readonly ensSubgraphUrl = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens';
  private readonly alchemyApiKey = process.env.ALCHEMY_API_KEY || '';
  private readonly infuraProjectId = process.env.INFURA_PROJECT_ID || '';

  constructor(private readonly httpService: HttpService) {}

  /**
   * ENS正向解析 - 域名解析为ETH地址
   */
  async resolveName(name: string, chainId: number = 1): Promise<any> {
    const normalizedName = this.normalizeEnsName(name);
    
    try {
      // 使用 Cloudflare ETH Gateway
      const response = await firstValueFrom(
        this.httpService.get(`https://cloudflare-eth.com/v1/resolve/${normalizedName}`)
      ).catch(() => null);

      if (response?.data?.address) {
        return {
          name: normalizedName,
          address: response.data.address,
          resolved: true,
          chainId,
        };
      }

      // 备用方案: 使用 ethers.js API
      return await this.resolveWithApi(normalizedName);
    } catch (error) {
      console.error('ENS resolve error:', error);
      return {
        name: normalizedName,
        address: null,
        resolved: false,
        error: 'Failed to resolve ENS name',
      };
    }
  }

  /**
   * ENS反向解析 - ETH地址解析为域名
   */
  async reverseResolve(address: string): Promise<any> {
    const normalizedAddress = address.toLowerCase();

    try {
      // 使用 ENS 官方反向解析 API
      const response = await firstValueFrom(
        this.httpService.get(`https://reverse.gnr.dev/addr/${normalizedAddress}`)
      ).catch(() => null);

      if (response?.data?.name) {
        return {
          address: normalizedAddress,
          name: response.data.name,
          reverseResolved: true,
        };
      }

      // 使用 Cloudflare 反向解析
      const cfResponse = await firstValueFrom(
        this.httpService.get(`https://cloudflare-eth.com/v1/reverse/${normalizedAddress}`)
      ).catch(() => null);

      if (cfResponse?.data?.name) {
        return {
          address: normalizedAddress,
          name: cfResponse.data.name,
          reverseResolved: true,
        };
      }

      return {
        address: normalizedAddress,
        name: null,
        reverseResolved: false,
      };
    } catch (error) {
      console.error('ENS reverse resolve error:', error);
      return {
        address: normalizedAddress,
        name: null,
        reverseResolved: false,
        error: 'Failed to resolve reverse name',
      };
    }
  }

  /**
   * 获取ENS域名详细信息
   */
  async getEnsDetails(name: string): Promise<any> {
    const normalizedName = this.normalizeEnsName(name);

    try {
      // 获取域名所有者
      const owner = await this.getOwner(normalizedName);
      
      // 获取解析地址
      const resolution = await this.resolveName(normalizedName);
      
      // 获取到期时间
      const expiry = await this.getExpiry(normalizedName);
      
      // 获取头像
      const avatar = await this.getEnsAvatar(normalizedName);

      return {
        name: normalizedName,
        owner: owner,
        resolvedAddress: resolution.address,
        avatar: avatar.avatar,
        expiryDate: expiry.expiryDate,
        isExpired: expiry.isExpired,
        registrationDate: expiry.registrationDate,
        is2LD: normalizedName.split('.').length === 2, // Second-level domain
      };
    } catch (error) {
      console.error('ENS details error:', error);
      return {
        name: normalizedName,
        error: 'Failed to fetch ENS details',
      };
    }
  }

  /**
   * 批量解析ENS域名
   */
  async batchResolve(names: string[]): Promise<any> {
    const results = await Promise.all(
      names.map(async (name) => {
        const result = await this.resolveName(name);
        return {
          name,
          ...result,
        };
      })
    );

    return {
      total: names.length,
      resolved: results.filter(r => r.resolved).length,
      results,
    };
  }

  /**
   * 获取ENS头像
   */
  async getEnsAvatar(name: string): Promise<any> {
    const normalizedName = this.normalizeEnsName(name);

    try {
      // 使用 ENS Avatar API
      const response = await firstValueFrom(
        this.httpService.get(`https://metadata.ens.domains/mainnet/avatar/${normalizedName}`)
      ).catch(() => null);

      return {
        name: normalizedName,
        avatar: response?.data ? `https://metadata.ens.domains/mainnet/avatar/${normalizedName}` : null,
      };
    } catch (error) {
      return {
        name: normalizedName,
        avatar: null,
      };
    }
  }

  /**
   * 获取ENS所有记录
   */
  async getEnsRecords(name: string): Promise<any> {
    const normalizedName = this.normalizeEnsName(name);

    try {
      // 使用 ETH API 获取所有记录
      const response = await firstValueFrom(
        this.httpService.get(`https://api.ensideas.com/addresses/${normalizedName}`)
      ).catch(() => null);

      if (response?.data) {
        return {
          name: normalizedName,
          records: response.data,
        };
      }

      return {
        name: normalizedName,
        records: {
          address: await this.resolveName(normalizedName),
          avatar: await this.getEnsAvatar(normalizedName),
        },
      };
    } catch (error) {
      return {
        name: normalizedName,
        error: 'Failed to fetch records',
      };
    }
  }

  /**
   * 获取ENS域名历史记录
   */
  async getEnsHistory(name: string): Promise<any> {
    const normalizedName = this.normalizeEnsName(name);

    try {
      // 使用 The Graph 查询 ENS  subgraph
      const query = {
        query: `
          query getDomain($name: String!) {
            domains(where: { name: $name }) {
              id
              name
              labelName
              labelhash
              owner {
                id
              }
              registrant {
                id
              }
              registrationDate
              expirationDate
              events {
                id
                __typename
                owner {
                  id
                }
                timestamp
              }
            }
          }
        `,
        variables: { name: normalizedName },
      };

      const response = await firstValueFrom(
        this.httpService.post(this.ensSubgraphUrl, query)
      ).catch(() => null);

      if (response?.data?.data?.domains && response.data.data.domains.length > 0) {
        const domain = response.data.data.domains[0];
        return {
          name: normalizedName,
          domain,
          events: domain.events || [],
        };
      }

      return {
        name: normalizedName,
        events: [],
      };
    } catch (error) {
      console.error('ENS history error:', error);
      return {
        name: normalizedName,
        events: [],
        error: 'Failed to fetch history',
      };
    }
  }

  /**
   * 搜索ENS域名
   */
  async searchEns(query: string, limit: number = 10): Promise<any> {
    try {
      // 使用 OpenSea API 获取域名列表
      const response = await firstValueFrom(
        this.httpService.get('https://api.opensea.io/api/v1/collection/ens', {
          headers: { 'X-API-KEY': process.env.OPENSEA_API_KEY || '' },
        })
      ).catch(() => null);

      if (response?.data?.collection) {
        const collection = response.data.collection;
        return {
          query,
          totalSupply: collection.stats?.total_supply || 0,
          floorPrice: collection.stats?.floor_price || 0,
          description: collection.description,
          imageUrl: collection.image_url,
        };
      }

      return {
        query,
        results: [],
      };
    } catch (error) {
      return {
        query,
        results: [],
        error: 'Search failed',
      };
    }
  }

  /**
   * 获取热门ENS域名
   */
  async getPopularEns(limit: number = 20): Promise<any> {
    // 预定义热门ENS域名列表
    const popularEns = [
      'vitalik.eth',
      'cryptopunk.eth',
      'uniswap.eth',
      'aave.eth',
      'makerdao.eth',
      'compound.eth',
      'synthetix.eth',
      'curve.eth',
      'balancer.eth',
      'yearn.eth',
      ' ENS',
      'opticket.eth',
      'random.eth',
      'genesis.eth',
      'paradigm.eth',
    ].slice(0, limit);

    const results = await Promise.all(
      popularEns.map(async (name) => {
        try {
          const details = await this.getEnsDetails(name);
          return details;
        } catch {
          return { name, error: 'Failed to fetch' };
        }
      })
    );

    return {
      total: results.length,
      results,
    };
  }

  // 辅助方法
  private normalizeEnsName(name: string): string {
    let normalized = name.toLowerCase().trim();
    if (!normalized.endsWith('.eth')) {
      normalized = normalized + '.eth';
    }
    return normalized;
  }

  private async resolveWithApi(name: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.ens.vip/v1/resolve/${name}`)
      ).catch(() => null);

      if (response?.data?.address) {
        return {
          name,
          address: response.data.address,
          resolved: true,
        };
      }

      return { name, address: null, resolved: false };
    } catch {
      return { name, address: null, resolved: false };
    }
  }

  private async getOwner(name: string): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.ensideas.com/owner/${name}`)
      ).catch(() => null);
      return response?.data?.owner || null;
    } catch {
      return null;
    }
  }

  private async getExpiry(name: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.ensideas.com/expiry/${name}`)
      ).catch(() => null);
      
      if (response?.data) {
        return {
          expiryDate: response.data.expiryDate,
          registrationDate: response.data.registrationDate,
          isExpired: response.data.expired,
        };
      }
      
      return { expiryDate: null, registrationDate: null, isExpired: null };
    } catch {
      return { expiryDate: null, registrationDate: null, isExpired: null };
    }
  }
}
