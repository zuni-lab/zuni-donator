'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shadcn/Card';
import { getNetworkConfig } from '@/utils/network';
import { getForrmattedFullDate, isValidAddress } from '@/utils/tools';
import { ClaimType } from '@/utils/vaults/claim';
import { RuleOperators, getShortOperator } from '@/utils/vaults/operators';
import { splitValidationSchema } from '@/utils/vaults/schema';
import { wagmiConfig } from '@/utils/wagmi';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { decodeAbiParameters } from 'viem';
import { usePublicClient } from 'wagmi';

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
  const publicClient = usePublicClient({ config: wagmiConfig });
  const networkConfig = getNetworkConfig(publicClient.chain.id);
  const splittedValidationSchema = splitValidationSchema(validationSchema);

  return (
    <CardContainer
      title={name}
      description={description}
      link={`/vaults/${uuid}`}
      linkTitle="Explore the vault"
      className="min-h-[360px] hover:scale-105 duration-150 group"
      renderFooter={() => (
        <div className="w-full flex items-center justify-between text-sm text-gray-400">
          <div className="flex flex-col text-xs">
            <span className="flex justify-between">
              <span className="w-12 text-white">Start:</span>
              {getForrmattedFullDate(Number(contributeStart) * 1000)}
            </span>
            <span className="flex justify-between">
              <span className="w-12 text-white">End:</span>
              {getForrmattedFullDate(Number(contributeEnd) * 1000)}
            </span>
          </div>
          <div className="flex flex-col text-xs">
            {claimType === ClaimType.FIXED ? (
              <>
                <span className="text-white">Fixed Amount</span>
                <span className="text-blue-500 text-right">{Number(fixedAmount) / 1e18} ETH</span>
              </>
            ) : (
              <>
                <span className="text-white">Percentage</span>
                <span className="text-blue-500 text-right">{Number(percentage) / 1e18}%</span>
              </>
            )}
          </div>
        </div>
      )}>
      <div className="w-full h-full text-sm">
        <div>
          <h3 className="text-white">Valid attestation: </h3>
          <Link
            href={`${networkConfig.easScan}/schema/view/${validationSchemaUID}`}
            passHref
            legacyBehavior>
            <a className="text-primary underline line-clamp-1 mt-2" target="_blank">
              {validationSchemaUID.slice(0, 17) + '...' + validationSchemaUID.slice(-17)}
            </a>
          </Link>
        </div>
        <div className="py-4">
          <h3 className="text-white">Conditions: </h3>
          <table className="table-fixed">
            <tbody>
              {splittedValidationSchema.slice(0, 3).map((item, index) => {
                const name = item[1];
                const operator = operators[index];
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
                    ? value.slice(0, 4) + '...' + value.slice(-4)
                    : value;
                }
                return (
                  <tr
                    key={index}
                    className="text-gray-400 [&>td]:pr-4 [&>td]:py-1 [&>td]:align-middle">
                    <td className="w-1/3t">
                      {name.length > 16 ? name.slice(0, 6) + '...' + name.slice(-6) : name}
                    </td>
                    <td className="w-1/4">{getShortOperator(operator) || `Unknown ${operator}`}</td>
                    <td className="text-right min-w-[40px]">{thresholdValue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <span>
            {splittedValidationSchema.length > 3 && (
              <span className="text-primary text-xs">
                +{splittedValidationSchema.length - 3} more
              </span>
            )}
          </span>
        </div>
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
      className={`flex flex-col justify-between glass shadow-md rounded-lg overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-8">{description}</CardDescription>
        <hr />
      </CardHeader>
      <CardContent className="grow py-1">{children}</CardContent>
      <CardFooter className="relative overflow-hidden pt-2">
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
      </CardFooter>
    </Card>
  );
};
