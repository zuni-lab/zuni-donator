'use client';

import { Button } from '@/shadcn/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shadcn/Form';
import { Input } from '@/shadcn/Input';

import { useActionDebounce } from '@/hooks/useAction';
import { useSchemaStore } from '@/states/schema';
import { getValidationSchema, parseValidationSchema } from '@/utils/rule';
import { isValidBytes32 } from '@/utils/tools';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader, ShieldBan, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  validationSchema: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => isValidBytes32(val), {
      message: 'Validation schema must be a valid bytes string, eg. 0x3a2fa...80a42',
    }),
});
// .refine(
//   (data) => {
//     const depositStart = new Date(data.depositStart).getTime();
//     const depositEnd = new Date(data.depositEnd).getTime();
//     return depositStart < depositEnd;
//   },
//   {
//     message: 'Deposit start must be less than deposit end',
//     path: ['depositStart'],
//   }
// );

export const VaultForm: IComponent = () => {
  const { registry } = useSchemaStore();
  const debounce = useActionDebounce(1000, true);

  const [dynamicSchema, setDynamicSchema] = useState(z.object({}));
  const [parsedRules, setParsedRules] = useState<TDeclareStmt[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const combinedSchema = baseFormSchema.extend(dynamicSchema.shape);
  const form = useForm({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      name: '',
      description: '',
      depositEnd: tenMinutesLater.toISOString().slice(0, 16),
      depositStart: tenMinutesLater.toISOString().slice(0, 16),
      validationSchema: '',
    },
  });

  const { control, handleSubmit, watch } = form;

  const watchValidationSchema = watch('validationSchema').trim();

  useEffect(() => {
    if (!registry) {
      return;
    }
    debounce(async () => {
      setLoading(true);
      if (!isValidBytes32(watchValidationSchema)) {
        setParsedRules([]);
        setDynamicSchema(z.object({}));
        setLoading(false);
        return;
      }
      try {
        const schemaRecord = await registry?.getSchema({ uid: watchValidationSchema });
        if (!schemaRecord) {
          setParsedRules([]);
          setDynamicSchema(z.object({}));
        }

        const rules = parseValidationSchema(schemaRecord.schema);
        setParsedRules(rules);
        setDynamicSchema(getValidationSchema(rules));
      } catch (error) {
        setParsedRules([]);
        setDynamicSchema(z.object({}));
      } finally {
        setLoading(false);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchValidationSchema, registry, setParsedRules, setDynamicSchema]);

  const handlePressSubmit = handleSubmit((values) => {
    console.log('values: ', values);
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
            {parsedRules.map((rule, index) => {
              return (
                <FormField
                  key={index}
                  control={control}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  name={rule.name as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{rule.name}</FormLabel>
                      <FormControl>
                        {/* {rule.type === 'address' && ( */}
                        <Input
                          placeholder={`The ${rule.name} of the vault`}
                          {...field}
                          className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                        />
                        {/* )} */}
                        {/* {rule.type === 'uint256' && (
                            <Input
                              type="number"
                              placeholder="Number"
                              {...field}
                              className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                            />
                          )}
                          {rule.type === 'bool' && (
                            <select
                              {...field}
                              className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700">
                              <option value={'true'}>True</option>
                              <option value={'false'}>False</option>
                            </select>
                          )}
                          {rule.type === 'string' && (
                            <Input
                              placeholder="String"
                              {...field}
                              className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                            />
                          )} */}
                        {/* Add other input types based on `rule.type` */}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}

            {/* 
                  {parsedRules.map((rule, index) => (
                    <FormField
                      key={index}
                      control={control}
                      name={rule.name as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>{rule.name}</FormLabel>
                          <FormControl>
                            {rule.type === 'address' && (
                              <Input
                                placeholder="Address"
                                {...field}
                                className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                              />
                            )}
                            {rule.type === 'uint256' && (
                              <Input
                                type="number"
                                placeholder="Number"
                                {...field}
                                className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                              />
                            )}
                            {rule.type === 'bool' && (
                              <select
                                {...field}
                                className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700">
                                <option value={'true'}>True</option>
                                <option value={'false'}>False</option>
                              </select>
                            )}
                          
                            {rule.type === 'string' && (
                              <Input
                                placeholder="String"
                                {...field}
                                className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
                              />
                            )}
                           
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))} */}
          </>
        )}

        {
          // parsedRules.map((rule, index) => (
          //   <FormField
          //     key={index}
          //     control={control}
          //     name={rule.name}
          //     render={({ field }) => (
          //       <FormItem>
          //         <FormLabel required>{rule.name}</FormLabel>
          //         <FormControl>
          //           <Input
          //             placeholder={`The ${rule.name} of the vault`}
          //             {...field}
          //             className="bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700"
          //           />
          //         </FormControl>
          //         <FormMessage />
          //       </FormItem>
          //     )}
          //   />
          // ))
        }

        {/* <FormField
              control={form.control}
              name="ops"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a verified email to display" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="m@example.com">m@example.com</SelectItem>
                      <SelectItem value="m@google.com">m@google.com</SelectItem>
                      <SelectItem value="m@support.com">m@support.com</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You can manage email addresses in your{' '}
                    <Link href="/examples/forms">email settings</Link>.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
        <div className="flex items-center justify-center !my-4">
          <Button type="submit" className="px-4">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
};
