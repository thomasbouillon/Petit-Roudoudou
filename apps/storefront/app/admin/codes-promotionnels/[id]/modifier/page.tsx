'use client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Form, { Props as FormProps } from '../../form';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import { routes } from '@couture-next/routing';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { PromotionCode } from '@couture-next/types';

export default function Page() {
  const db = useDatabase();
  const router = useRouter();
  const queryClient = useQueryClient();

  const id = useParams().id as string;

  const promotionCodeQuery = useQuery({
    queryKey: ['promotionCodes', id],
    queryFn: async () => {
      const snapshot = await getDoc(
        doc(db, 'promotionCodes', id).withConverter(firestoreConverterAddRemoveId<PromotionCode>())
      );
      return snapshot.data();
    },
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: (async (data) => {
      await updateDoc(doc(db, 'promotionCodes', id).withConverter(firestoreConverterAddRemoveId<PromotionCode>()), {
        ...data,
        used: promotionCodeQuery.data?.used ?? 0,
      } satisfies Omit<PromotionCode, '_id'>);
    }) satisfies FormProps['onSubmit'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotionCodes'] });
    },
  });

  if (promotionCodeQuery.isPending) return <div>Chargement...</div>;
  if (promotionCodeQuery.isError) throw promotionCodeQuery.error;

  const onSubmit: FormProps['onSubmit'] = async (data) => {
    await saveMutation.mutateAsync(data);
    router.push(routes().admin().promotionCodes().index());
  };

  return <Form onSubmit={onSubmit} defaultValues={promotionCodeQuery.data} />;
}
