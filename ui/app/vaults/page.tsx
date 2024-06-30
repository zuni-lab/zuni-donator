import { Heading } from '@/components/Heading';
import { RouterMeta } from '@/constants/router';
import { Metadata } from 'next';
import { StatSection } from '../sections/StatSection';
import { PageContent } from './content';

export const metadata: Metadata = RouterMeta.Vaults;

export default function ValutPage() {
  return (
    <main>
      <Heading
        title="Zuni Vaults"
        description="Explore the one that best suits your needs."
        size="md"
      />
      <PageContent />
      <StatSection />
    </main>
  );
}
