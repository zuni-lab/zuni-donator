'use client';

import { Button } from '@/components/shadcn/Button';
import { Input } from '@/components/shadcn/Input';
import { CreateVaultMode, VaultDialog } from '@/components/vault/VaultDialog';
import { SMART_VAULT_ABI } from '@/constants/abi';
import { useActionDebounce } from '@/hooks/useAction';
import { useEAS } from '@/hooks/useEas';
import { useSchemaRegistry } from '@/hooks/useSchemaRegisty';
import { useVaultStore } from '@/states/vault';
import { ProjectENV } from '@env';
import { SearchIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useChainId, useWatchContractEvent } from 'wagmi';
import { VaultListSection } from '../sections/VaultListSection';

export const PageContent = () => {
  const chainId = useChainId();
  const data = useVaultStore((state) => state.getAllOfVaults(chainId));
  const fetchVaults = useVaultStore((state) => state.fetchVaults);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { registry } = useSchemaRegistry();
  const { eas } = useEAS();

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
          placeholder="Search by Name / Schema UID / Vault ID"
          className="focus:!border-none"
          onChange={onSearch}
        />
        <Button size={'lg'} variant={'link'} className="px-2 text-white cursor-default">
          <SearchIcon className="w-6 h-6" />
        </Button>
      </div>
    );
  }, [onSearch]);

  useWatchContractEvent({
    address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as THexString,
    abi: SMART_VAULT_ABI,
    eventName: 'CreateVault',
    onLogs(logs) {
      const vaultId = logs[0].args.vaultId;
      if (vaultId) {
        // TODO : check if registry and eas are available
        fetchVaults(chainId, [vaultId], registry, eas);
      }
    },
  });

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <VaultDialog>
          <CreateVaultMode />
        </VaultDialog>
        {renderSearch}
      </div>
      <div className="w-full flex flex-col items-center justify-center mt-12">
        <VaultListSection vaults={data} query={searchQuery} />
      </div>
    </section>
  );
};
