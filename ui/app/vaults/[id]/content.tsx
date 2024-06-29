'use client';

import { VaultActions } from '@/components/vault/VaultActions';
import { VaultAttesters } from '@/components/vault/VaultAttesters';
import { VaultClaim } from '@/components/vault/VaultClaim';
import { VaultProgress } from '@/components/vault/VaultProgress';
import { VaultRules } from '@/components/vault/VaultsRules';
import { useVaultStore } from '@/states/vault';
import { useParams } from 'next/navigation';
import { TableTxs } from './txs';

export const Content: IComponent = () => {
  const param = useParams<{ id: string }>();
  const { getVault } = useVaultStore();
  if (!param) return null;

  const id = param.id;
  const vault = getVault(id as THexString);
  if (!vault) {
    return <>Not Found</>;
  }

  const {
    name,
    description,
    contributeStart,
    contributeEnd,
    validationSchemaUID,
    attesters,
    operators,
    thresholds,
    claimType,
    fixedAmount,
    percentage,
    customData,
    validationSchema,
  } = vault;

  return (
    <section className="flex flex-col gap-12">
      <div className=" glass rounded-xl p-8 flex flex-col gap-4 text-gray-400">
        <div className="w-full flex justify-between gap-4 items-start">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <p className="text-lg">{description}</p>
          </div>
          <VaultActions
            vaultId={id}
            vaultName={name}
            start={Number(contributeStart)}
            end={Number(contributeEnd)}
          />
        </div>
        <hr className="my-4" />
        <div className="flex flex-col gap-4">
          <VaultProgress start={Number(contributeStart)} end={Number(contributeEnd)} />
          <VaultRules
            uid={validationSchemaUID}
            schema={validationSchema}
            operators={operators}
            thresholds={thresholds}
          />
          <VaultAttesters attesters={attesters} />
          <VaultClaim
            claimType={claimType}
            fixedAmount={fixedAmount}
            percentage={percentage}
            customData={customData}
          />
        </div>
      </div>
      <TableTxs />
    </section>
  );
};
