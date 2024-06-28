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

export const getOperatorNumber = (op: string): number | undefined => {
  return RuleOperators[op as TOperator]?.[0];
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
