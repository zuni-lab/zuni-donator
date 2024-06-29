import { cx, isValidAddress } from '@/utils/tools';
import { RuleOperators, getOperator, getOperatorLabel } from '@/utils/vaults/operators';
import { splitValidationSchema } from '@/utils/vaults/schema';
import { isSupportedType } from '@/utils/vaults/types';
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
    thresholValue = 'This is field is skipped';
  } else {
    const abi = [
      {
        type: type,
        value: threshold,
      },
    ];
    const value = decodeAbiParameters(abi, threshold)[0] as string;
    thresholValue = isValidAddress(value) ? value.slice(0, 8) + '...' + value.slice(-8) : value;
  }

  return (
    <div className="flex gap-2 rounded-md overflow-hidden text-white">
      <div className="w-[30%] bg-primary p-2">
        <div
          className={cx('text-gray-300 uppercase text-sm', {
            'line-through': !isSupported,
            'text-gray-400': isSupported && isNoneOperator,
          })}>
          {type}
        </div>
        <div
          className={cx('text-white font-medium', {
            'line-through': !isSupported,
            'text-gray-400': isSupported && isNoneOperator,
          })}>
          {name}
        </div>
      </div>
      <div
        className={cx('w-1/5 bg-orange-400 flex items-center px-4 font-medium uppercase', {
          'line-through': !isSupported,
          'drop-shadow-sm': isSupported && isNoneOperator,
        })}>
        {isSupported ? getOperatorLabel(getOperator(operator)) : 'Unsupported'}
      </div>
      <div
        className={cx('w-1/2 bg-accent-foreground glass  flex items-center px-4', {
          'line-through': !isSupported,
          'text-gray-400': isSupported && isNoneOperator,
        })}>
        {thresholValue}
      </div>
    </div>
  );
};

export const VaultRules: IComponent<{
  schema: string;
  operators: number[];
  thresholds: THexString[];
}> = ({ schema, operators, thresholds }) => {
  const splittedValidationSchema = splitValidationSchema(schema);

  return (
    <div className="space-y-2">
      <h3 className="text-white font-semibold text-lg">Schema:</h3>
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
