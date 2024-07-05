'use client';

import Form, { Props as FormProps, WorkshopSessionDTO } from '../../(form)/form';
import { routes } from '@couture-next/routing';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const router = useRouter();

  const id = useParams().id as string;

  const workshopSessionQuery = trpc.workshopSessions.findById.useQuery(id);

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.workshopSessions.update.useMutation({
    onSuccess: async () => {
      trpcUtils.workshopSessions.invalidate();
    },
  });

  if (workshopSessionQuery.isPending) return <div>Chargement...</div>;
  if (workshopSessionQuery.isError) throw workshopSessionQuery.error;

  const onSubmit: FormProps['onSubmit'] = async (data) => {
    await saveMutation.mutateAsync({
      id,
      ...data,
      image: data.image.uid,
    });
    router.push(routes().admin().workshopSessions().index());
  };

  return <Form onSubmit={onSubmit} defaultValues={workshopSessionQuery.data} />;
}
