import { getStorage } from 'firebase-admin/storage';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import * as csv from 'csvtojson';
import { z } from 'zod';
import { LegacyOrder, Order, OrderItem, Taxes } from '@couture-next/types';
import { getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreOrderConverter } from '@couture-next/utils';

/**
 * SET shipping_method = collectAtWorkshop FOR:
 * 
SELECT pc.code, pc.strategy_id, opc.amount, o.* 
FROM `order` o 
LEFT JOIN order_promotion_code opc ON o.id = opc.user_order_id
LEFT JOIN promotion_code pc ON pc.id = opc.promotion_code_id
WHERE o.hidden = 0 AND o.submitted_at IS NOT NULL AND shipping_method IS NULL;
 */

/**
 * GENERATE EXPORT:
 *
SELECT 
pc.code, pc.strategy_id, opc.amount, 
oc.image oc_image, oc.id oc_id, oc.total*100 oc_total, COALESCE(a.weight, COALESCE(oq.weight, 0))*oc.quantity oc_total_weight, COALESCE(q.title, COALESCE(v.label, 'Carte cadeau')) oc_description, IF(oc.article_id IS NOT NULL, 'customized', IF(oc.order_quickbuy_id IS NOT NULL, 'inStock', 'giftCard')) oc_type, oc.quantity oc_quantity, 
u.firstname u_firstname, u.lastname u_lastname, u.email u_email, u.usr_address u_address, u.country u_country, u.usr_address_complement u_address_complement, u.city u_city, u.zip_code u_zip_code,
o.*,
REPLACE(oc.comment, ';', ',') oc_user_comment
FROM `order` o 
LEFT JOIN order_promotion_code opc ON o.id = opc.user_order_id
LEFT JOIN promotion_code pc ON pc.id = opc.promotion_code_id
LEFT JOIN order_content oc on oc.user_order_id = o.id 
LEFT JOIN order_quickbuy oq on oq.id = oc.order_quickbuy_id 
LEFT JOIN quick_buy q on oq.quickbuy_id = q.id 
LEFT JOIN article a on a.id = oc.article_id
LEFT JOIN cost c on c.id = a.variant_cost_id
LEFT JOIN variant v on c.variant_id = v.id
LEFT JOIN user u on o.user_id = u.id
WHERE o.hidden = 0 AND o.submitted_at IS NOT NULL
ORDER BY o.id
 */

