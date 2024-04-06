import { Order } from '@couture-next/types';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useFirestoreDocumentQuery } from 'apps/storefront/hooks/useFirestoreDocumentQuery';
import clsx from 'clsx';
import { DocumentReference, setDoc } from 'firebase/firestore';
import { HTMLProps } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

type Props = {
  orderRef: DocumentReference<Order>;
} & Omit<HTMLProps<HTMLFormElement>, 'onSubmit'>;

const editAdminCommentFn = async (orderRef: DocumentReference<Order>, adminComment: string) => {
  await setDoc(
    orderRef,
    {
      adminComment,
    },
    { merge: true }
  );
};

const schema = z.object({
  comment: z.string(),
});

type SchemaType = z.infer<typeof schema>;

export function AdminCommentForm({ orderRef, ...props }: Props) {
  const orderQuery = useFirestoreDocumentQuery(orderRef);

  const form = useForm<SchemaType>({
    defaultValues: {
      comment: orderQuery.data?.adminComment,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await editAdminCommentFn(orderRef, data.comment)
      .then(() => form.reset({ comment: data.comment }))
      .catch(() => toast.error('Impossible de sauvegarder ton commentaire...'));
  });

  return (
    <form {...props} onSubmit={onSubmit} className={clsx('relative', props.className)}>
      <textarea {...form.register('comment')} rows={3} className="w-full border rounded-md px-4 py-2 bg-white" />
      {form.formState.isDirty && (
        <button type="submit" className="absolute p-2 right-4 top-4">
          <CheckCircleIcon className="w-6 h-6 text-primary-100" />
        </button>
      )}
    </form>
  );
}
