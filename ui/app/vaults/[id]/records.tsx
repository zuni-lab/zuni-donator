'use client';

import { CopyToClipboard } from '@/components/CopyToClipboard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/Table';
import { SMART_VAULT_ABI } from '@/constants/abi';
import { defaultNetworkConfig } from '@/utils/network';
import { getForrmattedFullDate } from '@/utils/tools';
import { wagmiConfig } from '@/utils/wagmi';
import { ProjectENV } from '@env';
import { Copy } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { usePublicClient, useWatchContractEvent } from 'wagmi';

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

const isContribution = (record: Record): record is Contribution => {
  return (record as Contribution).contributor !== undefined;
};

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
      <h1 className="text-2xl font-bold py-4">
        {recordType === 'Contribute' ? 'Contributors' : 'Claimers'}
      </h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[190px]">Tx Hash</TableHead>
            <TableHead className="w-[408px]">
              {recordType === 'Contribute' ? 'Contributor' : 'Validation UID'}
            </TableHead>
            <TableHead>Attestation</TableHead>
            <TableHead className="text-right">
              {/* {recordType === 'Contribute' ? 'Contribute At' : 'Claim At'} */}
              Time At
            </TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, id) => (
            <TableRow key={id}>
              <TableCell className="font-medium">
                <div className="text-gray-400 flex items-center gap-2">
                  <Link
                    href={`${baseSepolia.blockExplorers.default.url}/tx/${record.txHash}`}
                    passHref
                    legacyBehavior>
                    <a className="text-primary underline line-clamp-1" target="_blank">
                      {record.txHash.slice(0, 6) + '...' + record.txHash.slice(-6)}
                    </a>
                  </Link>
                  <CopyToClipboard text={record.txHash}>
                    <Copy size={16} />
                  </CopyToClipboard>
                </div>
              </TableCell>
              <TableCell>
                {isContribution(record) && (
                  <div className="text-gray-400 flex items-center gap-2">
                    <span className="text-gray-400 line-clamp-1">{record.contributor}</span>
                    <CopyToClipboard text={record.contributor}>
                      <Copy size={16} />
                    </CopyToClipboard>
                  </div>
                )}
                {!isContribution(record) && (
                  <div className="text-gray-400 flex items-center gap-2">
                    <Link
                      href={`${defaultNetworkConfig.easScan}/attestation/view/${record.validation}`}
                      passHref
                      legacyBehavior>
                      <a className="text-primary underline line-clamp-1" target="_blank">
                        {record.validation.slice(0, 19) + '...' + record.validation.slice(-19)}
                      </a>
                    </Link>
                    <CopyToClipboard text={record.txHash}>
                      <Copy size={16} />
                    </CopyToClipboard>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="text-gray-400 flex items-center gap-2">
                  <Link
                    href={`${defaultNetworkConfig.easScan}/attestation/view/${record.attestation}`}
                    passHref
                    legacyBehavior>
                    <a className="text-primary underline line-clamp-1" target="_blank">
                      {record.attestation.slice(0, 8) + '...' + record.attestation.slice(-8)}
                    </a>
                  </Link>
                  <CopyToClipboard text={record.txHash}>
                    <Copy size={16} />
                  </CopyToClipboard>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {getForrmattedFullDate(record.time.getTime())}
              </TableCell>
              <TableCell className="text-right">{formatEther(record.amount)} ETH</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
