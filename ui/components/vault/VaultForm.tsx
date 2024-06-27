'use client';

import { Button } from '@/shadcn/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shadcn/Form';
import { Input } from '@/shadcn/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/Select';

import { BLACK_LIST_SCHEMA } from '@/constants/schema';
import { SMART_VAULT_ABI } from '@/constants/abi';
import { useActionDebounce } from '@/hooks/useAction';
import { useSchemaStore } from '@/states/schema';
import {
  getOperatorLabel,
  getValidationSchema,
  isNumericType,
  parseValidationSchema,
} from '@/utils/rule';
import { isValidBytesWithLength } from '@/utils/tools';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader, ShieldBan, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useWriteContract } from 'wagmi';
import { z } from 'zod';
import { TooltipWrapper } from '../TooltipWrapper';
import { ProjectENV } from '@env';

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
  const { data: hash, writeContract } = useWriteContract();

  const combinedSchema = baseFormSchema.extend(dynamicSchema.shape).refine(
    (data) => {
      const depositStart = new Date(data.depositStart).getTime();
      const depositEnd = new Date(data.depositEnd).getTime();
      return depositStart < depositEnd;
    },
    {
      message: 'Deposit end must be greater than deposit start',
      path: ['depositEnd'],
    }
  );

  let defaultValues = {
    name: '',
    description: '',
    depositEnd: tenMinutesLater.toISOString().slice(0, 16),
    depositStart: tenMinutesLater.toISOString().slice(0, 16),
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

  const handlePressSubmit = handleSubmit((values) => {
    console.log(values);
    // writeContract({
    //   address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as `0x${string}`,
    //   abi: SMART_VAULT_ABI,
    //   functionName: 'createVault',
    //   args: [],
    // });
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

  return (
    <Form {...form}>
      <form onSubmit={handlePressSubmit} className="space-y-2">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="The name of the vault"
                  {...field}
                  className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="The description of the vault"
                  className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={control}
            name="depositStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Deposit start (UTC)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    placeholder="The start of the deposit period"
                    className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="depositEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Deposit end (UTC)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    placeholder="The end of the deposit period"
                    {...field}
                    className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="validationSchema"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                required
                className="flex items-center gap-1"
                renderSuffix={renderSchemaStatus}>
                Validation schema
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="The UID of the validation schema. Eg.0x3a2fa...80a42"
                  {...field}
                  className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        {parsedRules.length > 0 && (
          <>
            <h3 className="text-center font-semibold text-sm text-gray-800 !my-4">
              Rules of vault
            </h3>
            <div className="max-h-[45vh] overflow-y-auto space-y-2">
              {parsedRules.map((rule, index) => {
                return (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <FormLabel className="col-span-3">
                      {rule.name}
                      <span className="ml-1 text-gray-500 text-xs">({rule.type})</span>
                    </FormLabel>
                    <FormField
                      control={form.control}
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
                    <FormField
                      key={index}
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
                                    // type="number"
                                    // min={getMinValue(rule.type)}
                                    // max={getMaxValue(rule.type)}
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
                  </div>
                );
              })}
            </div>
          </>
        )}
        <div className="flex items-center justify-center !my-4">
          <Button type="submit" className="px-4">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
};