export const importOrders = onMessagePublished(
  {
    topic: 'oneshot-import-orders',
    retry: false,
  },
  async () => {
    const storage = getStorage();

    const fileRef = storage.bucket().file('/tmp/legacy-orders.csv');
    if (!fileRef.exists()) {
      throw new Error('File does not exist');
    }

    const csvStr = await fileRef.download();
    const res = legacyOrderSchema.safeParse(
      await csv({
        noheader: false,
        delimiter: ';',
      }).fromString(csvStr.toString())
    );

    if (!res.success) {
      console.error(res.error);
      throw new Error('CSV parsing failed');
    }

    const orders = res.data;

    const firestore = getFirestore();
    await Promise.all(
      orders.map((order): any => {
        try {
          const shippingFields = shippingSchema.parse(order);

          const discountMultiplier =
            order.promotionCode?.strategyId === 2 ||
            order.promotionCode?.strategyId === 1 ||
            order.promotionCode?.strategyId === 4
              ? 1 -
                order.promotionCode.amount /
                  ((order.promotionCode.strategyId === 4
                    ? order.items.reduce((acc, item) => acc + (item.type === 'inStock' ? item.total : 0), 0)
                    : order.base) /
                    1.2)
              : 1;

          const items = order.items.map(
            (item) =>
              ({
                customizations: [],
                description: item.description,
                image: item.image,
                originalTotalTaxExcluded: Math.round(item.total / (item.type === 'giftCard' ? 1 : 1.2)) / 100,
                originalTotalTaxIncluded: item.total / 100,
                totalTaxIncluded:
                  Math.round(
                    item.total *
                      (order.promotionCode?.strategyId !== 4 || item.type === 'inStock' ? discountMultiplier : 1)
                  ) / 100,
                totalTaxExcluded:
                  Math.round(
                    (item.total / (item.type === 'giftCard' ? 1 : 1.2)) *
                      (order.promotionCode?.strategyId !== 4 || item.type === 'inStock' ? discountMultiplier : 1)
                  ) / 100,
                taxes:
                  item.type === 'giftCard'
                    ? {}
                    : {
                        [Taxes.VAT_20]:
                          Math.round(
                            (item.total / 1.2) *
                              (order.promotionCode?.strategyId !== 4 || item.type === 'inStock'
                                ? discountMultiplier
                                : 1) *
                              0.2
                          ) / 100,
                      },
                type: item.type as OrderItem['type'],
                weight: 0,
                totalWeight: item.totalWeight,
                quantity: item.quantity,
                customerComment: item.userComment,
              } satisfies OrderItem)
          );

          const subTotalTaxes = items.reduce((acc, item) => acc + (item.taxes[Taxes.VAT_20] ?? 0), 0);
          const subTotalTaxExcluded =
            Math.round(items.reduce((acc, item) => acc + item.totalTaxExcluded, 0) * 100) / 100;
          const subTotalTaxIncluded = Math.round((subTotalTaxExcluded + subTotalTaxes) * 100) / 100;

          const taxes = {
            [Taxes.VAT_20]:
              Math.round(
                subTotalTaxes * 100 +
                  (shippingFields.price.taxIncluded - shippingFields.price.taxExcluded) * 100 +
                  (order.is_accelerated ? 250 : 0)
              ) / 100,
          };
          const totalTaxes = Object.values(taxes).reduce((acc, tax) => acc + tax, 0);
          const totalTaxExcluded =
            Math.round(
              (subTotalTaxExcluded + (order.is_accelerated ? 12.5 : 0) + shippingFields.price.taxExcluded) * 100
            ) / 100;
          const totalTaxIncluded = Math.round((totalTaxExcluded + totalTaxes) * 100) / 100;

          if (totalTaxIncluded !== order.total / 100) {
            console.warn(
              '[WARNING] Computed total does not match previous total (id=legacy-' +
                order.id +
                ', prev=' +
                order.total / 100 +
                ', computed=' +
                totalTaxIncluded +
                ')'
            );
          }

          firestore
            .collection('orders')
            .doc('legacy-' + order.id)
            .withConverter(adminFirestoreOrderConverter)
            .create({
              _id: 'legacy-' + order.id,
              createdAt: new Date(order.submitted_at),
              shipping: shippingFields,
              extras: {
                ...(order.is_accelerated ? { price: { priceTaxExcluded: 12.5, priceTaxIncluded: 15 } } : {}),
              },
              items,
              adminComment: order.annotation,
              ...paymentInfoSchema.parse(order),
              totalWeight: order.items.reduce((acc, item) => acc + item.totalWeight, 0),
              taxes,
              totalTaxExcluded,
              totalTaxIncluded,
              subTotalTaxExcluded,
              subTotalTaxIncluded,
              user: {
                uid: 'legacy-' + order.user_id,
                email: order.user.email,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
              },
              ...(order.promotionCode !== undefined
                ? {
                    promotionCode: {
                      code: order.promotionCode?.code,
                      conditions: {},
                      type:
                        order.promotionCode.strategyId === 2
                          ? 'percentage'
                          : order.promotionCode.strategyId === 1
                          ? 'fixed'
                          : 'freeShipping',
                    } satisfies Order['promotionCode'],
                  }
                : {}),

              billing: {
                address: order.user.address,
                addressComplement: order.user.addressComplement,
                civility: 'Mme',
                city: order.user.city,
                country: order.user.country,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
                zipCode: '',
                ...(order.payment_session
                  ? {
                      checkoutSessionId: order.payment_session,
                    }
                  : {}),
              },
            } as any)
            .catch((e) => {
              console.error('Error while creating order');
              console.debug(order);
              throw e;
            });
        } catch (e) {
          console.error('Error while preparing order promise');
          console.debug(order);
          throw e;
        }
      })
    );
  }
);

