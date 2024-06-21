import { Button } from '@/components/shadcn/Button';
import { Metadata } from 'next';
import { RecentVaultSection } from './sections/RecentVaultSection';
import { StatSection } from './sections/StatSection';
import { Heading } from '@/components/Heading';
import { AboutSection } from './sections/AboutSection';
import { RouterMeta } from '@/constants/router';

export const metadata: Metadata = RouterMeta.Home;

export default function HomePage() {
  return (
    <main className="py-16">
      <div className="glass section rounded-xl py-32 flex flex-col items-center gap-20">
        <Heading
          title="Zuni Vault"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        />
        <Button className="h-12 text-lg px-6">Get Started</Button>
      </div>
      <div className="my-12 h-[2px] max-w-6xl mx-auto bg-white"></div>
      <AboutSection />
      <RecentVaultSection />
      <StatSection />
    </main>
  );
}
