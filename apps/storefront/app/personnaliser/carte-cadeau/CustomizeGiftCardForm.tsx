'use client';

import { ButtonWithLoading, Field } from '@couture-next/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { ChooseGiftCardImageField } from './ChooseGiftCardImageField';
import { useCart } from 'apps/storefront/contexts/CartContext';

const schema = z.object({
  amount: z.number().int().min(1, 'Précise un montant.'),
  backgroundColor: z.string(),
  textColor: z.string(),
  recipient: z.object({
    name: z.string().min(1, 'Précise le prénom de la personne à qui tu offres la carte.'),
    email: z.string().email("Précise l'adresse email de la personne à qui tu offres la carte."),
  }),
  title: z.string(),
  message: z.string(),
  text: z.string(),
  image: z.any().refine((image) => image instanceof HTMLImageElement, 'Choisis une image.'),
});

export type CustomizeGiftCardFormValues = z.infer<typeof schema>;

export function CustomizeGiftCardForm() {
  const form = useForm<CustomizeGiftCardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      backgroundColor: '#D27A0F',
      textColor: '#ffffff',
      recipient: {
        name: '',
        email: '',
      },
      title: 'Félicitations',
      message: '',
      amount: 50,
    },
  });

  const cardPreviewBase64Ref = React.useRef<string>();

  const { addToCartMutation } = useCart();
  const onSubmit = form.handleSubmit(async (values) => {
    if (!cardPreviewBase64Ref.current) {
      form.setError('root', { type: 'manual', message: 'Une erreur est survenue' });
      return;
    }
    await addToCartMutation
      .mutateAsync({
        type: 'giftCard',
        amount: values.amount,
        recipient: values.recipient,
        text: values.text,
        imageDataUrl: cardPreviewBase64Ref.current,
      })
      .catch(() => {
        form.setError('root', { type: 'manual', message: 'Une erreur est survenue' });
      });
  });

  return (
    <div>
      <FormProvider {...form}>
        <GiftCardPreview cardPreviewBase64Ref={cardPreviewBase64Ref} />
        <form onSubmit={onSubmit}>
          <Field
            label="Couleur de fond"
            widgetId="backgroundColor"
            labelClassName="!items-start"
            helpText="Couleur de Petit Roudoudou: #D27A0F"
            error={form.formState.errors.backgroundColor?.message}
            renderWidget={(className) => (
              <div className={className}>
                <input type="color" className="w-10" id="backgroundColor" {...form.register('backgroundColor')} />
              </div>
            )}
          />
          <Field
            label="Couleur du texte"
            widgetId="textColor"
            labelClassName="!items-start"
            helpText="Couleur de Petit Roudoudou: #D27A0F"
            error={form.formState.errors.textColor?.message}
            renderWidget={(className) => (
              <div className={className}>
                <input type="color" className="w-10" id="textColor" {...form.register('textColor')} />
              </div>
            )}
          />
          <Field
            label="Montant"
            widgetId="amount"
            labelClassName="!items-start"
            error={form.formState.errors.amount?.message}
            renderWidget={(className) => (
              <input
                type="number"
                id="amount"
                className={className}
                {...form.register('amount', { valueAsNumber: true })}
              />
            )}
          />
          <Field
            label="Titre"
            widgetId="title"
            labelClassName="!items-start"
            error={form.formState.errors.title?.message}
            renderWidget={(className) => (
              <input type="text" id="title" className={className} {...form.register('title')} />
            )}
          />
          <ChooseGiftCardImageField />
          <Field
            label="Prénom du bénéficiaire"
            widgetId="recipientName"
            labelClassName="!items-start"
            error={form.formState.errors.recipient?.name?.message}
            renderWidget={(className) => (
              <input type="text" id="recipientName" className={className} {...form.register('recipient.name')} />
            )}
          />
          <Field
            label="Message sur la carte"
            widgetId="message"
            labelClassName="!items-start"
            error={form.formState.errors.message?.message}
            renderWidget={(className) => <input className={className} id="message" {...form.register('message')} />}
          />
          <div className="border-t-2 my-6 border-dashed"></div>
          <Field
            label="Email du bénéficiaire"
            widgetId="recipientEmail"
            labelClassName="!items-start"
            error={form.formState.errors.recipient?.email?.message}
            renderWidget={(className) => (
              <input type="email" id="recipientEmail" className={className} {...form.register('recipient.email')} />
            )}
          />
          <Field
            label="Message complet à inclure dans l'email"
            widgetId="text"
            labelClassName="!items-start"
            error={form.formState.errors.message?.message}
            renderWidget={(className) => (
              <textarea className={className} id="text" rows={5} {...form.register('text')} />
            )}
          />
          <ButtonWithLoading type="submit" loading={form.formState.isSubmitting} className="btn-primary mx-auto mt-4">
            Ajouter au panier
          </ButtonWithLoading>
          <p className="text-center mt-6 text-red-500">{form.formState.errors.root?.message}</p>
        </form>
      </FormProvider>
    </div>
  );
}

