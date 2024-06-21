import { Heading } from '@/components/Heading';
import { Button } from '@/components/shadcn/Button';
import { Input } from '@/components/shadcn/Input';
import { VaultCard } from '@/components/vault/VaultCard';
import { SearchIcon } from 'lucide-react';

export default function ValutPage() {
  return (
    <main className="mt-20">
      <Heading
        title="Our Vaults"
        description="Explore the one that best suits your needs."
        size="md"
      />
      <div className="mt-6 max-w-6xl mx-auto flex justify-end items-center">
        <div className='min-w-[400px] flex items-end gap-2'>
          <Input placeholder="Search by Name / UUID of vaults" />
          <Button size={'lg'} variant={'link'} className="px-2 text-white hover:text-primary">
            <SearchIcon className="w-6 h-6" />
          </Button>
        </div>
      </div>
      <section className="w-full grid grid-cols-4 gap-8">
      </section>
    </main>
  );
}
