import { z } from 'zod';
import { isValidAddress } from '../tools';
import { getValidOperators } from './operators';
import {
  getMaxValue,
  getMinValue,
  isBytesType,
  isNBytesValue,
  isNumericType,
  isValidRuleType,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RuleSchema: Record<TRuleType, any> = {
  int8: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  int16: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  int24: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  int32: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  int64: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  int128: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  int256: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  uint8: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  uint16: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  uint24: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  uint32: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  uint64: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  uint128: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  uint256: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  bytes1: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  bytes2: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  bytes3: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  bytes4: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  bytes8: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  bytes16: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  bytes32: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  bytes: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  address: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  bool: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  string: z
    .string()
    .transform((val) => val.trim())
    .optional(),
} as const;

export const validateField = (type: TRuleType, value: string): [boolean, string] => {
  if (isNumericType(type)) {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return [false, 'Must be a valid number'];
    }
    const min = getMinValue(type);
    const max = getMaxValue(type);
    const result = num >= min && num <= max;
    return [result, result ? '' : `Must be a number between ${min} and ${max}`];
  } else if (isBytesType(type)) {
    return [isNBytesValue(type, value), 'Must be a valid bytes string'];
  } else if (type === 'address') {
    return [isValidAddress(value), 'Must be a valid address'];
  } else if (type === 'bool') {
    return [value === 'true' || value === 'false', 'Must be a valid boolean'];
  } else {
    // string is always valid
  }
  return [true, ''];
};

export const splitValidationSchema = (schema: string): [string, string][] => {
  schema = schema.replace(/"/g, '');
  const lit = schema.split(',');
  if (lit.length == 0) {
    return [];
  }

  return lit.map((l) => {
    const [type, name] = l.trim().split(' ');
    return [type, name];
  });
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
      result.push({ type: value, name, ops });
    } else {
      result.push({
        type,
        typeOfRule: 'unsupported',
        name,
        ops: ['NONE'],
      });
    }
  });
  return result;
};

export const isUnsupportedRule = (rule: TRule): rule is TUnsupportedRule => {
  return (rule as TUnsupportedRule).typeOfRule === 'unsupported';
};

export const getValidationSchema = (rules: TRule[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = {};
  rules.forEach((rule) => {
    // check if rule is supported
    if (isUnsupportedRule(rule)) {
      fields[rule.name] = z.string().default('');
      fields[`${rule.name}_op`] = z
        .string()
        .refine((val) => val === 'NONE', {
          message: 'Invalid operator for this field',
        })
        .default('NONE');
      return;
    }

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
