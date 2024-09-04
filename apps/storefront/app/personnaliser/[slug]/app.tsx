'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import ChooseSKU from './formSkuField';
import FormChooseFabricsFields from './formChooseFabricsFields';
import { useCart } from '../../../contexts/CartContext';
import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { WithStructuredDataWrapper } from '@couture-next/ui/seo/WithStructuredDataWrapper';
import { BreadCrumbsNav } from '@couture-next/ui/BreadCrumbsNav';
import { z } from 'zod';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import ManufacturingTimes from '../../manufacturingTimes';
import FormChooseCustomizableFields from './(customizables)/form';
import { structuredData } from '@couture-next/seo';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import ReviewsSection from '../../boutique/[articleSlug]/[inStockSlug]/ReviewsSections';
import env from '../../../env';
import { Article } from '@couture-next/types';
import { applyTaxes } from '@couture-next/utils';
import { ArticleDetailsSection } from './articleDetailsSection';
import { ImagePreview } from './imagePreview';
import ChooseVariant from './chooseVariant';
import { CostTable } from './CostTable';

const schema = z.object({
  skuId: z.string().min(1),
  articleId: z.string().min(1),
  imageDataUrl: z.string().min(1),
  customizations: z.record(z.unknown()),
  quantity: z.number().int().min(1),
  comment: z.string().default(''),
});

export type AddToCartFormType = z.infer<typeof schema>;

const allowedSteps = ['chooseVariant', 'chooseFabrics', 'chooseOptions'] as const;
type Step = (typeof allowedSteps)[number];
const firstStep = allowedSteps[0];

