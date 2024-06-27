'use client';

import { Button } from '@/shadcn/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shadcn/Form';
import { Input } from '@/shadcn/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/Select';

import { SMART_VAULT_ABI } from '@/constants/abi';
import { BLACK_LIST_SCHEMA } from '@/constants/schema';
import { useActionDebounce } from '@/hooks/useAction';
import { useSchemaStore } from '@/states/schema';
import { ClaimType, isValidType } from '@/utils/claim';
import {
  getMaxValue,
  getOperatorLabel,
  getOperatorNumber,
  getValidationSchema,
  isNumericType,
  parseValidationSchema,
} from '@/utils/rule';
import { isValidBytesWithLength, isValidFloat, toUtcTime } from '@/utils/tools';
import { ProjectENV } from '@env';
import { zodResolver } from '@hookform/resolvers/zod';
import { cx } from 'class-variance-authority';
import { Loader, ShieldBan, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { encodeAbiParameters } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract, type BaseError } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

import { z } from 'zod';
import { TooltipWrapper } from '../TooltipWrapper';

const now = new Date().getTime(); // Current time in milliseconds
const tenMinutesLater = new Date(now + 10 * 60 * 1000); // 10 minutes later

const latterThanCurrentTimeTenMinutes = (msg: string) =>
  z.string().refine(
    (val) => {
      const time = new Date(val);
      if (isNaN(time.getTime())) {
        return false;
      }
      // add time zone offset
      time.setMinutes(time.getMinutes() - time.getTimezoneOffset());
      return time.getTime() > now;
    },
    { message: msg }
  );

const baseFormSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Name is required'),
  description: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Description is required'),
  depositStart: latterThanCurrentTimeTenMinutes(
    'Deposit start must be at least 10 minutes in the future'
  ),
  depositEnd: latterThanCurrentTimeTenMinutes(
    'Deposit end must be at least 10 minutes in the future'
  ),
  claimType: z.enum(['FIXED', 'PERCENTAGE'], { message: 'Claim type is required' }),
  claimAmount: z.string().optional(),
  claimPercentage: z.string().optional(),
  validationSchema: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => isValidBytesWithLength(val, 32), {
      message: 'Validation schema must be a valid bytes string, eg. 0x3a2fa...80a42',
    }),
});

