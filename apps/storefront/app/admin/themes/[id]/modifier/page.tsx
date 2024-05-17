'use client';

import { routes } from '@couture-next/routing';
import { ButtonWithLoading, Field } from '@couture-next/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from 'apps/storefront/trpc-client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

type Props = {
  params: {
    id: string;
  };
};

const schema = z.object({
  name: z.string().min(1),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
  }),
});

type EditArticleThemeForm = z.infer<typeof schema>;

export default function Page({ params: { id } }: Props) {
  const artileThemeQuery = trpc.articleThemes.findById.useQuery(id);
  const form = useForm<EditArticleThemeForm>({
    resolver: zodResolver(schema),
    values: {
      name: artileThemeQuery.data?.name ?? '',
      seo: {
        title: artileThemeQuery.data?.seo?.title ?? '',
        description: artileThemeQuery.data?.seo?.description ?? '',
      },
    },
  });

  const trpcUtils = trpc.useUtils();
  const editMutation = trpc.articleThemes.update.useMutation({
    onSuccess: () => {
      trpcUtils.articleThemes.invalidate();
    },
  });

  const router = useRouter();

  const onSubmit = form.handleSubmit(async (values) => {
    await editMutation
      .mutateAsync({ id, ...values })
      .then(() => {
        router.push(routes().admin().articleThemes().index());
      })
      .catch((error) => {
        console.error(error);
        toast.error('Une erreur est survenue');
      });
  });

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-serif text-center mb-8">Modifier le thème</h1>
      <form className="space-y-4 grid grid-cols-[auto_1fr] items-center gap-2" onSubmit={onSubmit}>
        <h2 className="col-span-full text-center text-xl font-serif">Général</h2>
        <Field
          label="Nom"
          widgetId="name"
          error={form.formState.errors.name?.message}
          renderWidget={(className) => <input id="name" className={className} {...form.register('name')} />}
        />
        <h2 className="col-span-full text-center text-xl font-serif">Seo</h2>
        <Field
          label="Titre"
          widgetId="seo.title"
          error={form.formState.errors.seo?.title?.message}
          renderWidget={(className) => <input id="seo.title" className={className} {...form.register('seo.title')} />}
        />
        <Field
          label="Description"
          widgetId="seo.description"
          error={form.formState.errors.seo?.description?.message}
          renderWidget={(className) => (
            <textarea id="seo.description" className={className} {...form.register('seo.description')} />
          )}
        />
        <ButtonWithLoading
          type="submit"
          loading={form.formState.isSubmitting}
          className="btn-primary mx-auto col-span-full"
        >
          Enregistrer
        </ButtonWithLoading>
      </form>
    </div>
  );
}
