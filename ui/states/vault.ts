import { splitValidationSchema } from '@/utils/vaults/schema';
import { ProjectENV } from '@env';
import { EAS, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { decodeAbiParameters } from 'viem';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IVaultState {
  vaults: Record<THexString, TVault>;
  schema: Record<THexString, string>;
  loading: boolean;
  addVault: (vault: TVault) => void;
  getVault: (uuid: THexString) => TVault | undefined;
  fetchVaults: (uuid: THexString[], registry: SchemaRegistry, eas: EAS) => void;
  getComingVaults: (n: number) => TVault[];
  getAllOfVaults: () => TVault[];
}

export const useVaultStore = create<IVaultState>()(
  persist(
    (set, get) => ({
      vaults: {},
      loading: false,
      schema: {},
      addVault: (vault) => {
        const serializedVault = serializeVault(vault);
        set((state) => ({
          vaults: {
            ...state.vaults,
            [vault.uuid]: serializedVault,
          },
        }));
      },
      getVault: (uuid) => {
        const vault = get().vaults[uuid];
        return vault ? deserializeVault(vault) : undefined;
      },
      fetchVaults: async (newVaultIds, registry, eas) => {
        try {
          set({ loading: true });

          const vaultIds = newVaultIds.filter((id) => !get().vaults[id]);
          if (!vaultIds.length) {
            return;
          }

          if (!get().schema[ProjectENV.NEXT_PUBLIC_VAULT_SCHEMA_UUID as THexString]) {
            const schemaRecord = await registry?.getSchema({
              uid: ProjectENV.NEXT_PUBLIC_VAULT_SCHEMA_UUID,
            });

            if (!schemaRecord || !schemaRecord.schema) {
              throw new Error('Schema not found');
            }

            set((state) => ({
              schema: {
                ...state.schema,
                [ProjectENV.NEXT_PUBLIC_VAULT_SCHEMA_UUID as THexString]: schemaRecord.schema,
              },
            }));
          }

          const abi = splitValidationSchema(
            get().schema[ProjectENV.NEXT_PUBLIC_VAULT_SCHEMA_UUID as THexString]
          ).map((tupple) => ({
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
                contributeStart: (values[2] as bigint) * 1000n,
                contributeEnd: (values[3] as bigint) * 1000n,
                validationSchemaUID: validationUID,
                attesters: values[5] as THexString[],
                operators: values[6] as number[],
                thresholds: values[7] as THexString[],
                claimType: values[8] as number,
                fixedAmount: values[9] as bigint,
                percentage: values[10] as bigint,
                customData: values[11] as THexString,
                validationSchema: sr.schema,
                time: rsp.time,
              };
              set((state) => ({
                vaults: {
                  ...state.vaults,
                  [uid]: serializeVault(vault),
                },
              }));

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
        const vaults = Object.values(get().vaults).map(deserializeVault);
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
        const vaults = Object.values(get().vaults).map(deserializeVault);
        return vaults.sort((a, b) => Number(b.time) - Number(a.time));
      },
    }),
    {
      name: 'vaults-storage',
      partialize: (state) => ({ vaults: state.vaults, schema: state.schema }),
      skipHydration: true,
    }
  )
);

const serializeVault = (vault: TVault) => ({
  ...vault,
  contributeStart: vault.contributeStart.toString(),
  contributeEnd: vault.contributeEnd.toString(),
  fixedAmount: vault.fixedAmount.toString(),
  percentage: vault.percentage.toString(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deserializeVault = (vault: any): TVault => ({
  ...vault,
  contributeStart: BigInt(vault.contributeStart),
  contributeEnd: BigInt(vault.contributeEnd),
  fixedAmount: BigInt(vault.fixedAmount),
  percentage: BigInt(vault.percentage),
});
