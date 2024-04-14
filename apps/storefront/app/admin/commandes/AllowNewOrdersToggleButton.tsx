import { Field } from '@couture-next/ui';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import useSetting from 'apps/storefront/hooks/useSetting';
import clsx from 'clsx';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

const schema = z.object({
  value: z.boolean(),
});

type SchemaType = z.infer<typeof schema>;

export function AllowNewOrdersToggleButton() {
  const { getSettingValueQuery, setSettingValueMutation } = useSetting('allowNewOrdersWithCustomArticles');
  if (getSettingValueQuery.isError) throw getSettingValueQuery.error;

  const form = useForm<SchemaType>({
    defaultValues: { value: getSettingValueQuery.data },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await setSettingValueMutation
      .mutateAsync({
        key: 'allowNewOrdersWithCustomArticles',
        value: data.value,
      })
      .then(() => form.reset(data))
      .catch((e) => {
        console.log(e);
        toast.error('Impossible de sauvegarder');
      });
  });

  useEffect(() => {
    if (form.getValues('value') === undefined && getSettingValueQuery.data !== undefined)
      form.reset({ value: getSettingValueQuery.data });
  }, [getSettingValueQuery.data]);

  if (form.getValues('value') === undefined) return null;

  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-4 relative px-10">
        <Field
          label="Autoriser les nouvelles commandes"
          widgetId="value"
          labelClassName="!mt-0"
          error={form.formState.errors.value?.message}
          renderWidget={(className) => (
            <input type="checkbox" className={clsx(className, '!w-5 aspect-square')} {...form.register('value')} />
          )}
        />
        {form.formState.isDirty && (
          <button type="submit" className="absolute right-0 p-2 top-1/2 -translate-y-1/2">
            <CheckCircleIcon
              className={clsx(!form.formState.isSubmitting && 'animate-bounce', 'w-6 h-6 text-primary-100')}
            />
          </button>
        )}
      </div>
    </form>
  );
}
