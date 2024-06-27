import { SchemaRegistry, TransactionSigner } from '@ethereum-attestation-service/eas-sdk';
import { create } from 'zustand';

// const ; // Sepolia 0.26
// const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);
// schemaRegistry.connect(provider);

interface ISchemaState {
  registry: null | SchemaRegistry;
  loadSchemaRegistry: (address: string, provider: TransactionSigner) => void;
}

const useSchemaStore = create<ISchemaState>((set, get) => ({
  registry: null,
  loadSchemaRegistry: (address, provider) => {
    if (get().registry) {
      console.warn('Schema registry already loaded');
      return;
    }

    if (!address) throw new Error('Address not found');
    const registry = new SchemaRegistry(address);

    registry.connect(provider);

    set({ registry });
  },
}));

export { useSchemaStore };
