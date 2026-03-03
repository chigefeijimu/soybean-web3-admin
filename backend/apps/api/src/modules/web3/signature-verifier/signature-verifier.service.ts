import { Injectable } from '@nestjs/common';

const ethers = require('ethers');

export interface SignatureResult {
  valid: boolean;
  signer: string | null;
  message: string;
  signature: string;
  algorithm: string;
  timestamp: string;
}

export interface SignResult {
  message: string;
  signature: string;
  signer: string;
  privateKey?: string;
  algorithm: string;
  timestamp: string;
}

@Injectable()
export class SignatureVerifierService {
  async verifySignature(message: string, signature: string): Promise<SignatureResult> {
    try {
      // 尝试方法1: 直接验证 personalSign (EIP-191)
      try {
        const recovered = ethers.verifyMessage(message, signature);
        if (recovered) {
          return {
            valid: true,
            signer: recovered,
            message,
            signature,
            algorithm: 'EIP-191 Personal Sign',
            timestamp: new Date().toISOString(),
          };
        }
      } catch (e) {
        // 继续尝试其他方法
      }

      // 方法2: 尝试标准 ECDSA 签名恢复
      try {
        const messageHash = ethers.id(message);
        const sigBuffer = Buffer.from(signature.slice(2), 'hex');

        if (sigBuffer.length === 65) {
          const v = sigBuffer[64];
          const r = '0x' + sigBuffer.slice(0, 32).toString('hex');
          const s = '0x' + sigBuffer.slice(32, 64).toString('hex');

          const recovered = ethers.recoverAddress(messageHash, { r, s, v });
          if (recovered) {
            return {
              valid: true,
              signer: recovered,
              message,
              signature,
              algorithm: 'ECDSA',
              timestamp: new Date().toISOString(),
            };
          }
        }
      } catch (e) {
        // 
      }

      // 方法3: 尝试带前缀的消息 (Ethereum Signed Message)
      try {
        const msgHash = ethers.keccak256(
          ethers.toUtf8Bytes(message)
        );
        const prefixedMsg = ethers.concat([
          ethers.hexlify(0x19),
          ethers.hexlify(0x00),
          msgHash
        ]);
        const hash = ethers.keccak256(prefixedMsg);

        const sigParams = ethers.Signature.from(signature);
        const recovered = ethers.recoverAddress(hash, sigParams);
        if (recovered) {
          return {
            valid: true,
            signer: recovered,
            message,
            signature,
            algorithm: 'EIP-191 (0x00 prefix)',
            timestamp: new Date().toISOString(),
          };
        }
      } catch (e) {
        // 
      }

      return {
        valid: false,
        signer: null,
        message,
        signature,
        algorithm: 'Unknown',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        valid: false,
        signer: null,
        message,
        signature,
        algorithm: 'Error: ' + error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async signMessage(message: string, privateKey?: string): Promise<SignResult | { error: string; timestamp: string }> {
    try {
      let wallet;
      if (privateKey) {
        if (!privateKey.startsWith('0x')) {
          privateKey = '0x' + privateKey;
        }
        wallet = new ethers.Wallet(privateKey);
      } else {
        wallet = ethers.Wallet.createRandom();
      }

      const signature = await wallet.signMessage(message);

      return {
        message,
        signature,
        signer: wallet.address,
        privateKey: wallet.privateKey,
        algorithm: 'EIP-191 Personal Sign',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async verifyTypedData(domain: string, types: string, value: string, signature: string): Promise<any> {
    try {
      const domainData = JSON.parse(domain);
      const typesData = JSON.parse(types);
      const valueData = JSON.parse(value);

      // 简化版 EIP-712 验证
      const domainHash = ethers.id(JSON.stringify(domainData));
      const structHash = ethers.id(JSON.stringify(valueData));
      const hash = ethers.keccak256(
        ethers.concat([ethers.hexlify(0x19), ethers.hexlify(0x01), domainHash, structHash])
      );

      let signer: string | null = null;
      let valid = false;

      try {
        const sigParams = ethers.Signature.from(signature);
        signer = ethers.recoverAddress(hash, sigParams);
        valid = !!signer;
      } catch (e) {
        // 
      }

      return {
        valid,
        signer,
        domain: domainData,
        value: valueData,
        signature,
        algorithm: 'EIP-712 Typed Data',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        valid: false,
        signer: null,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getTestSignatures(): Promise<any> {
    const wallet = ethers.Wallet.createRandom();
    const testMessage = 'Hello, Web3!';
    const signature = await wallet.signMessage(testMessage);

    return {
      examples: [
        {
          message: testMessage,
          signature,
          signer: wallet.address,
          privateKey: wallet.privateKey,
          description: 'Personal Sign 示例',
        },
      ],
      supportedAlgorithms: [
        { name: 'EIP-191 Personal Sign', description: '以太坊标准签名' },
        { name: 'EIP-191 (0x00 prefix)', description: '旧版签名格式' },
        { name: 'ECDSA', description: '标准ECDSA签名' },
        { name: 'EIP-712 Typed Data', description: '类型化数据签名' },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  async getSupportedChains(): Promise<any> {
    return {
      chains: [
        { name: 'Ethereum', chainId: 1, symbol: 'ETH' },
        { name: 'Polygon', chainId: 137, symbol: 'MATIC' },
        { name: 'Arbitrum One', chainId: 42161, symbol: 'ETH' },
        { name: 'Optimism', chainId: 10, symbol: 'ETH' },
        { name: 'BSC', chainId: 56, symbol: 'BNB' },
        { name: 'Avalanche', chainId: 43114, symbol: 'AVAX' },
        { name: 'Base', chainId: 8453, symbol: 'ETH' },
        { name: 'zkSync Era', chainId: 324, symbol: 'ETH' },
        { name: 'Starknet', chainId: 0, symbol: 'ETH' },
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
