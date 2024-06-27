type TClaimType = 'FIXED' | 'PERCENTAGE';

type TClaimData = {
  type: TClaimType;
  fixedAmount?: number;
  percentage?: number;
};
