import { splitValidationSchema } from '@/utils/vaults/schema';
import { ProjectENV } from '@env';
import { EAS, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { decodeAbiParameters } from 'viem';
import { create } from 'zustand';

interface IVaultState {
  vaults: Record<THexString, TVault>;
  loading: boolean;
  addVault: (vault: TVault) => void;
  getVault: (uuid: THexString) => TVault | undefined;
  fetchVaults: (uuid: THexString[], registry: SchemaRegistry, eas: EAS) => void;
  getComingVaults: (n: number) => TVault[];
  getAllOfVaults: () => TVault[];
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
      set({ loading: true });

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

      const abi = splitValidationSchema(schemaRecord.schema).map((tupple) => ({
        type: tupple[0],
        name: tupple[1],
      }));

      await Promise.all(
        vaultIds.map(async (uid) => {
          const rsp = await eas.getAttestation(uid);
          if (!rsp) {
            throw new Error('Attestation not found');
          }
          const values = decodeAbiParameters(abi, rsp.data as THexString);
          if (values.length !== abi.length) {
            throw new Error('Invalid attestation');
          }

          const validationUID = values[4] as THexString;

          const sr = await registry?.getSchema({ uid: validationUID as string });
          if (!sr || !sr.schema) {
            throw new Error('Schema not found');
          }

          const vault: TVault = {
            uuid: uid,
            name: values[0] as string,
            description: values[1] as string,
            contributeStart: values[2] as bigint,
            contributeEnd: values[3] as bigint,
            validationSchemaUID: validationUID,
            attesters: values[5] as THexString[],
            operators: values[6] as number[],
            thresholds: values[7] as THexString[],
            claimType: values[8] as number,
            fixedAmount: values[9] as bigint,
            percentage: values[10] as bigint,
            customData: values[11] as THexString,
            validationSchema: sr.schema,
          };
          set({
            vaults: {
              ...get().vaults,
              [uid]: vault,
            },
          });

          return vault;
        })
      )
        .catch((error) => {
          console.error('Error fetching vault:', error);
        })
        .finally(() => {
          set({ loading: false });
        });
    } catch (error) {
      console.error('Error fetching vault:', error);
    }
  },
  getComingVaults: (n) => {
    const vaults = Object.values(get().vaults);
    const length = Object.keys(vaults).length;
    if (length === 0) {
      return [];
    }

    if (length <= n) {
      return Object.values(get().vaults);
    }

    const sortedVaults = Object.values(get().vaults).sort(
      (a, b) => Number(b.contributeEnd) - Number(a.contributeEnd)
    );

    return sortedVaults.slice(0, n);
  },
  getAllOfVaults: () => {
    return Object.values(get().vaults).sort(
      (a, b) => Number(b.contributeEnd) - Number(a.contributeEnd)
    );
  },
}));
