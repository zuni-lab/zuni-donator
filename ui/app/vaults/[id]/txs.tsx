'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/Table';
import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { wagmiConfig } from '@/utils/wagmi';
import { SMART_VAULT_ABI } from '@/constants/abi';
import { ProjectENV } from '@env';
import { formatEther } from 'viem';

type Contribution = {
  txHash: `0x${string}`;
  contributor: `0x${string}`;
  attestation: string;
  contributeAt: bigint;
  amount: bigint;
};

export const TableTxs: IComponent = () => {
  const publicClient = usePublicClient({ config: wagmiConfig });
  const [contributionList, setContributionList] = useState<Contribution[]>([]);

  useEffect(() => {
    if (!publicClient) return;
    (async () => {
      const events = await publicClient.getContractEvents({
        address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as `0x${string}`,
        abi: SMART_VAULT_ABI,
        eventName: 'Contribute',
        fromBlock: 11908090n,
      });

      const data = events.map((event) => {
        return {
          txHash: event.transactionHash as `0x${string}`,
          contributor: event.args.contributor as `0x${string}`,
          attestation: event.args.contributionAttestation as string,
          contributeAt: event.blockNumber as bigint,
          amount: event.args.amount as bigint,
        };
      });
      setContributionList([...data]);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">List of contributors</h1>
      <Table>
        <TableCaption>Contribution Records</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Tx Hash</TableHead>
            <TableHead>Contributor</TableHead>
            <TableHead>Attestation</TableHead>
            <TableHead className="w-[300px]">Contribute at</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contributionList.map((contribution, id) => (
            <TableRow key={id}>
              <TableCell className="font-medium">{contribution.txHash}</TableCell>
              <TableCell>{contribution.contributor}</TableCell>
              <TableCell>{contribution.attestation}</TableCell>
              <TableCell className="w-[300px]">{Number(contribution.contributeAt)}</TableCell>
              <TableCell className="text-right">{formatEther(contribution.amount)} ETH</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
