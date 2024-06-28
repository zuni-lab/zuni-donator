'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shadcn/Card';
import { defaultNetworkConfig } from '@/utils/network';
import { getFormattedTimeAndDate, isValidAddress } from '@/utils/tools';
import { ClaimType } from '@/utils/vaults/claim';
import { RuleOperators, getOperator } from '@/utils/vaults/operators';
import { splitValidationSchema } from '@/utils/vaults/schema';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { decodeAbiParameters } from 'viem';

export const VaultCard: IComponent<TVault> = ({
  uuid,
  name,
  description,
  contributeStart,
  contributeEnd,
  validationSchemaUID,
  operators,
  thresholds,
  claimType,
  fixedAmount,
  percentage,
  validationSchema,
}) => {
  const splittedValidationSchema = splitValidationSchema(validationSchema);
  return (
    <CardContainer
      title={name}
      description={description}
      link={`/vaults/${uuid}`}
      linkTitle="Explore the vault"
      className="min-h-[400px] hover:scale-105 duration-150 group"
      renderFooter={() => (
        <div className="w-full flex items-center justify-between text-sm text-gray-400">
          <div className="flex flex-col text-xs">
            <span className="flex justify-between">
              <span className="w-12 text-white">Start:</span>
              {getFormattedTimeAndDate(Number(contributeStart))}
            </span>
            <span className="flex justify-between">
              <span className="w-12 text-white">End:</span>
              {getFormattedTimeAndDate(Number(contributeEnd))}
            </span>
          </div>
          <div className="flex flex-col text-xs">
            {claimType === ClaimType.FIXED ? (
              <>
                <span className="text-white">Fixed Amount</span>
                <span className="text-blue-500">{Number(fixedAmount) / 1e18} ETH</span>
              </>
            ) : (
              <>
                <span className="text-white">Percentage</span>
                <span className="text-blue-500">{Number(percentage) / 1e18}%</span>
              </>
            )}
          </div>
        </div>
      )}>
      <div className="w-full h-full text-sm space-y-2">
        <div>
          <h3 className="text-white">Schema: </h3>
          <Link
            href={`${defaultNetworkConfig.easScan}/schema/view/${validationSchemaUID}`}
            passHref
            legacyBehavior>
            <a className="text-primary underline line-clamp-1" target="_blank">
              {validationSchemaUID.slice(0, 17) + '...' + validationSchemaUID.slice(-17)}
            </a>
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="text-white">Operator:</span>
          <span className="text-white col-span-2">Threshold:</span>
        </div>
        {operators.slice(0, 6).map((operator, index) => {
          const isNoneOperator = operator === RuleOperators.NONE[0];
          let thresholdValue = '-';
          if (!isNoneOperator) {
            const type = splittedValidationSchema[index][0];
            const abi = [
              {
                type: type,
                value: thresholds[index],
              },
            ];
            const value = decodeAbiParameters(abi, thresholds[index])[0] as string;
            thresholdValue = isValidAddress(value)
              ? value.slice(0, 8) + '...' + value.slice(-8)
              : value;
          }
          return (
            <div key={index} className="grid grid-cols-3 gap-2">
              <span className="text-gray-400">
                {getOperator(operator) || `Unknown Operator ${operator}`}
              </span>
              <span className="text-gray-400 col-span-2 line-clamp-1">{thresholdValue}</span>
            </div>
          );
        })}
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
    <Card
      className={`flex flex-col justify-between glass shadow-md rounded-md overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-8">{description}</CardDescription>
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
