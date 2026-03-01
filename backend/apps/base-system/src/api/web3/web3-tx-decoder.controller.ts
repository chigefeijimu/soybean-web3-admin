import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface FunctionSelector {
  selector: string;
  name: string;
  signature: string;
  category: string;
}

@Controller('web3/tx-decoder')
export class Web3TxDecoderController {
  private readonly ethereumRpc: string;
  private readonly etherscanApiKey: string;

  // Common function selectors database
  private readonly knownSelectors: FunctionSelector[] = [
    // ERC20
    { selector: '0xa9059cbb', name: 'transfer', signature: 'transfer(address to, uint256 amount)', category: 'ERC20' },
    { selector: '0x23b872dd', name: 'transferFrom', signature: 'transferFrom(address from, address to, uint256 amount)', category: 'ERC20' },
    { selector: '0x095ea7b3', name: 'approve', signature: 'approve(address spender, uint256 amount)', category: 'ERC20' },
    { selector: '0x70a08231', name: 'balanceOf', signature: 'balanceOf(address account)', category: 'ERC20' },
    { selector: '0x18160ddd', name: 'totalSupply', signature: 'totalSupply()', category: 'ERC20' },
    { selector: '0x06fdde03', name: 'name', signature: 'name()', category: 'ERC20' },
    { selector: '0x95d89b41', name: 'symbol', signature: 'symbol()', category: 'ERC20' },
    { selector: '0x313ce567', name: 'decimals', signature: 'decimals()', category: 'ERC20' },
    { selector: '0x2e1a7d4d', name: 'withdraw', signature: 'withdraw(uint256 amount)', category: 'ERC20' },
    
    // ERC721
    { selector: '0xb88d4fde', name: 'safeTransferFrom', signature: 'safeTransferFrom(address from, address to, uint256 tokenId, uint256 amount, bytes data)', category: 'ERC721' },
    { selector: '0x42842e0e', name: 'safeTransferFrom', signature: 'safeTransferFrom(address from, address to, uint256 tokenId)', category: 'ERC721' },
    { selector: '0xf242432a', name: 'safeTransferFrom', signature: 'safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)', category: 'ERC1155' },
    { selector: '0x1f4f0780', name: 'setApprovalForAll', signature: 'setApprovalForAll(address operator, bool approved)', category: 'ERC721' },
    { selector: '0xe985e9c5', name: 'Approval', signature: 'Approval(address owner, address spender, uint256 tokenId)', category: 'ERC721' },
    { selector: '0xddf252ad', name: 'Transfer', signature: 'Transfer(address from, address to, uint256 amount)', category: 'ERC20' },
    
    // Uniswap V2
    { selector: '0x022c0d9f', name: 'swap', signature: 'swap(uint256 amount0Out, uint256 amount1Out, address to, bytes data)', category: 'UniswapV2' },
    { selector: '0x4f3786d2', name: 'mint', signature: 'mint(address to)', category: 'UniswapV2' },
    { selector: '0x0dfe1681', name: 'sync', signature: 'sync()', category: 'UniswapV2' },
    { selector: '0x8907b2a4', name: 'getReserves', signature: 'getReserves()', category: 'UniswapV2' },
    { selector: '0x026e9ced', name: 'factory', signature: 'factory()', category: 'UniswapV2' },
    { selector: '0xfc0c546a', name: 'token0', signature: 'token0()', category: 'UniswapV2' },
    { selector: '0x0d4cd7c1', name: 'token1', signature: 'token1()', category: 'UniswapV2' },
    
    // Uniswap V3
    { selector: '0x414bf389', name: 'exactInputSingle', signature: 'exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96))', category: 'UniswapV3' },
    { selector: '0x04e45aaf', name: 'exactInput', signature: 'exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum))', category: 'UniswapV3' },
    { selector: '0x76cf3881', name: 'exactOutputSingle', signature: 'exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96))', category: 'UniswapV3' },
    { selector: '0x4f30c1d0', name: 'exactOutput', signature: 'exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum))', category: 'UniswapV3' },
    { selector: '0xac9650d8', name: 'multicall', signature: 'multicall(bytes[] data)', category: 'UniswapV3' },
    
    // Aave
    { selector: '0x4f3786d2', name: 'mint', signature: 'mint(address to)', category: 'Aave' },
    { selector: '0x260e12d1', name: 'deposit', signature: 'deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)', category: 'Aave' },
    { selector: '0x0cbc9d03', name: 'withdraw', signature: 'withdraw(address asset, uint256 amount, address to)', category: 'Aave' },
    { selector: '0x5c60da1b', name: 'initialize', signature: 'initialize(address assets, uint256[] amounts, address aTokenImplementations)', category: 'Aave' },
    
    // Compound
    { selector: '0x852a12e3', name: 'mint', signature: 'mint(uint256 mintAmount)', category: 'Compound' },
    { selector: '0x0e2e8c54', name: 'redeem', signature: 'redeem(uint256 redeemTokens)', category: 'Compound' },
    { selector: '0x8b1d36a4', name: 'borrow', signature: 'borrow(uint256 borrowAmount)', category: 'Compound' },
    { selector: '0x8703d402', name: 'repayBorrow', signature: 'repayBorrow(uint256 repayAmount)', category: 'Compound' },
    
    // Gnosis Safe
    { selector: '0x0d2c56f8', name: 'execTransaction', signature: 'execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)', category: 'GnosisSafe' },
    { selector: '0x6a761202', name: 'execTransaction', signature: 'execTransaction(address to, uint256 value, bytes data, uint8 operation)', category: 'GnosisSafe' },
    { selector: '0x59c7885e', name: 'confirmTransaction', signature: 'confirmTransaction(bytes32 safeTxHash, uint8 sigsV, bytes32 sigsR, bytes32 sigsS)', category: 'GnosisSafe' },
    
    // Multisig
    { selector: '0xa9059cbb', name: 'execute', signature: 'execute(address to, uint256 value, bytes data)', category: 'Multisig' },
    { selector: '0x2f4c9adb', name: 'submitTransaction', signature: 'submitTransaction(address to, uint256 value, bytes data)', category: 'Multisig' },
    
    // LayerZero
    { selector: '0x4b5e5f84', name: 'send', signature: 'send(uint16 _dstChainId, bytes calldata _destination, bytes calldata _payload, address _refundAddress, address _zroPaymentAddress, bytes calldata _adapterParams)', category: 'LayerZero' },
    { selector: '0x4a4f715a', name: 'lzReceive', signature: 'lzReceive(uint16 _srcChainId, bytes calldata _srcAddress, uint64 _nonce, bytes calldata _payload)', category: 'LayerZero' },
    
    // Stargate
    { selector: '0xc44e8e14', name: 'swap', signature: 'swap(uint16 dstChainId, uint256 srcPoolId, uint256 dstPoolId, address refundAddress, uint256 amountIn, uint256 amountOutMin, address to, bytes calldata payload)', category: 'Stargate' },
    { selector: '0x96f5b8ad', name: 'addLiquidity', signature: 'addLiquidity(uint256 amount, address to)', category: 'Stargate' },
    
    // General
    { selector: '0x00000000', name: 'unknown', signature: 'unknown', category: 'General' }
  ];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ethereumRpc = this.configService.get<string>('ETHEREUM_RPC') || 'https://eth.llamarpc.com';
    this.etherscanApiKey = this.configService.get<string>('ETHERSCAN_API_KEY') || '';
  }

  /**
   * Get all known function selectors
   */
  @Get('selectors')
  @HttpCode(HttpStatus.OK)
  async getKnownSelectors(@Query('category') category?: string): Promise<{
    success: boolean;
    data: FunctionSelector[];
  }> {
    let selectors = this.knownSelectors;
    
    if (category) {
      selectors = selectors.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }
    
    return {
      success: true,
      data: selectors
    };
  }

  /**
   * Lookup a specific function selector
   */
  @Get('lookup/:selector')
  @HttpCode(HttpStatus.OK)
  async lookupSelector(@Param('selector') selector: string): Promise<{
    success: boolean;
    data: FunctionSelector | null;
  }> {
    const cleanSelector = selector.startsWith('0x') ? selector.slice(0, 10) : selector.slice(0, 8);
    const found = this.knownSelectors.find(s => s.selector === cleanSelector);
    
    return {
      success: true,
      data: found || null
    };
  }

  /**
   * Get transaction details by hash
   */
  @Get('transaction/:hash')
  @HttpCode(HttpStatus.OK)
  async getTransaction(
    @Param('hash') hash: string,
    @Query('chainId') chainId: string = '1',
  ): Promise<{
    success: boolean;
    data: any;
  }> {
    try {
      const rpcUrl = this.getRpcUrl(chainId);
      
      // Get transaction details
      const txResponse = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_getTransactionByHash',
          params: [hash],
          id: 1,
        })
      );
      
      // Get transaction receipt for status
      const receiptResponse = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [hash],
          id: 2,
        })
      );
      
      const tx = txResponse.data.result;
      const receipt = receiptResponse.data.result;
      
      if (!tx) {
        return {
          success: false,
          data: { error: 'Transaction not found' }
        };
      }
      
      // Decode input data
      const decoded = this.decodeInputData(tx.input || '0x');
      
      return {
        success: true,
        data: {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          gasPrice: tx.gasPrice,
          gasLimit: tx.gas,
          nonce: tx.nonce,
          chainId: tx.chainId,
          transactionIndex: tx.transactionIndex,
          input: tx.input,
          decoded,
          receipt: receipt ? {
            status: receipt.status,
            blockNumber: receipt.blockNumber,
            blockHash: receipt.blockHash,
            gasUsed: receipt.gasUsed,
            logs: receipt.logs,
            logsBloom: receipt.logsBloom
          } : null
        }
      };
    } catch (error: any) {
      return {
        success: false,
        data: { error: error.message || 'Failed to fetch transaction' }
      };
    }
  }

  /**
   * Query contract storage at a specific slot
   */
  @Get('storage/:address/:slot')
  @HttpCode(HttpStatus.OK)
  async getStorage(
    @Param('address') address: string,
    @Param('slot') slot: string,
    @Query('chainId') chainId: string = '1',
  ): Promise<{
    success: boolean;
    data: any;
  }> {
    try {
      const rpcUrl = this.getRpcUrl(chainId);
      const cleanSlot = slot.startsWith('0x') ? slot : `0x${parseInt(slot).toString(16)}`;
      
      const response = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_getStorageAt',
          params: [address, cleanSlot, 'latest'],
          id: 1,
        })
      );
      
      return {
        success: true,
        data: {
          address,
          slot: cleanSlot,
          value: response.data.result,
          decoded: this.decodeStorageValue(response.data.result)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        data: { error: error.message || 'Failed to query storage' }
      };
    }
  }

  /**
   * Batch decode multiple transactions
   */
  @Get('batch-decode')
  @HttpCode(HttpStatus.OK)
  async batchDecode(@Query('hashes') hashes: string): Promise<{
    success: boolean;
    data: any[];
  }> {
    const hashList = hashes.split(',').map(h => h.trim()).filter(h => h);
    const results: any[] = [];
    
    for (const hash of hashList) {
      try {
        const rpcUrl = this.getRpcUrl('1');
        
        const response = await firstValueFrom(
          this.httpService.post(rpcUrl, {
            jsonrpc: '2.0',
            method: 'eth_getTransactionByHash',
            params: [hash],
            id: 1,
          })
        );
        
        const tx = response.data.result;
        if (tx) {
          results.push({
            hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            decoded: this.decodeInputData(tx.input || '0x')
          });
        }
      } catch (error) {
        results.push({ hash, error: 'Failed to decode' });
      }
    }
    
    return {
      success: true,
      data: results
    };
  }

  /**
   * Decode raw input data
   */
  @Get('decode')
  @HttpCode(HttpStatus.OK)
  async decodeInput(@Query('data') data: string): Promise<{
    success: boolean;
    data: any;
  }> {
    const decoded = this.decodeInputData(data || '0x');
    
    return {
      success: true,
      data: decoded
    };
  }

  // Helper: Decode input data
  private decodeInputData(input: string): any {
    if (!input || input === '0x') {
      return { type: 'empty', description: 'Empty data' };
    }

    const cleanData = input.startsWith('0x') ? input : `0x${input}`;
    
    if (cleanData.length < 10) {
      return { type: 'insufficient', description: 'Data too short for function selector' };
    }

    const selector = cleanData.substring(0, 10);
    const params = cleanData.substring(10);

    // Check known selectors
    const known = this.knownSelectors.find(s => s.selector === selector);
    if (known) {
      const decodedParams = this.decodeParameters(params, known.signature);
      return {
        type: 'known',
        selector,
        function: known.name,
        signature: known.signature,
        category: known.category,
        parameters: decodedParams
      };
    }

    return {
      type: 'unknown',
      selector,
      rawData: params,
      description: 'Unknown function selector'
    };
  }

  // Helper: Decode parameters based on signature
  private decodeParameters(params: string, signature: string): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Extract parameter types from signature
    const paramTypes = signature.replace(/^[^\(]+\(/, '').replace(/\).*$/, '').split(',').map(s => s.trim());
    
    let offset = 0;
    paramTypes.forEach((type, index) => {
      if (offset * 2 >= params.length) return;
      
      if (type.includes('address')) {
        result[`param${index}`] = `0x${params.substring(offset * 2 + 24, (offset + 1) * 2)}`;
        offset += 12;
      } else if (type.includes('uint256') || type.includes('uint128') || type.includes('uint64')) {
        const hexValue = params.substring(offset * 2, (offset + 32) * 2);
        result[`param${index}`] = {
          hex: `0x${hexValue}`,
          decimal: BigInt(`0x${hexValue}`).toString(),
          formatted: (Number(BigInt(`0x${hexValue}`)) / 1e18).toFixed(6)
        };
        offset += 32;
      } else if (type.includes('uint8')) {
        result[`param${index}`] = parseInt(params.substring(offset * 2, (offset + 1) * 2), 16);
        offset += 1;
      } else if (type.includes('bool')) {
        result[`param${index}`] = params.substring(offset * 2, (offset + 1) * 2) !== '00';
        offset += 1;
      } else if (type.includes('bytes')) {
        const lenOffset = offset + 32;
        if (lenOffset * 2 <= params.length) {
          const len = parseInt(params.substring(lenOffset * 2, lenOffset * 2 + 64), 16);
          const dataStart = offset + 64;
          result[`param${index}`] = `0x${params.substring(dataStart * 2, (dataStart + len) * 2)}`;
          offset += 32 + Math.ceil(len / 32) * 32;
        } else {
          offset += 32;
        }
      } else {
        result[`param${index}`] = `0x${params.substring(offset * 2, (offset + 32) * 2)}`;
        offset += 32;
      }
    });

    return result;
  }

  // Helper: Decode storage value
  private decodeStorageValue(value: string): any {
    if (!value) return { hex: '0x0' };
    
    const bigIntValue = BigInt(value);
    
    return {
      hex: value,
      decimal: bigIntValue.toString(),
      asUint8Array: Array.from(Buffer.from(value.slice(2), 'hex')),
      asAddress: value.slice(2).length === 40 ? `0x${value.slice(2).slice(-40)}` : null,
      asBool: bigIntValue !== 0n
    };
  }

  // Helper: Get RPC URL based on chain ID
  private getRpcUrl(chainId: string): string {
    const chainUrls: Record<string, string> = {
      '1': this.ethereumRpc,
      '5': 'https://goerli.infura.io/v3/public',
      '11155111': 'https://sepolia.infura.io/v3/public',
      '137': 'https://polygon-rpc.com',
      '80001': 'https://rpc-mumbai.maticvigil.com',
      '42161': 'https://arb1.arbitrum.io/rpc',
      '421613': 'https://goerli-rollup.arbitrum.io/rpc',
      '56': 'https://bsc-dataseed.binance.org',
      '97': 'https://data-seed-prebsc-1-s1.binance.org:8545',
      '10': 'https://mainnet.optimism.io',
      '69': 'https://kovan.optimism.io',
      '8453': 'https://mainnet.base.org',
      '84531': 'https://goerli.base.org'
    };
    
    return chainUrls[chainId] || this.ethereumRpc;
  }
}
