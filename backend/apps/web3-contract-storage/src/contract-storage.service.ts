import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface StorageSlot {
  slot: string;
  value: string;
  decodedValue?: string;
  type?: string;
}

export interface ContractStorageResult {
  address: string;
  chainId: number;
  slots: StorageSlot[];
  blockNumber: number;
  timestamp: string;
}

const ETH_MAINNET_RPC = process.env.ETH_MAINNET_RPC || 'https://eth.llamarpc.com';
const POLYGON_RPC = process.env.POLYGON_RPC || 'https://polygon-rpc.com';
const ARBITRUM_RPC = process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc';
const BSC_RPC = process.env.BSC_RPC || 'https://bsc-dataseed.binance.org';
const OPTIMISM_RPC = process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io';

const RPC_MAP: Record<number, string> = {
  1: ETH_MAINNET_RPC,
  5: 'https://goerli.infura.io/v3/84842078b09946638c03157f83405213',
  11155111: 'https://sepolia.infura.io/v3/84842078b09946638c03157f83405213',
  137: POLYGON_RPC,
  80001: 'https://rpc-mumbai.maticvigil.com',
  42161: ARBITRUM_RPC,
  421613: 'https://goerli-rollup.arbitrum.io/rpc',
  56: BSC_RPC,
  97: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  10: OPTIMISM_RPC,
  69: 'https://kovan.optimism.io',
  8453: 'https://mainnet.base.org',
  84531: 'https://sepolia.base.org',
};

function getRpcUrl(chainId: number): string {
  return RPC_MAP[chainId] || ETH_MAINNET_RPC;
}

@Injectable()
export class ContractStorageService {
  private knownMappingTypes: Record<string, string[]> = {
    'mapping(address => uint256)': ['_balances', 'balanceOf', 'allowances'],
    'mapping(address => mapping(address => uint256))': ['_allowances'],
    'mapping(address => bool)': ['_whiteList', 'blackList', 'minters'],
    'uint256': ['totalSupply', '_totalSupply', 'balance', 'reward', 'accumulatedRewards'],
    'address': ['_owner', 'owner', 'admin', 'treasury', 'feeAddress'],
    'string': ['_name', '_symbol', 'name', 'symbol'],
    'bool': ['_paused', 'paused', 'locked', 'initialized'],
  };

  async getStorageAt(
    address: string,
    chainId: number,
    slot: string,
    blockNumber: number = 'latest',
  ): Promise<ContractStorageResult> {
    try {
      const rpcUrl = getRpcUrl(chainId);
      const response = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_getStorageAt',
        params: [address, slot, blockNumber],
        id: 1,
      });

      if (response.data.error) {
        throw new HttpException(
          response.data.error.message,
          HttpStatus.BAD_REQUEST,
        );
      }

