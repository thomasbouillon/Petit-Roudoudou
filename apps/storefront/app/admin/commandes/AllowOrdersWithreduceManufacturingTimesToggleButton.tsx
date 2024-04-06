import { Setting } from '@couture-next/types';
import { Field } from '@couture-next/ui';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import useSetting from 'apps/storefront/hooks/useSetting';
import clsx from 'clsx';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

const schema = z.object({
  value: z.boolean(),
});

type SchemaType = z.infer<typeof schema>;

export function AllowOrdersWithReduceManufacturingTimesToggleButton() {
  const newOrdersWithReducedManufacturingTimesAllowed = useSetting(
    'allowNewOrdersWithReducedManufacturingTimes',
    undefined
  );

  const form = useForm<SchemaType>({
    defaultValues: { value: newOrdersWithReducedManufacturingTimesAllowed },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const database = useDatabase();
    const settingRef = doc(
      collection(database, 'settings'),
      'allowNewOrdersWithReducedManufacturingTimes' satisfies Setting['_id']
    ).withConverter(firestoreConverterAddRemoveId<Setting>());
    await setDoc(settingRef, { value: data.value }, { merge: true })
      .then(() => form.reset(data))
      .catch((e) => {
        console.log(e);
        toast.error('Impossible de sauvegarder');
      });
  });

  useEffect(() => {
    if (form.getValues('value') === undefined && newOrdersWithReducedManufacturingTimesAllowed !== undefined)
      form.reset({ value: newOrdersWithReducedManufacturingTimesAllowed });
  }, [newOrdersWithReducedManufacturingTimesAllowed]);

  if (form.getValues('value') === undefined) return null;

  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-center gap-4 relative px-10">
        <Field
          label="Autoriser les nouvelles commandes urgentes"
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
