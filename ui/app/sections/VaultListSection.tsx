import { VaultCard } from '@/components/vault/VaultCard';
import { Inbox } from 'lucide-react';

export const VaultListSection: IComponent<{
  vaults: TVault[];
  loading?: boolean;
  query?: string;
}> = ({ vaults, loading = false, query }) => {
  const lowerCaseQuery = query?.toLowerCase() || '';

  const renderedVaults = !lowerCaseQuery
    ? vaults
    : vaults.filter((vault) => {
        return (
          vault.name.toLowerCase().includes(lowerCaseQuery) ||
          vault.uuid.toLowerCase().includes(lowerCaseQuery)
        );
      });

  return (
    <>
      {loading ||
        (renderedVaults.length === 0 && (
          <div className="mt-40 w-full flex justify-center items-center text-xl">
            No vaults
            <Inbox className="w-8 h-8 ml-2" />
          </div>
        ))}
      {!loading && renderedVaults.length > 0 && (
        <>
          {renderedVaults.length > 0 && (
            <div className="mt-4 w-full grid grid-cols-3 gap-8">
              {renderedVaults.map((vault) => (
                <VaultCard key={vault.uuid} {...vault} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};