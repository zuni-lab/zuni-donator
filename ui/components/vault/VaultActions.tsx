import { DepositVaultMode, VaultDialog } from './VaultDialog';

export const VaultActions: IComponent<{
  vaultName: string;
  vaultId: string;
  start: number;
  end: number;
}> = ({ start, end }) => {
  const isInDepositPhase = start < Date.now() && Date.now() < end;
  return (
    <VaultDialog
      buttonClassName="bg-blue-400 text-white"
      button={isInDepositPhase ? 'Deposit' : 'Claim'}
      description={isInDepositPhase ? 'Deposit to vault' : 'Claim from vault'}>
      {isInDepositPhase ? <DepositVaultMode /> : null}
    </VaultDialog>
  );
};
