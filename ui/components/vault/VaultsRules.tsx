import { getNetworkConfig } from '@/utils/network';
import { cx } from '@/utils/tools';
import { RuleOperators, getOperator, getOperatorLabel } from '@/utils/vaults/operators';
import { splitValidationSchema } from '@/utils/vaults/schema';
import { isNumericType, isSupportedType } from '@/utils/vaults/types';
import { wagmiConfig } from '@/utils/wagmi';
import Link from 'next/link';
import { decodeAbiParameters } from 'viem';
import { usePublicClient } from 'wagmi';

export const RuleItem: IComponent<{
  type: string;
  name: string;
  operator: number;
  threshold: THexString;
}> = ({ type, name, operator, threshold }) => {
  const isNoneOperator = operator === RuleOperators.NONE[0];
  const isSupported = isSupportedType(type as TRuleType);
  const isDisabled = !isSupported || isNoneOperator;
  let thresholValue = '';
  if (!isSupported) {
    thresholValue = 'This field is not supported';
  } else if (isNoneOperator) {
    thresholValue = 'This field is skipped';
  } else {
    const abi = [
      {
        type: type,
        value: threshold,
      },
    ];
    const value = decodeAbiParameters(abi, threshold)[0];
    thresholValue = isNumericType(type as TRuleType)
      ? Number(value as bigint).toLocaleString()
      : type === 'bool'
        ? value
          ? 'True'
          : 'False'
        : (value as string);
  }

  return (
    <div className="flex gap-2 rounded-md overflow-hidden text-white">
      <div
        className={cx('w-[30%] bg-primary p-2', {
          'bg-gray-500 opacity-60': isDisabled,
        })}>
        <div className={cx('text-gray-300 uppercase text-sm')}>{type}</div>
        <div className={cx('text-white font-medium')}>{name}</div>
      </div>
      <div
        className={cx('w-1/5 bg-orange-400 flex items-center px-4 font-medium uppercase', {
          'bg-gray-500 opacity-60': isDisabled,
        })}>
        {isSupported ? getOperatorLabel(getOperator(operator)) : 'Unsupported'}
      </div>
      <div
        className={cx('w-1/2 bg-accent-foreground flex items-center px-4', {
          'bg-gray-500 opacity-60': isDisabled,
          glass: !isDisabled,
        })}>
        {thresholValue}
      </div>
    </div>
  );
};

export const VaultRules: IComponent<{
  uid: string;
  schema: string;
  operators: number[];
  thresholds: THexString[];
}> = ({ uid, schema, operators, thresholds }) => {
  const publicClient = usePublicClient({ config: wagmiConfig });
  const networkConfig = getNetworkConfig(publicClient.chain.id);
  const splittedValidationSchema = splitValidationSchema(schema);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-white font-semibold text-lg inline-flex gap-2">
          Valid attestations schema{' '}
        </h3>
        <p className="inline-flex gap-2">
          Scan now on EAS explorer:
          <Link href={`${networkConfig.easScan}/schema/view/${uid}`} passHref legacyBehavior>
            <a className="text-primary underline line-clamp-1" target="_blank">
              {uid}
            </a>
          </Link>
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {splittedValidationSchema.map(([type, name], index) => (
          <RuleItem
            key={index}
            type={type}
            name={name}
            operator={operators[index]}
            threshold={thresholds[index]}
          />
        ))}
      </div>
    </div>
  );
};