function GiftCardPreview({
  cardPreviewBase64Ref,
}: {
  cardPreviewBase64Ref: React.MutableRefObject<string | undefined>;
}) {
  const values = useWatch<CustomizeGiftCardFormValues>();
  const ref = React.useRef<HTMLCanvasElement>(null);
  const font = React.useRef<string>();

  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d');
    if (!ctx) return;
    if (!font.current) {
      font.current = window.getComputedStyle(ref.current).getPropertyValue('--font-serif');
    }
    ctx.clearRect(0, 0, 400, 200);
    drawBackground(ctx, values.backgroundColor || '#D27A0F');
    ctx.fillStyle = values.textColor || '#ffffff';
    drawTitle(ctx, values.title ?? '', font.current);
    drawImage(ctx, values.image);
    drawInfos(
      ctx,
      `Pour: ${values.recipient?.name || '[Prénom]'}\nValeur: ${values.amount}€\n${values.message || '[Ton message]'}`
    );
    cardPreviewBase64Ref.current = ref.current.toDataURL();
  }, [values, ref.current]);

  return (
    <canvas
      id="gift-card-preview"
      className="border rounded-sm mx-auto my-6"
      width="400"
      height="200"
      ref={ref}
    ></canvas>
  );
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 200;
const CANVAS_BORDER_RADIUS = 10;
const CANVAS_PADDING = 20;
const CANVAS_SPACE_BETWEEN_LINES = 10;
const CANVAS_FONT_SIZE_DEFAULT = 20;
const CANVAS_FONT_SIZE_TITLE = 40;
const CANVAS_IMAGE_MARGIN = CANVAS_SPACE_BETWEEN_LINES;
const CANVAS_IMAGE_WIDTH = CANVAS_HEIGHT - 2 * CANVAS_PADDING - CANVAS_FONT_SIZE_TITLE - CANVAS_IMAGE_MARGIN;
const CANVAS_IMAGE_HEIGHT = CANVAS_IMAGE_WIDTH;

function drawBackground(ctx: CanvasRenderingContext2D, color: string, ff: string = 'Arial') {
  ctx.fillStyle = color;
  ctx.font = CANVAS_FONT_SIZE_DEFAULT + 'px ' + ff;
  ctx.beginPath();
  ctx.moveTo(CANVAS_BORDER_RADIUS, 0);
  ctx.lineTo(CANVAS_WIDTH - CANVAS_BORDER_RADIUS, 0);
  ctx.quadraticCurveTo(CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_BORDER_RADIUS);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - CANVAS_BORDER_RADIUS);
  ctx.quadraticCurveTo(CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH - CANVAS_BORDER_RADIUS, CANVAS_HEIGHT);
  ctx.lineTo(CANVAS_BORDER_RADIUS, CANVAS_HEIGHT);
  ctx.quadraticCurveTo(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT - CANVAS_BORDER_RADIUS);
  ctx.lineTo(0, CANVAS_BORDER_RADIUS);
  ctx.quadraticCurveTo(0, 0, CANVAS_BORDER_RADIUS, 0);
  ctx.fill();
}

function drawTitle(ctx: CanvasRenderingContext2D, text: string, ff: string = 'Arial') {
  ctx.font = CANVAS_FONT_SIZE_TITLE + 'px ' + ff;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_PADDING, CANVAS_WIDTH - 2 * CANVAS_PADDING);
}

function drawInfos(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = CANVAS_FONT_SIZE_DEFAULT + 'px Arial';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'start';
  const lines = text.split('\n');
  let y = CANVAS_PADDING + CANVAS_FONT_SIZE_TITLE + CANVAS_SPACE_BETWEEN_LINES;
  for (const line of lines) {
    ctx.fillText(line, CANVAS_PADDING, y, CANVAS_WIDTH - 2 * CANVAS_PADDING - CANVAS_IMAGE_WIDTH - CANVAS_IMAGE_MARGIN);
    y += CANVAS_FONT_SIZE_DEFAULT + CANVAS_SPACE_BETWEEN_LINES;
  }
}

function drawImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement | undefined) {
  if (!image) return;
  ctx.drawImage(
    image,
    CANVAS_WIDTH - CANVAS_PADDING - CANVAS_IMAGE_WIDTH,
    CANVAS_PADDING + CANVAS_FONT_SIZE_TITLE + CANVAS_IMAGE_MARGIN,
    CANVAS_IMAGE_WIDTH,
    CANVAS_IMAGE_HEIGHT
  );
}
