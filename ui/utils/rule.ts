import { z } from 'zod';
import { isValidAddress, isValidBytes, isValidBytesWithLength } from './tools';

export const RuleOperators: {
  [key in TOperator]: [number, string];
} = {
  EQ: [0, 'Equal'],
  NE: [1, 'Not Equal'],
  GT: [2, 'Greater Than'],
  GE: [3, 'Greater Than or Equal'],
  LT: [4, 'Less Than'],
  LE: [5, 'Less Than or Equal'],
  NONE: [6, 'None'],
} as const;

export const RuleTypes: Record<TRuleType, string> = {
  int8: 'int8',
  int16: 'int16',
  int24: 'int24',
  int32: 'int32',
  int64: 'int64',
  int128: 'int128',
  int256: 'int256',
  uint8: 'uint8',
  uint16: 'uint16',
  uint24: 'uint24',
  uint32: 'uint32',
  uint64: 'uint64',
  uint128: 'uint128',
  uint256: 'uint256',
  bytes1: 'bytes1',
  bytes2: 'bytes2',
  bytes4: 'bytes4',
  bytes8: 'bytes8',
  bytes16: 'bytes16',
  bytes32: 'bytes32',
  bytes: 'bytes',
  address: 'address',
  bool: 'bool',
  string: 'string',
};

export const isNumericType = (type: TRuleType): boolean => {
  switch (type) {
    case 'int8':
    case 'int16':
    case 'int24':
    case 'int32':
    case 'int64':
    case 'int128':
    case 'int256':
    case 'uint8':
    case 'uint16':
    case 'uint24':
    case 'uint32':
    case 'uint64':
    case 'uint128':
    case 'uint256':
      return true;
    default:
      return false;
  }
};

export const MIN_VAULES_OF_NUMERIC_TYPES: Record<TRuleNumericType, number> = {
  int8: -128,
  int16: -(2 ** 15),
  int24: -(2 ** 23),
  int32: -(2 ** 31),
  int64: -(2 ** 63),
  int128: -(2 ** 127),
  int256: -(2 ** 255),
  uint8: 0,
  uint16: 0,
  uint24: 0,
  uint32: 0,
  uint64: 0,
  uint128: 0,
  uint256: 0,
} as const;

export const MAX_VAULES_OF_NUMERIC_TYPES: Record<TRuleNumericType, number> = {
  int8: 127,
  int16: 2 ** 15 - 1,
  int24: 2 ** 23 - 1,
  int32: 2 ** 31 - 1,
  int64: 2 ** 63 - 1,
  int128: 2 ** 127 - 1,
  int256: 2 ** 255 - 1,
  uint8: 255,
  uint16: 2 ** 16 - 1,
  uint24: 2 ** 24 - 1,
  uint32: 2 ** 32 - 1,
  uint64: 2 ** 64 - 1,
  uint128: 2 ** 128 - 1,
  uint256: 2 ** 256 - 1,
} as const;

export const getMinValue = (type: TRuleType): number => {
  return MIN_VAULES_OF_NUMERIC_TYPES[type as TRuleNumericType];
};

export const getMaxValue = (type: TRuleType): number => {
  return MAX_VAULES_OF_NUMERIC_TYPES[type as TRuleNumericType];
};

export const isNumericValue = (type: TRuleType) =>
  z.string().refine(
    (val) => {
      if (isNumericType(type)) {
        const num = parseInt(val, 10);
        if (isNaN(num)) {
          return false;
        }
        return num >= getMinValue(type) && num <= getMaxValue(type);
      }
      return false;
    },
    {
      message: `Must be a valid integer, between ${getMinValue(type)} and ${getMaxValue(type)}`,
    }
  );

export const isNBytesValue = (type: TRuleBytesType) =>
  z.string().refine(
    (val) => {
      let num = 0;
      switch (type) {
        case 'bytes1':
          num = 1;
          break;
        case 'bytes2':
          num = 2;
          break;
        case 'bytes4':
          num = 4;
          break;
        case 'bytes8':
          num = 8;
          break;
        case 'bytes16':
          num = 16;
          break;
        case 'bytes32':
          num = 32;
          break;
        default:
          break;
      }
      return isValidBytesWithLength(val, num);
    },
    {
      message: `Must be a valid ${type} string`,
    }
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RuleSchema: Record<TRuleType, any> = {
  int8: isNumericValue('int8'),
  int16: isNumericValue('int16'),
  int24: isNumericValue('int24'),
  int32: isNumericValue('int32'),
  int64: isNumericValue('int64'),
  int128: isNumericValue('int128'),
  int256: isNumericValue('int256'),
  uint8: isNumericValue('uint8'),
  uint16: isNumericValue('uint16'),
  uint24: isNumericValue('uint24'),
  uint32: isNumericValue('uint32'),
  uint64: isNumericValue('uint64'),
  uint128: isNumericValue('uint128'),
  uint256: isNumericValue('uint256'),
  bytes1: isNBytesValue('bytes1'),
  bytes2: isNBytesValue('bytes2'),
  bytes4: isNBytesValue('bytes4'),
  bytes8: isNBytesValue('bytes8'),
  bytes16: isNBytesValue('bytes16'),
  bytes32: isNBytesValue('bytes32'),
  bytes: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => isValidBytes(val), {
      message: 'Must be a valid bytes string',
    })
    .optional(),
  address: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => isValidAddress(val), {
      message: 'Must be a valid address',
    })
    .optional(),
  bool: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val === 'true' || val === 'false', {
      message: 'Must be a valid boolean',
    }),
  string: z
    .string()
    .transform((val) => val.trim())
    .optional(),
};

export const isValidRuleType = (
  type: string
): {
  isValid: boolean;
  value: TRuleType;
} => {
  const value = RuleTypes[type as TRuleType];
  return {
    isValid: !!value,
    value: value as TRuleType,
  };
};

export const getOperatorValue = (op: TOperator): number => {
  return RuleOperators[op][0];
};

export const getOperatorLabel = (op: TOperator): string => {
  return RuleOperators[op][1];
};

export const getValidOperators = (type: TRuleType): TOperator[] => {
  switch (type) {
    case 'address':
    case 'bool':
    case 'bytes':
      return ['EQ', 'NE', 'NONE'];
    default:
      return ['EQ', 'NE', 'GT', 'GE', 'LT', 'LE', 'NONE'];
  }
};

export const parseValidationSchema = (schema: string): TRule[] => {
  schema = schema.replace(/"/g, '');
  const lit = schema.split(',');
  if (lit.length == 0) {
    return [];
  }

  const result: TRule[] = [];
  lit.forEach((l) => {
    const [type, name] = l.trim().split(' ');
    const { isValid, value } = isValidRuleType(type);
    if (isValid) {
      const ops = getValidOperators(value);
      let defaultValue;
      if (isNumericType(value)) {
        defaultValue = 0;
      } else {
        defaultValue = '';
      }
      result.push({ type: value, name, ops, defaultValue });
    } else {
      console.error(`Invalid type: ${type}`);
    }
  });
  return result;
};

export const getValidationSchema = (rules: TRule[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = {};
  rules.forEach((rule) => {
    fields[rule.name] = RuleSchema[rule.type];
    fields[`${rule.name}_op`] = z.string().refine(
      (val) => {
        return rule.ops.includes(val as TOperator);
      },
      {
        message: 'Invalid operator for this field',
      }
    );
  });
  return z.object(fields);
};
