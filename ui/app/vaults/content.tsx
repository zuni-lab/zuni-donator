'use client';

import { Button } from '@/components/shadcn/Button';
import { Input } from '@/components/shadcn/Input';
import { VaultCard } from '@/components/vault/VaultCard';
import { VaultForm } from '@/components/vault/VaultForm';
import { useActionDebounce } from '@/hooks/useAction';
import { Inbox, LoaderCircle, SearchIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

export const PageContent: IComponent<{
  data: TVault[];
}> = ({ data }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedVaults, setSelectedVaults] = useState<TVault[]>(data);

  const debounce = useActionDebounce(500, true);

  const onSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debounce(() => {
        setLoading(true);
        if (e.target.value.length === 0) {
          setSelectedVaults(data);
          setLoading(false);
          return;
        }
        setSelectedVaults(
          data.filter(
            (vault) => vault.title.includes(e.target.value) || vault.uuid.includes(e.target.value)
          )
        );
        setLoading(false);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const renderVaults = useMemo(() => {
    if (selectedVaults.length === 0) {
      return (
        <div className="mt-40 w-full flex justify-center items-center text-xl">
          No vaults
          <Inbox className="w-8 h-8 ml-2" />
        </div>
      );
    }

    return (
      <div className="mt-12 w-full grid grid-cols-3 gap-8">
        {selectedVaults.map((vault) => (
          <VaultCard key={vault.uuid} {...vault} />
        ))}
      </div>
    );
  }, [selectedVaults]);

  const renderSearch = useMemo(() => {
    return (
      <div className="w-[500px] flex items-center float-end bg-background px-2 rounded-md border">
        <Input
          placeholder="Search by Name / UUID of vaults"
          className="focus:!border-none"
          onChange={onSearch}
        />
        <Button size={'lg'} variant={'link'} className="px-2 text-white cursor-default">
          {loading ? (
            <LoaderCircle className="w-6 h-6 animate-spin" />
          ) : (
            <SearchIcon className="w-6 h-6" />
          )}
        </Button>
      </div>
    );
  }, [loading, onSearch]);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <VaultForm />
        {renderSearch}
      </div>
      <div className="w-full flex flex-col items-center justify-center">{renderVaults}</div>
    </section>
  );
};
