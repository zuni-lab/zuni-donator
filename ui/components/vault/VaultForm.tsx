'use client';

import { Button } from '@/shadcn/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shadcn/Form';
import { Input } from '@/shadcn/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/Select';

import { SMART_VAULT_ABI } from '@/constants/abi';
import { useActionDebounce } from '@/hooks/useAction';
import {
  getValidationSchema,
  isUnsupportedRule,
  parseValidationSchema,
  validateField,
} from '@/utils/vaults/schema';
import { getMaxValue, isNumericType } from '@/utils/vaults/types';
import { ClaimType, isValidType } from '@/vaults/claim';
import { RuleOperators, getOperatorLabel, getOperatorNumber } from '@/vaults/operators';

import { isValidBytesWithLength, isValidFloat, toUtcTime } from '@/utils/tools';
import { ProjectENV } from '@env';
import { zodResolver } from '@hookform/resolvers/zod';
import { cx } from 'class-variance-authority';
import { Loader, ShieldBan, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { encodeAbiParameters } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

import { useSchemaRegistry } from '@/hooks/useSchemaRegisty';
import { z } from 'zod';
import { TooltipWrapper } from '../TooltipWrapper';
import { TxDialog } from './TxDialog';

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
  _zuni_smv_name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Name is required'),
  _zuni_smv_description: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Description is required'),
  _zuni_smv_depositStart: latterThanCurrentTimeTenMinutes(
    'Deposit start must be at least 10 minutes in the future'
  ),
  _zuni_smv_depositEnd: latterThanCurrentTimeTenMinutes(
    'Deposit end must be at least 10 minutes in the future'
  ),
  _zuni_smv_claimType: z.enum(['FIXED', 'PERCENTAGE'], { message: 'Claim type is required' }),
  _zuni_smv_claimAmount: z.string().optional(),
  _zuni_smv_claimPercentage: z.string().optional(),
  _zuni_smv_validationSchema: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => isValidBytesWithLength(val, 32), {
      message: 'Validation schema must be a valid bytes string, eg. 0x3a2fa...80a42',
    }),
});

const baseDefaultValues = {
  _zuni_smv_name: '',
  _zuni_smv_description: '',
  _zuni_smv_depositEnd: tenMinutesLater.toISOString().slice(0, 16),
  _zuni_smv_depositStart: tenMinutesLater.toISOString().slice(0, 16),
  _zuni_smv_claimType: '',
  _zuni_smv_claimAmount: '',
  _zuni_smv_claimPercentage: '',
  _zuni_smv_validationSchema: '',
};

const genDefaultValues = (rules: TRule[]) => {
  let defaultValues = { ...baseDefaultValues };
  rules.forEach((rule) => {
    defaultValues = {
      ...defaultValues,
      [rule.name]: '',
      [`${rule.name}_op`]: isUnsupportedRule(rule) ? 'NONE' : '',
    };
  });
  return defaultValues;
};

