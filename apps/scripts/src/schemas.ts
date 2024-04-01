import z from 'zod';
import { LegacyOrder } from './legacyTypes';
import { Order, OrderItem, PaidOrder, WaitingBankTransferOrder } from '@couture-next/types';
import { getStorage } from './firebase';
import wget from 'wget-improved';
import { readFile } from 'fs/promises';

export const legacyOrderSchema = z
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
          .transform(async (data) => ({
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
        const toCopy = { ...order, orderLine: null } as Omit<(typeof data)[number], 'orderLine'> & { orderLine?: null };
        delete toCopy.orderLine;
        acc[order.id] = {
          ...(toCopy as Omit<(typeof data)[number], 'orderLine'>),
          submitted_at: order.submitted_at,
          items: [],
        };
      }
      acc[order.id].items.push(order.orderLine);
      return acc;
    }, {} as Record<string, Omit<(typeof data)[0], 'orderLine'> & { items: (typeof data)[0]['orderLine'][]; orderLine?: never; submitted_at: string }>);

    return Object.values(orderById).slice(0, 40);
  })
  .transform(async (data) => {
    console.debug('------ Start uploading images ------');
    // BATCHING
    for (const order of data) {
      await Promise.all([
        order.items.map((item) =>
          uploadImage('legacy-' + order.id.toString(), item.image.uid).then(
            ({ uid, url }) => (item.image = { uid, url })
          )
        ),
      ]);
    }
    // await Promise.all(
    //   data
    //     .map((order) =>
    //       order.items.map((item) =>
    //         uploadImage('legacy-' + order.id.toString(), item.image.uid).then(({ uid, url }) => {
    //           item.image = { uid, url };
    //         })
    //       )
    //     )
    //     .flat()
    // );
    console.debug('------ Finished uploading images ------');
    return data;
  });

export const shippingSchema = z
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
    const shippingCostTaxExcluded = data.shipping_cost / 100;
    // DO not passthrough taxes for now
    //   data.shipping_method === 'colissimo' ? data.shipping_cost / 100 : Math.round(data.shipping_cost / 1.2) / 100;

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

export const paymentInfoSchema = z
  .object({
    payment_session: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
    completed: z.preprocess((data) => (data === '' ? null : data), z.string().nullable()),
    sent_at: z.string().nullable(),
    submitted_at: z.string(),
  })
  .transform<
    Pick<PaidOrder, 'status' | 'paidAt' | 'paymentMethod' | 'workflowStep'> | Pick<WaitingBankTransferOrder, 'status'>
  >((data) => {
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

async function uploadImage(orderUid: string, legacyFileUid: string) {
  if (!legacyFileUid) throw 'legacyFileUid is empty';
  const storage = getStorage();
  const fileRef = storage.bucket().file(`orders/${orderUid}/${legacyFileUid}`);
  const r = {
    uid: legacyFileUid,
    url: getPublicUrl(`orders/${orderUid}/${legacyFileUid}`),
  };

  if (!(await fileRef.exists())[0]) {
    const localPath = await downloadLegacyImageToLocalFile(legacyFileUid).catch((e) => {
      console.warn(`Error while downloading image ${legacyFileUid}:`, e);
      return null;
    });
    if (localPath)
      await fileRef
        .save(await readFile(localPath))
        .catch((e) => console.warn(`Error while uploading image ${legacyFileUid}:`, e));
  }

  return r;
}

function downloadLegacyImageToLocalFile(uid: string) {
  const filepath = `/tmp/${uid}`;
  const request = wget.download(`https://www.petit-roudoudou.fr/images/articles/preview/${uid}`, filepath);
  return new Promise<string>((resolve, reject) => {
    request.on('error', reject);
    // request.on('progress', (progress) => console.debug(`${uid} progress: ${Math.round(parseFloat(progress) * 100)}%`));
    request.on('end', () => resolve(filepath));
  });
}

export function getPublicUrl(path: string) {
  path = encodeURIComponent(path);
  return `http://127.0.0.1:9199/v0/b/petit-roudoudou-daae4.appspot.com/o/${path}?alt=media`;
}
