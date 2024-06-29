import { defaultNetworkConfig } from '@/utils/network';
import { cx, isValidAddress } from '@/utils/tools';
import { RuleOperators, getOperator, getOperatorLabel } from '@/utils/vaults/operators';
import { splitValidationSchema } from '@/utils/vaults/schema';
import { isSupportedType } from '@/utils/vaults/types';
import Link from 'next/link';
import { decodeAbiParameters } from 'viem';

export const RuleItem: IComponent<{
  type: string;
  name: string;
  operator: number;
  threshold: THexString;
}> = ({ type, name, operator, threshold }) => {
  const isNoneOperator = operator === RuleOperators.NONE[0];
  const isSupported = isSupportedType(type as TRuleType);
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
    thresholValue = isValidAddress(value as string)
      ? (value as string).slice(0, 8) + '...' + (value as string).slice(-8)
      : type === 'uint256'
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
          'bg-gray-500 opacity-60': !isSupported,
        })}>
        <div className={cx('text-gray-300 uppercase text-sm')}>{type}</div>
        <div className={cx('text-white font-medium')}>{name}</div>
      </div>
      <div
        className={cx('w-1/5 bg-orange-400 flex items-center px-4 font-medium uppercase', {
          'bg-gray-500 opacity-60': !isSupported,
        })}>
        {isSupported ? getOperatorLabel(getOperator(operator)) : 'Unsupported'}
      </div>
      <div
        className={cx('w-1/2 bg-accent-foreground flex items-center px-4', {
          'bg-gray-500 opacity-60': !isSupported,
          glass: isSupported,
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
  const splittedValidationSchema = splitValidationSchema(schema);

  return (
    <div className="space-y-2">
      <h3 className="text-white font-semibold text-lg inline-flex gap-2">
        Schema:{' '}
        <Link href={`${defaultNetworkConfig.easScan}/schema/view/${uid}`} passHref legacyBehavior>
          <a className="text-primary underline line-clamp-1" target="_blank">
            {uid}
          </a>
        </Link>
      </h3>

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
