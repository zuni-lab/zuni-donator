// The vault is an onchain attestation of vault schema [https://base-sepolia.easscan.org/schema/view/0x44a41b27edee9c517cd3d340f054d3e32cc96cb2ef135e959595831d3c3ffc15]

/**
 * UUID: string
 * Name: string
 * Description: string
 * ContributeStart: uint256
 * ContributeEnd: uint256
 * ValidationSchema: bytes32
 * Operators: uint8[]
 * Thresholds: bytes[]
 * ClaimType: uint8
 * FixedAmount: uint256
 * Percentage: uint256
 * CustomData: bytes
 */

type THexString = `0x${string}`;

type TVault = {
  uuid: THexString;
  name: string;
  description: string;
  contributeStart: bigint;
  contributeEnd: bigint;
  validationSchemaUID: THexString; // Schema UID
  attesters: THexString[];
  operators: number[];
  thresholds: THexString[];
  claimType: number;
  fixedAmount: bigint;
  percentage: bigint;
  customData: THexString;
  validationSchema: string;
  time: bigint;
};
