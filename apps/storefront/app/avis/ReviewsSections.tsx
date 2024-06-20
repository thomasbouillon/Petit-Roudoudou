'use client';

import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { StarIcon } from '@heroicons/react/24/solid';
import { Review } from '@prisma/client';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
const scoreList = [
  { id: 5, name: '5 étoiles' },
  { id: 4, name: '4 étoiles' },
  { id: 3, name: '3 étoiles' },
  { id: 2, name: '2 étoiles' },
  { id: 1, name: '1 étoile' },
];
const paginationPageSize = 8;
export default function ReviewsSection() {
  const [selectedScores, setSelectedScores] = useState<{ id: number; name: string } | null>(null);
  const [paginationPage, setPaginationPage] = useState(1);
  const [allReviews, setAllReviews] = useState({
    reviews: [] as Omit<Review, 'articleId' | 'id'>[],
    totalCount: 0,
    reviewsScore: [] as { score: number; _count: { score: number } }[],
  });
  const selectedScoreId = selectedScores?.id;
  const getReviewsQuery = trpc.reviews.find.useQuery({
    skip: paginationPageSize * (paginationPage - 1),
    take: paginationPageSize,
    scores: selectedScoreId,
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
  useEffect(() => {
    setAllReviews({ reviews: [], totalCount: 0, reviewsScore: [] });
    setPaginationPage(1);
  }, [selectedScores]);

  if (getReviewsQuery.isError) throw getReviewsQuery.error;
  if (allReviews.reviews.length === 0 && getReviewsQuery.isPending) return <div>Chargement des avis...</div>;
  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  if (allReviews.reviews.length === 0) return null;
  console.log(allReviews);
  return (
    <div className="my-4 mx-4 md:mx-16" id="reviews">
      <p className="text-base text-center p-2 font-bold">{allReviews.totalCount} évaluations</p>
      <div>
        <Progressbars reviewsScore={allReviews.reviewsScore} />
      </div>

      <div className="relative">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(24rem,65ch))] gap-4 place-content-center">
          <div className="">
            <Listbox value={selectedScores} onChange={setSelectedScores}>
              <ListboxButton className="flex items-center">
                <span className="flex-1">Filtrer par note</span>
                <ChevronUpDownIcon className="w-5 h-5"></ChevronUpDownIcon>
              </ListboxButton>
              <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <ListboxOptions
                  anchor="bottom"
                  className="cursor-default gap-2 py-1.5 px-3 select-none bg-white data-[focus]:bg-white/10"
                >
                  {scoreList.map((score) => (
                    <ListboxOption
                      key={score.id}
                      value={score}
                      className="flex items-center gap-2 data-[focus]:bg-blue-100 group"
                    >
                      <CheckIcon className="invisible size-5   fill-primary-100 group-data-[selected]:visible" />
                      <span>{score.name}</span>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </Listbox>
          </div>
          <div></div>
          {allReviews.reviews.map((review, i) => (
            <div className="p-4 shadow-md border" key={i}>
              <Scores rating={review.score} />
              <p>{review.text}</p>
              <small className="block text-end">
                {review.authorName} - {formatDate(review.createdAt)}
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

const Scores: React.FC<{ rating: number }> = ({ rating }) => {
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
  return (
    <div className="grid max-w-lg  pb-8 mx-auto">
      {reviewsScore.map((score) => (
        <div key={score.score} className="grid grid-cols-4 items-center">
          <div className="col-span-1 text-center px-4">{score.score.toFixed(0)} étoiles</div>
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
