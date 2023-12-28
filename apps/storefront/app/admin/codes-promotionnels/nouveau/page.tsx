'use client';
import { addDoc, collection } from 'firebase/firestore';
import Form, { Props as FormProps } from '../form';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import { routes } from '@couture-next/routing';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function Page() {
  const db = useDatabase();
  const router = useRouter();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (async (data) => {
      await addDoc(collection(db, 'promotionCodes'), data);
    }) satisfies FormProps['onSubmit'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotionCodes'] });
    },
  });

  const onSubmit: FormProps['onSubmit'] = async (data) => {
    await saveMutation.mutateAsync(data);
    router.push(routes().admin().promotionCodes().index());
  };

  return <Form onSubmit={onSubmit} defaultValues={{ type: 'percentage' }} />;
}
