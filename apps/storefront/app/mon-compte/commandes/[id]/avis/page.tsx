'use client';

import { routes } from '@couture-next/routing';
import { CallAddReviewPayload, CallAddReviewResponse, Order } from '@couture-next/types';
import { ButtonWithLoading, Field } from '@couture-next/ui';
import { firestoreOrderConverter } from '@couture-next/utils';
import { RadioGroup } from '@headlessui/react';
import { StarIcon } from '@heroicons/react/24/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from 'apps/storefront/contexts/AuthContext';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import useFunctions from 'apps/storefront/hooks/useFunctions';
import { trpc } from 'apps/storefront/trpc-client';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import clsx from 'clsx';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Page() {
  const orderId = useParams().id as string;
  const db = useDatabase();
  const getOrderQuery = useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () =>
      getDoc(doc(db, 'orders', orderId).withConverter(firestoreOrderConverter)).then((snapshot) => {
        if (!snapshot.exists()) throw new Error('Order not found');
        return snapshot.data();
      }),
  });
  if (getOrderQuery.isError) throw getOrderQuery.error;

  const reviewableItems = getOrderQuery.data?.items.filter((item) => !item.reviewId && item.articleId);
  const groupedReviewableItems =
    reviewableItems?.reduce((acc, item) => {
      if (!item.articleId) return acc;
      if (!acc[item.articleId]) acc[item.articleId] = [];
      acc[item.articleId].push(item);
      return acc;
    }, {} as Record<string, typeof reviewableItems>) ?? {};

  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  if (currentArticleIndex >= Object.keys(groupedReviewableItems).length) {
    return (
      <div>
        <p className="text-center font-bold text-xl">Merci !</p>
        <Link href={routes().index()} className="btn-primary mx-auto mt-6">
          Retour à la page d'acceuil
        </Link>
      </div>
    );
  }

  const currentArticleId = Object.keys(groupedReviewableItems)[currentArticleIndex];

  if (!reviewableItems?.length)
    return (
      <p className="text-center">
        Votre commande ne contient pas d'articles sur lesquels vous pouvez donner votre avis.
      </p>
    );

  return (
    <div className="flex flex-col gap-4 px-4">
      <h1 className="text-center">Donnez nous votre avis</h1>
      {Object.keys(groupedReviewableItems).length > 1 && (
        <p className="text-center">
          {currentArticleIndex + 1} / {Object.keys(groupedReviewableItems).length}
        </p>
      )}
      <div>
        <ReviewArticle
          articleId={currentArticleId}
          items={groupedReviewableItems[currentArticleId]}
          orderId={orderId}
          onReviewed={() => setCurrentArticleIndex((i) => i + 1)}
        />
      </div>
    </div>
  );
}

const reviewSchema = z.object({
  authorName: z.string().min(1),
  score: z.number().min(1).max(5),
  text: z.string().min(5, 'Votre avis doit faire au moins 5 caractères'),
});
const ReviewArticle: React.FC<{
  items: Order['items'];
  articleId: string;
  orderId: string;
  onReviewed: () => void;
}> = ({ items, articleId, orderId, onReviewed }) => {
  const { userQuery } = useAuth();

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { score: 5, authorName: userQuery.data?.displayName?.split(' ')[0] },
  });

  const createReviewMutation = trpc.reviews.create.useMutation();

  const onSubmit = form.handleSubmit((data) => {
    return createReviewMutation
      .mutateAsync({ articleId, orderId, ...data })
      .then(onReviewed)
      .catch((error) => {
        console.error(error);
      });
  });

  useEffect(() => {
    form.reset();
  }, [articleId, orderId]);

  return (
    <form onSubmit={onSubmit}>
      <p className="text-center font-bold text-xl mb-4">Qu'avez vous pensé de votre {items[0].description} ?</p>
      <div className="flex justify-center">
        {items.map((item) => (
          <Image
            className="w-24 h-24 object-contain object-center"
            width={96}
            height={96}
            src={item.image.url}
            loader={loader}
            alt=""
          />
        ))}
      </div>
      <div className="max-w-md mx-auto">
        <Controller
          name="score"
          control={form.control}
          render={({ field }) => (
            <Score score={field.value} onChange={field.onChange} error={form.formState.errors.score?.message} />
          )}
        />
        <Field
          labelClassName="!items-start"
          label="Avis"
          widgetId="review-text"
          error={form.formState.errors.text?.message}
          renderWidget={(className) => <textarea className={className} required {...form.register('text')} />}
        />
        <Field
          labelClassName="!items-start"
          label="Prénom affiché sur l'avis public"
          widgetId="author-name"
          error={form.formState.errors.authorName?.message}
          renderWidget={(className) => <input className={className} required {...form.register('authorName')} />}
        />
      </div>
      <ButtonWithLoading className="btn-primary mx-auto mt-4" loading={form.formState.isSubmitting}>
        Suivant
      </ButtonWithLoading>
    </form>
  );
};

const Score: React.FC<{ score: number; onChange: (score: number) => void; error?: string }> = ({
  score,
  onChange,
  error,
}) => {
  return (
    <RadioGroup value={score} onChange={onChange} className="mt-4">
      <RadioGroup.Label className="sr-only">Note</RadioGroup.Label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex items-center justify-center">
        {[1, 2, 3, 4, 5].map((value) => (
          <RadioGroup.Option
            key={value}
            value={value}
            className="p-2 !outline-none cursor-pointer ui-checked:ring-1 ring-primary-100"
          >
            <span className="sr-only">{value}</span>
            <StarIcon className="h-6 w-6 text-primary-500 ui-checked:text-primary-100" />
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
};
