import { SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useAlchemyProvider } from './useProvider';

const schemaRegistryCache: { [key: string]: SchemaRegistry } = {};

export const useSchemaRegistry = (address: string) => {
  const provider = useAlchemyProvider();
  const [registry, setRegistry] = useState<SchemaRegistry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRegistry = useCallback(async () => {
    try {
      if (!address) {
        throw new Error('Address not found');
      }

      if (schemaRegistryCache[address]) {
        setRegistry(schemaRegistryCache[address]);
        return;
      }

      const newRegistry = new SchemaRegistry(address);
      if (provider) {
        await newRegistry.connect(provider as unknown as ethers.Signer);
      }

      schemaRegistryCache[address] = newRegistry;
      setRegistry(newRegistry);
    } catch (err) {
      setError(`Failed to load schema registry: ${err}`);
    }
  }, [address, provider]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  return { registry, error };
};
