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
import { useCallback, useEffect, useState } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { wagmiConfig } from '@/utils/wagmi';
import { SMART_VAULT_ABI } from '@/constants/abi';
import { ProjectENV } from '@env';
import { formatEther } from 'viem';

type Contribution = {
  txHash: `0x${string}`;
  contributor: `0x${string}`;
  attestation: `0x${string}`;
  time: Date;
  amount: bigint;
};

type Claim = {
  txHash: `0x${string}`;
  validation: `0x${string}`;
  attestation: `0x${string}`;
  time: Date;
  amount: bigint;
};

type Record = Contribution | Claim;

export const TableTxs: IComponent<{
  vaultId: `0x${string}`;
  recordType: 'Contribute' | 'Claim';
}> = ({ vaultId, recordType }) => {
  const publicClient = usePublicClient({ config: wagmiConfig });
  const [records, setRecords] = useState<Record[]>([]);

  const convertBlockNumberToTime = (blockNumber: bigint) => {
    const blockRef = 11800000;
    const timeAtBlockRef = 1719368288000;
    const timePerBlock = 2000;
    return new Date((Number(blockNumber) - blockRef) * timePerBlock + timeAtBlockRef);
  };

  useWatchContractEvent({
    address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as `0x${string}`,
    abi: SMART_VAULT_ABI,
    eventName: recordType === 'Contribute' ? 'Contribute' : 'Claim',
    args: {
      vaultId,
    },
    onLogs: () => {
      if (recordType === 'Contribute') {
        fetchContributionList();
      } else {
        fetchClaimList();
      }
    },
  });

  const fetchContributionList = useCallback(async () => {
    const events = await publicClient.getContractEvents({
      address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as `0x${string}`,
      abi: SMART_VAULT_ABI,
      eventName: 'Contribute',
      args: {
        vaultId,
      },
      fromBlock: 11908090n,
    });

    const data = events.map((event) => {
      return {
        txHash: event.transactionHash as `0x${string}`,
        contributor: event.args.contributor as `0x${string}`,
        attestation: event.args.contributionAttestation as `0x${string}`,
        time: convertBlockNumberToTime(event.blockNumber),
        amount: event.args.amount as bigint,
      };
    });
    data.reverse();
    setRecords([...data]);
  }, [publicClient, vaultId]);

  const fetchClaimList = useCallback(async () => {
    const events = await publicClient.getContractEvents({
      address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as `0x${string}`,
      abi: SMART_VAULT_ABI,
      eventName: 'Claim',
      args: {
        vaultId,
      },
      fromBlock: 11908090n,
    });

    const data = events.map((event) => {
      return {
        txHash: event.transactionHash as `0x${string}`,
        validation: event.args.validatedAttestion as `0x${string}`,
        attestation: event.args.claimAttestation as `0x${string}`,
        time: convertBlockNumberToTime(event.blockNumber),
        amount: event.args.amount as bigint,
      };
    });
    data.reverse();
    setRecords([...data]);
  }, [publicClient, vaultId]);

  useEffect(() => {
    if (recordType === 'Contribute') {
      fetchContributionList();
    } else {
      fetchClaimList();
    }
  }, [recordType, fetchContributionList, fetchClaimList]);

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {recordType === 'Contribute' ? 'List of contributors' : 'List of claimers'}
      </h1>
      <Table>
        <TableCaption>Contribution Records</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Tx Hash</TableHead>
            <TableHead>{recordType === 'Contribute' ? 'Contributor' : 'Validation UID'}</TableHead>
            <TableHead>Attestation</TableHead>
            <TableHead className="text-right">
              {recordType === 'Contribute' ? 'Contribute At' : 'Claim At'}
            </TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, id) => (
            <TableRow key={id}>
              <TableCell className="font-medium">{record.txHash}</TableCell>
              <TableCell>
                {recordType === 'Contribute'
                  ? (record as Contribution).contributor
                  : (record as Claim).validation}
              </TableCell>
              <TableCell>{record.attestation}</TableCell>
              <TableCell className="text-right">{record.time.toLocaleString()}</TableCell>
              <TableCell className="text-right">{formatEther(record.amount)} ETH</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
