export const ClaimType: {
  [key in TClaimType]: number;
} = {
  FIXED: 0,
  PERCENTAGE: 1,
} as const;

export const isValidType = (type: string): boolean => {
  return type === 'FIXED' || type === 'PERCENTAGE';
};
