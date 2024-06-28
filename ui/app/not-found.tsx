import { HomeIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto my-12 glass max-w-lg rounded-xl py-12 flex flex-col items-center gap-4">
      <h2 className="text-xl">Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/" passHref legacyBehavior>
        <a className="text-primary">
          <HomeIcon className="w-4 h-4 inline " /> Return Home
        </a>
      </Link>
    </div>
  );
}
