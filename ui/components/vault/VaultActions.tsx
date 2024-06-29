import { ContributeVaultMode, VaultDialog } from './VaultDialog';

export const VaultActions: IComponent<{
  vaultName: string;
  vaultId: THexString;
  start: number;
  end: number;
}> = ({ vaultId, vaultName, start, end }) => {
  const now = Date.now() / 1000;
  const isInDepositPhase = start < now && now < end;
  return (
    <VaultDialog
      buttonClassName="hover:bg-accent/60 hover:text-white"
      button={isInDepositPhase ? 'Contriubte' : 'Claim'}
      description={isInDepositPhase ? 'Contriubte to vault' : 'Claim from vault'}>
      {isInDepositPhase ? <ContributeVaultMode vaultId={vaultId} vaultName={vaultName} /> : null}
    </VaultDialog>
  );
};
