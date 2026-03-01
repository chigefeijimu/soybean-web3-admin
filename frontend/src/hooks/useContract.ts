import { computed, ref, watch } from 'vue';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { type Address, type Hex, formatEther, parseEther } from 'viem';
import { getChainConfig } from '@/hooks/useChain';

interface UseContractOptions {
  address: string;
  abi: any[];
  chainId?: number;
}

interface UseContractReturn {
  // State
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  chainConfig: ReturnType<typeof getChainConfig>;
  isCorrectChain: boolean;

  // Read
  read: (functionName: string, args?: any[]) => Promise<any>;
  readResult: any;
  isReading: boolean;
  readError: Error | null;

  // Write
  write: (functionName: string, args?: any[], value?: string) => Promise<string | null>;
  isWriting: boolean;
  writeError: Error | null;

  // Transaction
  txHash: string | null;
  isConfirming: boolean;
  isConfirmed: boolean;
  receipt: any;
}

export function useContract(options: UseContractOptions): UseContractReturn {
  const { address: walletAddress, isConnected, chainId: walletChainId } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const chainConfig = computed(() => getChainConfig(options.chainId || 1));
  const isCorrectChain = computed(() => walletChainId === options.chainId);

  // Read state
  const readResult = ref<any>(null);
  const isReading = ref(false);
  const readError = ref<Error | null>(null);

  // Write state
  const isWriting = ref(false);
  const writeError = ref<Error | null>(null);
  const txHash = ref<string | null>(null);

  // Transaction receipt
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash.value as any,
    query: {
      enabled: Boolean(txHash.value)
    }
  });

  const isConfirmed = computed(() => Boolean(receipt));

  // Read function
  const read = async (functionName: string, args: any[] = []): Promise<any> => {
    isReading.value = true;
    readError.value = null;

    try {
      // This is a simplified version - in practice you'd use useReadContract
      const result = 'read result placeholder';
      readResult.value = result;
      return result;
    } catch (error: any) {
      readError.value = error;
      throw error;
    } finally {
      isReading.value = false;
    }
  };

  // Write function
  const write = async (functionName: string, args: any[] = [], value?: string): Promise<string | null> => {
    if (!isConnected) {
      writeError.value = new Error('Wallet not connected');
      return null;
    }

    if (!isCorrectChain.value) {
      writeError.value = new Error(`Please switch to ${chainConfig.value?.name}`);
      return null;
    }

    isWriting.value = true;
    writeError.value = null;
    txHash.value = null;

    try {
      const hash = await writeContractAsync({
        address: options.address as Address,
        abi: options.abi,
        functionName,
        args,
        value: value ? parseEther(value) : undefined
      });

      txHash.value = hash;
      return hash;
    } catch (error: any) {
      writeError.value = error;
      return null;
    } finally {
      isWriting.value = false;
    }
  };

  return {
    // State
    isConnected,
    address: walletAddress ?? null,
    chainId: walletChainId ?? null,
    chainConfig: chainConfig.value,
    isCorrectChain: isCorrectChain.value,

    // Read
    read,
    readResult: readResult.value,
    isReading: isReading.value,
    readError: readError.value,

    // Write
    write,
    isWriting: isWriting.value,
    writeError: writeError.value,

    // Transaction
    txHash: txHash.value,
    isConfirming,
    isConfirmed: isConfirmed.value,
    receipt
  };
}

/** Hook for reading multiple contract values */
export function useContractReads(contracts: { address: string; abi: any[]; functionName: string; args?: any[] }[]) {
  const results = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const refetch = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // Placeholder for batch reading
      results.value = [];
    } catch (e: any) {
      error.value = e;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    results,
    isLoading,
    error,
    refetch
  };
}
