import { Article } from '@couture-next/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from 'apps/storefront/trpc-client';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

const schema = z.object({
  shopPage: z.object({
    serp: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }),
  customizePage: z.object({
    serp: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }),
  stockShopPages: z.array(
    z.object({
      serp: z.object({
        title: z.string(),
        description: z.string(),
      }),
      fullDescription: z.string(),
    })
  ),
});

export type ArticleSeoDTO = z.infer<typeof schema>;

export default function useArticleSeoForm(article: Article) {
  const form = useForm<ArticleSeoDTO>({
    resolver: zodResolver(schema),
    defaultValues: {
      shopPage: { serp: article.seo },
      customizePage: { serp: { title: '', description: '' } },
      stockShopPages: article.stocks.map((stock) => ({
        serp: stock.seo,
        fullDescription: stock.fullDescription ?? '',
      })),
    },
  });

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.articles.updateSeo.useMutation({
    async onSuccess() {
      trpcUtils.articles.invalidate();
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await saveMutation
      .mutateAsync({
        id: article.id,
        seo: data.shopPage.serp,
        stocks: data.stockShopPages.map((stock) => ({
          seo: stock.serp,
          fullDescription: stock.fullDescription,
        })),
      })
      .then(() => {
        form.reset(data);
        toast.success('Enregistré');
      })
      .catch((e) => {
        console.error(e);
        toast.error('Une erreur est survenue');
      });
  });

  return { ...form, onSubmit };
}