export const VaultForm: IComponent = () => {
  const { registry, error } = useSchemaRegistry(
    ProjectENV.NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS
  );
  const debounce = useActionDebounce(1000, true);

  const [dynamicSchema, setDynamicSchema] = useState(z.object({}));
  const [parsedRules, setParsedRules] = useState<TRule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { data: hash, isPending, writeContract, isSuccess } = useWriteContract();
  const [hashState, setHash] = useState('');

  const combinedSchema = baseFormSchema
    .extend(dynamicSchema.shape)
    .refine(
      (data) => {
        const depositStart = new Date(data._zuni_smv_depositStart).getTime();
        const depositEnd = new Date(data._zuni_smv_depositEnd).getTime();
        return depositStart < depositEnd;
      },
      {
        message: 'Deposit end must be greater than deposit start',
        path: ['_zuni_smv_depositEnd'],
      }
    )
    .superRefine((data, ctx) => {
      let valid = false;
      let path = '';
      let msg = '';
      if (data._zuni_smv_claimType === 'FIXED' && data._zuni_smv_claimAmount) {
        if (
          isValidFloat(data._zuni_smv_claimAmount) &&
          !isNaN(parseFloat(data._zuni_smv_claimAmount))
        ) {
          const num = parseFloat(data._zuni_smv_claimAmount);
          valid = num > 0 && num <= getMaxValue('uint64');
        }
        path = '_zuni_smv_claimAmount';
        msg = 'Claim amount must be a valid number, greater than 0 and less than 2^64';
      } else if (data._zuni_smv_claimType === 'PERCENTAGE' && data._zuni_smv_claimPercentage) {
        if (
          isValidFloat(data._zuni_smv_claimPercentage) &&
          !isNaN(parseFloat(data._zuni_smv_claimPercentage))
        ) {
          const num = parseFloat(data._zuni_smv_claimPercentage);
          valid = num >= 0 && num <= 100;
        }
        path = '_zuni_smv_claimPercentage';
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

  const defaultValues = genDefaultValues(parsedRules);

  const form = useForm({
    resolver: zodResolver(combinedSchema),
    defaultValues,
  });

  const { control, handleSubmit, watch } = form;

  const watchValidationSchema = watch('_zuni_smv_validationSchema').trim();

  const reset = useCallback(() => {
    setParsedRules([]);
    setDynamicSchema(z.object({}));
  }, [setParsedRules, setDynamicSchema]);

  useEffect(() => {
    parsedRules.forEach((rule) => {
      if (!isUnsupportedRule(rule)) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ruleName = rule.name as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ruleNameOp = `${ruleName}_op` as any;

      if (!form.getValues(ruleNameOp)) {
        form.setValue(ruleNameOp, 'NONE');
      }

      if (form.getValues(ruleName) === undefined) {
        form.setValue(ruleName, '');
      }
    });
  }, [parsedRules, form]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching schema registry:', error);
      return;
    }

    if (!registry) {
      return;
    }

    debounce(async () => {
      setLoading(true);
      if (!isValidBytesWithLength(watchValidationSchema, 32)) {
        reset();
        form.clearErrors('_zuni_smv_validationSchema');
        setLoading(false);
        return;
      }
      try {
        const schemaRecord = await registry?.getSchema({ uid: watchValidationSchema });
        if (!schemaRecord) {
          form.setError('_zuni_smv_validationSchema', {
            message: 'The validation schema is not found',
          });
          reset();
          setLoading(false);
          return;
        }
        const rules = parseValidationSchema(schemaRecord.schema);
        setParsedRules(rules);
        setDynamicSchema(getValidationSchema(rules));
        form.clearErrors('_zuni_smv_validationSchema');
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setError('_zuni_smv_validationSchema', {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message: (error as any).message || 'Invalid schema',
        });
        reset();
      } finally {
        setLoading(false);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchValidationSchema, registry, reset]);

  useEffect(() => {
    if (isSuccess && hash) {
      form.reset();
      reset();
      setHash(hash as string);
    }
  }, [isSuccess, form, reset, hash, setHash]);

  const handlePressSubmit = handleSubmit((values) => {
    if (parsedRules.length === 0) {
      form.setError('_zuni_smv_validationSchema', { message: 'The validation schema is invalid' });
      return;
    }

    const ops: number[] = [];
    const thresholds: `0x${string}`[] = [];
    let isError = false;

    parsedRules.forEach((rule) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ruleName = rule.name as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ruleNameOp = `${ruleName}_op` as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opKey = (values as any)[ruleNameOp];
      if (!opKey) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setError(ruleNameOp, { message: 'Operator is required' });
        isError = true;
        return;
      }

      const op = getOperatorNumber(opKey);
      if (op === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setError(ruleNameOp, { message: 'Invalid operator' });
        isError = true;
        return;
      }

      if (isUnsupportedRule(rule)) {
        form.clearErrors(ruleNameOp);
        ops.push(op);
        thresholds.push('0x');
        return;
      }

      // supported rule

      // operator is NONE, clear error
      if (op === RuleOperators.NONE[0]) {
        form.clearErrors(ruleNameOp);
        ops.push(op);
        thresholds.push('0x');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (values as any)[ruleName];
      const [valid, msg] = validateField(rule.type, value);
      if (!valid) {
        form.setError(ruleName, { message: msg });
        isError = true;
        return;
      }
      ops.push(op);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const encodedData = encodeAbiParameters([{ type: rule.type }], [value]);
      thresholds.push(encodedData);
    });

    if (isError) {
      return;
    }

    if (ops.length === 0 || thresholds.length === 0) {
      form.setError('_zuni_smv_validationSchema', { message: 'Invalid schema' });
      return;
    }

    if (ops.length !== thresholds.length) {
      form.setError('_zuni_smv_validationSchema', { message: 'Invalid schema' });
      return;
    }

    if (!isValidType(values._zuni_smv_claimType)) {
      form.setError('_zuni_smv_claimType', { message: 'Claim type is required' });
      return;
    }

    let claimData: TClaimData = {} as TClaimData;
    if (values._zuni_smv_claimType === 'FIXED') {
      claimData = {
        claimType: ClaimType.FIXED,
        fixedAmount: BigInt(parseFloat(values._zuni_smv_claimAmount) * 1e18),
        percentage: BigInt(0),
        customData: '0x' as `0x${string}`,
      };
    } else if (values._zuni_smv_claimType === 'PERCENTAGE') {
      claimData = {
        claimType: ClaimType.PERCENTAGE,
        fixedAmount: BigInt(0),
        percentage: BigInt(parseFloat(values._zuni_smv_claimPercentage) * 1e18),
        customData: '0x' as `0x${string}`,
      };
    }

    writeContract({
      address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as `0x${string}`,
      abi: SMART_VAULT_ABI,
      functionName: 'createVault',
      args: [
        values._zuni_smv_name,
        values._zuni_smv_description,
        BigInt(toUtcTime(new Date(values._zuni_smv_depositStart)).getTime()),
        BigInt(toUtcTime(new Date(values._zuni_smv_depositEnd)).getTime()),
        values._zuni_smv_validationSchema as `0x${string}`,
        ops,
        thresholds,
        claimData,
      ],
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
        | '_zuni_smv_name'
        | '_zuni_smv_description'
        | '_zuni_smv_depositStart'
        | '_zuni_smv_depositEnd'
        | '_zuni_smv_validationSchema'
        | '_zuni_smv_claimAmount'
        | '_zuni_smv_claimPercentage';
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
      const isSupportedRule = !isUnsupportedRule(rule);
      return (
        <FormField
          control={control}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={`${rule.name}_op` as any}
          render={({ field }) => (
            <FormItem>
              {!isSupportedRule && (
                <Input {...field} disabled readOnly value={RuleOperators.NONE[1]} />
              )}
              {isSupportedRule && (
                <>
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
                </>
              )}
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
                  const isUnSupported = isUnsupportedRule(rule);
                  if (isUnSupported) {
                    return (
                      <Input
                        {...field}
                        disabled
                        placeholder={"This type of rule isn't supported"}
                        className={cx(
                          'bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700 placeholder:text-destructive'
                        )}
                      />
                    );
                  }

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const isDisable = watch(`${rule.name}_op` as any) === 'NONE';

                  if (isNumericType(rule.type)) {
                    return (
                      <Input
                        {...field}
                        disabled={isDisable}
                        value={isDisable ? '' : field.value}
                        placeholder={`The value of ${rule.name} threshold`}
                        className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                      />
                    );
                  } else if (rule.type === 'bool') {
                    return (
                      <Select
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        disabled={watch(`${rule.name}_op` as any) === 'NONE'}
                        onValueChange={field.onChange}
                        value={isDisable ? '' : field.value}>
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
                      {...field}
                      disabled={isDisable}
                      value={isDisable ? '' : field.value}
                      placeholder={`The value of ${rule.name} threshold`}
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
    [control, watch]
  );

  const watchClaimType = watch('_zuni_smv_claimType');

  const renderClaim = useCallback(() => {
    return (
      <div className="grid grid-cols-2 gap-2 items-start">
        <FormField
          control={control}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name="_zuni_smv_claimType"
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
            name: '_zuni_smv_claimAmount',
            label: 'Amount (ETH)',
            placeholder: 'Eg. 10',
            className: 'translate-y-[4px]',
          })}
        {watchClaimType === 'PERCENTAGE' &&
          renderInputField({
            name: '_zuni_smv_claimPercentage',
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
          name: '_zuni_smv_name',
          label: 'Name',
          placeholder: 'The name of the vault',
        })}

        {renderInputField({
          name: '_zuni_smv_description',
          label: 'Description',
          placeholder: 'The description of the vault',
        })}

        <div className="grid grid-cols-2 gap-2">
          {renderInputField({
            name: '_zuni_smv_depositStart',
            label: 'Deposit start (UTC)',
            placeholder: 'The start of the deposit period',
            type: 'datetime-local',
          })}
          {renderInputField({
            name: '_zuni_smv_depositEnd',
            label: 'Deposit end (UTC)',
            placeholder: 'The end of the deposit period',
            type: 'datetime-local',
          })}
        </div>
        {renderClaim()}
        {renderInputField({
          name: '_zuni_smv_validationSchema',
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
                const isSupportedRule = !isUnsupportedRule(rule);
                return (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <FormLabel
                      className="col-span-3"
                      required={isSupportedRule && rule.type !== 'string'}>
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
        {/* {error && (
          <div className="text-destructive">
            Error: {(error as BaseError).shortMessage || error.message}
          </div>
        )} */}
        {<TxDialog hash={hashState as string} onClose={() => setHash('')} />}
        {/* {isConfirming && <div>Waiting for confirmation...</div>} */}
        {/* {isConfirmed && <div>Transaction confirmed.</div>} */}
      </form>
    </Form>
  );
};
