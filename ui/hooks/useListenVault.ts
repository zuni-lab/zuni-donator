import { SMART_VAULT_ABI } from '@/constants/abi';
import { useVaultStore } from '@/states/vault';
import { wagmiConfig } from '@/utils/wagmi';
import { ProjectENV } from '@env';
import { useCallback, useEffect } from 'react';
import { useChainId, usePublicClient } from 'wagmi';
import { useEAS } from './useEas';
import { useSchemaRegistry } from './useSchemaRegisty';
import { useEthersProvider } from './useWagmi';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useListenVaults = () => {
  const chainId = useChainId();
  const provider = useEthersProvider({ chainId });
  const { registry } = useSchemaRegistry();
  const { eas } = useEAS();
  const publicClient = usePublicClient({ config: wagmiConfig });
  const { fetchVaults } = useVaultStore();

  const fetchPastEvents = useCallback(async () => {
    try {
      const events = await publicClient.getContractEvents({
        address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as THexString,
        abi: SMART_VAULT_ABI,
        eventName: 'CreateVault',
        fromBlock: 11908090n,
      });

      if (!registry || !eas) {
        return;
      }

      if (events.length === 0) {
        return;
      }

      const vaultIds: THexString[] = [];
      events.forEach((event) => {
        if (event.args?.vaultId) {
          vaultIds.push(event.args.vaultId);
        }
      });
      fetchVaults(vaultIds, registry, eas);
    } catch (error) {
      console.error('Error fetching past events:', error);
    }
  }, [publicClient, fetchVaults, registry, eas]);

  useEffect(() => {
    fetchPastEvents();
  }, [provider, fetchPastEvents]);
};
