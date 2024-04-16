'use client';

import Form, { Props as FormProps, PromotionCodeDTO } from '../../form';
import { routes } from '@couture-next/routing';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from 'apps/storefront/trpc-client';
import { toFormDTO } from '@couture-next/utils';

export default function Page() {
  const router = useRouter();

  const id = useParams().id as string;

  const promotionCodeQuery = trpc.promotionCodes.findById.useQuery(id, {
    select: (data) => toFormDTO(data) as PromotionCodeDTO,
  });

  console.log(promotionCodeQuery.data);

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.promotionCodes.update.useMutation({
    onSuccess: async () => {
      trpcUtils.promotionCodes.invalidate();
    },
  });

  if (promotionCodeQuery.isPending) return <div>Chargement...</div>;
  if (promotionCodeQuery.isError) throw promotionCodeQuery.error;

  const onSubmit: FormProps['onSubmit'] = async (data) => {
    await saveMutation.mutateAsync({
      id,
      ...data,
    });
    router.push(routes().admin().promotionCodes().index());
  };

  return <Form onSubmit={onSubmit} defaultValues={promotionCodeQuery.data} />; // TODO allow null instead of undefined
}
