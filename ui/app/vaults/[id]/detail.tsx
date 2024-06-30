'use client';

import { Progress } from '@/components/shadcn/Progress';
import { VaultActions } from '@/components/vault/VaultActions';
import { VaultAttesters } from '@/components/vault/VaultAttesters';
import { VaultClaim } from '@/components/vault/VaultClaim';
import { VaultProgress } from '@/components/vault/VaultProgress';
import { VaultRules } from '@/components/vault/VaultsRules';
import { SMART_VAULT_ABI } from '@/constants/abi';
import { useVaultStore } from '@/states/vault';
import { ProjectENV } from '@env';
import { cx } from 'class-variance-authority';
import { useParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useReadContract, useWatchContractEvent } from 'wagmi';
import { TableTxs } from './records';

const toEthers = (value?: bigint) => (value ? Number(value) / 1e18 : 0);

export const VaultDetails: IComponent = () => {
  const param = useParams<{ id: string }>();
  const { getVault } = useVaultStore();
  if (!param) return null;
  const id = param.id;
  const vault = getVault(id as THexString);
  if (!vault) {
    return <>Not Found</>;
  }

  return <Vault vault={vault} />;
};

export const Vault: IComponent<{
  vault: TVault;
}> = ({ vault }) => {
  const {
    uuid: id,
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
  const now = Date.now() / 1000;

  const { data: vaultRaised, refetch } = useReadContract({
    address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as THexString,
    abi: SMART_VAULT_ABI,
    scopeKey: 'vaultRaised',
    functionName: 'vaultRaised',
    args: [id as THexString],
  });

  const { data: vaultBalance } = useReadContract({
    address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as THexString,
    abi: SMART_VAULT_ABI,
    scopeKey: 'vaultBalance',
    functionName: 'vaultBalance',
    args: [id as THexString],
    query: {
      enabled: now > Number(contributeEnd),
    },
  });

  useWatchContractEvent({
    address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as THexString,
    abi: SMART_VAULT_ABI,
    eventName: 'Contribute',
    onLogs(logs) {
      const vaultId = logs[0].args.vaultId;
      if (vaultId === id) {
        refetch();
      }
    },
  });

  const currentPhase = useMemo(() => {
    if (now < Number(contributeStart)) {
      return 'upcoming';
    }
    if (Number(contributeStart) < now && now < Number(contributeEnd)) {
      return 'contribute';
    }
    if (now > Number(contributeEnd) && Number(vaultBalance) > 0) {
      return 'claim';
    }
    return 'ended';
  }, [now, contributeStart, contributeEnd, vaultBalance]);

  const renderCurrentPhase = useCallback(() => {
    return (
      <div className="min-w-1/3 mx-auto glass rounded-lg uppercase flex flex-col px-12 py-6">
        <span className=" font-semibold text-lg">
          Current Phase:
          <span
            className={cx(' px-2 py-1 rounded-full font-semibold', {
              'text-gray-400': currentPhase === 'upcoming',
              'text-orange-400': currentPhase === 'contribute',
              'text-blue-400': currentPhase === 'claim',
              'text-red-400': currentPhase === 'ended',
            })}>
            {currentPhase}
          </span>
        </span>
        {currentPhase === 'contribute' && (
          <h3 className="text-lg font-semibold">
            Raised amount: <span className="text-white italic">{toEthers(vaultRaised)} ETH</span>
          </h3>
        )}
        {currentPhase === 'claim' ||
          (currentPhase === 'ended' &&
            (() => {
              const burned = (Number(vaultRaised) - Number(vaultBalance)) / 1e18;
              const progress = Math.floor((burned / toEthers(vaultRaised)) * 100);
              return (
                <div className="mt-3">
                  <p className="text-lg font-semibold mb-2">
                    Progress: {progress}% ({burned} / {toEthers(vaultRaised)} ETH)
                  </p>
                  <Progress
                    value={progress}
                    barClassName="bg-green-600"
                    className="w-full rounded-lg h-2 bg-[#ddd]"
                  />
                </div>
              );
            })())}
      </div>
    );
  }, [currentPhase, vaultRaised, vaultBalance]);

  return (
    <section className="flex flex-col gap-12">
      <div className=" glass rounded-xl p-8 flex flex-col gap-4 text-gray-400">
        <div className="w-full flex justify-between gap-4 items-start">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <p className="text-lg">{description}</p>
          </div>
          <VaultActions
            vaultId={id as THexString}
            vaultName={name}
            schemaUID={validationSchemaUID}
            mode={currentPhase}
          />
        </div>
        <hr className="mt-4 mb-0" />
        <div className="mt-4 flex flex-col gap-8">
          {renderCurrentPhase()}
          <VaultProgress
            start={Number(contributeStart) * 1000}
            end={Number(contributeEnd) * 1000}
          />
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
      {Date.now() > contributeEnd * 1000n && (
        <TableTxs vaultId={id as `0x${string}`} recordType="Claim" />
      )}
      <TableTxs vaultId={id as `0x${string}`} recordType="Contribute" />
    </section>
  );
};