export function App({ article }: { article: Article }) {
  const queryParams = useSearchParams();
  const router = useRouter();

  const [addedToCart, setAddedToCart] = useState(false);

  const containerRef = useRef<HTMLElement>(null);

  const step = (queryParams.get('step') ?? firstStep) as Step;
  const selectedVariantUid = queryParams.get('variant');
  const selectedVariant = useMemo(
    () => article.customizableVariants.find((variant) => variant.uid === selectedVariantUid),
    [selectedVariantUid, article.customizableVariants]
  );

  useEffect(() => {
    if (queryParams.get('step') === null) {
      const url = new URL(window.location.href);
      url.searchParams.set('step', firstStep);
      router.replace(url.toString());
    }
  }, [queryParams]);

  const setStep = (next: Step) => {
    const url = new URL(window.location.href);
    url.searchParams.set('step', next);
    router.push(url.toString());
  };

  const schemaWithRefine = useMemo(
    () =>
      zodResolver(
        schema.extend({
          customizations: z
            .record(
              z.unknown().transform((v) => (typeof v === 'object' && v !== null && !(v as any)['text'] ? undefined : v))
            )
            .refine(
              (customizations) => {
                if (!article) return false;
                if (!selectedVariant) return false;
                const allFabricsAreChosen = selectedVariant.customizableParts.every(
                  (customizableFabric) => customizations[customizableFabric.uid]
                );
                const allCustomizablesAreFilled = article.customizables
                  .filter((customizable) => selectedVariant.inherits.includes(customizable.uid))
                  .every((customizable) => {
                    if (customizable.type === 'customizable-boolean')
                      return typeof customizations[customizable.uid] === 'boolean';
                    if (customizable.type === 'customizable-text')
                      return typeof customizations[customizable.uid] === 'string';
                    if (customizable.type === 'customizable-piping')
                      return typeof customizations[customizable.uid] === 'string';
                    if (customizable.type === 'customizable-embroidery')
                      return z
                        .object({ text: z.string(), colorId: z.string() })
                        .optional()
                        .safeParse(customizations[customizable.uid]).success;

                    return false;
                  });
                return allFabricsAreChosen && allCustomizablesAreFilled;
              },
              {
                message: 'Remplis tous les champs',
              }
            ),
        })
      ),
    [article.customizableVariants, article?.customizables, selectedVariant]
  );

  const form = useForm<AddToCartFormType>({
    resolver: schemaWithRefine,
    defaultValues: {
      articleId: article.id,
      quantity: 1,
      skuId: queryParams.get('sku') ?? '',
      customizations: (article?.customizables ?? []).reduce((acc, customizable) => {
        if (customizable.type === 'customizable-boolean') acc[customizable.uid] = false;
        if (customizable.type === 'customizable-text') acc[customizable.uid] = '';
        return acc;
      }, {} as Record<string, string | boolean>),
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = form;

  const selectedFabrics = watch('customizations');
  const allFabricsAreChosen = useMemo(() => {
    if (!selectedVariant) return false;
    return selectedVariant.customizableParts.every((customizableFabric) => selectedFabrics[customizableFabric.uid]);
  }, [selectedFabrics, selectedVariant]);

  useEffect(() => {
    // invalid step from url
    if (!allowedSteps.includes(step)) {
      setStep(firstStep);
    } else if (step === 'chooseVariant' && selectedVariant) {
      // variant selected but step is chooseVariant
      setStep('chooseFabrics');
    } else if (step !== 'chooseVariant' && !selectedVariant) {
      // no variant selected
      setStep('chooseVariant');
    } else if (step !== 'chooseFabrics' && step !== 'chooseVariant' && !allFabricsAreChosen) {
      // step manually set but state is not
      setStep('chooseFabrics');
    }
  }, [step, allFabricsAreChosen, selectedVariant]);

  const { addToCartMutation } = useCart();

  const onSubmit = handleSubmit(async (data) => {
    console.log('HEELLOOOO');
    if (!selectedVariant) return;
    await addToCartMutation.mutateAsync({
      ...data,
      type: 'customized',
    });
    setAddedToCart(true);
  });

  const breadcrumbs = [
    {
      label: 'Boutique',
      href: routes().shop().index(),
    },
    {
      label: article.namePlural,
      href: routes().shop().article(article.slug).index(),
    },
    {
      label: 'Personnalisation',
      href: routes().shop().customize(article.slug),
    },
  ];

  return (
    <WithStructuredDataWrapper
      as="div"
      ref={containerRef}
      className="pt-8 mb-[20vh]"
      stucturedData={structuredData.customizableArticle(article, env.CDN_BASE_URL)}
    >
      <div
        className={clsx(
          'flex items-center flex-col-reverse',
          step === 'chooseFabrics' && 'fixed top-[3.5rem] h-[3.5rem] w-full bg-white z-[11] justify-center'
        )}
      >
        <div className="flex justify-center">
          <BreadCrumbsNav Link={Link} ariaLabel="Navigation dans la boutique" items={breadcrumbs} />
        </div>
      </div>
      <h1 className="sr-only">Personnalisez votre {article.name}</h1>
      <div>
        <FormProvider {...form}>
          <form className={clsx('w-full h-full mx-auto', step !== 'chooseFabrics' && 'max-w-3xl')} onSubmit={onSubmit}>
            {step === 'chooseVariant' && <ChooseVariant article={article} nextStep={'chooseFabrics'} />}
            {step === 'chooseFabrics' && (
              <FormChooseFabricsFields
                className="mt-6 flex-grow"
                article={article}
                onNextStep={() => {
                  setStep('chooseOptions');
                  setTimeout(() => {
                    containerRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }, 50);
                }}
              />
            )}
            {step === 'chooseOptions' && (
              <div className="px-4">
                <strong className="max-w-md block mx-auto empty:hidden">{selectedVariant?.disclaimer}</strong>
                <ImagePreview />
                <ManufacturingTimes className="text-center mb-4" />
                <h2 className="font-serif text-2xl w-full">Récapitulatif</h2>
                <CostTable article={article} />
                <ChooseSKU article={article} />
                <FormChooseCustomizableFields className="mt-6" article={article} register={register} errors={errors} />
                <div>
                  <TotalPrice article={article} />
                  <ButtonWithLoading
                    id="customize_add-to-cart-button"
                    className={clsx(
                      'btn-primary mx-auto mt-4 !static',
                      !isValid && 'bg-opacity-50 cursor-not-allowed',
                      step !== 'chooseOptions' && 'sr-only'
                    )}
                    loading={addToCartMutation.isPending}
                    // disabled={!isValid}
                    type="submit"
                  >
                    Continuer
                  </ButtonWithLoading>
                  {addedToCart && (
                    <Link href={routes().shop().index()} className="btn-light mx-auto">
                      Continuer mes achats
                    </Link>
                  )}
                </div>
                <div className="mt-4">
                  <ArticleDetailsSection article={article} />
                </div>
                <ReviewsSection articleId={article.id} />
              </div>
            )}
          </form>
        </FormProvider>
      </div>
    </WithStructuredDataWrapper>
  );
}

function TotalPrice({ article }: { article: Article }) {
  const watch = useFormContext<AddToCartFormType>().watch;
  const quantity = watch('quantity');
  const skuId = watch('skuId');
  const options = watch('customizations');

  const sku = skuId ? article.skus.find((sku) => sku.uid === skuId) : null;

  const optionsPrice = Object.entries(options).reduce((acc, [key, value]) => {
    const option = article.customizables.find((customizable) => customizable.uid === key);
    if (!option || !option.price) return acc;
    const valueIsFilled =
      option.type !== 'customizable-embroidery' ? !!value : !!(value as Record<string, string>)?.text;
    return acc + (valueIsFilled ? option.price : 0);
  }, 0);

  return (
    <div className="mt-4">
      <p className="text-center">
        <span className="font-bold">Prix total:</span>{' '}
        {sku && !isNaN(quantity) ? applyTaxes(sku.price + optionsPrice) * quantity : '-'} €
      </p>
    </div>
  );
}
