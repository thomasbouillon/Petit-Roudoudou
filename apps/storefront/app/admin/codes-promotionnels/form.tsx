import { TRPCRouterInput } from '@couture-next/api-connector';
import { Article } from '@couture-next/types';
import { Field, Spinner } from '@couture-next/ui';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import { DefaultValues, useForm } from 'react-hook-form';
import { ZodType, z } from 'zod';

export type PromotionCodeDTO = TRPCRouterInput['promotionCodes']['create'];

const schema = z.intersection(
  z.object({
    code: z.string().min(1),
    conditions: z.object({
      minAmount: z.number().min(0).optional(),
      until: z.date().optional(),
      usageLimit: z.number().min(0).optional(),
    }),
  }),
  z.union([
    z.object({
      type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
      discount: z.number().min(0).max(100),
      filters: z.object({
        category: z.enum(['IN_STOCK', 'CUSTOMIZED']).optional(),
        articleId: z.string().optional(),
      }),
    }),
    z.object({
      type: z.enum(['FREE_SHIPPING']),
    }),
  ])
) satisfies ZodType<PromotionCodeDTO>;

export type PromotionCodeFormType = z.infer<typeof schema>;

export type Props = {
  onSubmit: (data: PromotionCodeFormType) => void;
  defaultValues?: DefaultValues<PromotionCodeFormType>;
};