const legacyOrderSchema = z
  .array(
    z.intersection(
      z.object({
        id: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number()),
        user_id: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number()),
        total: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number()),
        state: z.enum(['pending', 'unfinished', 'done', 'waiting_payment']),
        completed: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        base: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number()),
        payment_session: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        shipping_method: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        shipping_first_name: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        shipping_cost: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number().nullable()),
        shipping_address: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        shipping_last_name: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        shipping_phone_number: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        shipping_point: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        sent_at: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        shipping_code: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        shipping_city: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        shipping_zip_code: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        ref: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number().nullable()),
        hidden: z.preprocess((data) => data === '1', z.boolean()),
        annotation: z.string(),
        submitted_at: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        last_review_email_sent_at: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        shipping_address_complement: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        is_validated: z.preprocess((data) => data === '1', z.boolean()),
        is_prioritary: z.preprocess((data) => data === '1', z.boolean()),
        shipping_country: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
        is_accelerated: z.preprocess((data) => data === '1', z.boolean()),
        review_id: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number().nullable()),
      }) as z.ZodType<LegacyOrder>,
      z.intersection(
        z.union([
          z
            .object({
              amount: z.literal(''),
              code: z.literal(''),
              strategy_id: z.literal(''),
            })
            .transform(() => ({ promotionCode: undefined })),
          z
            .object({
              amount: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number()),
              code: z.preprocess((data) => (data === '' ? null : data), z.string()),
              strategy_id: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number()),
            })
            .transform((data) => ({
              promotionCode: {
                code: data.code,
                strategyId: data.strategy_id,
                amount: data.amount,
              },
            })),
        ]),
        z
          .object({
            oc_id: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number()),
            oc_total: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number()),
            oc_total_weight: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number()),
            oc_image: z.preprocess((data) => (data === '' ? null : data), z.string()),
            oc_quantity: z.preprocess((data) => (data === '' ? null : parseInt(data as string)), z.number()),
            oc_description: z.preprocess((data) => (data === '' ? null : data), z.string()),
            oc_type: z.preprocess((data) => (data === '' ? null : data), z.enum(['customized', 'inStock', 'giftCard'])),
            u_email: z.preprocess((data) => (data === '' ? null : data), z.string()),
            u_firstname: z.preprocess((data) => (data === '' ? null : data), z.string()),
            u_lastname: z.preprocess((data) => (data === '' ? null : data), z.string()),
            u_address: z.string(),
            u_address_complement: z.string(),
            u_city: z.string(),
            u_zip_code: z.string(),
            u_country: z.string(),
            oc_user_comment: z.string(),
          })
          .transform((data) => ({
            orderLine: {
              id: data.oc_id,
              image: { uid: data.oc_image, url: '' },
              total: data.oc_total,
              totalWeight: data.oc_total_weight,
              quantity: data.oc_quantity,
              description: data.oc_description,
              type: data.oc_type,
              userComment: data.oc_user_comment,
            },
            user: {
              email: data.u_email,
              firstName: data.u_firstname,
              lastName: data.u_lastname,
              address: data.u_address,
              addressComplement: data.u_address_complement,
              city: data.u_city,
              zipCode: data.u_zip_code,
              country: data.u_country,
            },
          }))
      )
    )
  )
  .transform((data) => {
    const orderById = data.reduce((acc, order) => {
      if (order.submitted_at === null) return acc; // ignore carts
      if (acc[order.id] === undefined) {
        const toCopy = { ...order, orderLine: null } as Omit<(typeof data)[0], 'orderLine'> & { orderLine?: any };
        delete toCopy.orderLine;
        acc[order.id] = {
          ...toCopy,
          submitted_at: order.submitted_at,
          items: [],
        };
      }
      acc[order.id].items.push(order.orderLine);
      return acc;
    }, {} as Record<string, Omit<(typeof data)[0], 'orderLine'> & { items: (typeof data)[0]['orderLine'][]; orderLine?: never; submitted_at: string }>);

    return Object.values(orderById);
  });

