import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import { HTMLProps } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

type Props = {
  orderId: string;
} & Omit<HTMLProps<HTMLFormElement>, 'onSubmit'>;

const schema = z.object({
  comment: z.string(),
});

type SchemaType = z.infer<typeof schema>;

export function AdminCommentForm({ orderId, ...props }: Props) {
  const orderQuery = trpc.orders.findById.useQuery(orderId);

  const form = useForm<SchemaType>({
    defaultValues: {
      comment: orderQuery.data?.adminComment ?? undefined,
    },
  });

  const editAdminCommentMutation = trpc.orders.editAdminComment.useMutation();

  const onSubmit = form.handleSubmit(async (data) => {
    await editAdminCommentMutation
      .mutateAsync({
        orderId,
        comment: data.comment,
      })
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
