type TClaimType = 'FIXED' | 'PERCENTAGE';

type TClaimData = {
  claimType: number;
  fixedAmount: bigint;
  percentage: bigint;
  customData: `0x${string}`;
};
