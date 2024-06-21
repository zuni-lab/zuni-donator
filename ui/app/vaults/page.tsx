import { Heading } from '@/components/Heading';
import { MockVaults } from '@/constants/mock';
import { RouterMeta } from '@/constants/router';
import { Metadata } from 'next';
import { PageContent } from './content';

export const metadata: Metadata = RouterMeta.Vaults;

export default function ValutPage() {
  return (
    <main className="mt-20">
      <Heading
        title="Our Vaults"
        description="Explore the one that best suits your needs."
        size="md"
      />
      <PageContent data={MockVaults} />
    </main>
  );
}