const shippingSchema = z
  .intersection(
    z.union([
      z.intersection(
        z.object({
          shipping_first_name: z.string(),
          shipping_cost: z.number(),
          shipping_address: z.string(),
          shipping_code: z.string().nullable(),
          shipping_phone_number: z
            .string()
            .nullable()
            .transform((data) => data || ''),
          shipping_city: z
            .string()
            .nullable()
            .transform((data) => data || ''),
          shipping_zip_code: z
            .string()
            .nullable()
            .transform((data) => data || ''),
          shipping_address_complement: z
            .string()
            .nullable()
            .transform((data) => data || ''),
          shipping_country: z
            .string()
            .nullable()
            .transform((data) => data || 'FR'),
        }),
        z.union([
          z.object({
            shipping_method: z.literal('mondial_relay'),
            shipping_last_name: z
              .string()
              .nullable()
              .transform((data) => data || ''),
            shipping_point: z.string(),
          }),
          z.object({
            shipping_method: z.literal('colissimo'),
            shipping_last_name: z.string(),
          }),
        ])
      ),
      z.object({
        shipping_method: z.literal('collectAtWorkshop'),
      }),
    ]),
    z.object({
      promotionCode: z
        .object({
          code: z.string(),
          strategyId: z.number(),
          amount: z.number(),
        })
        .optional(),
    })
  )

  .transform<Order['shipping']>((data) => {
    if (data.shipping_method === 'collectAtWorkshop')
      return {
        method: 'pickup-at-workshop',
        price: {
          originalTaxExcluded: 0,
          originalTaxIncluded: 0,
          taxExcluded: 0,
          taxIncluded: 0,
        },
      };

    const shippingCostOffered = data.promotionCode?.strategyId === 3;
    const shippingCostTaxExcluded =
      data.shipping_method === 'colissimo' ? data.shipping_cost / 100 : Math.round(data.shipping_cost / 1.2) / 100;

    const details = {
      civility: 'Mme' as const,
      firstName: data.shipping_first_name,
      lastName: data.shipping_last_name,
      address: data.shipping_address,
      addressComplement: data.shipping_address_complement,
      city: data.shipping_city,
      zipCode: data.shipping_zip_code,
      country: data.shipping_country,
      price: {
        originalTaxExcluded: shippingCostTaxExcluded,
        originalTaxIncluded: data.shipping_cost / 100,
        taxExcluded: shippingCostOffered ? 0 : shippingCostTaxExcluded,
        taxIncluded: shippingCostOffered ? 0 : data.shipping_cost / 100,
      },
    };

    if (data.shipping_method === 'mondial_relay')
      return {
        ...details,
        method: 'mondial-relay',
        relayPoint: { code: data.shipping_point },
        ...(data.shipping_code !== null ? { trackingNumber: data.shipping_code } : {}),
      };

    if (data.shipping_method === 'colissimo')
      return {
        ...details,
        method: 'colissimo',
        ...(data.shipping_code !== null ? { trackingNumber: data.shipping_code } : {}),
      };

    throw new Error('Unknown shipping method');
  });

const paymentInfoSchema = z
  .object({
    payment_session: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
    completed: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
    sent_at: z.string().nullable(),
    submitted_at: z.string(),
  })
  .transform<Pick<Order, 'status' | 'paidAt' | 'paymentMethod' | 'workflowStep'>>((data) => {
    if (data.payment_session === null && data.completed !== null)
      return {
        paidAt: new Date(data.completed),
        paymentMethod: 'bank-transfert',
        status: 'paid',
        workflowStep: data.sent_at === null ? 'in-production' : 'delivered',
      };
    if (data.payment_session === null && data.completed === null) return { status: 'waitingBankTransfer' };
    // if(data.payment_session !== null && data.completed === null) return { status: 'draft' } satisfies Pick<DraftOrder, 'status'>;
    if (data.payment_session !== null && data.completed !== null)
      return {
        paidAt: new Date(data.completed),
        paymentMethod: 'card',
        status: 'paid',
        workflowStep: data.sent_at === null ? 'in-production' : 'delivered',
      };
    throw new Error('Unknown payment status');
  });
