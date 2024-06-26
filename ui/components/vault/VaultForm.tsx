'use client';

import { Button } from '@/shadcn/Button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shadcn/Dialog';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shadcn/Form';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/Select';

import { Input } from '@/shadcn/Input';

import { Operators } from '@/constants/operators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { isValid, z } from 'zod';
import { useActionDebounce } from '@/hooks/useAction';
import { toUtcTime } from '@/utils/datetime';
import { HEXDECIMAL_REGEX, isValidHex } from '@/utils/regex';

const now = new Date().getTime(); // Current time in milliseconds
const tenMinutesLater = new Date(now + 10 * 60 * 1000); // 10 minutes later

// Custom validator for bytes strings
const bytesString = z.string().refine((val) => isValidHex(val), {
  message: 'Each threshold must be a valid bytes string',
});

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

// Main schema
const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    depositStart: latterThanCurrentTimeTenMinutes(
      'Deposit start must be at least 10 minutes in the future'
    ),
    depositEnd: latterThanCurrentTimeTenMinutes(
      'Deposit end must be at least 10 minutes in the future'
    ),
    validationSchema: z
      .string()
      .length(66)
      .refine((val) => isValidHex(val), {
        message: 'Validation schema must be a valid bytes string, eg. 0x3a2fa...80a42',
      }),
    ops: z.array(
      z
        .number()
        .int()
        .refine((val) => val in Operators, {
          message: 'Ops values must be valid keys in the Operators record',
        })
    ),
    // thresholds: z.array(bytesString),
  })
  .refine(
    (data) => {
      const depositStart = new Date(data.depositStart).getTime();
      const depositEnd = new Date(data.depositEnd).getTime();
      return depositStart < depositEnd;
    },
    {
      message: 'Deposit start must be less than deposit end',
      path: ['depositStart'],
    }
  );

export const VaultForm: IComponent = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      depositEnd: tenMinutesLater.toISOString().slice(0, 16),
      depositStart: tenMinutesLater.toISOString().slice(0, 16),
      validationSchema: '',
      // ops: [1, 2, 3],
      // thresholds: [
      //   '0x0000000000000000000000000000000000000000000000000000000000000012', // abi.encodePacked(uint256(18))
      //   '0x4d4954', // abi.encodePacked("MIT")
      //   '0x01', // abi.encodePacked(true)
      // ],
    },
  });

  const debounce = useActionDebounce(1000, true);
  const watch = form.watch();
  const errors = form.formState.errors;
  const [isValidSchema, setIsValidSchema] = useState(false);

  useEffect(() => {
    console.log({ isValidSchema });
  }, [isValidSchema]);

  useEffect(() => {
    console.log("validationSchema: ", watch.validationSchema);
    debounce(() => {
      console.log("Debounce validationSchema: ", watch.validationSchema);
      if (watch.validationSchema.length != 66 || !isValidHex(watch.validationSchema)) {
        return;
      }

      setIsValidSchema(true);
    });

    // console.log('validationSchema: ', watch.validationSchema);

    // // check if the validation schema is valid
    // if (watch.validationSchema.length === 66) {
    //   setIsValidSchema(true);
    // } else {
    //   setIsValidSchema(false);
    // }

    // debounce(() => {
    //   setLoading(true);
    //   if (e.target.value.length === 0) {
    //     setSelectedVaults(data);
    //     setLoading(false);
    //     return;
    //   }
    //   setSelectedVaults(
    //     data.filter(
    //       (vault) => vault.title.includes(e.target.value) || vault.uuid.includes(e.target.value)
    //     )
    //   );
    //   setLoading(false);
    // });
  }, [
    // debounce,
    watch.validationSchema,
    // watch.validationSchema.length,
    // watch.validationSchema.length === 66,
    // isValidHex(watch.validationSchema),
  ]);

  const handlePressSubmit = form.handleSubmit((values) => {
    console.log('values: ', values);
    const depositStart = toUtcTime(new Date(values.depositStart));
    const depositEnd = toUtcTime(new Date(values.depositEnd));

    console.log('depositStart: ', depositStart);
    console.log('depositEnd: ', depositEnd);
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border border-blue-400">
          Create vault
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Create a new vault</DialogTitle>
          <DialogDescription>Make changes to your profile here.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handlePressSubmit} className="space-y-2">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
              name="validationSchema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Validation schema</FormLabel>
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
            <Button type="submit">Submit</Button>
          </form>
        </Form>
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
