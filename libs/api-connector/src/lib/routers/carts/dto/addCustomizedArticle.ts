import { z } from 'zod';
import { Context } from '../../../context';
import { Article, CartItemCustomized } from '@couture-next/types';

export const addCustomizedPayloadSchema = ({ orm }: Context) =>
  z
    .object({
      type: z.literal('customized'),
      articleId: z.string(),
      skuId: z.string(),
      customizations: z.record(z.unknown()),
      imageDataUrl: z.string().min(1),
      quantity: z.number().int().min(1),
      comment: z.string().optional(),
    })
    .transform(async (data, ctx) => {
      // ensure article exists
      const article = await orm.article
        .findUnique({
          where: { id: data.articleId },
        })
        .then((article) => article as Article | null);
      if (!article) {
        ctx.addIssue({ code: 'custom', message: 'Article not found' });
        return z.NEVER;
      }

      // Validate min quantity
      if (data.quantity < (article.minQuantity ?? 1)) {
        ctx.addIssue({
          code: 'too_small',
          minimum: article.minQuantity ?? 1,
          inclusive: true,
          type: 'number',
          message: 'Quantity too low',
          path: ['quantity'],
        });
        return z.NEVER;
      }

      // ensure sku exists
      const sku = article.skus.find((sku) => sku.uid === data.skuId);
      if (!sku) {
        ctx.addIssue({ code: 'custom', message: 'Sku not found' });
        return z.NEVER;
      }

      const selectedVariantUid = sku.customizableVariantUid;
      if (!selectedVariantUid) {
        ctx.addIssue({ code: 'custom', message: 'Chosen SKU is not suitable for customization (missing 3D model)' });
        return z.NEVER;
      }
      const customizedVariant = article.customizableVariants.find((v) => v.uid === selectedVariantUid);
      if (!customizedVariant) {
        ctx.addIssue({ code: 'custom', message: 'Customized variant not found' });
        return z.NEVER;
      }

      // encure all required customizations are set and valid
      const inheritedCustomizations = article.customizables.filter((c) => customizedVariant.inherits.includes(c.uid));
      const cartItemValidatedCustomizations = {} as CartItemCustomized['customizations'];
      for (const customizable of inheritedCustomizations) {
        // validate customization value
        const customizableSchema =
          customizable.type === 'customizable-boolean'
            ? z.boolean().transform((v) => ({
                value: v satisfies (CartItemCustomized['customizations'][string] & { type: 'boolean' })['value'],
                displayValue: v ? 'Oui' : 'Non',
              }))
            : customizable.type === 'customizable-text'
            ? z
                .string()
                .min(customizable.min)
                .max(customizable.max)
                .transform((v) => ({
                  value: v satisfies (CartItemCustomized['customizations'][string] & { type: 'text' })['value'],
                  displayValue: v,
                }))
            : customizable.type === 'customizable-piping'
            ? z
                .string()
                .min(1)
                .transform(async (v, ctx) => {
                  const piping = await orm.piping.findUnique({ where: { id: v } });
                  if (!piping) {
                    ctx.addIssue({ code: 'custom', message: 'Invalid piping' });
                    return z.NEVER;
                  }
                  return {
                    value: v satisfies (CartItemCustomized['customizations'][string] & { type: 'piping' })['value'],
                    displayValue: piping.name,
                  };
                })
            : customizable.type === 'customizable-embroidery'
            ? z
                .object({
                  text: z.string().min(1),
                  colorId: z.string().min(1),
                })
                .optional()
                .transform(async (v, ctx) => {
                  if (!v) {
                    return {
                      value: undefined satisfies (CartItemCustomized['customizations'][string] & {
                        type: 'embroidery';
                      })['value'],
                      displayValue: 'Non',
                    };
                  }
                  const color = await orm.embroideryColor.findUnique({ where: { id: v.colorId } });
                  if (!color) {
                    ctx.addIssue({ code: 'custom', message: 'Invalid embroidery color' });
                    return z.NEVER;
                  }
                  return {
                    value: v satisfies (CartItemCustomized['customizations'][string] & { type: 'embroidery' })['value'],
                    displayValue: `${v.text} (${color.name})`,
                  };
                })
            : null;

        if (!customizableSchema) {
          throw new Error('Not handled');
        }

        // validate customization value (raw)
        const validatedCustomization = await customizableSchema.safeParseAsync(data.customizations[customizable.uid]);
        if (!validatedCustomization.success) {
          validatedCustomization.error.issues.forEach(ctx.addIssue);
          return z.NEVER;
        }

        const { value, displayValue } = validatedCustomization.data;

        // Add customization to cart item
        cartItemValidatedCustomizations[customizable.uid] = {
          title: customizable.label,
          value: value as any,
          displayValue,
          type:
            customizable.type === 'customizable-boolean'
              ? 'boolean'
              : customizable.type === 'customizable-text'
              ? 'text'
              : customizable.type === 'customizable-piping'
              ? 'piping'
              : 'embroidery',
        };
      }

      for (const customizablePart of customizedVariant.customizableParts) {
        const schema = z.string().min(1);
        const validatedCustomization = schema.safeParse(data.customizations[customizablePart.uid]);
        if (!validatedCustomization.success) {
          validatedCustomization.error.issues.forEach(ctx.addIssue);
          return z.NEVER;
        }
        const linkedFabric = await orm.fabric.findUnique({ where: { id: validatedCustomization.data } });
        if (!linkedFabric || !linkedFabric.enabled || !linkedFabric.groupIds.includes(customizablePart.fabricListId)) {
          ctx.addIssue({ code: 'custom', message: 'Invalid fabric' });
          return z.NEVER;
        }
        cartItemValidatedCustomizations[customizablePart.uid] = {
          title: customizablePart.label,
          value: validatedCustomization.data,
          displayValue: linkedFabric.name,
          type: 'fabric',
        };
      }

      return {
        ...data,
        customizations: cartItemValidatedCustomizations,
        article,
        sku,
      } satisfies Partial<CartItemCustomized> & { article: Article; sku: Article['skus'][number] };
    });
