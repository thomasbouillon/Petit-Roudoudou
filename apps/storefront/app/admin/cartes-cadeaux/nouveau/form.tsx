'use client';

import { routes } from '@couture-next/routing';
import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { Field } from '@couture-next/ui/form/Field';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from 'apps/storefront/trpc-client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  code: z.string().regex(/^.{4}-.{4}-.{4}$/, 'Mauvais format'),
  amount: z.number().positive(),
});
type SchemaValue = z.infer<typeof schema>;
export default function Form() {
  const form = useForm<SchemaValue>({
    resolver: zodResolver(schema),
  });
  const trpcUtils = trpc.useUtils();
  const addMutation = trpc.giftCards.create.useMutation({
    onSuccess() {
      trpcUtils.giftCards.invalidate;
    },
  });
  const router = useRouter();
  const onSubmit = form.handleSubmit(async (data) => {
    await addMutation.mutateAsync(data);
    router.push(routes().admin().giftCards().index());
  });

  const randomizeCode = useCallback(() => {
    const code = Array.from({ length: 12 }, () => Math.random().toString(36)[2])
      .join('')
      .toUpperCase();
    form.setValue('code', `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`);
  }, [form.setValue]);

  return (
    <form onSubmit={onSubmit}>
      <button type="button" className="btn-secondary mx-auto my-4" onClick={randomizeCode}>
        Générer un code
      </button>
      <div className="grid grid-cols-[auto_1fr] gap-4 border p-4 mx-4">
        <Field
          widgetId="code"
          helpText="Format: XXXX-XXXX-XXXX"
          label="Code"
          renderWidget={(className) => <input className={className} {...form.register('code')} />}
          error={form.formState.errors.code?.message}
        />
        <Field
          widgetId="amount"
          label="Montant"
          renderWidget={(className) => (
            <input className={className} {...form.register('amount', { valueAsNumber: true })} type="number" />
          )}
          error={form.formState.errors.amount?.message}
        />
      </div>
      <ButtonWithLoading loading={form.formState.isSubmitting} type="submit" className="btn-primary mx-auto my-4">
        Ajouter la carte
      </ButtonWithLoading>
    </form>
  );
}
