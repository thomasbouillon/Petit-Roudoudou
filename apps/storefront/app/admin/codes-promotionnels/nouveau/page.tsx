'use client';
import Form, { Props as FormProps } from '../form';
import { routes } from '@couture-next/routing';
import { useRouter } from 'next/navigation';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const router = useRouter();

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.promotionCodes.create.useMutation({
    onSuccess: async (data) => {
      trpcUtils.promotionCodes.list.invalidate();
    },
  });

  const onSubmit: FormProps['onSubmit'] = async (data) => {
    await saveMutation.mutateAsync(data);
    router.push(routes().admin().promotionCodes().index());
  };

  return <Form onSubmit={onSubmit} defaultValues={{ type: 'PERCENTAGE' }} />;
}
