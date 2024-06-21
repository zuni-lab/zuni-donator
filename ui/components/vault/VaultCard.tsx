'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shadcn/Card';
import { getFormattedDate } from '@/utils/datetime';
import { formatWalletAddress } from '@/utils/hex';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CopyToClipboard } from '../CopyToClipboard';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';

export const VaultCard: IComponent<TVault> = ({
  uuid,
  title,
  description,
  rules,
  creator,
  createdAt,
}) => {
  return (
    <CardContainer
      title={title}
      description={description}
      link={`/vaults/${uuid}`}
      linkTitle="Explore the vault"
      className="min-h-[400px] hover:scale-105 duration-150 group"
      renderFooter={() => (
        <div className="w-full flex items-center justify-between text-xs">
          <CopyToClipboard text={creator}>
            By <span className="text-primary font-bold">@{formatWalletAddress(creator)}</span>
          </CopyToClipboard>
          <span>{getFormattedDate(createdAt)}</span>
        </div>
      )}>
      <div>
        {rules.map((rule, index) => (
          <div key={index}>{rule}</div>
        ))}
      </div>
    </CardContainer>
  );
};

const CardContainer: IComponent<{
  title: string;
  description: string;
  link?: string;
  className?: string;
  renderFooter?: () => JSX.Element;
  linkTitle?: string;
}> = ({ title, description, className, link, linkTitle, renderFooter, children }) => {
  return (
    <Card className={`flex flex-col justify-between bg-accent shadow-md rounded-md ${className}`}>
      <CardHeader>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-11">{description}</CardDescription>
        <hr />
      </CardHeader>
      <CardContent className="grow">{children}</CardContent>
      <CardFooter className="relative overflow-hidden pt-2">
        {
          <>
            {renderFooter && renderFooter()}
            {link && (
              <Link href={link} passHref legacyBehavior>
                <a className="absolute bottom-0 top-0 left-0 right-0 flex flex-col justify-center bg-primary shadow-md transition-all duration-300 ease-in-out transform group-hover:translate-y-0 group-hover:opacity-100 opacity-0 translate-y-full rounded-b-md">
                  <span className="flex justify-center items-center gap-4">
                    {linkTitle} <ArrowRightIcon className="w-6 h-5" />
                  </span>
                </a>
              </Link>
            )}
          </>
        }
      </CardFooter>
    </Card>
  );
};
