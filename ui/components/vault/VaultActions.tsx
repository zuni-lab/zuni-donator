import { ClaimVaultMode, ContributeVaultMode, VaultDialog } from './VaultDialog';

export type TVaultMode = 'contribute' | 'claim' | 'upcoming' | 'ended';

export const VaultActions: IComponent<{
  vaultName: string;
  vaultId: THexString;
  schemaUID: THexString;
  mode?: TVaultMode;
}> = ({ vaultId, vaultName, schemaUID, mode = 'upcoming' }) => {
  if (mode === 'ended' || mode === 'upcoming') {
    return null;
  }

  if (mode === 'contribute') {
    return (
      <VaultDialog
        buttonClassName={'bg-orange-400 hover:bg-orange-500'}
        button={'Contriubte'}
        description={'Contriubte to vault'}>
        <ContributeVaultMode vaultId={vaultId} vaultName={vaultName} />
      </VaultDialog>
    );
  }

  return (
    <VaultDialog
      buttonClassName={'bg-primary hover:bg-blue-600'}
      button={'Claim'}
      description={'Claim from vault'}>
      <ClaimVaultMode vaultId={vaultId} vaultName={vaultName} schemaUID={schemaUID} />
    </VaultDialog>
  );
};
