import { SMART_VAULT_ABI } from '@/constants/abi';
import { ProjectENV } from '@env';
import { useReadContract } from 'wagmi';

export const useVaultContract = (id: THexString, contributeEnd: bigint, now: number) => {
  const { data: vaultRaised, queryKey: vaultRaisedQueryKey } = useReadContract({
    address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as THexString,
    abi: SMART_VAULT_ABI,
    scopeKey: 'vaultRaised',
    functionName: 'vaultRaised',
    args: [id as THexString],
  });

  const { data: vaultBalance, queryKey: vaultBalanceQueryKey } = useReadContract({
    address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as THexString,
    abi: SMART_VAULT_ABI,
    scopeKey: 'vaultBalance',
    functionName: 'vaultBalance',
    args: [id as THexString],
    query: {
      enabled: now > Number(contributeEnd),
    },
  });

  return {
    vaultRaised,
    vaultRaisedQueryKey,
    vaultBalance,
    vaultBalanceQueryKey,
  };
};
