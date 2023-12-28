import { Article, PromotionCode } from '@couture-next/types';
import { Field, Spinner } from '@couture-next/ui';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import clsx from 'clsx';
import { collection, getDocs } from 'firebase/firestore';
import { DefaultValues, useForm } from 'react-hook-form';
import { ZodType, z } from 'zod';

const schema = z.intersection(
  z.object({
    code: z.string().min(1),
    conditions: z
      .object({
        minAmount: z.number().min(0).optional(),
        until: z.date().optional(),
        usageLimit: z.number().min(0).optional(),
      })
      .refine((value) => {
        if (value.minAmount === undefined) delete value.minAmount;
        if (value.until === undefined) delete value.until;
        if (value.usageLimit === undefined) delete value.usageLimit;
        return value;
      }),
  }),
  z.union([
    z
      .object({
        type: z.enum(['percentage', 'fixed']),
        discount: z.number().min(0).max(100),
        filters: z
          .object({
            category: z.enum(['inStock', 'customized']).optional(),
            articleId: z.string().optional(),
          })
          .refine((value) => {
            if (value.category === undefined) delete value.category;
            if (value.articleId === undefined) delete value.articleId;
            return value;
          }),
      })
      .refine((value) => {
        if (value.filters === undefined) delete (value as unknown as { filters: unknown }).filters;
        if (value.discount === undefined) delete (value as unknown as { discount: unknown }).discount;
        return value;
      }),
    z.object({
      type: z.enum(['freeShipping']),
    }),
  ])
) satisfies ZodType<Omit<PromotionCode, '_id' | 'used'>> as ZodType<Omit<PromotionCode, '_id' | 'used'>>;

export type PromotionCodeFormType = z.infer<typeof schema>;

export type Props = {
  onSubmit: (data: PromotionCodeFormType) => void;
  defaultValues?: DefaultValues<PromotionCodeFormType>;
};

export default function Form({ onSubmit, defaultValues }: Props) {
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

  const db = useDatabase();
  const allArticlesQuery = useQuery({
    queryKey: ['articles'],
    queryFn: () =>
      getDocs(collection(db, 'articles').withConverter(firestoreConverterAddRemoveId<Article>())).then((snapshot) =>
        snapshot.docs.map((doc) => doc.data())
      ),
  });
  if (allArticlesQuery.isError) throw allArticlesQuery.error;

  const allPromotionCodesQuery = useQuery({
    queryKey: ['promotionCodes'],
    queryFn: () =>
      getDocs(collection(db, 'promotionCodes').withConverter(firestoreConverterAddRemoveId<PromotionCode>())).then(
        (snapshot) => snapshot.docs.map((doc) => doc.data())
      ),
  });
  if (allPromotionCodesQuery.isError) throw allPromotionCodesQuery.error;

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <form
      className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md border pb-8 pt-4 space-y-4"
      onSubmit={handleSubmit}
    >
      <div className="flex justify-end border-b px-4 pb-4">
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
      </div>

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
              <option value="percentage">Pourcentage</option>
              <option value="fixed">Remise fixe</option>
              <option value="freeShipping">Livraison gratuite</option>
            </select>
          )}
        />
        {form.watch('type') !== 'freeShipping' && (
          <Field
            label="Montant"
            widgetId="discount"
            error={form.formState.errors.discount?.message}
            renderWidget={(className) => (
              <div className={'flex gap-4'}>
                <input
                  type="number"
                  id="discount"
                  className={className}
                  {...form.register('discount', { valueAsNumber: true })}
                />
                <span className="w-4 block my-auto empty:hidden">
                  {form.watch('type') === 'fixed' ? '€' : form.watch('type') === 'percentage' ? '%' : ''}
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

      {form.watch('type') !== 'freeShipping' && (
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
              error={form.formState.errors.filters?.category?.message}
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
              error={form.formState.errors.filters?.articleId?.message}
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
                    <option key={article._id} value={article._id}>
                      {article.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>
      )}
    </form>
  );
}

const numberOrUndefinedTransformer = (value: string) => (value === '' ? undefined : parseInt(value));
const stringOrUndefinedTransformer = (value: string) => (value === '' ? undefined : value);
const dateOrUndefinedTransformer = (value: string) => (value === '' ? undefined : new Date(value));
