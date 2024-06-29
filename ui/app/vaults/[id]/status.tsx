import { Button } from '@/components/shadcn/Button';
import { SMART_VAULT_ABI } from '@/constants/abi';
import { ProjectENV } from '@env';
import { parseEther } from 'viem';
import { useWriteContract } from 'wagmi';

export const StatusPhase: IComponent<{
  vaultId: `0x${string}`;
  buttonType: 'Contribute' | 'Claim';
}> = ({ vaultId, buttonType }) => {
  // TODO: Add validationUID
  // TODO: handle tx status
  const { writeContract } = useWriteContract();
  const validationUID = '0x';

  const contribute = async () => {
    writeContract({
      abi: SMART_VAULT_ABI,
      address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as `0x${string}`,
      functionName: 'contribute',
      args: [vaultId],
      value: parseEther('0.00001'),
    });
  };

  const claim = async () => {
    writeContract({
      abi: SMART_VAULT_ABI,
      address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as `0x${string}`,
      functionName: 'claim',
      args: [vaultId, validationUID],
    });
  };

  return (
    <Button
      variant="outline"
      className="bg-orange-400"
      onClick={buttonType === 'Contribute' ? contribute : claim}>
      {buttonType}
    </Button>
  );
};
