import { cx } from '@/utils/tools';
import NextLink from 'next/link';


export const NavbarLink: IComponent<{
    href: string;
    children: React.ReactNode;
    target?: string;
    ariaLabel?: string;
    className?: string;
  }> = ({ href, className, children, target, ariaLabel }) => {
    return (
      <NextLink
        href={href}
        className={cx('px-0 text-center text-base font-normal text-white no-underline', className)}
        target={target}
        aria-label={ariaLabel}>
        {children}
      </NextLink>
    );
  };