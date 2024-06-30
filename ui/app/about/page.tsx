import { Heading } from '@/components/Heading';
import { Button } from '@/components/shadcn/Button';
import { AppRouter, RouterMeta } from '@/constants/router';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = RouterMeta.About;
export default function HomePage() {
  return (
    <main>
      <div className="section rounded-xl !p-0 !mt-12 !min-h-[20vh] flex flex-col items-center gap-12">
        <Heading title="About Us" description="A decentralized vault platform." />
        <Link href={AppRouter.Vaults} passHref legacyBehavior>
          <a>
            <Button className="h-12 text-lg px-6">Get Started</Button>
          </a>
        </Link>
      </div>
      <section className="mt-8" id="about">
        <p className="mt-4">
          This platform allows users to handle their funds securely and transparently without
          relying on a centralized authority.
        </p>
        <p className="mt-4">
          Built on the Base blockchain, the platform leverages smart contracts to ensure
          decentralization, transparency, and security. Users can create vaults, deposit funds, and
          join vaults created by others seamlessly.
        </p>

        <h2 className="mt-8 subtitle">Features</h2>
        <ul className="mt-4 list-disc list-inside">
          <li>Decentralized vault creation and management</li>
          <li>Secure and transparent operations</li>
          <li>Smart contract governance</li>
          <li>Interactive vault participation</li>
        </ul>

        <h2 className="mt-8 subtitle">How It Works</h2>
        <p className="mt-4">
          The platform operates on the Base blockchain, utilizing smart contracts to manage vaults.
          This ensures a decentralized, transparent, and secure environment where users can create,
          deposit, and participate in vaults without central oversight.
        </p>

        <h2 className="mt-8 subtitle">Why Use Zuni Vault?</h2>
        <p className="mt-4">
          Zuni Vault offers a secure and transparent decentralized platform for managing vaults. By
          leveraging the Base blockchain and smart contracts, users can trust in the integrity and
          security of their transactions without the need for centralized control.
        </p>

        <h2 className="mt-8 subtitle">Get Started</h2>
        <p className="mt-4">
          Start using Zuni Vault by creating an account, then begin creating and managing your
          vaults. Deposit funds into your vaults and participate in vaults created by others. The
          platform is user-friendly, making decentralized fund management accessible to everyone.
        </p>
      </section>
      {/* <div className="my-12 h-[2px] max-w-6xl mx-auto bg-white"></div> */}
      {/* <RecentVaultSection /> */}
      {/* <StatSection /> */}
    </main>
  );
}
