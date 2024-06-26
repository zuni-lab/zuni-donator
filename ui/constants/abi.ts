export const SMART_VAULT_ABI = [
  {
    inputs: [{ internalType: 'bytes32', name: '_vaultSchema', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'DepositEndInvalid', type: 'error' },
  { inputs: [], name: 'DepositEnded', type: 'error' },
  { inputs: [], name: 'DepositNotStarted', type: 'error' },
  { inputs: [], name: 'DepositStartInvalid', type: 'error' },
  { inputs: [], name: 'NameEmpty', type: 'error' },
  { inputs: [], name: 'RulesLengthMismatch', type: 'error' },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'bytes32', name: 'vaultId', type: 'bytes32' }],
    name: 'CreateVault',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'vaultId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'attestionUID', type: 'bytes32' },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'description', type: 'string' },
      { internalType: 'uint256', name: 'depositStart', type: 'uint256' },
      { internalType: 'uint256', name: 'depositEnd', type: 'uint256' },
      { internalType: 'bytes32', name: 'validationSchema', type: 'bytes32' },
      { internalType: 'enum Operator[]', name: 'ops', type: 'uint8[]' },
      { internalType: 'bytes[]', name: 'thresholds', type: 'bytes[]' },
    ],
    name: 'createVault',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'vaultId', type: 'bytes32' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'vaultId', type: 'bytes32' }],
    name: 'getRules',
    outputs: [
      { internalType: 'enum Type[]', name: '', type: 'uint8[]' },
      { internalType: 'enum Operator[]', name: '', type: 'uint8[]' },
      { internalType: 'bytes[]', name: '', type: 'bytes[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'vaultUid', type: 'bytes32' }],
    name: 'vaultBalances',
    outputs: [{ internalType: 'uint256', name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'vaultSchema',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
];