'use client';

import { ButtonWithLoading, Spinner } from '@couture-next/ui';
import { StarIcon } from '@heroicons/react/24/solid';
import { Review } from '@prisma/client';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import React, { useEffect, useMemo } from 'react';

const paginationPageSize = 8;

export default function ReviewsSection() {
  const [paginationPage, setPaginationPage] = React.useState(1);
  const [allReviews, setAllReviews] = React.useState({
    reviews: [] as Omit<Review, 'articleId' | 'id'>[],
    totalCount: 0,
    reviewsScore: [] as { score: number; _count: { score: number } }[],
  });

  const getReviewsQuery = trpc.reviews.find.useQuery({
    skip: paginationPageSize * (paginationPage - 1),
    take: paginationPageSize,
  });

  useEffect(() => {
    if (getReviewsQuery.data) {
      setAllReviews((prev) => ({
        reviews: prev.reviews.concat(getReviewsQuery.data.reviews),
        totalCount: getReviewsQuery.data.totalCount,
        reviewsScore: getReviewsQuery.data.reviewsScore,
      }));
    }
  }, [getReviewsQuery.data]);

  const shouldShowDate = useMemo(() => {
    const latest = allReviews.reviews?.[0];
    return latest !== undefined && latest.createdAt.getTime() > new Date().getTime() - 1000 * 60 * 60 * 24 * 180;
  }, [allReviews.reviews]);
  console.log(allReviews.reviewsScore);
  if (getReviewsQuery.isError) throw getReviewsQuery.error;
  if (allReviews.reviews.length === 0 && getReviewsQuery.isPending) return <div>Chargement des avis...</div>;
  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  if (allReviews.reviews.length === 0) return null;
  console.log(allReviews);

  return (
    <div className="my-4 mx-4 md:mx-16" id="reviews">
      <div>
        <Progressbars reviewsScore={allReviews.reviewsScore} />
      </div>
      <div className="relative">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(24rem,65ch))] gap-4 place-content-center">
          {allReviews.reviews.map((review, i) => (
            <div className="p-4 shadow-md border" key={i}>
              <Stars rating={review.score} />
              <p>{review.text}</p>
              <small className="block text-end">
                {review.authorName}
                {shouldShowDate && ' - ' + formatDate(review.createdAt)}
              </small>
            </div>
          ))}
        </div>
      </div>
      <ButtonWithLoading
        loading={getReviewsQuery.isPending}
        className="btn-light mx-auto"
        type="button"
        onClick={() => setPaginationPage((prev) => prev + 1)}
      >
        Voir plus d&apos;avis
      </ButtonWithLoading>
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

const Progressbars = ({ reviewsScore }: { reviewsScore: { score: number; _count: { score: number } }[] }) => {
  const total = reviewsScore.reduce((acc, { _count }) => acc + _count.score, 0);
  console.log(reviewsScore);
  console.log(total);
  return (
    <div className="grid max-w-lg text-center pb-8 mx-auto">
      {reviewsScore.map((score) => (
        <div key={score.score} className="grid grid-cols-4 items-center">
          <div className="col-span-1 px-4">{score.score.toFixed(0)} étoiles</div>
          <div className="col-span-2 px-4">
            <div className="bg-gray-200">
              <div
                className="bg-primary-100"
                style={{ width: `${((score._count.score / total) * 100).toFixed(0)}%`, height: '1rem' }}
              />
            </div>
          </div>
          <div className="col-span-1 px-4">{((score._count.score / total) * 100).toFixed(0)}%</div>
        </div>
      ))}
    </div>
  );
};
