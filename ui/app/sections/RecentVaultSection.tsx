import { Button } from '@/components/shadcn/Button';
import { VaultCard } from '@/components/vault/VaultCard';
import { MockVaults } from '@/constants/mock';
import { ArrowTopRightIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

// TODO: fetch onchain data
export const RecentVaultSection: IComponent = () => {
  return (
    <section className="mt-8">
      <h1 className="title">Recent Vaults</h1>
      <div className="mt-4 w-full grid grid-cols-4 gap-8">
        {MockVaults.slice(0, 6).map((vault, index) => (
          <VaultCard key={vault.uuid} {...vault} />
        ))}
      </div>
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
