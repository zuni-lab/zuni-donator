import { splitValidationSchema } from '@/utils/vaults/schema';
import { ProjectENV } from '@env';
import { EAS, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { decodeAbiParameters } from 'viem';
import { create } from 'zustand';

interface IVaultState {
  vaults: Record<string, TVault>;
  loading: boolean;
  addVault: (vault: TVault) => void;
  getVault: (uuid: string) => TVault | undefined;
  fetchVaults: (uuid: string[], registry: SchemaRegistry, eas: EAS) => void;
}

export const useVaultStore = create<IVaultState>((set, get) => ({
  vaults: {},
  loading: false,
  addVault: (vault) => {
    set((state) => {
      return {
        vaults: {
          ...state.vaults,
          [vault.uuid]: vault,
        },
      };
    });
  },
  getVault: (uuid) => {
    return get().vaults[uuid];
  },
  fetchVaults: async (newVaultIds, registry, eas) => {
    try {
      const vaultIds = newVaultIds.filter((id) => !get().vaults[id]);
      if (!vaultIds.length) {
        return;
      }

      const schemaRecord = await registry?.getSchema({
        uid: ProjectENV.NEXT_PUBLIC_VAULT_SCHEMA_UUID,
      });

      if (!schemaRecord || !schemaRecord.schema) {
        throw new Error('Schema not found');
      }

      let abi = splitValidationSchema(schemaRecord.schema).map((tupple) => ({
        type: tupple[0],
        name: tupple[1],
      }));

      console.log('ABI:', abi);
      abi = [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'description',
        },
        {
          type: 'uint256',
          name: 'contributeStart',
        },
        {
          type: 'uint256',
          name: 'contributeEnd',
        },
        {
          type: 'bytes32',
          name: 'validationSchema',
        },
        {
          type: 'uint8[]',
          name: 'operators',
        },
        {
          type: 'bytes[]',
          name: 'thresholds',
        },
        {
          type: 'uint8',
          name: 'claimType',
        },
        // {
        //   type: 'uint256',
        //   name: 'fixedAmount',
        // },
        // {
        //   type: 'uint256',
        //   name: 'percentage',
        // },
        // {
        //   type: 'bytes',
        //   name: 'customData',
        // },
      ];

      const vaults = await Promise.all(
        [vaultIds[0]].map(async (vaultId) => {
          const rsp = await eas.getAttestation(vaultId);
          if (!rsp) {
            throw new Error('Attestation not found');
          }
          const values = decodeAbiParameters(abi, rsp.data as `0x${string}`);
          console.log('Values:', values);
        })
      ).catch((error) => {
        console.error('Error fetching vault:', error);
      });

      console.log('Attestation:', vaults);
    } catch (error) {
      console.error('Error fetching vault:', error);
    }
  },
}));
