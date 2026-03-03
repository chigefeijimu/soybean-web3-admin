import { Injectable } from '@nestjs/common';
import { ethers, Interface, Fragment } from 'ethers';

export interface ABIEntry {
  id: string;
  name: string;
  address: string;
  chain: string;
  abi: string;
  functions: ABIFunction[];
  events: ABIEvent[];
  createdAt: number;
  tags: string[];
  verified: boolean;
}

export interface ABIFunction {
  name: string;
  signature: string;
  selector: string;
  inputs: ABIParameter[];
  outputs: ABIParameter[];
  stateMutability: string;
  type: string;
}

export interface ABIEvent {
  name: string;
  signature: string;
  topic0: string;
  inputs: ABIParameter[];
  type: string;
}

export interface ABIParameter {
  name: string;
  type: string;
  indexed?: boolean;
  components?: ABIParameter[];
}

export interface DecodedTransaction {
  functionName: string;
  functionSelector: string;
  args: Record<string, any>;
  inputs: ABIParameter[];
}

export interface FunctionSignature {
  selector: string;
  name: string;
  signature: string;
  description: string;
}

@Injectable()
export class ContractAbiManagerService {
  private abiDatabase: Map<string, ABIEntry> = new Map();
  private signatureDatabase: Map<string, FunctionSignature> = new Map();

  constructor() {
    this.initializeSignatures();
  }

