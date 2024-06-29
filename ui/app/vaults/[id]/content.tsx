'use client';

import { useVaultStore } from '@/states/vault';
import { getFormattedDate } from '@/utils/tools';
import { useParams } from 'next/navigation';
import { StatusPhase } from './status';
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

  console.log({ validationSchemaUID, fixedAmount, percentage, customData });

  return (
    <div className="flex flex-col gap-12">
      <div className="w-full flex justify-between gap-4">
        <div className="max-w-full glass rounded-xl p-8 flex flex-col gap-4 text-gray-400">
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          <p className="text-lg">{description}</p>
          <div className="flex flex-col gap-2">
            <span className="font-bold">Contribute Start:</span>{' '}
            {getFormattedDate(Number(contributeStart) / 1000)}
            <span className="font-bold">Contribute End:</span>{' '}
            {getFormattedDate(Number(contributeEnd))}
            <span className="font-bold">Validation Schema:</span> {validationSchema}
            <span className="font-bold">Attesters:</span> {attesters.join(', ')}
            <span className="font-bold">Operators:</span> {operators.join(', ')}
            <span className="font-bold">Thresholds:</span> {thresholds.join(', ')}
            <span className="font-bold">Claim Type:</span> {claimType}
          </div>
        </div>

        <StatusPhase />
      </div>
      <TableTxs />
    </div>
  );
};
