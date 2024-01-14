'use client';

import { structuredData } from '@couture-next/seo';
import { Review } from '@couture-next/types';
import { WithStructuedDataWrapper } from '@couture-next/ui';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { StarIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import clsx from 'clsx';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React from 'react';

type Props = {
  articleId: string;
  titleAs?: React.ElementType;
};

export default function ReviewsSection({ articleId, titleAs: titleAs }: Props) {
  const TitleComponent = titleAs ?? 'h2';

  const firestore = useDatabase();
  const getReviewsQuery = useQuery({
    queryKey: ['reviews', articleId],
    queryFn: () =>
      getDocs(
        query(
          collection(firestore, 'reviews').withConverter(firestoreConverterAddRemoveId<Review>()),
          where('articleId', '==', articleId)
        )
      ).then((snapshot) =>
        snapshot.docs.map((doc) => {
          const review = doc.data();
          return {
            ...review,
            createdAt: new Date(review.createdAt),
          };
        })
      ),
    enabled: !!articleId,
  });

  if (getReviewsQuery.isError) throw getReviewsQuery.error;
  if (getReviewsQuery.isPending) return <div>Chargement...</div>;

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  if (getReviewsQuery.data?.length === 0) return null;

  return (
    <div className="my-8 mx-4 md:mx-16" id="reviews">
      <TitleComponent className="text-3xl font-serif mb-4 text-center">Avis clients</TitleComponent>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(24rem,1fr))] gap-4 place-content-center">
        {getReviewsQuery.data?.map((review) => (
          <WithStructuedDataWrapper stucturedData={structuredData.review(review)} key={review._id}>
            <div className="p-4 shadow-md border">
              <Stars rating={review.score} />
              <p>{review.text}</p>
              <small className="block text-end">{formatDate(review.createdAt)}</small>
            </div>
          </WithStructuedDataWrapper>
        ))}
      </div>
    </div>
  );
}

const Stars: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <>
      <div className="flex items-center justify-center" aria-hidden>
        {[1, 2, 3, 4, 5].map((value) => (
          <div key={value} className="p-2 !outline-none cursor-pointer ui-checked:ring-1">
            <StarIcon
              className={clsx('h-6 w-6 text-primary-500', rating >= value ? 'text-primary-100' : 'text-gray-500')}
            />
          </div>
        ))}
      </div>
      <p className="sr-only">{rating}/5</p>
    </>
  );
};
