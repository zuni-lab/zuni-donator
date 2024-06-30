import { ProjectENV } from '@env';
import { SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { useEthersProvider } from './useWagmi';

const defaultSchemaRegistryAddress = ProjectENV.NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS;

const schemaRegistryCache: { [chainId: number]: SchemaRegistry } = {};

export const useSchemaRegistry = () => {
  const chainId = useChainId();
  const provider = useEthersProvider({ chainId });
  const [registry, setRegistry] = useState<SchemaRegistry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRegistry = useCallback(async () => {
    try {
      if (schemaRegistryCache[chainId]) {
        setRegistry(schemaRegistryCache[chainId]);
        return;
      }

      const newRegistry = new SchemaRegistry(defaultSchemaRegistryAddress);
      if (provider) {
        await newRegistry.connect(provider as unknown as ethers.Signer);
      }

      schemaRegistryCache[chainId] = newRegistry;
      setRegistry(newRegistry);
    } catch (err) {
      setError(`Failed to load schema registry: ${err}`);
    }
  }, [chainId, provider]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  return { registry, error };
};