export const VaultForm: IComponent = () => {
  const { registry } = useSchemaStore();
  const debounce = useActionDebounce(1000, true);

  const [dynamicSchema, setDynamicSchema] = useState(z.object({}));
  const [parsedRules, setParsedRules] = useState<TRule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { data: hash, isPending, writeContract, error } = useWriteContract();

  const combinedSchema = baseFormSchema
    .extend(dynamicSchema.shape)
    .refine(
      (data) => {
        const depositStart = new Date(data.depositStart).getTime();
        const depositEnd = new Date(data.depositEnd).getTime();
        return depositStart < depositEnd;
      },
      {
        message: 'Deposit end must be greater than deposit start',
        path: ['depositEnd'],
      }
    )
    .superRefine((data, ctx) => {
      let valid = false;
      let path = '';
      let msg = '';
      if (data.claimType === 'FIXED' && data.claimAmount) {
        if (isValidFloat(data.claimAmount) && !isNaN(parseFloat(data.claimAmount))) {
          const num = parseFloat(data.claimAmount);
          valid = num > 0 && num <= getMaxValue('uint64');
        }
        path = 'claimAmount';
        msg = 'Claim amount must be a valid number, greater than 0 and less than 2^64';
      } else if (data.claimType === 'PERCENTAGE' && data.claimPercentage) {
        if (isValidFloat(data.claimPercentage) && !isNaN(parseFloat(data.claimPercentage))) {
          const num = parseFloat(data.claimPercentage);
          valid = num >= 0 && num <= 100;
        }
        path = 'claimPercentage';
        msg = 'Claim percentage must be a valid number between 0 and 100';
      }
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: msg,
          path: [path],
        });
      }
    });

  let defaultValues = {
    name: '',
    description: '',
    depositEnd: tenMinutesLater.toISOString().slice(0, 16),
    depositStart: tenMinutesLater.toISOString().slice(0, 16),
    claimType: '',
    claimAmount: '',
    claimPercentage: '',
    validationSchema: '',
  };

  parsedRules.forEach((rule) => {
    defaultValues = {
      ...defaultValues,
      [rule.name]: rule.defaultValue,
      [`${rule.name}_op`]: '',
    };
  });

  const form = useForm({
    resolver: zodResolver(combinedSchema),
    defaultValues,
  });

  const { control, handleSubmit, watch } = form;

  const watchValidationSchema = watch('validationSchema').trim();

  const reset = useCallback(() => {
    form.reset();
    setParsedRules([]);
    setDynamicSchema(z.object({}));
  }, [form, setParsedRules, setDynamicSchema]);

  useEffect(() => {
    if (!registry) {
      return;
    }
    debounce(async () => {
      setLoading(true);
      if (!isValidBytesWithLength(watchValidationSchema, 32)) {
        reset();
        setLoading(false);
        return;
      }
      try {
        const schemaRecord = await registry?.getSchema({ uid: watchValidationSchema });
        if (!schemaRecord) {
          reset();
          setLoading(false);
          return;
        }

        if (BLACK_LIST_SCHEMA.includes(schemaRecord.schema)) {
          reset();
          setLoading(false);
          return;
        }

        const rules = parseValidationSchema(schemaRecord.schema);
        setParsedRules(rules);
        setDynamicSchema(getValidationSchema(rules));
      } catch (error) {
        reset();
      } finally {
        setLoading(false);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchValidationSchema, registry, reset]);

  const handlePressSubmit = handleSubmit((values) => {
    if (parsedRules.length === 0) {
      form.setError('validationSchema', { message: 'The validation schema is invalid' });
      return;
    }

    const ops: number[] = [];
    const thresholds: `0x${string}`[] = [];

    parsedRules.forEach((rule) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opKey = (values as any)[`${rule.name}_op` as any];
      if (!opKey) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setError(`${rule.name}_op` as any, { message: 'Operator is required' });
        return;
      }

      const op = getOperatorNumber(opKey);
      if (op === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setError(`${rule.name}_op` as any, { message: 'Invalid operator' });
        return;
      }
      ops.push(op);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (values as any)[rule.name as any];
      const encodedData = encodeAbiParameters([{ type: rule.type }], [value]);
      thresholds.push(encodedData);
    });

    if (ops.length === 0 || thresholds.length === 0) {
      form.setError('validationSchema', { message: 'Invalid schema' });
      return;
    }

    if (ops.length !== thresholds.length) {
      form.setError('validationSchema', { message: 'Invalid schema' });
      return;
    }

    if (!isValidType(values.claimType)) {
      form.setError('claimType', { message: 'Claim type is required' });
      return;
    }

    let claimData: TClaimData = {} as TClaimData;
    if (values.claimType === 'FIXED') {
      claimData = {
        claimType: ClaimType.FIXED,
        fixedAmount: BigInt(parseFloat(values.claimAmount) * 1e18),
        percentage: BigInt(0),
        customData: '0x' as `0x${string}`,
      };
    } else if (values.claimType === 'PERCENTAGE') {
      claimData = {
        claimType: ClaimType.PERCENTAGE,
        fixedAmount: BigInt(0),
        percentage: BigInt(parseFloat(values.claimPercentage) * 1e18),
        customData: '0x' as `0x${string}`,
      };
    }

    writeContract({
      address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as `0x${string}`,
      abi: SMART_VAULT_ABI,
      functionName: 'createVault',
      args: [
        values.name,
        values.description,
        BigInt(toUtcTime(new Date(values.depositStart)).getTime()),
        BigInt(toUtcTime(new Date(values.depositEnd)).getTime()),
        values.validationSchema as `0x${string}`,
        ops,
        thresholds,
        claimData,
      ],
    });
    debounce(() => {
      reset();
    });
  });

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const renderSchemaStatus = useMemo(() => {
    if (loading) {
      return <Loader className="w-4 h-4 text-background animate-spin" />;
    }
    if (parsedRules.length === 0) {
      return (
        <TooltipWrapper text="The validation schema is not found">
          <ShieldBan className="w-4 h-4 text-red-500" />
        </TooltipWrapper>
      );
    }
    return (
      <TooltipWrapper text="The validation schema is valid">
        <ShieldCheck className="w-4 h-4 text-green-500" />
      </TooltipWrapper>
    );
  }, [parsedRules, loading]);

  const renderInputField = useCallback(
    (props: {
      name:
        | 'name'
        | 'description'
        | 'depositStart'
        | 'depositEnd'
        | 'validationSchema'
        | 'claimAmount'
        | 'claimPercentage';
      label: string;
      placeholder: string;
      type?: 'text' | 'datetime-local';
      renderSuffix?: React.ReactNode;
      className?: string;
    }) => {
      if (!props.type) {
        props.type = 'text';
      }
      return (
        <FormField
          control={control}
          name={props.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel
                className="flex items-center gap-1"
                required
                renderSuffix={props.renderSuffix}>
                {props.label}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type={props.type}
                  placeholder={props.placeholder}
                  className={cx(
                    'bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700',
                    props.className
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    },
    [control]
  );

  const renderRuleOp = useCallback(
    (rule: TRule) => {
      return (
        <FormField
          control={control}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={`${rule.name}_op` as any}
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {rule.ops.map((op, index) => (
                    <SelectItem key={index} value={op}>
                      {getOperatorLabel(op)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    },
    [control]
  );

  const renderRuleValue = useCallback(
    (rule: TRule) => {
      return (
        <FormField
          control={control}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={rule.name as any}
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormControl>
                {(() => {
                  if (isNumericType(rule.type)) {
                    return (
                      <Input
                        // disabled={watch(`${rule.name}_op` as any) === 'NONE'}
                        placeholder={`The value of ${rule.name} threshold`}
                        {...field}
                        className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                      />
                    );
                  } else if (rule.type === 'bool') {
                    return (
                      <Select
                        // disabled={watch(`${rule.name}_op` as any) === 'NONE'}
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white focus:ring-blue-300 border-blue-400 [&>*]:text-gray-700">
                            <SelectValue placeholder="Select a value" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white text-gray-700">
                          <SelectItem value={'true'}>True</SelectItem>
                          <SelectItem value={'false'}>False</SelectItem>
                        </SelectContent>
                      </Select>
                    );
                  }
                  return (
                    <Input
                      // disabled={watch(`${rule.name}_op` as any) === 'NONE'}
                      placeholder={`The value of ${rule.name} threshold`}
                      {...field}
                      className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                    />
                  );
                })()}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    },
    [control]
  );

  const watchClaimType = watch('claimType');

  const renderClaim = useCallback(() => {
    return (
      <div className="grid grid-cols-2 gap-2 items-start">
        <FormField
          control={control}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name="claimType"
          render={({ field }) => (
            <FormItem
              className={cx({
                'col-span-2': !isValidType(watchClaimType),
              })}>
              <FormLabel required>Type of claim</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white focus:ring-blue-300 border-blue-400 [&>*]:text-gray-700">
                    <SelectValue placeholder="Type of claim" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white text-gray-700">
                  {Object.keys(ClaimType).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {watchClaimType === 'FIXED' &&
          renderInputField({
            name: 'claimAmount',
            label: 'Amount (ETH)',
            placeholder: 'Eg. 10',
            className: 'translate-y-[4px]',
          })}
        {watchClaimType === 'PERCENTAGE' &&
          renderInputField({
            name: 'claimPercentage',
            label: 'Percentage (%)',
            placeholder: 'Eg. 0-100',
          })}
      </div>
    );
  }, [control, watchClaimType, renderInputField]);

  return (
    <Form {...form}>
      <form onSubmit={handlePressSubmit} className="space-y-2">
        {renderInputField({
          name: 'name',
          label: 'Name',
          placeholder: 'The name of the vault',
        })}

        {renderInputField({
          name: 'description',
          label: 'Description',
          placeholder: 'The description of the vault',
        })}

        <div className="grid grid-cols-2 gap-2">
          {renderInputField({
            name: 'depositStart',
            label: 'Deposit start (UTC)',
            placeholder: 'The start of the deposit period',
            type: 'datetime-local',
          })}
          {renderInputField({
            name: 'depositEnd',
            label: 'Deposit end (UTC)',
            placeholder: 'The end of the deposit period',
            type: 'datetime-local',
          })}
        </div>
        {renderClaim()}
        {renderInputField({
          name: 'validationSchema',
          label: 'Validation schema',
          placeholder: 'The UID of the validation schema. Eg.0x3a2fa...80a42',
          renderSuffix: renderSchemaStatus,
        })}
        {parsedRules.length > 0 && (
          <>
            <h3 className="text-center font-semibold text-sm text-gray-800 !my-4">
              Rules of vault
            </h3>
            <div className="max-h-[45vh] overflow-y-auto space-y-2">
              {parsedRules.map((rule, index) => {
                return (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <FormLabel className="col-span-3" required={rule.type !== 'string'}>
                      {rule.name}
                      <span className="ml-1 text-gray-500 text-xs">({rule.type})</span>
                    </FormLabel>
                    {renderRuleOp(rule)}
                    {renderRuleValue(rule)}
                  </div>
                );
              })}
            </div>
          </>
        )}
        <div className="flex items-center justify-center !mt-4">
          <Button type="submit" className="px-4" disabled={isPending || isConfirming}>
            {isPending || isConfirming ? (
              <Loader className="w-4 h-4 text-background animate-spin" />
            ) : (
              'Submit'
            )}
          </Button>
        </div>
        {error && (
          <div className="text-destructive">
            Error: {(error as BaseError).shortMessage || error.message}
          </div>
        )}
        {hash && (
          <div className="text-gray-700 text-sm flex flex-col">
            Transaction ID:
            <Link
              href={`${baseSepolia.blockExplorers.default.url}/tx/${hash}`}
              passHref
              legacyBehavior>
              <a target="_blank" className="text-blue-600 underline text-xs">
                {hash}
              </a>
            </Link>
          </div>
        )}
        {/* {isConfirming && <div>Waiting for confirmation...</div>} */}
        {/* {isConfirmed && <div>Transaction confirmed.</div>} */}
      </form>
    </Form>
  );
};
