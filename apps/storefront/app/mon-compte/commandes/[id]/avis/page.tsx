'use client';

import { Order } from '.prisma/client';
import { routes } from '@couture-next/routing';
import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { Field } from '@couture-next/ui/form/Field';
import { Label, Radio, RadioGroup } from '@headlessui/react';
import { StarIcon } from '@heroicons/react/24/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from 'apps/storefront/contexts/AuthContext';
import { trpc } from 'apps/storefront/trpc-client';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Page() {
  const orderId = useParams().id as string;
  const getOrderQuery = trpc.orders.findById.useQuery(orderId);
  if (getOrderQuery.isError) throw getOrderQuery.error;

  const reviewableItems = getOrderQuery.data?.items.filter((item) => !item.reviewId && item.originalArticleId);
  const groupedReviewableItems =
    reviewableItems?.reduce((acc, item) => {
      if (!item.originalArticleId) return acc;
      if (!acc[item.originalArticleId]) acc[item.originalArticleId] = [];
      acc[item.originalArticleId].push(item);
      return acc;
    }, {} as Record<string, typeof reviewableItems>) ?? {};

  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);

  if (getOrderQuery.isPending) return <p className="text-center">Récupération de la commande...</p>;

  if (currentArticleIndex >= Object.keys(groupedReviewableItems).length) {
    return (
      <div>
        <p className="text-center font-bold text-xl">Merci !</p>
        <Link href={routes().index()} className="btn-primary mx-auto mt-6">
          Retour à la page d'accueil
        </Link>
      </div>
    );
  }

  const currentArticleId = Object.keys(groupedReviewableItems)[currentArticleIndex];

  if (!reviewableItems?.length)
    return <p className="text-center">Ta commande ne contient pas d'articles sur lesquels ta peux donner ton avis.</p>;

  return (
    <div className="flex flex-col gap-4 px-4">
      <h1 className="text-center">Donne nous ton avis</h1>
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
    defaultValues: { score: 5, authorName: userQuery.data?.firstName ?? '' },
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
      <p className="text-center font-bold text-xl mb-4">Qu'as tu pensé de la création "{items[0].description}" ?</p>
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
      <Label className="sr-only">Note</Label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex items-center justify-center">
        {[1, 2, 3, 4, 5].map((value) => (
          <Radio
            key={value}
            value={value}
            className="p-2 !outline-none cursor-pointer group data-[checked]:ring-1 ring-primary-100"
          >
            <span className="sr-only">{value}</span>
            <StarIcon className="h-6 w-6 text-primary-500 group-data-[checked]:text-primary-100" />
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
};
