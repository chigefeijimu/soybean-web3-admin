import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

interface ContractMethod {
  name: string;
  signature: string;
  description: string;
  category: string;
  params: {
    name: string;
    type: string;
    description: string;
  }[];
  example: Record<string, string>;
}

interface MethodCategory {
  id: string;
  name: string;
  description: string;
  methods: ContractMethod[];
}

@ApiTags('Contract Method Selector')
@Controller('web3/contract-methods')
export class ContractMethodSelectorController {
  
  @Get('categories')
  @ApiOperation({ summary: 'Get all method categories' })
  getCategories(): MethodCategory[] {
    return this.getAllCategories();
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'Get methods by category' })
  @ApiQuery({ name: 'id', required: false })
  getCategoryById(@Query('id') id: string): MethodCategory | MethodCategory[] | null {
    if (id) {
      return this.getAllCategories().find(c => c.id === id) || null;
    }
    return this.getAllCategories();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search methods by keyword' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  searchMethods(@Query('q') query: string): ContractMethod[] {
    const lowerQuery = query.toLowerCase();
    const methods: ContractMethod[] = [];
    
    for (const category of this.getAllCategories()) {
      for (const method of category.methods) {
        if (
          method.name.toLowerCase().includes(lowerQuery) ||
          method.signature.toLowerCase().includes(lowerQuery) ||
          method.description.toLowerCase().includes(lowerQuery)
        ) {
          methods.push(method);
        }
      }
    }
    
    return methods;
  }

  @Get('encode')
  @ApiOperation({ summary: 'Encode method parameters' })
  @ApiQuery({ name: 'signature', required: true, description: 'Function signature' })
  @ApiQuery({ name: 'params', required: true, description: 'Comma-separated parameters' })
  encodeParams(
    @Query('signature') signature: string,
    @Query('params') params: string
  ): { signature: string; calldata: string; error?: string } {
    try {
      const paramList = params.split(',').map(p => p.trim()).filter(p => p);
      
      // Basic encoding - for demonstration
      // In production, use ethers.js or web3.js
      const funcSelector = this.getFunctionSelector(signature);
      const encodedParams = this.encodeParameters(paramList);
      
      return {
        signature,
        calldata: funcSelector + encodedParams
      };
    } catch (error) {
      return {
        signature,
        calldata: '',
        error: error.message
      };
    }
  }

  @Get('decode')
  @ApiOperation({ summary: 'Decode calldata' })
  @ApiQuery({ name: 'calldata', required: true, description: 'Calldata to decode' })
  decodeCalldata(@Query('calldata') calldata: string): {
    functionSelector: string;
    matchedMethod?: ContractMethod;
    parameters?: Record<string, string>;
    error?: string;
  } {
    if (!calldata || calldata.length < 10) {
      return {
        functionSelector: '',
        error: 'Invalid calldata'
      };
    }

    const selector = calldata.substring(0, 10);
    const method = this.findMethodBySelector(selector);

    return {
      functionSelector: selector,
      matchedMethod: method,
      parameters: method ? { note: 'Decoding not implemented in demo' } : undefined
    };
  }

  private getFunctionSelector(signature: string): string {
    // Keccak256 hash of function signature (first 4 bytes)
    // This is a simplified version
    const hash = this.keccak256(signature);
    return '0x' + hash.substring(0, 8);
  }

  private keccak256(str: string): string {
    // Simplified keccak256 for demonstration
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += Math.floor(Math.random() * 16).toString(16);
    }
    // In production, use proper keccak256
    return hash;
  }

  private encodeParameters(params: string[]): string {
    // Pad each parameter to 32 bytes (64 chars)
    return params.map(p => {
      // If it's an address (40 hex chars + 0x)
      if (p.startsWith('0x') && p.length === 42) {
        return p.substring(2).padStart(64, '0');
      }
      // If it's a number
      if (/^\d+$/.test(p)) {
        return BigInt(p).toString(16).padStart(64, '0');
      }
      // String - pad to 32 bytes
      const hex = Buffer.from(p).toString('hex');
      return hex.padStart(64, '0');
    }).join('');
  }

  private findMethodBySelector(selector: string): ContractMethod | undefined {
    for (const category of this.getAllCategories()) {
      for (const method of category.methods) {
        if (method.signature.startsWith(selector.replace('0x', '').substring(0, 8))) {
          return method;
        }
      }
    }
    return undefined;
  }

  private getAllCategories(): MethodCategory[] {
    return [
      {
        id: 'erc20',
        name: 'ERC20 Token',
        description: 'Common ERC20 token methods',
        methods: [
          {
            name: 'transfer',
            signature: 'transfer(address to, uint256 amount)',
            description: 'Transfer tokens to another address',
            category: 'ERC20',
            params: [
              { name: 'to', type: 'address', description: 'Recipient address' },
              { name: 'amount', type: 'uint256', description: 'Amount to transfer (in wei)' }
            ],
            example: { to: '0x1234567890123456789012345678901234567890', amount: '1000000000000000000' }
          },
          {
            name: 'transferFrom',
            signature: 'transferFrom(address from, address to, uint256 amount)',
            description: 'Transfer tokens from one address to another (requires approval)',
            category: 'ERC20',
            params: [
              { name: 'from', type: 'address', description: 'Source address' },
              { name: 'to', type: 'address', description: 'Recipient address' },
              { name: 'amount', type: 'uint256', description: 'Amount to transfer' }
            ],
            example: { from: '0x...', to: '0x...', amount: '1000000' }
          },
          {
            name: 'approve',
            signature: 'approve(address spender, uint256 amount)',
            description: 'Approve a spender to use your tokens',
            category: 'ERC20',
            params: [
              { name: 'spender', type: 'address', description: 'Spender address' },
              { name: 'amount', type: 'uint256', description: 'Allowance amount (use max for unlimited)' }
            ],
            example: { spender: '0x...', amount: '115792089237316195423570985008687907853269984665640564039457584007913129639935' }
          },
          {
            name: 'increaseAllowance',
            signature: 'increaseAllowance(address spender, uint256 addedValue)',
            description: 'Increase the allowance for a spender',
            category: 'ERC20',
            params: [
              { name: 'spender', type: 'address', description: 'Spender address' },
              { name: 'addedValue', type: 'uint256', description: 'Amount to add' }
            ],
            example: { spender: '0x...', addedValue: '1000000' }
          },
          {
            name: 'decreaseAllowance',
            signature: 'decreaseAllowance(address spender, uint256 subtractedValue)',
            description: 'Decrease the allowance for a spender',
            category: 'ERC20',
            params: [
              { name: 'spender', type: 'address', description: 'Spender address' },
              { name: 'subtractedValue', type: 'uint256', description: 'Amount to subtract' }
            ],
            example: { spender: '0x...', subtractedValue: '1000000' }
          },
          {
            name: 'mint',
            signature: 'mint(address to, uint256 amount)',
            description: 'Mint new tokens (requires minter role)',
            category: 'ERC20',
            params: [
              { name: 'to', type: 'address', description: 'Recipient address' },
              { name: 'amount', type: 'uint256', description: 'Amount to mint' }
            ],
            example: { to: '0x...', amount: '1000000' }
          },
          {
            name: 'burn',
            signature: 'burn(uint256 amount)',
            description: 'Burn tokens from caller balance',
            category: 'ERC20',
            params: [
              { name: 'amount', type: 'uint256', description: 'Amount to burn' }
            ],
            example: { amount: '1000000' }
          }
        ]
      },
      {
        id: 'erc721',
        name: 'ERC721 NFT',
        description: 'Common ERC721 NFT methods',
        methods: [
          {
            name: 'transferFrom',
            signature: 'transferFrom(address from, address to, uint256 tokenId)',
            description: 'Transfer an NFT from one address to another',
            category: 'ERC721',
            params: [
              { name: 'from', type: 'address', description: 'Current owner' },
              { name: 'to', type: 'address', description: 'New owner' },
              { name: 'tokenId', type: 'uint256', description: 'Token ID to transfer' }
            ],
            example: { from: '0x...', to: '0x...', tokenId: '1' }
          },
          {
            name: 'safeTransferFrom',
            signature: 'safeTransferFrom(address from, address to, uint256 tokenId)',
            description: 'Safely transfer an NFT with receiver check',
            category: 'ERC721',
            params: [
              { name: 'from', type: 'address', description: 'Current owner' },
              { name: 'to', type: 'address', description: 'New owner' },
              { name: 'tokenId', type: 'uint256', description: 'Token ID' }
            ],
            example: { from: '0x...', to: '0x...', tokenId: '1' }
          },
          {
            name: 'approve',
            signature: 'approve(address to, uint256 tokenId)',
            description: 'Approve an address to transfer a specific NFT',
            category: 'ERC721',
            params: [
              { name: 'to', type: 'address', description: 'Approved address' },
              { name: 'tokenId', type: 'uint256', description: 'Token ID' }
            ],
            example: { to: '0x...', tokenId: '1' }
          },
          {
            name: 'setApprovalForAll',
            signature: 'setApprovalForAll(address operator, bool approved)',
            description: 'Approve an operator to transfer all NFTs',
            category: 'ERC721',
            params: [
              { name: 'operator', type: 'address', description: 'Operator address' },
              { name: 'approved', type: 'bool', description: 'Approval status' }
            ],
            example: { operator: '0x...', approved: 'true' }
          },
          {
            name: 'mint',
            signature: 'mint(address to, uint256 tokenId)',
            description: 'Mint a new NFT (requires minter role)',
            category: 'ERC721',
            params: [
              { name: 'to', type: 'address', description: 'Recipient address' },
              { name: 'tokenId', type: 'uint256', description: 'Token ID' }
            ],
            example: { to: '0x...', tokenId: '1' }
          },
          {
            name: 'burn',
            signature: 'burn(uint256 tokenId)',
            description: 'Burn an NFT',
            category: 'ERC721',
            params: [
              { name: 'tokenId', type: 'uint256', description: 'Token ID to burn' }
            ],
            example: { tokenId: '1' }
          }
        ]
      },
      {
        id: 'erc1155',
        name: 'ERC1155 Multi-Token',
        description: 'Common ERC1155 multi-token methods',
        methods: [
          {
            name: 'safeTransferFrom',
            signature: 'safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
            description: 'Safely transfer multiple tokens of the same type',
            category: 'ERC1155',
            params: [
              { name: 'from', type: 'address', description: 'Current owner' },
              { name: 'to', type: 'address', description: 'New owner' },
              { name: 'id', type: 'uint256', description: 'Token ID' },
              { name: 'amount', type: 'uint256', description: 'Amount' },
              { name: 'data', type: 'bytes', description: 'Additional data' }
            ],
            example: { from: '0x...', to: '0x...', id: '1', amount: '10', data: '0x' }
          },
          {
            name: 'safeBatchTransferFrom',
            signature: 'safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
            description: 'Safely transfer multiple token types',
            category: 'ERC1155',
            params: [
              { name: 'from', type: 'address', description: 'Current owner' },
              { name: 'to', type: 'address', description: 'New owner' },
              { name: 'ids', type: 'uint256[]', description: 'Token IDs' },
              { name: 'amounts', type: 'uint256[]', description: 'Amounts' },
              { name: 'data', type: 'bytes', description: 'Additional data' }
            ],
            example: { from: '0x...', to: '0x...', ids: '[1,2,3]', amounts: '[10,20,30]', data: '0x' }
          },
          {
            name: 'mint',
            signature: 'mint(address account, uint256 id, uint256 amount, bytes data)',
            description: 'Mint new tokens',
            category: 'ERC1155',
            params: [
              { name: 'account', type: 'address', description: 'Recipient' },
              { name: 'id', type: 'uint256', description: 'Token ID' },
              { name: 'amount', type: 'uint256', description: 'Amount' },
              { name: 'data', type: 'bytes', description: 'Additional data' }
            ],
            example: { account: '0x...', id: '1', amount: '100', data: '0x' }
          }
        ]
      },
      {
        id: 'uniswap',
        name: 'Uniswap/Sushiswap',
        description: 'DEX swap and liquidity methods',
        methods: [
          {
            name: 'exactInputSingle',
            signature: 'exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96))',
            description: 'Swap exact amount of tokens for tokens (single hop)',
            category: 'Uniswap V3',
            params: [
              { name: 'tokenIn', type: 'address', description: 'Input token address' },
              { name: 'tokenOut', type: 'address', description: 'Output token address' },
              { name: 'fee', type: 'uint24', description: 'Pool fee (3000 = 0.3%, 500 = 0.05%, 10000 = 1%)' },
              { name: 'recipient', type: 'address', description: 'Recipient address' },
              { name: 'deadline', type: 'uint256', description: 'Deadline timestamp' },
              { name: 'amountIn', type: 'uint256', description: 'Amount of input tokens' },
              { name: 'amountOutMinimum', type: 'uint256', description: 'Minimum output (slippage protection)' },
              { name: 'sqrtPriceLimitX96', type: 'uint160', description: 'Price limit (0 for no limit)' }
            ],
            example: { tokenIn: '0x...', tokenOut: '0x...', fee: '3000', recipient: '0x...', deadline: '1234567890', amountIn: '1000000', amountOutMinimum: '900000', sqrtPriceLimitX96: '0' }
          },
          {
            name: 'exactInput',
            signature: 'exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum))',
            description: 'Swap exact amount of tokens for tokens (multi-hop)',
            category: 'Uniswap V3',
            params: [
              { name: 'path', type: 'bytes', description: 'Encoded path (tokenA, fee, tokenB, ...)' },
              { name: 'recipient', type: 'address', description: 'Recipient address' },
              { name: 'deadline', type: 'uint256', description: 'Deadline timestamp' },
              { name: 'amountIn', type: 'uint256', description: 'Amount of input tokens' },
              { name: 'amountOutMinimum', type: 'uint256', description: 'Minimum output' }
            ],
            example: { path: '0x...', recipient: '0x...', deadline: '1234567890', amountIn: '1000000', amountOutMinimum: '900000' }
          },
          {
            name: 'exactOutputSingle',
            signature: 'exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96))',
            description: 'Swap for exact amount of output tokens (single hop)',
            category: 'Uniswap V3',
            params: [
              { name: 'tokenIn', type: 'address', description: 'Input token address' },
              { name: 'tokenOut', type: 'address', description: 'Output token address' },
              { name: 'fee', type: 'uint24', description: 'Pool fee' },
              { name: 'recipient', type: 'address', description: 'Recipient' },
              { name: 'deadline', type: 'uint256', description: 'Deadline' },
              { name: 'amountOut', type: 'uint256', description: 'Desired output amount' },
              { name: 'amountInMaximum', type: 'uint256', description: 'Max input' },
              { name: 'sqrtPriceLimitX96', type: 'uint160', description: 'Price limit' }
            ],
            example: { tokenIn: '0x...', tokenOut: '0x...', fee: '3000', recipient: '0x...', deadline: '1234567890', amountOut: '1000000', amountInMaximum: '1100000', sqrtPriceLimitX96: '0' }
          },
          {
            name: 'swapExactETHForTokens',
            signature: 'swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline)',
            description: 'Swap exact ETH for tokens (Uniswap V2)',
            category: 'Uniswap V2',
            params: [
              { name: 'amountOutMin', type: 'uint256', description: 'Minimum tokens received' },
              { name: 'path', type: 'address[]', description: 'Token path (WETH -> token)' },
              { name: 'to', type: 'address', description: 'Recipient' },
              { name: 'deadline', type: 'uint256', description: 'Deadline' }
            ],
            example: { amountOutMin: '1000000', path: '[WETH, TOKEN]', to: '0x...', deadline: '1234567890' }
          },
          {
            name: 'swapExactTokensForETH',
            signature: 'swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)',
            description: 'Swap exact tokens for ETH (Uniswap V2)',
            category: 'Uniswap V2',
            params: [
              { name: 'amountIn', type: 'uint256', description: 'Amount of input tokens' },
              { name: 'amountOutMin', type: 'uint256', description: 'Minimum ETH received' },
              { name: 'path', type: 'address[]', description: 'Token path' },
              { name: 'to', type: 'address', description: 'Recipient' },
              { name: 'deadline', type: 'uint256', description: 'Deadline' }
            ],
            example: { amountIn: '1000000', amountOutMin: '900000', path: '[TOKEN, WETH]', to: '0x...', deadline: '1234567890' }
          },
          {
            name: 'addLiquidity',
            signature: 'addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline)',
            description: 'Add liquidity to a token pair (Uniswap V2)',
            category: 'Uniswap V2',
            params: [
              { name: 'tokenA', type: 'address', description: 'Token A address' },
              { name: 'tokenB', type: 'address', description: 'Token B address' },
              { name: 'amountADesired', type: 'uint256', description: 'Desired amount A' },
              { name: 'amountBDesired', type: 'uint256', description: 'Desired amount B' },
              { name: 'amountAMin', type: 'uint256', description: 'Minimum amount A' },
              { name: 'amountBMin', type: 'uint256', description: 'Minimum amount B' },
              { name: 'to', type: 'address', description: 'Recipient' },
              { name: 'deadline', type: 'uint256', description: 'Deadline' }
            ],
            example: { tokenA: '0x...', tokenB: '0x...', amountADesired: '1000000', amountBDesired: '2000000', amountAMin: '900000', amountBMin: '1800000', to: '0x...', deadline: '1234567890' }
          }
        ]
      },
      {
        id: 'aave',
        name: 'Aave Lending',
        description: 'Aave lending pool methods',
        methods: [
          {
            name: 'supply',
            signature: 'supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
            description: 'Supply tokens to Aave pool',
            category: 'Aave V3',
            params: [
              { name: 'asset', type: 'address', description: 'Token to supply' },
              { name: 'amount', type: 'uint256', description: 'Amount to supply' },
              { name: 'onBehalfOf', type: 'address', description: 'On behalf of address' },
              { name: 'referralCode', type: 'uint16', description: 'Referral code (0 for none)' }
            ],
            example: { asset: '0x...', amount: '1000000', onBehalfOf: '0x...', referralCode: '0' }
          },
          {
            name: 'withdraw',
            signature: 'withdraw(address asset, uint256 amount, address to)',
            description: 'Withdraw supplied tokens from Aave',
            category: 'Aave V3',
            params: [
              { name: 'asset', type: 'address', description: 'Token to withdraw' },
              { name: 'amount', type: 'uint256', description: 'Amount to withdraw (use max for all)' },
              { name: 'to', type: 'address', description: 'Recipient address' }
            ],
            example: { asset: '0x...', amount: '1000000', to: '0x...' }
          },
          {
            name: 'borrow',
            signature: 'borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
            description: 'Borrow tokens from Aave pool',
            category: 'Aave V3',
            params: [
              { name: 'asset', type: 'address', description: 'Token to borrow' },
              { name: 'amount', type: 'uint256', description: 'Amount to borrow' },
              { name: 'interestRateMode', type: 'uint256', description: '1 = stable, 2 = variable' },
              { name: 'referralCode', type: 'uint16', description: 'Referral code' },
              { name: 'onBehalfOf', type: 'address', description: 'On behalf of' }
            ],
            example: { asset: '0x...', amount: '1000000', interestRateMode: '2', referralCode: '0', onBehalfOf: '0x...' }
          },
          {
            name: 'repay',
            signature: 'repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf)',
            description: 'Repay borrowed tokens',
            category: 'Aave V3',
            params: [
              { name: 'asset', type: 'address', description: 'Token to repay' },
              { name: 'amount', type: 'uint256', description: 'Amount to repay' },
              { name: 'rateMode', type: 'uint256', description: '1 = stable, 2 = variable' },
              { name: 'onBehalfOf', type: 'address', description: 'On behalf of' }
            ],
            example: { asset: '0x...', amount: '1000000', rateMode: '2', onBehalfOf: '0x...' }
          },
          {
            name: 'setUserUseReserveAsCollateral',
            signature: 'setUserUseReserveAsCollateral(address asset, bool useAsCollateral)',
            description: 'Enable/disable asset as collateral',
            category: 'Aave V3',
            params: [
              { name: 'asset', type: 'address', description: 'Token address' },
              { name: 'useAsCollateral', type: 'bool', description: 'Use as collateral' }
            ],
            example: { asset: '0x...', useAsCollateral: 'true' }
          }
        ]
      },
      {
        id: 'multisig',
        name: 'Multi-Sig Wallet',
        description: 'Multi-signature wallet methods',
        methods: [
          {
            name: 'confirmTransaction',
            signature: 'confirmTransaction(uint256 transactionId)',
            description: 'Confirm a transaction',
            category: 'Gnosis Safe',
            params: [
              { name: 'transactionId', type: 'uint256', description: 'Transaction ID' }
            ],
            example: { transactionId: '1' }
          },
          {
            name: 'executeTransaction',
            signature: 'executeTransaction(uint256 transactionId)',
            description: 'Execute a confirmed transaction',
            category: 'Gnosis Safe',
            params: [
              { name: 'transactionId', type: 'uint256', description: 'Transaction ID' }
            ],
            example: { transactionId: '1' }
          },
          {
            name: 'revokeConfirmation',
            signature: 'revokeConfirmation(uint256 transactionId)',
            description: 'Revoke your confirmation',
            category: 'Gnosis Safe',
            params: [
              { name: 'transactionId', type: 'uint256', description: 'Transaction ID' }
            ],
            example: { transactionId: '1' }
          },
          {
            name: 'submitTransaction',
            signature: 'submitTransaction(address destination, uint256 value, bytes data)',
            description: 'Submit a new transaction for confirmation',
            category: 'Gnosis Safe',
            params: [
              { name: 'destination', type: 'address', description: 'Target contract' },
              { name: 'value', type: 'uint256', description: 'ETH value (wei)' },
              { name: 'data', type: 'bytes', description: 'Transaction data' }
            ],
            example: { destination: '0x...', value: '0', data: '0x...' }
          }
        ]
      },
      {
        id: 'common',
        name: 'Common Contracts',
        description: 'Common smart contract interactions',
        methods: [
          {
            name: 'sendETH',
            signature: 'transfer(address to, uint256 amount)',
            description: 'Send ETH (call with empty data)',
            category: 'Wallet',
            params: [
              { name: 'to', type: 'address', description: 'Recipient address' },
              { name: 'amount', type: 'uint256', description: 'Amount in wei' }
            ],
            example: { to: '0x...', amount: '1000000000000000000' }
          },
          {
            name: 'createTask',
            signature: 'createTask(bytes32 taskId, address executor, bytes data)',
            description: 'Create an automation task (example)',
            category: 'Automation',
            params: [
              { name: 'taskId', type: 'bytes32', description: 'Task ID' },
              { name: 'executor', type: 'address', description: 'Executor address' },
              { name: 'data', type: 'bytes', description: 'Task data' }
            ],
            example: { taskId: '0x...', executor: '0x...', data: '0x...' }
          },
          {
            name: 'setData',
            signature: 'setData(bytes32 key, bytes value)',
            description: 'Set contract storage data',
            category: 'Storage',
            params: [
              { name: 'key', type: 'bytes32', description: 'Storage key' },
              { name: 'value', type: 'bytes', description: 'Storage value' }
            ],
            example: { key: '0x...', value: '0x...' }
          },
          {
            name: 'registerENS',
            signature: 'register(bytes32 label, address owner, uint256 duration)',
            description: 'Register an ENS name',
            category: 'ENS',
            params: [
              { name: 'label', type: 'bytes32', description: 'Label hash' },
              { name: 'owner', type: 'address', description: 'Owner address' },
              { name: 'duration', type: 'uint256', description: 'Duration in seconds' }
            ],
            example: { label: '0x...', owner: '0x...', duration: '31536000' }
          }
        ]
      }
    ];
  }
}
