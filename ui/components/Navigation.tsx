import Link from 'next/link';

import { AccountConnect } from '@/components/account/AccountConnect';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/shadcn/Navigation';
import { AppRouter } from '@/constants/router';
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
            {Object.entries(AppRouter)
              .filter(([k]) => k !== 'Home' && k !== 'Vaults')
              .map(([k, v]) => (
                <NavigationMenuItem key={v}>
                  <Link href={v} passHref legacyBehavior>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      {k}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}

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
