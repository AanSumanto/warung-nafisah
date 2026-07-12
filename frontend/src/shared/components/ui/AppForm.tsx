'use client';

import Box from '@mui/material/Box';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';
import type { ZodType } from 'zod';

export interface AppFormProps<TFieldValues extends FieldValues> {
  readonly schema: ZodType<TFieldValues>;
  readonly defaultValues?: DefaultValues<TFieldValues>;
  readonly formOptions?: Omit<UseFormProps<TFieldValues>, 'resolver' | 'defaultValues'>;
  readonly onSubmit: (values: TFieldValues, methods: UseFormReturn<TFieldValues>) => void | Promise<void>;
  readonly children: (methods: UseFormReturn<TFieldValues>) => React.ReactNode;
  readonly id?: string;
}

export function AppForm<TFieldValues extends FieldValues>({
  schema,
  defaultValues,
  formOptions,
  onSubmit,
  children,
  id,
}: AppFormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>({
    ...formOptions,
    defaultValues,
    resolver: zodResolver(schema),
  });

  const handleSubmit = methods.handleSubmit(async (values) => {
    await onSubmit(values, methods);
  });

  return (
    <FormProvider {...methods}>
      <Box component="form" id={id} onSubmit={handleSubmit} noValidate>
        {children(methods)}
      </Box>
    </FormProvider>
  );
}
