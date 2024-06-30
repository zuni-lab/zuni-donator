'use client';

import { Button } from '@/shadcn/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shadcn/Form';
import { Input } from '@/shadcn/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/Select';

import { SMART_VAULT_ABI } from '@/constants/abi';
import { useActionDebounce, useOverflowDetection } from '@/hooks/useAction';
import {
  getValidationSchema,
  isUnsupportedRule,
  parseValidationSchema,
  validateField,
} from '@/utils/vaults/schema';
import { getMaxValue, isNumericType } from '@/utils/vaults/types';
import { ClaimType, isValidType } from '@/vaults/claim';
import { RuleOperators, getOperatorLabel, getOperatorNumber } from '@/vaults/operators';

import { TooltipWrapper } from '@/components/TooltipWrapper';
import { TxDialog } from '@/components/vault/TxDialog';
import { useSchemaRegistry } from '@/hooks/useSchemaRegisty';
import { isValidAddress, isValidBytesWithLength, isValidFloat, toUtcTime } from '@/utils/tools';
import { ProjectENV } from '@env';
import { zodResolver } from '@hookform/resolvers/zod';
import { cx } from 'class-variance-authority';
import { ChevronDown, Loader, ShieldBan, ShieldCheck, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { encodeAbiParameters } from 'viem';
import { BaseError, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { z } from 'zod';

const now = new Date().getTime(); // Current time in milliseconds
const tenMinutesLater = new Date(now + 0 * 60 * 1000); // 5 minutes later
const EMPTY_HEX_DATA = encodeAbiParameters([{ type: 'bytes' }], ['0x00']);

const latterThanCurrentTimeTenMinutes = (msg: string) =>
  z.string().refine(
    (val) => {
      const time = new Date(val);
      if (isNaN(time.getTime())) {
        return false;
      }
      // add time zone offset
      time.setMinutes(time.getMinutes() - time.getTimezoneOffset());
      // return time.getTime() > now;
      return true;
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
    'Contribute start must be at least 5 minutes in the future'
  ),
  _zuni_smv_depositEnd: latterThanCurrentTimeTenMinutes(
    'Contribute end must be at least 5 minutes in the future'
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
  _zuni_smv_attesters: z.array(
    z.string().refine((val) => isValidAddress(val), {
      message: 'Invalid attester address',
    })
  ),
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
  _zuni_smv_attesters: [] as string[],
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

export const CreateVaultForm: IComponent = () => {
  const { registry, error } = useSchemaRegistry();
  const debounce = useActionDebounce(1000, true);

  const [dynamicSchema, setDynamicSchema] = useState(z.object({}));
  const [parsedRules, setParsedRules] = useState<TRule[]>([]);

  const [containerRef, isOverflowing] = useOverflowDetection(parsedRules.length);

  const [loading, setLoading] = useState<boolean>(false);
  const {
    data: hash,
    isPending,
    writeContract,
    isSuccess,
    error: writeCallError,
  } = useWriteContract();
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
        message: 'Contribute end must be greater than deposit start',
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
  const { fields, append, remove } = useFieldArray({
    control,
    name: '_zuni_smv_attesters' as never,
    keyName: 'key',
  });

  const [fieldsContainerRef, isFieldsOverflowing] = useOverflowDetection(fields.length);

  const handleAddAttester = useCallback(() => {
    append('0x76639B0EC8a5f61061c0Dd8C2a915F800af40a65');
  }, [append]);

  const handleRemoveAttester = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );

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
    const thresholds: THexString[] = [];
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

      // operator is NONE, clear error
      if (op === RuleOperators.NONE[0] || isUnsupportedRule(rule)) {
        form.clearErrors(ruleNameOp);
        ops.push(op);
        thresholds.push(EMPTY_HEX_DATA);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (values as any)[ruleName];
      const [valid, parsedValue, msg] = validateField(rule.type, value);
      if (!valid || !parsedValue) {
        form.setError(ruleName, { message: msg });
        isError = true;
        return;
      }

      ops.push(op);
      const encodedValue = encodeAbiParameters([{ type: rule.type, parsedValue }], [parsedValue]);
      thresholds.push(encodedValue);
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
        customData: EMPTY_HEX_DATA,
      };
    } else if (values._zuni_smv_claimType === 'PERCENTAGE') {
      claimData = {
        claimType: ClaimType.PERCENTAGE,
        fixedAmount: BigInt(0),
        percentage: BigInt(parseFloat(values._zuni_smv_claimPercentage) * 1e18),
        customData: EMPTY_HEX_DATA,
      };
    }

    writeContract({
      address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as THexString,
      abi: SMART_VAULT_ABI,
      functionName: 'createVault',
      args: [
        values._zuni_smv_name,
        values._zuni_smv_description,
        BigInt(toUtcTime(new Date(values._zuni_smv_depositStart)).getTime() / 1000),
        BigInt(toUtcTime(new Date(values._zuni_smv_depositEnd)).getTime() / 1000),
        values._zuni_smv_validationSchema as THexString,
        values._zuni_smv_attesters as THexString[],
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
                        placeholder={`Enter ${rule.name} threshold`}
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
                      placeholder={`Enter ${rule.name} threshold`}
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
              <FormLabel required>Claim amount</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white focus:ring-blue-300 border-blue-400 [&>*]:text-gray-700">
                    <SelectValue placeholder="Claim amount" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white text-gray-700">
                  {Object.keys(ClaimType).map((key) => (
                    <SelectItem key={key} value={key}>
                      <span className="capitalize">{key.toLowerCase()}</span>
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
            label: 'Contribute start (UTC)',
            placeholder: 'The start of the contribute period',
            type: 'datetime-local',
          })}
          {renderInputField({
            name: '_zuni_smv_depositEnd',
            label: 'Contribute end (UTC)',
            placeholder: 'The end of the contribute period',
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
        <div className="space-y-2 ">
          <FormLabel>Attesters</FormLabel>
          <div
            className="relative !mt-0 max-h-[100px] overflow-y-auto scrollable"
            ref={fieldsContainerRef}>
            <div className="space-y-2">
              {fields.map((item, index) => {
                return (
                  <FormField
                    control={control}
                    name={`_zuni_smv_attesters.${index}` as never}
                    key={item.key}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input
                              {...field}
                              placeholder="Enter attester's address"
                              className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => handleRemoveAttester(index)}>
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            </div>
            {isFieldsOverflowing && (
              <div className="animate-bounce absolute bottom-0 right-0 transform -translate-x-1/2">
                <ChevronDown className="w-8 h-6 text-orange-600 bg-white right-0 rounded-xl" />
              </div>
            )}
          </div>

          <div className="flex justify-start">
            <Button
              type="button"
              variant="secondary"
              size={'sm'}
              onClick={handleAddAttester}
              className="mt-2">
              Add attester
            </Button>
          </div>
          <FormMessage>
            {form.formState.errors?._zuni_smv_attesters?.root
              ? form.formState.errors._zuni_smv_attesters?.root.message
              : form.formState.errors._zuni_smv_attesters?.message || ''}
          </FormMessage>
        </div>

        {parsedRules.length > 0 && (
          <>
            <h3 className="text-center font-semibold text-sm text-gray-800 !mt-4">
              Rules of vault
            </h3>
            <div
              className="max-h-[calc(30vh-40px)] relative overflow-y-auto !mt-0 space-y-2 py-2 scrollable"
              ref={containerRef}>
              <div>
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
              {isOverflowing && (
                <div className="animate-bounce absolute -bottom-2 right-0 transform -translate-x-1/2 p-2">
                  <ChevronDown className="w-8 h-6 text-orange-600" />
                </div>
              )}
            </div>
          </>
        )}
        <div className="flex items-center justify-center !mt-4">
          <Button type="submit" className="px-4" disabled={isPending || isConfirming}>
            {isPending || isConfirming ? (
              <Loader className="w-4 h-4 text-background animate-spin" />
            ) : (
              'Create vault'
            )}
          </Button>
        </div>
        {writeCallError && (
          <div className="text-destructive text-sm">
            Error: {(writeCallError as BaseError).shortMessage || writeCallError.message}
          </div>
        )}
        {<TxDialog hash={hashState as string} onClose={() => setHash('')} />}
        {/* {isConfirming && <div>Waiting for confirmation...</div>} */}
        {/* {isConfirmed && <div>Transaction confirmed.</div>} */}
      </form>
    </Form>
  );
};
