'use client';

import { Button } from '@/components/shadcn/Button';
import { Input } from '@/components/shadcn/Input';
import { CreateVaultMode, VaultDialog } from '@/components/vault/VaultDialog';
import { useActionDebounce } from '@/hooks/useAction';
import { useVaultStore } from '@/states/vault';
import { SearchIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { VaultListSection } from '../sections/VaultListSection';

export const PageContent = () => {
  const data = useVaultStore((state) => state.getAllOfVaults());
  const isFetching = useVaultStore((state) => state.loading);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const debounce = useActionDebounce(500, true);

  const onSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debounce(() => {
        setSearchQuery(e.target.value);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, setSearchQuery]
  );

  const renderSearch = useMemo(() => {
    return (
      <div className="w-[500px] flex items-center float-end bg-background px-2 rounded-md border">
        <Input
          placeholder="Search by Name / UUID of vaults"
          className="focus:!border-none"
          onChange={onSearch}
        />
        <Button size={'lg'} variant={'link'} className="px-2 text-white cursor-default">
          <SearchIcon className="w-6 h-6" />
        </Button>
      </div>
    );
  }, [onSearch]);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <VaultDialog>
          <CreateVaultMode />
        </VaultDialog>
        {renderSearch}
      </div>
      <div className="w-full flex flex-col items-center justify-center mt-12">
        <VaultListSection vaults={data} loading={isFetching} query={searchQuery} />
      </div>
    </section>
  );
};
