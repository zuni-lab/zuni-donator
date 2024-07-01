import { ClaimType } from '@/utils/vaults/claim';

export const VaultClaim: IComponent<TClaimData> = ({ claimType, fixedAmount, percentage }) => {
  return (
    <div>
      <h3 className="text-white font-semibold text-lg">Claim amount per attestation:</h3>
      <div className="w-[360px] flex flex-col bg-accent/60 border border-accent/90 rounded-2xl p-4 mt-4">
        {claimType === ClaimType.FIXED ? (
          <>
            <span className="text-gray-300 text-lg">Fixed Amount</span>
            <span className="text-blue-500 font-bold text-medium">
              {Number(fixedAmount) / 1e18} ETH
            </span>
          </>
        ) : (
          <>
            <span className="text-gray-300 text-lg">Percentage</span>
            <span className="text-blue-500 font-bold text-medium">
              {Number(percentage) / 1e16}% <span className="text-gray-300">of raised amount</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};
