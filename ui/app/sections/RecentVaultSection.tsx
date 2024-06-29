'use client';

import { Button } from '@/components/shadcn/Button';
import { useVaultStore } from '@/states/vault';
import { ArrowTopRightIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { VaultListSection } from './VaultListSection';

export const RecentVaultSection: IComponent = () => {
  const vaults = useVaultStore((state) => state.getComingVaults(6));
  return (
    <section className="mt-8">
      <h1 className="title">Recent Vaults</h1>
      <VaultListSection vaults={vaults} />
      <div className="flex justify-end mt-2">
        <Link href="/vaults" passHref legacyBehavior>
          <Button className="mt-4 flex gap-2 items-center text-base" variant={'link'}>
            See more <ArrowTopRightIcon width="16" height="16" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
