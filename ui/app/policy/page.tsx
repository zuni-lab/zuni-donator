import { Heading } from '@/components/Heading';
import { RouterMeta } from '@/constants/router';
import { Metadata } from 'next';

export const metadata: Metadata = RouterMeta.Documentation;
export default function PolicyPage() {
  return (
    <main>
      <div className="section rounded-xl !p-0 !mt-12 !min-h-[20vh] flex flex-col items-center gap-12">
        <Heading title="Policy" description="Privacy Policy" />
      </div>
    </main>
  );
}
