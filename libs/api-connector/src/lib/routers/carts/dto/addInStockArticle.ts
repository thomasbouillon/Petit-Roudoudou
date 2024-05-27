import { Article, CartItemInStock } from '@couture-next/types';
import { z } from 'zod';
import { Context } from '../../../context';

export const addInStockPayloadSchema = ({ orm }: Context) =>
  z
    .object({
      type: z.literal('inStock'),
      articleId: z.string(),
      stockUid: z.string(),
      customizations: z.record(z.unknown()),
      quantity: z.number().int().positive(),
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

      // ensure stockUid is defined in article stocks
      const articleStock = article.stocks.find((stock) => stock.uid === data.stockUid);
      if (!articleStock) {
        ctx.addIssue({ code: 'custom', message: 'Stock not found' });
        return z.NEVER;
      }
      // ensure sufficient stock quantity
      if (articleStock.stock < data.quantity) {
        ctx.addIssue({ code: 'custom', message: 'Not enought stock' });
        return z.NEVER;
      }

      // encure all required customizations are set and valid
      const inheritedCustomizables = article.customizables.filter(
        (customizable) => articleStock.inherits.customizables[customizable.uid]
      );
      const cartItemValidatedCustomizations = {} as CartItemInStock['customizations'];
      for (const customizable of inheritedCustomizables) {
        // validate customization value
        const customizableSchema =
          customizable.type === 'customizable-boolean'
            ? z.boolean()
            : customizable.type === 'customizable-text'
            ? z.string().min(customizable.min).max(customizable.max)
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
                  return v;
                })
            : null;

        if (!customizableSchema) {
          throw new Error('Not handled');
        }

        const validatedCustomization = customizableSchema.safeParse(data.customizations[customizable.uid]);
        if (!validatedCustomization.success) {
          validatedCustomization.error.issues.forEach(ctx.addIssue);
          return z.NEVER;
        }

        // Add customization to cart item
        cartItemValidatedCustomizations[customizable.uid] = {
          title: customizable.label,
          value: validatedCustomization.data,
          type:
            customizable.type === 'customizable-boolean'
              ? 'boolean'
              : customizable.type === 'customizable-piping'
              ? 'piping'
              : 'text',
        };
      }

      return {
        ...data,
        customizations: cartItemValidatedCustomizations,
        article,
        articleStock,
      } satisfies Partial<CartItemInStock> & {
        article: Article;
        articleStock: Article['stocks'][number];
      };
    });
