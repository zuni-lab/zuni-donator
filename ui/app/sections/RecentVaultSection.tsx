import { VaultCard } from '@/components/vault/VaultCard';

// TODO: fetch onchain data
export const RecentVaultSection: IComponent = () => {
  return (
    <section className="mt-8">
      <h1 className="title">Recent Vaults</h1>
      <div className="mt-4 w-full grid grid-cols-4 gap-4">
        <VaultCard />
        <VaultCard />
        <VaultCard />
        <VaultCard />
      </div>
    </section>
  );
};
