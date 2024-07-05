'use client';

import Form, { Props as FormProps } from '../(form)/form';
import { routes } from '@couture-next/routing';
import { useRouter } from 'next/navigation';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const router = useRouter();

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.workshopSessions.create.useMutation({
    onSuccess: async () => {
      trpcUtils.workshopSessions.list.invalidate();
    },
  });

  const onSubmit: FormProps['onSubmit'] = async (data) => {
    await saveMutation.mutateAsync({
      ...data,
      image: data.image.uid,
    });
    router.push(routes().admin().workshopSessions().index());
  };

  return <Form onSubmit={onSubmit} />;
}