export default function Form({ onSubmit, defaultValues }: Props) {
  console.log(defaultValues);
  const form = useForm<PromotionCodeFormType>({
    defaultValues,
    resolver: zodResolver(
      schema.superRefine((data, ctx) => {
        if (
          data.code !== defaultValues?.code &&
          allPromotionCodesQuery.data?.some((promotionCode) => promotionCode.code === data.code)
        ) {
          ctx.addIssue({ code: 'custom', message: 'Ce code promotionnel existe déjà.', path: ['code'] });
          return false;
        }
      })
    ),
  });

  const allArticlesQuery = trpc.articles.list.useQuery(undefined, {
    select: (data) => data as Article[],
  });
  if (allArticlesQuery.isError) throw allArticlesQuery.error;

  const allPromotionCodesQuery = trpc.promotionCodes.list.useQuery();
  if (allPromotionCodesQuery.isError) throw allPromotionCodesQuery.error;

  const handleSubmit = form.handleSubmit(onSubmit);

  const SubmitButton = (
    <button
      type="submit"
      disabled={!form.formState.isDirty || form.formState.isSubmitting}
      className={clsx(
        form.formState.isDirty && !form.formState.isSubmitting && 'animate-bounce',
        !form.formState.isDirty && 'opacity-20 cursor-not-allowed'
      )}
    >
      {!form.formState.isSubmitting && <CheckCircleIcon className="h-6 w-6 text-primary-100" />}
      {form.formState.isSubmitting && <Spinner className="w-6 h-6 text-primary-100" />}
    </button>
  );

  return (
    <form
      className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md border pt-4 space-y-4"
      onSubmit={handleSubmit}
    >
      <div className="flex justify-end border-b px-4 pb-4">{SubmitButton}</div>

      <div className="grid grid-cols-[auto_1fr] gap-4 border p-4 mx-4">
        <h2 className="font-bold col-span-full">Général</h2>
        <Field
          label="Code"
          widgetId="code"
          labelClassName="min-w-[min(30vw,15rem)]"
          error={form.formState.errors.code?.message}
          renderWidget={(className) => <input {...form.register('code')} type="text" id="code" className={className} />}
        />
        <Field
          label="Type"
          widgetId="type"
          error={form.formState.errors.type?.message}
          renderWidget={(className) => (
            <select id="type" className={className} {...form.register('type')}>
              <option value="PERCENTAGE">Pourcentage</option>
              <option value="FIXED_AMOUNT">Remise fixe</option>
              <option value="FREE_SHIPPING">Livraison gratuite</option>
            </select>
          )}
        />
        {form.watch('type') !== 'FREE_SHIPPING' && (
          <Field
            label="Montant"
            widgetId="discount"
            error={(form.formState.errors as any).discount?.message}
            renderWidget={(className) => (
              <div className={'flex gap-4'}>
                <input
                  type="number"
                  id="discount"
                  className={className}
                  {...form.register('discount', { valueAsNumber: true })}
                  required
                />
                <span className="w-4 block my-auto empty:hidden">
                  {form.watch('type') === 'FIXED_AMOUNT' ? '€' : form.watch('type') === 'PERCENTAGE' ? '%' : ''}
                </span>
              </div>
            )}
          />
        )}
      </div>

      <div className="p-4 border mx-4">
        <h2 className="font-bold">
          Conditions <small className="font-normal">(Tous les champs sont optionnels)</small>
        </h2>
        <div className="grid grid-cols-[auto_1fr] gap-4">
          <Field
            label="Montant minimum"
            widgetId="conditions.minAmount"
            labelClassName="min-w-[min(30vw,15rem)]"
            error={form.formState.errors.conditions?.minAmount?.message}
            renderWidget={(className) => (
              <div className={'flex gap-4'}>
                <input
                  type="number"
                  id="conditions.minAmount"
                  className={className}
                  {...form.register('conditions.minAmount', {
                    setValueAs: numberOrUndefinedTransformer,
                  })}
                />
                <span className="w-4 block my-auto empty:hidden">€</span>
              </div>
            )}
          />
          <Field
            label="Utilisable jusqu'au"
            widgetId="conditions.until"
            error={form.formState.errors.conditions?.until?.message}
            renderWidget={(className) => (
              <input
                type="datetime-local"
                id="conditions.until"
                className={className}
                {...form.register('conditions.until', {
                  setValueAs: dateOrUndefinedTransformer,
                })}
              />
            )}
          />
          <Field
            label="Nombre d'utilisations maximum"
            widgetId="conditions.usageLimit"
            error={form.formState.errors.conditions?.usageLimit?.message}
            renderWidget={(className) => (
              <input
                type="number"
                id="conditions.usageLimit"
                className={className}
                {...form.register('conditions.usageLimit', {
                  setValueAs: numberOrUndefinedTransformer,
                })}
              />
            )}
          />
        </div>
      </div>

      {form.watch('type') !== 'FREE_SHIPPING' && (
        <div className="p-4 border mx-4">
          <div className="flex gap-2 items-end">
            <h2 className="font-bold">
              Filtres <small className="font-normal">(Tous les champs sont optionnels)</small>
            </h2>
            <small className="mb-px">(applique le code promotionnel que sur certains articles du panier)</small>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <Field
              label="Type d'articles"
              widgetId="filters.category"
              labelClassName="min-w-[min(30vw,15rem)]"
              error={(form.formState.errors as any).filters?.category?.message}
              renderWidget={(className) => (
                <select
                  id="filters.category"
                  className={className}
                  {...form.register('filters.category', {
                    setValueAs: stringOrUndefinedTransformer,
                  })}
                >
                  <option value=""></option>
                  <option value="inStock">En stock</option>
                  <option value="customized">Personnalisé</option>
                </select>
              )}
            />
            <Field
              label="Article"
              widgetId="filters.articleId"
              error={(form.formState.errors as any).filters?.articleId?.message}
              renderWidget={(className) => (
                <select
                  id="filters.articleId"
                  className={className}
                  {...form.register('filters.articleId', {
                    setValueAs: stringOrUndefinedTransformer,
                  })}
                >
                  <option value=""></option>
                  {allArticlesQuery.data?.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>
      )}
      <div className="flex justify-end mb-4 border-t px-4 pt-4 mt-8">{SubmitButton}</div>
    </form>
  );
}

const numberOrUndefinedTransformer = (value: string) => (value === '' ? undefined : parseInt(value));
const stringOrUndefinedTransformer = (value: string) => (value === '' ? undefined : value);
const dateOrUndefinedTransformer = (value: string) => (value === '' ? undefined : new Date(value));
