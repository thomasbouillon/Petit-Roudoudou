import { Article } from '@couture-next/types';
import { PropsWithChildren } from 'react';
import useArticleSeoForm from './useArticleSeoForm';
import { FormProvider } from 'react-hook-form';
import { ButtonWithLoading } from '@couture-next/ui';
import clsx from 'clsx';

type Props = PropsWithChildren<{
  article: Article;
}>;

export default function ArticleSeoFormWrapper({ article, children }: Props) {
  const form = useArticleSeoForm(article);
  return (
    <form onSubmit={form.onSubmit}>
      <FormProvider {...form}>{children}</FormProvider>
      <div className="fixed bottom-0 sm:bottom-2 left-1/2 -translate-x-1/2 w-full sm:w-40">
        <ButtonWithLoading
          loading={form.formState.isSubmitting}
          disabled={!form.formState.isDirty}
          className={clsx('btn-primary w-full text-center', !form.formState.isDirty && 'cursor-not-allowed opacity-70')}
          type="submit"
        >
          Enregister
        </ButtonWithLoading>
      </div>
    </form>
  );
}
