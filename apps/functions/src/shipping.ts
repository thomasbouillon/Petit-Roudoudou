import {
    CallListPickUpPointsPayload,
    CallListPickUpPointsResponse,
  } from '@couture-next/types';
  import { onCall } from 'firebase-functions/v2/https';
  import { defineSecret } from 'firebase-functions/params';
import { z } from 'zod';
import { BoxtalClient } from '@couture-next/shipping';
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