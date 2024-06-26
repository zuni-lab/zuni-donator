import { z } from 'zod';
import { isValidAddress, isValidBytes, isValidBytes32 } from './tools';

export const RuleOperators: Record<number, string> = {
  0: 'Equal',
  1: 'Not Equal',
  2: 'Greater Than',
  3: 'Greater Than or Equal',
  4: 'Less Than',
  5: 'Less Than or Equal',
  6: 'None',
};

export const RuleTypes: Record<TRuleType, string> = {
  uint256: 'uint256',
  int256: 'int256',
  bytes32: 'bytes32',
  bytes: 'bytes',
  address: 'address',
  bool: 'bool',
  string: 'string',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RuleSchema: Record<TRuleType, any> = {
  uint256: z.number().int().optional(),
  int256: z.number().int().optional(),
  bytes32: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => isValidBytes32(val), {
      message: 'Must be a valid bytes string',
    })
    .optional(),
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
  bool: z.boolean(),
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

export const parseValidationSchema = (schema: string): TDeclareStmt[] => {
  const lit = schema.split(',');
  if (lit.length == 0) {
    return [];
  }

  const result: TDeclareStmt[] = [];
  lit.forEach((l) => {
    const [type, name] = l.trim().split(' ');
    const { isValid, value } = isValidRuleType(type);
    if (isValid) {
      result.push({ type: value, name });
    }
  });
  return result;
};

export const getValidationSchema = (rules: TDeclareStmt[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = {};
  rules.forEach((rule) => {
    fields[rule.name] = RuleSchema[rule.type];
  });
  return z.object(fields);
};
