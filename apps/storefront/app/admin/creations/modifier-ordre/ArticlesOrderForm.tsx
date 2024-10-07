'use client';

import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { Spinner } from '@couture-next/ui/Spinner';
import { trpc } from 'apps/storefront/trpc-client';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import Image from 'next/image';
import { Fragment } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  articles: z.array(z.object({ id: z.string(), name: z.string(), image: z.string().nullish() })),
});

type FormData = z.infer<typeof schema>;

export default function Form() {
  const articlesQuery = trpc.articles.list.useQuery(undefined, {
    select: (res) => res.map((article) => ({ id: article.id, name: article.name, image: article.images[0]?.url })),
  });
  const form = useForm<FormData>({
    defaultValues: articlesQuery.data ? { articles: articlesQuery.data } : undefined,
  });
  const { fields: articles, move } = useFieldArray({
    control: form.control,
    name: 'articles',
  });

  const trpcUtils = trpc.useUtils();
  const editOrderMutation = trpc.articles.updatePositions.useMutation({
    onSuccess: async () => {
      await trpcUtils.articles.invalidate();
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await editOrderMutation.mutateAsync(data.articles.map((article, index) => article.id));
  });

  if (articlesQuery.error) throw articlesQuery.error;
  if (articlesQuery.isLoading) return <Spinner />;

  return (
    <form className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md px-4 border py-8" onSubmit={onSubmit}>
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 max-w-md mx-auto">
        {articles.map((article, index) => (
          <Fragment key={article.id}>
            <Image
              src={article.image ?? ''}
              width={64}
              height={64}
              alt=""
              loader={loader}
              className="w-16 h-16 rounded-md"
            />
            <span>{article.name}</span>
            <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0}>
              ↑
            </button>
            <button type="button" onClick={() => move(index, index + 1)} disabled={index === articles.length - 1}>
              ↓
            </button>
          </Fragment>
        ))}
      </div>
      <ButtonWithLoading type="submit" className="btn-primary mx-auto mt-6" loading={form.formState.isSubmitting}>
        Enregistrer
      </ButtonWithLoading>
    </form>
  );
}
