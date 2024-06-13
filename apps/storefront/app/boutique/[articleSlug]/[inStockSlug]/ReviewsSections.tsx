'use client';

import { Spinner } from '@couture-next/ui';
import { StarIcon } from '@heroicons/react/24/solid';
import { Review } from '@prisma/client';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import React, { useEffect, useMemo } from 'react';

type Props = {
  articleId: string;
  titleAs?: React.ElementType;
};

const paginationPageSize = 6;

export default function ReviewsSection({ articleId, titleAs: titleAs }: Props) {
  const TitleComponent = titleAs ?? 'h2';
  const [paginationPage, setPaginationPage] = React.useState(1);
  const prevData = React.useRef({
    reviews: [] as Review[],
    totalCount: 0,
  });

  const getReviewsQuery = trpc.reviews.findByArticle.useQuery(
    {
      articleId,
      skip: paginationPageSize * (paginationPage - 1),
      take: paginationPageSize,
    },
    {
      placeholderData: prevData.current,
    }
  );

  useEffect(() => {
    if (getReviewsQuery.data) {
      prevData.current = getReviewsQuery.data;
    }
  }, [getReviewsQuery.data]);

  const shouldShowDate = useMemo(() => {
    const latest = getReviewsQuery.data?.reviews[0];
    return latest !== undefined && latest.createdAt.getTime() > new Date().getTime() - 1000 * 60 * 60 * 24 * 180;
  }, [getReviewsQuery.data]);

  if (getReviewsQuery.isError) throw getReviewsQuery.error;
  if (getReviewsQuery.isPending) return <div>Chargement des avis...</div>;

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  if (getReviewsQuery.data?.reviews.length === 0) return null;

  return (
    <div className="my-8 mx-4 md:mx-16" id="reviews">
      <TitleComponent className="text-3xl font-serif mb-4 text-center">Avis clients</TitleComponent>
      <div className="relative">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(24rem,65ch))] gap-4 place-content-center">
          {getReviewsQuery.data?.reviews.map((review) => (
            <div className="p-4 shadow-md border">
              <Stars rating={review.score} />
              <p>{review.text}</p>
              <small className="block text-end">
                {review.authorName}
                {shouldShowDate && ' - ' + formatDate(review.createdAt)}
              </small>
            </div>
          ))}
        </div>
        {getReviewsQuery.isFetching && (
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2">
            <Spinner className="" />
          </div>
        )}
      </div>
      <PageSelector
        currentPage={paginationPage}
        totalPages={Math.ceil(getReviewsQuery.data.totalCount / paginationPageSize)}
        setPage={setPaginationPage}
      />
    </div>
  );
}

const Stars: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <>
      <div className="flex items-center justify-center" aria-hidden>
        {[1, 2, 3, 4, 5].map((value) => (
          <div key={value} className="p-2 !outline-none cursor-pointer">
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

const PageSelector = ({
  currentPage,
  totalPages,
  setPage,
}: {
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  if (pages.length <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-4">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => setPage(page)}
          className={clsx(
            'px-2 py-1 rounded-md border border-gray-300',
            currentPage === page ? 'bg-gray-100' : 'hover:bg-gray-100'
          )}
        >
          {page}
        </button>
      ))}
    </div>
  );
};
