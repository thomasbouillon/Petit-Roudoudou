import {
  CallGetShippingPricesPayload,
  CallGetShippingPricesResponse,
    CallListPickUpPointsPayload,
    CallListPickUpPointsResponse,
  } from '@couture-next/types';
  import { onCall } from 'firebase-functions/v2/https';
  import { defineSecret } from 'firebase-functions/params';
import { z } from 'zod';
import { BoxtalCarriers, BoxtalClient } from '@couture-next/shipping';
import env from './env';

  
  const boxtalUserSecret = defineSecret('BOXTAL_USER');
  const boxtalPassSecret = defineSecret('BOXTAL_SECRET');

  const payloadSchema = z.object({
    zipCode: z.string().min(1),
  })
  
  export const callListPickupPoints = onCall<
    unknown,
    Promise<CallListPickUpPointsResponse>
  >({ cors: '*', secrets: [boxtalPassSecret, boxtalUserSecret] }, async (event) => {

    const { zipCode } = payloadSchema.parse(event.data) satisfies CallListPickUpPointsPayload;
    const client = new BoxtalClient(env.BOXTAL_API_URL, boxtalUserSecret.value(), boxtalPassSecret.value());

    return await client.listPickUpPoints(zipCode);
  })

  export const callGetShippingPrices = onCall<
    unknown,
    Promise<CallGetShippingPricesResponse>
  >({ cors: '*', secrets: [boxtalPassSecret, boxtalUserSecret] }, async (event) => {
      
      const { weight } = z.object({ weight: z.number().min(0) }).parse(event.data) satisfies CallGetShippingPricesPayload;
      const client = new BoxtalClient(env.BOXTAL_API_URL, boxtalUserSecret.value(), boxtalPassSecret.value());
  
      const [colissimo, mondialRelay] = await Promise.all([
        client.getPrice({ weight, carrier: BoxtalCarriers.COLISSIMO }),
        client.getPrice({ weight, carrier: BoxtalCarriers.MONDIAL_RELAY }),
      ]);

      return {
        [BoxtalCarriers.COLISSIMO]: colissimo.taxInclusive,
        [BoxtalCarriers.MONDIAL_RELAY]: mondialRelay.taxInclusive,
      }
    })