  private initializeSignatures() {
    // Common ERC functions
    const commonSignatures: FunctionSignature[] = [
      { selector: '0xa9059cbb', name: 'transfer', signature: 'transfer(address,uint256)', description: 'Transfer tokens to address' },
      { selector: '0x23b872dd', name: 'transferFrom', signature: 'transferFrom(address,address,uint256)', description: 'Transfer tokens from address' },
      { selector: '0x095ea7b3', name: 'approve', signature: 'approve(address,uint256)', description: 'Approve token spending' },
      { selector: '0xdd62ed3e', name: 'allowance', signature: 'allowance(address,address)', description: 'Check token allowance' },
      { selector: '0x18160ddd', name: 'totalSupply', signature: 'totalSupply()', description: 'Get total token supply' },
      { selector: '0x70a08231', name: 'balanceOf', signature: 'balanceOf(address)', description: 'Get token balance' },
      { selector: '0x313ce567', name: 'decimals', signature: 'decimals()', description: 'Get token decimals' },
      { selector: '0x06fdde03', name: 'name', signature: 'name()', description: 'Get token name' },
      { selector: '0x95d89b41', name: 'symbol', signature: 'symbol()', description: 'Get token symbol' },
      { selector: '0x4e71d92d', name: 'claim', signature: 'claim()', description: 'Claim tokens' },
      { selector: '0xf2fde38b', name: 'transferOwnership', signature: 'transferOwnership(address)', description: 'Transfer contract ownership' },
      { selector: '0x8da5cb5b', name: 'owner', signature: 'owner()', description: 'Get contract owner' },
      { selector: '0x5c60da1b', name: 'implementation', signature: 'implementation()', description: 'Get implementation address' },
      { selector: '0x1626ba7e', name: 'ecrecover', signature: 'ecrecover(bytes32,uint8,bytes32,bytes32)', description: 'Recover signer' },
      // Uniswap V3
      { selector: '0x414bf389', name: 'swap', signature: 'swap(address,bool,int256,uint160,bytes)', description: 'Uniswap V3 swap' },
      { selector: '0x2e1a7d4d', name: 'multicall', signature: 'multicall(bytes[])', description: 'Execute multiple calls' },
      // ERC721
      { selector: '0xb88d4fde', name: 'safeTransferFrom', signature: 'safeTransferFrom(address,address,uint256,bytes)', description: 'Safe NFT transfer' },
      { selector: '0x42842e0e', name: 'safeTransferFrom', signature: 'safeTransferFrom(address,address,uint256)', description: 'Safe NFT transfer' },
      { selector: '0xf242432a', name: 'setApprovalForAll', signature: 'setApprovalForAll(address,bool)', description: 'Set approval for all NFTs' },
      { selector: '0xe985e9c5', name: 'isApprovedForAll', signature: 'isApprovedForAll(address,address)', description: 'Check NFT approval' },
      { selector: '0x6352211e', name: 'ownerOf', signature: 'ownerOf(uint256)', description: 'Get NFT owner' },
      { selector: '0x081812fc', name: 'tokenURI', signature: 'tokenURI(uint256)', description: 'Get NFT token URI' },
      // Aave
      { selector: '0x4c1d3e8a', name: 'supply', signature: 'supply(address,uint256,address,uint16)', description: 'Supply assets to Aave' },
      { selector: '0x573ade81', name: 'withdraw', signature: 'withdraw(address,uint256,address)', description: 'Withdraw from Aave' },
      { selector: '0x0d1b9e17', name: 'borrow', signature: 'borrow(address,uint256,uint256,uint16,address)', description: 'Borrow from Aave' },
      { selector: '0x69328dec', name: 'repay', signature: 'repay(address,uint256,address)', description: 'Repay Aave loan' },
      // Common events
      { selector: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', name: 'Transfer', signature: 'Transfer(address,address,uint256)', description: 'Token transfer event' },
      { selector: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', name: 'Approval', signature: 'Approval(address,address,uint256)', description: 'Token approval event' },
    ];

    commonSignatures.forEach(sig => {
      this.signatureDatabase.set(sig.selector, sig);
    });
  }

  async addABI(
    name: string,
    address: string,
    chain: string,
    abi: string,
    tags: string[] = [],
  ): Promise<ABIEntry> {
    const id = `${chain}:${address}`.toLowerCase();
    
    let parsedABI: any[];
    try {
      parsedABI = JSON.parse(abi);
    } catch {
      throw new Error('Invalid ABI format');
    }

    const functions = this.extractFunctions(parsedABI);
    const events = this.extractEvents(parsedABI);

    const entry: ABIEntry = {
      id,
      name,
      address: address.toLowerCase(),
      chain,
      abi,
      functions,
      events,
      createdAt: Date.now(),
      tags,
      verified: false,
    };

    this.abiDatabase.set(id, entry);
    return entry;
  }

  private extractFunctions(abi: any[]): ABIFunction[] {
    const functions: ABIFunction[] = [];
    
    for (const item of abi) {
      if (item.type === 'function') {
        try {
          const iface = new Interface([item]);
          const fragment = iface.getFunction(item.name);
          
          functions.push({
            name: item.name,
            signature: iface.getFunction(item.name).format('full'),
            selector: fragment.selector,
            inputs: this.extractParameters(item.inputs || []),
            outputs: this.extractParameters(item.outputs || []),
            stateMutability: item.stateMutability || 'nonpayable',
            type: item.type,
          });
        } catch (e) {
          // Skip invalid functions
        }
      }
    }
    
    return functions;
  }

  private extractEvents(abi: any[]): ABIEvent[] {
    const events: ABIEvent[] = [];
    
    for (const item of abi) {
      if (item.type === 'event') {
        try {
          const iface = new Interface([item]);
          const fragment = iface.getEvent(item.name);
          
          events.push({
            name: item.name,
            signature: iface.getEvent(item.name).format('full'),
            topic0: fragment.topicHash,
            inputs: this.extractParameters(item.inputs || [], true),
            type: item.type,
          });
        } catch (e) {
          // Skip invalid events
        }
      }
    }
    
    return events;
  }

  private extractParameters(params: readonly any[], isEvent: boolean = false): ABIParameter[] {
    return params.map(p => ({
      name: p.name || '',
      type: p.type,
      indexed: isEvent ? p.indexed : undefined,
      components: p.components ? this.extractParameters(p.components, isEvent) : undefined,
    }));
  }

  async getABI(chain: string, address: string): Promise<ABIEntry | null> {
    const id = `${chain}:${address}`.toLowerCase();
    return this.abiDatabase.get(id) || null;
  }

  async searchABIs(query: string): Promise<ABIEntry[]> {
    const results: ABIEntry[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const entry of this.abiDatabase.values()) {
      if (
        entry.name.toLowerCase().includes(lowerQuery) ||
        entry.address.includes(lowerQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        entry.functions.some(fn => fn.name.toLowerCase().includes(lowerQuery))
      ) {
        results.push(entry);
      }
    }
    
    return results;
  }

  async listABIs(chain?: string, tags?: string[]): Promise<ABIEntry[]> {
    let results = Array.from(this.abiDatabase.values());
    
    if (chain) {
      results = results.filter(e => e.chain === chain);
    }
    
    if (tags && tags.length > 0) {
      results = results.filter(e => 
        tags.some(tag => e.tags.includes(tag))
      );
    }
    
    return results;
  }

  async decodeTransaction(
    chain: string,
    address: string,
    data: string,
  ): Promise<DecodedTransaction | null> {
    const entry = await this.getABI(chain, address);
    if (!entry) return null;

    try {
      const iface = new Interface(entry.abi);
      const functionName = iface.getFunction(data.substring(0, 10))?.name || 'unknown';
      const fragment = iface.getFunction(data.substring(0, 10));
      
      let args: Record<string, any> = {};
      try {
        const decoded = iface.decodeFunctionData(fragment, data);
        // Convert to plain object
        for (const key of Object.keys(decoded)) {
          args[key] = decoded[key].toString();
        }
      } catch (e) {
        // Data couldn't be fully decoded
      }

      return {
        functionName,
        functionSelector: data.substring(0, 10),
        args,
        inputs: this.extractParameters(fragment.inputs || []),
      };
    } catch (e) {
      return null;
    }
  }

  async lookupSignature(selector: string): Promise<FunctionSignature | null> {
    // Try exact match first
    let sig = this.signatureDatabase.get(selector);
    if (sig) return sig;

    // Try to parse from known patterns
    for (const known of this.signatureDatabase.values()) {
      if (known.selector.startsWith(selector.substring(0, 8))) {
        return known;
      }
    }

    return null;
  }

  async decodeLog(log: { topics: string[], data: string }, chain: string, address: string): Promise<any> {
    const entry = await this.getABI(chain, address);
    if (!entry) return null;

    try {
      const iface = new Interface(entry.abi);
      const event = iface.getEvent(log.topics[0]);
      const decoded = iface.decodeEventLog(event, log.data, log.topics);
      
      return {
        name: event.name,
        signature: event.format('full'),
        args: decoded,
      };
    } catch (e) {
      return null;
    }
  }

  async getFunctionSignatures(): Promise<FunctionSignature[]> {
    return Array.from(this.signatureDatabase.values());
  }

  async verifyABI(chain: string, address: string, code: string): Promise<boolean> {
    const entry = await this.getABI(chain, address);
    if (!entry) return false;

    // Simplified verification - in production would compare bytecode
    entry.verified = code.startsWith('0x');
    this.abiDatabase.set(entry.id, entry);
    return entry.verified;
  }

  async deleteABI(chain: string, address: string): Promise<boolean> {
    const id = `${chain}:${address}`.toLowerCase();
    return this.abiDatabase.delete(id);
  }

  // Get popular ABIs
  async getPopularABIs(): Promise<ABIEntry[]> {
    const popularAddresses: Record<string, { name: string; address: string; chain: string }[]> = {
      ethereum: [
        { name: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'ethereum' },
        { name: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', chain: 'ethereum' },
        { name: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chain: 'ethereum' },
        { name: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chain: 'ethereum' },
        { name: 'AAVE', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', chain: 'ethereum' },
      ],
      polygon: [
        { name: 'USDC', address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', chain: 'polygon' },
        { name: 'USDT', address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', chain: 'polygon' },
        { name: 'QUICK', address: '0xb5c064f955d8e7f38fe0460c556a72987494ee17', chain: 'polygon' },
      ],
    };

    const results: ABIEntry[] = [];
    for (const [chain, tokens] of Object.entries(popularAddresses)) {
      for (const token of tokens) {
        const entry = await this.getABI(chain, token.address);
        if (entry) results.push(entry);
      }
    }
    return results;
  }

  // Get statistics
  async getStats(): Promise<{
    totalABIs: number;
    totalFunctions: number;
    totalEvents: number;
    chains: Record<string, number>;
  }> {
    let totalFunctions = 0;
    let totalEvents = 0;
    const chains: Record<string, number> = {};

    for (const entry of this.abiDatabase.values()) {
      totalFunctions += entry.functions.length;
      totalEvents += entry.events.length;
      chains[entry.chain] = (chains[entry.chain] || 0) + 1;
    }

    return {
      totalABIs: this.abiDatabase.size,
      totalFunctions,
      totalEvents,
      chains,
    };
  }
}
