import Link from 'next/link';

import { AccountConnect } from '@/components/account/AccountConnect';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/shadcn/Navigation';
import { LogoSvg } from './icons/LogoSvg';

export const Navigation: IComponent = () => {
  return (
    <div className="flex items-center justify-between py-4 pl-16">
      <Link href="/">
        <LogoSvg className="w-12 h-12" />
      </Link>
      <div className="py-8 px-20 flex justify-end items-center">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/docs" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  About
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/vaults" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Vaults
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/docs" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Policy
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/docs" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Documentation
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem className="pl-8 flex justify-end">
              <div className="w-max">
                <AccountConnect />
              </div>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};
