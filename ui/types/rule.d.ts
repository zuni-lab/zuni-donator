type TRuleType = 'uint256' | 'int256' | 'bytes32' | 'bytes' | 'address' | 'bool' | 'string';

type TDeclareStmt = {
  type: TRuleType;
  name: string;
};
