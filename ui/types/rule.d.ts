type TRuleType = TRuleNumericType | TRuleBytesType | 'address' | 'bool' | 'string';

type TRuleNumericType =
  | 'int8'
  | 'int16'
  | 'int24'
  | 'int32'
  | 'int64'
  | 'int128'
  | 'int256'
  | 'uint8'
  | 'uint16'
  | 'uint24'
  | 'uint32'
  | 'uint64'
  | 'uint128'
  | 'uint256';

type TRuleBytesType =
  | 'bytes1'
  | 'bytes2'
  | 'bytes3'
  | 'bytes4'
  | 'bytes8'
  | 'bytes16'
  | 'bytes32'
  | 'bytes';

type TDeclareStmt = {
  type: TRuleType;
  name: string;
};

type TSupportedRule = {
  type: TRuleType;
  name: string;
  ops: TOperator[];
};

type TUnsupportedRule = {
  type: string;
  typeOfRule: 'unsupported';
  name: string;
  ops: TOperator[];
};

type TRule = TSupportedRule | TUnsupportedRule;

type TOperator = 'EQ' | 'NE' | 'GT' | 'GE' | 'LT' | 'LE' | 'NONE';
