import { ProjectENV } from '@env';
import { SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useAlchemyProvider } from './useProvider';

const defaultSchemaRegistryAddress = ProjectENV.NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS;

const schemaRegistryCache: { [key: string]: SchemaRegistry } = {};
export const useSchemaRegistry = () => {
  const provider = useAlchemyProvider();
  const [registry, setRegistry] = useState<SchemaRegistry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRegistry = useCallback(async () => {
    try {
      if (schemaRegistryCache[defaultSchemaRegistryAddress]) {
        setRegistry(schemaRegistryCache[defaultSchemaRegistryAddress]);
        return;
      }

      const newRegistry = new SchemaRegistry(defaultSchemaRegistryAddress);
      if (provider) {
        await newRegistry.connect(provider as unknown as ethers.Signer);
      }

      schemaRegistryCache[defaultSchemaRegistryAddress] = newRegistry;
      setRegistry(newRegistry);
    } catch (err) {
      setError(`Failed to load schema registry: ${err}`);
    }
  }, [provider]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  return { registry, error };
};
