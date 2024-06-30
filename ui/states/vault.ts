import { splitValidationSchema } from '@/utils/vaults/schema';
import { ProjectENV } from '@env';
import { EAS, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { decodeAbiParameters } from 'viem';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IVaultState {
  vaults: Record<number, Record<THexString, TVault>>; // Nest vaults under chainId
  schema: Record<THexString, string>;
  loading: boolean;
  getVault: (chainId: number, uuid: THexString) => TVault | undefined;
  fetchVaults: (
    chainId: number,
    uuid: THexString[],
    registry: SchemaRegistry | null,
    eas: EAS | null
  ) => void;
  getComingVaults: (chainId: number, n: number) => TVault[];
  getAllOfVaults: (chainId: number) => TVault[];
}

export const useVaultStore = create<IVaultState>()(
  persist(
    (set, get) => ({
      vaults: {},
      schema: {},
      loading: false,
      getVault: (chainId, uuid) => {
        const vault = get().vaults[chainId]?.[uuid];
        return vault ? deserializeVault(vault) : undefined;
      },
      fetchVaults: async (chainId, newVaultIds, registry, eas) => {
        try {
          set({ loading: true });

          const vaultIds = newVaultIds.filter((id) => !get().vaults[chainId]?.[id]);

          if (!vaultIds.length) {
            return;
          }

          if (!registry) {
            throw new Error('Schema registry not found');
          }

          if (!eas) {
            throw new Error('EAS not found');
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
                time: rsp.time,
              };

              set((state) => ({
                vaults: {
                  ...state.vaults,
                  [chainId]: {
                    ...state.vaults[chainId],
                    [uid]: serializeVault(vault),
                  },
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
      getComingVaults: (chainId, n) => {
        const vaults = Object.values(get().vaults[chainId] || {}).map(deserializeVault);
        const length = Object.keys(vaults).length;
        if (length === 0) {
          return [];
        }

        if (length <= n) {
          return vaults;
        }

        const sortedVaults = vaults.sort(
          (a, b) => Number(b.contributeEnd) - Number(a.contributeEnd)
        );

        return sortedVaults.slice(0, n);
      },
      getAllOfVaults: (chainId) => {
        const vaults = Object.values(get().vaults[chainId] || {}).map(deserializeVault);
        return vaults.sort((a, b) => Number(b.time) - Number(a.time));
      },
    }),
    {
      name: 'vaults-storage',
      partialize: (state) => ({ vaults: state.vaults, schema: state.schema }),
    }
  )
);

const serializeVault = (vault: TVault) => ({
  ...vault,
  contributeStart: vault.contributeStart.toString(),
  contributeEnd: vault.contributeEnd.toString(),
  fixedAmount: vault.fixedAmount.toString(),
  percentage: vault.percentage.toString(),
  time: vault.time.toString(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deserializeVault = (vault: any): TVault => ({
  ...vault,
  contributeStart: BigInt(vault.contributeStart),
  contributeEnd: BigInt(vault.contributeEnd),
  fixedAmount: BigInt(vault.fixedAmount),
  percentage: BigInt(vault.percentage),
  time: BigInt(vault.time || 0),
});
