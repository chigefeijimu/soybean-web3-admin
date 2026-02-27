import { ref } from 'vue'
import { parseEther, formatEther, parseUnits, formatUnits, type Address, type Hex } from 'viem'

/**
 * Parse ABI JSON string to array
 */
export function parseAbi(abiString: string): any[] {
  try {
    return JSON.parse(abiString)
  } catch {
    return []
  }
}

/**
 * Extract function names from ABI
 */
export function extractFunctions(abi: any[]): any[] {
  return abi.filter(item => item.type === 'function')
}

/**
 * Extract view/pure functions (read-only)
 */
export function extractViewFunctions(abi: any[]): any[] {
  return abi.filter(item => 
    item.type === 'function' && 
    (item.stateMutability === 'view' || item.stateMutability === 'pure')
  )
}

/**
 * Extract non-view functions (write operations)
 */
export function extractWriteFunctions(abi: any[]): any[] {
  return abi.filter(item => 
    item.type === 'function' && 
    item.stateMutability !== 'view' && 
    item.stateMutability !== 'pure'
  )
}

/**
 * Get function signature (function selector)
 */
export function getFunctionSignature(abi: any): string {
  const inputs = abi.inputs?.map((input: any) => input.type).join(',') || ''
  return `${abi.name}(${inputs})`
}

/**
 * Format function for display
 */
export function formatFunctionForDisplay(abi: any): string {
  const inputs = abi.inputs?.map((input: any) => 
    `${input.name ? `${input.name}: ` : ''}${input.type}`
  ).join(', ') || ''
  return `${abi.name}(${inputs})`
}

/**
 * Format function with state mutability
 */
export function formatFunctionWithMutability(abi: any): string {
  const mutability = abi.stateMutability || 'nonpayable'
  const mutabilityIcon = {
    view: '🔒',
    pure: '🔒',
    payable: '💰',
    nonpayable: '📝'
  }[mutability] || '📝'
  
  return `${mutabilityIcon} ${abi.name} (${mutability})`
}

/**
 * Parse parameter input from string
 */
export function parseParameter(value: string, type: string): any {
  if (!value) return undefined
  
  try {
    // Handle different types
    if (type === 'address') {
      return value as Address
    }
    if (type.startsWith('uint') || type.startsWith('int')) {
      const bits = parseInt(type.replace(/[^0-9]/g, '')) || 256
      if (type.startsWith('uint')) {
        return parseUnits(value, bits / 8 * 2)
      }
      return BigInt(value)
    }
    if (type === 'bool') {
      return value === 'true' || value === '1'
    }
    if (type === 'bytes') {
      return value as Hex
    }
    if (type === 'string') {
      return value
    }
    // Default: return as string
    return value
  } catch {
    return value
  }
}

/**
 * Format return value for display
 */
export function formatReturnValue(value: any, type: string): string {
  if (value === null || value === undefined) return 'null'
  
  try {
    if (type.startsWith('uint') || type.startsWith('int')) {
      const bits = parseInt(type.replace(/[^0-9]/g, '')) || 256
      const decimals = bits / 8 * 2
      return formatUnits(value, decimals)
    }
    if (type === 'address') {
      return value as string
    }
    if (type === 'bool') {
      return value ? 'true' : 'false'
    }
    if (Array.isArray(value)) {
      return value.map(v => formatReturnValue(v, type.replace('[]', ''))).join(', ')
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  } catch {
    return String(value)
  }
}

/**
 * Validate contract address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate transaction hash
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

/**
 * Format ETH value for display
 */
export function formatEthValue(value: bigint | string | number): string {
  try {
    const bigIntValue = typeof value === 'bigint' ? value : BigInt(value)
    return formatEther(bigIntValue)
  } catch {
    return '0'
  }
}

/**
 * Parse ETH value from string
 */
export function parseEthValue(value: string): bigint {
  try {
    return parseEther(value)
  } catch {
    return 0n
  }
}
