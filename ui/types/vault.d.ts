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
