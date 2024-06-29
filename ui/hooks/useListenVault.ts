import { useVaultStore } from '@/states/vault';
import { ethers } from 'ethers';
import { useCallback, useEffect } from 'react';
import { useEAS } from './useEas';
import { useAlchemyProvider } from './useProvider';
import { useSchemaRegistry } from './useSchemaRegisty';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useListenVaults = (contractAddress: string, contractAbi: any) => {
  const provider = useAlchemyProvider();
  const { registry, error: registryError } = useSchemaRegistry();
  const { eas, error: easError } = useEAS();
  const { fetchVaults } = useVaultStore();

  const fetchPastEvents = useCallback(async () => {
    try {
      if (!provider) {
        return;
      }
      if (registryError || easError) {
        console.error('Error:', registryError || easError);
        return;
      }
      if (!registry || !eas) {
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

      fetchVaults(pastVaultIds, registry, eas);
    } catch (error) {
      console.error('Error fetching past events:', error);
    }
  }, [contractAddress, contractAbi, provider, registry, eas, fetchVaults, registryError, easError]);

  useEffect(() => {
    fetchPastEvents();
    return () => {
      provider.removeAllListeners();
    };
  }, [provider, fetchPastEvents]);
};
