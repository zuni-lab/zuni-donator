'use client';

import { ArrowTopRightIcon, GitHubLogoIcon } from '@radix-ui/react-icons';
import NextLink from 'next/link';
import { LogoSvg } from './icons/LogoSvg';
import { cx } from 'class-variance-authority';

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

export const Footer: IComponent = () => {
  return (
    <footer className="section flex flex-1 flex-col justify-end py-20">
      <div className="flex flex-col justify-between gap-16 bg-boat-footer-dark-gray py-12">
        <div className="container mx-auto flex w-full flex-col justify-between gap-16 px-8 md:flex-row">
          <div className="flex flex-col justify-between">
            <div className="flex h-8 items-center justify-start gap-2">
              <NextLink
                href="/"
                passHref
                className="relative h-8 w-8 flex items-center"
                aria-label="Home page">
                <LogoSvg className="w-6 h-6" />
              </NextLink>
              <NextLink
                href="/"
                passHref
                className="font-robotoMono text-center text-xl font-medium text-white no-underline">
                Zuni Vault
              </NextLink>
              <NavbarLink
                className="pl-2"
                href="https://github.com/coinbase/build-onchain-apps"
                target="_blank">
                <GitHubLogoIcon
                  width="24"
                  height="24"
                  aria-label="build-onchain-apps Github respository"
                />
              </NavbarLink>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center">
              <p className="text-base font-normal leading-7 text-boat-footer-light-gray">
                This project is applied at{' '}
                <NextLink
                  href="https://onchain-summer.devfolio.co"
                  className="underline"
                  target="_blank">
                  Onchain Summer Buildathon
                </NextLink>{' '}
              </p>
            </div>
          </div>
          <div className="font-robotoMono flex flex-col items-start justify-center gap-4 text-center text-xl font-medium text-white">
            CONTACT US
            <NavbarLink href="https://discord.gg/NhUfGfJwah">
              <span className="flex items-center gap-1 px-2">
                Discord <ArrowTopRightIcon width="16" height="16" />
              </span>
            </NavbarLink>
            <NavbarLink href="https://discord.gg/NhUfGfJwah">
              <span className="flex items-center gap-1 px-2">
                Telegram <ArrowTopRightIcon width="16" height="16" />
              </span>
            </NavbarLink>
            <NavbarLink href="https://discord.gg/NhUfGfJwah">
              <span className="flex items-center gap-1 px-2">
                Email <ArrowTopRightIcon width="16" height="16" />
              </span>
            </NavbarLink>
          </div>
        </div>
      </div>
    </footer>
  );
};
