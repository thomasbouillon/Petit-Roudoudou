import csvtojson from 'csvtojson';
import { LegacyOrder, adminFirestoreOrderConverter } from './legacyTypes';
import { legacyOrderSchema, shippingSchema, paymentInfoSchema } from './schemas';
import { getFirestore } from './firebase';
import { Order, OrderItem, Taxes } from '@couture-next/types';

// This is one shot, sry for it...

export async function seedOrders(pathToCsv: string) {
  const ordersUnsafe = await getLegacyOrders(pathToCsv);

  const res = await legacyOrderSchema.safeParseAsync(ordersUnsafe);

  if (!res.success) {
    console.error((res as any).error);
    throw new Error('CSV parsing failed');
  }

  const orders = res.data;

  const firestore = getFirestore();
  await Promise.all(
    orders.map(async (order): Promise<any> => {
      try {
        const shippingFields = shippingSchema.parse(order);

        const discountMultiplier =
          order.promotionCode?.strategyId === 2 ||
          order.promotionCode?.strategyId === 1 ||
          order.promotionCode?.strategyId === 4
            ? 1 -
              order.promotionCode.amount /
                (order.promotionCode.strategyId === 4
                  ? order.items.reduce((acc, item) => acc + (item.type === 'inStock' ? item.total : 0), 0)
                  : order.base)
            : // / 1.2 do not pass through taxes
              1;

        const getItemLinePrice = (item: (typeof order.items)[number]) =>
          Math.round(
            item.total * (order.promotionCode?.strategyId !== 4 || item.type === 'inStock' ? discountMultiplier : 1)
          ) / 100;

        const items = order.items.map(
          (item) =>
            ({
              customizations: [],
              description: item.description,
              image: item.image,
              originalTotalTaxExcluded: Math.round(item.total /* / (item.type === 'giftCard' ? 1 : 1.2) */) / 100,
              originalTotalTaxIncluded: item.total / 100,
              totalTaxIncluded: getItemLinePrice(item),
              totalTaxExcluded: getItemLinePrice(item),
              perUnitTaxExcluded: getItemLinePrice(item) / item.quantity,
              perUnitTaxIncluded: getItemLinePrice(item) / item.quantity,
              originalPerUnitTaxExcluded: Math.round(item.total) / 100 / item.quantity,
              originalPerUnitTaxIncluded: Math.round(item.total) / 100 / item.quantity,
              //   Math.round(
              //     (item.total /* / (item.type === 'giftCard' ? 1 : 1.2) */) *
              //       (order.promotionCode?.strategyId !== 4 || item.type === 'inStock' ? discountMultiplier : 1)
              //   ) / 100,
              taxes: { [Taxes.VAT_20]: 0 },
              //   item.type === 'giftCard'
              // ? {}
              // : {
              //     [Taxes.VAT_20]:
              //       Math.round(
              //         (item.total / 1.2) *
              //           (order.promotionCode?.strategyId !== 4 || item.type === 'inStock'
              //             ? discountMultiplier
              //             : 1) *
              //           0.2
              //       ) / 100,
              //   }
              type: item.type as OrderItem['type'],
              weight: item.totalWeight,
              quantity: item.quantity,
              customerComment: item.userComment,
              ...(item.type === 'inStock' ? { originalStockId: 'legacy' } : {}),
            } satisfies Omit<OrderItem, 'originalStockId'>)
        );

        const subTotalTaxes = items.reduce((acc, item) => acc + (item.taxes[Taxes.VAT_20] ?? 0), 0);
        const subTotalTaxExcluded = Math.round(items.reduce((acc, item) => acc + item.totalTaxExcluded, 0) * 100) / 100;
        const subTotalTaxIncluded = Math.round((subTotalTaxExcluded + subTotalTaxes) * 100) / 100;

        const taxes = {
          [Taxes.VAT_20]:
            Math.round(
              subTotalTaxes * 100 + (shippingFields.price.taxIncluded - shippingFields.price.taxExcluded) * 100 // +
              // (order.is_accelerated ? 250 : 0)
            ) / 100,
        };
        const totalTaxes = Object.values(taxes).reduce((acc, tax) => acc + tax, 0);
        const totalTaxExcluded =
          Math.round(
            (subTotalTaxExcluded + (order.is_accelerated ? 15 /* 12.5 */ : 0) + shippingFields.price.taxExcluded) * 100
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

        const toCreate = {
          _id: 'legacy-' + order.id,
          reference: order.ref,
          createdAt: new Date(order.submitted_at),
          archivedAt: order.hidden ? new Date() : null,
          shipping: shippingFields,
          extras: {
            ...(order.is_accelerated ? { price: { priceTaxExcluded: 15 /* 12.5 */, priceTaxIncluded: 15 } } : {}),
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
                  used: 0,
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
        } as any;

        await firestore
          .collection('orders')
          .doc('legacy-' + order.id)
          .withConverter(adminFirestoreOrderConverter)
          .create(toCreate)
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

async function getLegacyOrders(pathToCsv): Promise<LegacyOrder[]> {
  return await csvtojson({
    delimiter: ';',
    noheader: false,
  }).fromFile(pathToCsv);
}
