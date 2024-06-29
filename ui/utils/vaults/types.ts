import { isValidBytesWithLength } from '@/utils/tools';

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
  bytes3: 'bytes3',
  bytes4: 'bytes4',
  bytes8: 'bytes8',
  bytes16: 'bytes16',
  bytes32: 'bytes32',
  bytes: 'bytes',
  address: 'address',
  bool: 'bool',
  string: 'string',
} as const;

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

/** SUPPORT FOR NUMERIC */

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

/** SUPPORT FOR BYTES */

export const isBytesType = (type: TRuleType): boolean => {
  switch (type) {
    case 'bytes1':
    case 'bytes2':
    case 'bytes3':
    case 'bytes4':
    case 'bytes8':
    case 'bytes16':
    case 'bytes32':
    case 'bytes':
      return true;
    default:
      return false;
  }
};

export const isNBytesValue = (type: TRuleType, val: string): boolean => {
  let num = 0;
  switch (type) {
    case 'bytes1':
      num = 1;
      break;
    case 'bytes2':
      num = 2;
      break;
    case 'bytes3':
      num = 3;
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
};

export const isSupportedType = (type: TRuleType): boolean => {
  return !!RuleTypes[type];
};