      const blockResponse = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 2,
      });

      const decodedValue = this.decodeStorageValue(response.data.result);
      const typeInfo = this.estimateType(response.data.result);

      return {
        address,
        chainId,
        slots: [
          {
            slot,
            value: response.data.result,
            decodedValue,
            type: typeInfo,
          },
        ],
        blockNumber: parseInt(blockResponse.data.result, 16),
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get storage: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMultipleSlots(
    address: string,
    chainId: number,
    slots: string[],
    blockNumber: number = 16,
  ): Promise<ContractStorageResult> {
    try {
      const rpcUrl = getRpcUrl(chainId);
      const slotPromises = slots.map(async (slot) => {
        const response = await axios.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_getStorageAt',
          params: [address, slot, blockNumber],
          id: Math.floor(Math.random() * 1000),
        });

        const decodedValue = this.decodeStorageValue(response.data.result);
        const typeInfo = this.estimateType(response.data.result);

        return {
          slot,
          value: response.data.result,
          decodedValue,
          type: typeInfo,
        };
      });

      const resolvedSlots = await Promise.all(slotPromises);

      const blockResponse = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 999,
      });

      return {
        address,
        chainId,
        slots: resolvedSlots,
        blockNumber: parseInt(blockResponse.data.result, 16),
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get storage slots: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getContractCode(address: string, chainId: number): Promise<any> {
    try {
      const rpcUrl = getRpcUrl(chainId);
      const response = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, 'latest'],
        id: 1,
      });

      if (response.data.error) {
        throw new HttpException(
          response.data.error.message,
          HttpStatus.BAD_REQUEST,
        );
      }

      const code = response.data.result;
      const isContract = code !== '0x';

      return {
        address,
        chainId,
        code,
        isContract,
        codeLength: isContract ? (code.length - 2) / 2 : 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get contract code: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStorageLayout(address: string, chainId: number): Promise<any> {
    try {
      // Get first 20 storage slots (common for most contracts)
      const slots: string[] = [];
      for (let i = 0; i < 20; i++) {
        slots.push(`0x${i.toString(16).padStart(64, '0')}`);
      }

      // Add keccak256 slots for mappings (common patterns)
      // mapping(address => uint256) typically at slot 0 or 1
      // mapping(address => mapping(address => uint256)) is usually at slot 1+
      
      const rpcUrl = getRpcUrl(chainId);
      const storagePromises = slots.map(async (slot, index) => {
        const response = await axios.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_getStorageAt',
          params: [address, slot, 'latest'],
          id: index + 1,
        });

        const value = response.data.result;
        return {
          slot: index,
          slotHex: slot,
          value,
          decodedValue: this.decodeStorageValue(value),
          type: this.estimateType(value),
          label: this.suggestLabel(index, value),
        };
      });

      const storage = await Promise.all(storagePromises);

      return {
        address,
        chainId,
        storage,
        suggestedSlots: slots,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get storage layout: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMappingStorage(
    address: string,
    chainId: number,
    mappingSlot: number,
    keyType: string,
    valueType: string,
  ): Promise<any> {
    try {
      // For mapping(address => ...), compute slot = keccak256(key . slot)
      const results = [];
      const sampleAddresses = [
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000003',
        '0x0000000000000000000000000000000000000004',
        '0x0000000000000000000000000000000000000005',
      ];

      const rpcUrl = getRpcUrl(chainId);
      const mappingSlotHex = `0x${mappingSlot.toString(16).padStart(64, '0')}`;

      for (const addr of sampleAddresses) {
        const key = addr.replace('0x', '');
        const encodedSlot = key + mappingSlot.toString(16).padStart(64, '0');
        // Note: For full implementation, we'd need to compute keccak256
        // This is a simplified version

        try {
          const response = await axios.post(rpcUrl, {
            jsonrpc: '2.0',
            method: 'eth_getStorageAt',
            params: [address, mappingSlotHex, 'latest'],
            id: Math.floor(Math.random() * 1000),
          });

          results.push({
            key: addr,
            slot: mappingSlotHex,
            value: response.data.result,
            decodedValue: this.decodeStorageValue(response.data.result),
          });
        } catch (e) {
          // Skip failed requests
        }
      }

      return {
        address,
        chainId,
        mappingSlot,
        entries: results,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get mapping storage: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private decodeStorageValue(hexValue: string): string {
    if (!hexValue || hexValue === '0x') return '(empty)';
    
    const cleanHex = hexValue.startsWith('0x') ? hexValue.slice(2) : hexValue;
    
    // Try as uint256
    try {
      const bigIntValue = BigInt('0x' + cleanHex);
      
      // Check if it's an address
      if (cleanHex.length === 64) {
        const last40Chars = cleanHex.slice(-40);
        if (!last40Chars.match(/^0+$/) && BigInt('0x' + last40Chars) > 0n) {
          return `0x${last40Chars} (address)`;
        }
      }

      // Format as decimal if small enough
      if (bigIntValue < 10n ** 30n) {
        return bigIntValue.toString();
      }

      // Return scientific notation for large numbers
      return bigIntValue.toString();
    } catch (e) {
      return hexValue;
    }
  }

  private estimateType(hexValue: string): string {
    if (!hexValue || hexValue === '0x') return 'empty';
    
    const cleanHex = hexValue.startsWith('0x') ? hexValue.slice(2) : hexValue;
    
    // Check if it looks like an address
    if (cleanHex.length === 64) {
      const last40Chars = cleanHex.slice(-40);
      const prefix = cleanHex.slice(0, 24);
      if (prefix.match(/^0+$/) && !last40Chars.match(/^0+$/)) {
        return 'address';
      }
    }

    // Try to determine if it's uint or int
    try {
      const value = BigInt('0x' + cleanHex);
      const maxUint256 = (1n << 256n) - 1n;
      
      if (value > maxUint256 / 2n) {
        return 'int256';
      }
      return 'uint256';
    } catch (e) {
      return 'bytes32';
    }
  }

  private suggestLabel(slot: number, value: string): string {
    const labels: Record<number, string> = {
      0: '_balanceMap / owner / _totalSupply',
      1: '_allowances / _balances',
      2: '_nonces',
      3: '_approval',
      4: '_paused',
      5: '_whiteList',
      6: '_blackList',
      7: '_minters',
      8: '_tokenName',
      9: '_tokenSymbol',
      10: '_decimals',
      11: '_totalSupply',
      12: '_maxSupply',
      13: '_feeAddress',
      14: '_treasury',
      15: '_teamWallet',
      16: '_airdropRoot',
      17: '_claimAmount',
      18: '_startTime',
      19: '_endTime',
    };

    return labels[slot] || `slot_${slot}`;
  }
}
