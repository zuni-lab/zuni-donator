import { useVaultStore } from '@/states/vault';
import { ProjectENV } from '@env';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useEAS } from './useEas';
import { useAlchemyProvider } from './useProvider';
import { useSchemaRegistry } from './useSchemaRegisty';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useListenVaults = (contractAddress: string, contractAbi: any) => {
  const provider = useAlchemyProvider();
  const { registry, error: registryError } = useSchemaRegistry(
    ProjectENV.NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS
  );
  const { eas, error: easError } = useEAS(ProjectENV.NEXT_PUBLIC_EAS_ADDRESS);

  const { fetchVaults } = useVaultStore();
  const [vaultIds, setVaultIds] = useState<THexString[]>([]);

  const fetchPastEvents = useCallback(
    async (provider: ethers.WebSocketProvider) => {
      try {
        if (!provider) {
          return;
        }
        const iface = new ethers.Interface(contractAbi);
        if (!iface) {
          throw new Error('Interface not found');
        }
        const eventTopic = iface.getEvent('CreateVault')?.topicHash;
        if (!eventTopic) {
          throw new Error('Event topic not found');
        }

        const filter = {
          fromBlock: '0x0',
          toBlock: 'latest',
          address: contractAddress,
          topics: [eventTopic],
        };

        const pastEvents = await provider.getLogs(filter);

        const pastVaultIds = pastEvents.map((log) => {
          const parsedLog = iface.parseLog(log);
          if (!parsedLog) {
            throw new Error('Error parsing log');
          }
          return parsedLog.args.vaultId;
        });

        setVaultIds((prev) => [...new Set([...prev, ...pastVaultIds])]);
      } catch (error) {
        console.error('Error fetching past events:', error);
      }
    },
    [contractAddress, contractAbi, setVaultIds]
  );

  const handleCreateVaultEvent = useCallback((vaultId: THexString) => {
    setVaultIds((prev) => [...new Set([...prev, vaultId])]);
  }, []);

  useEffect(() => {
    if (!provider) {
      return;
    }
    fetchPastEvents(provider);

    const contract = new ethers.Contract(contractAddress, contractAbi, provider);
    contract.on('CreateVault', handleCreateVaultEvent);
    return () => {
      contract.off('CreateVault', handleCreateVaultEvent);
      provider.removeAllListeners();
    };
  }, [contractAddress, contractAbi, provider, fetchPastEvents, handleCreateVaultEvent]);

  useEffect(() => {
    if (registryError || easError) {
      console.error('Error:', registryError || easError);
      return;
    }
    if (!registry || !eas) {
      return;
    }
    if (vaultIds.length === 0) {
      return;
    }

    fetchVaults(vaultIds, registry, eas);
  }, [registry, eas, registryError, easError, vaultIds, fetchVaults]);

  return {
    ids: vaultIds,
  };
};
