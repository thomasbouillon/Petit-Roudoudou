'use client';
import { useState, useMemo, useEffect } from 'react';
import z from 'zod';
import clsx from 'clsx';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@couture-next/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from 'apps/storefront/trpc-client';
import { FormProvider, UseFormReset, useForm } from 'react-hook-form';
import { CategoryForm } from './categoryPropsFields';
import { StockForm } from './stockPropsFields';
import { CustomizationForm } from './customPropsFields';
import useArticleSeo from '../../../hooks/UseArticleSeo';
import { useParams } from 'next/navigation';
//----------------------------------------------------------------------
export const schema = z.object({
  seo: z.object({
    title: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
    description: z.string().min(3, 'La description doit faire au moins 3 caractères'),
  }),
});

export type ArticleFormType = z.infer<typeof schema>;
export type OnSubmitArticleFormCallback = (data: ArticleFormType, reset: UseFormReset<ArticleFormType>) => void;

export const SubmitButton = ({ isDirty, isPending }: { isDirty: boolean; isPending: boolean }) => (
  <button
    type="submit"
    disabled={!isDirty || isPending}
    className={clsx(
      'ml-auto mr-2 pl-2',
      isDirty && !isPending && 'animate-bounce',
      !isDirty && 'opacity-20 cursor-not-allowed'
    )}
  >
    {!isPending && <CheckCircleIcon className="h-6 w-6 text-primary-100" />}
    {isPending && <Spinner className="w-6 h-6 text-primary-100" />}
  </button>
);
//----------------------------------------------------------------------

export function Form({ stockUidBlacklist, isPending }: { stockUidBlacklist?: string[]; isPending?: boolean }) {
  const { data: articles, error } = trpc.articles.list.useQuery();
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    setStock('');
  }, [category]);

  //----------------------------------------------------------------------

  const id = useParams().id as string;
  const { query, saveMutation } = useArticleSeo(id);
  if (query.isError) throw query.error;
  const methods = useForm<ArticleFormType>({
    resolver: zodResolver(schema),
  });
  const onSubmit: OnSubmitArticleFormCallback = async (data, reset) => {
    await saveMutation.mutateAsync({
      id: selectedArticle?.id ?? '',
      ...data,
      stocks: [],
      name: '',
      namePlural: '',
      description: '',
      shortDescription: '',
      images: [],
      customizableVariants: [],
      customizables: [],
      characteristics: {},
      skus: [],
    });
    reset(data);
  };
  //----------------------------------------------------------------------

  const selectedArticle = useMemo(() => articles?.find((article) => article.id === category), [articles, category]);
  const filteredStocks = useMemo(
    () =>
      selectedArticle
        ? stockUidBlacklist
          ? selectedArticle.stocks.filter((stock) => !stockUidBlacklist.includes(stock.uid))
          : selectedArticle.stocks
        : [],
    [selectedArticle, stockUidBlacklist]
  );
  if (articles === undefined) return <div>Loading...</div>;

  if (error) throw error;

  return (
    <div className="max-w-3xl mx-auto my-8 shadow-sm bg-white rounded-md px-4 border">
      <FormProvider {...methods}>
        <CategoryForm
          category={category}
          setCategory={setCategory}
          articles={articles}
          isPending={!!isPending}
          onSubmitCallback={onSubmit}
        />
        {category && category.length > 0 && (
          <>
            <StockForm stock={stock} setStock={setStock} filteredStocks={filteredStocks} isPending={!!isPending} />
            <CustomizationForm isPending={!!isPending} />
          </>
        )}
      </FormProvider>
    </div>
  );
}
