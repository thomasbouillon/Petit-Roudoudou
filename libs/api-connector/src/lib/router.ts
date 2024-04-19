import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import reviews from './reviews';
import articles from './routers/articles';
import auth from './routers/auth';
import carts from './routers/carts';
import fabricGroups from './routers/fabric-groups';
import fabricTags from './routers/fabric-tags';
import fabrics from './routers/fabrics';
import giftCards from './routers/giftCards';
import promotionCodes from './routers/promotionCodes';
import settings from './routers/settings';
import { router } from './trpc';
import payments from './routers/payments';
import orders from './routers/orders';

export const trpcRouter = router({
  articles,
  carts,
  fabrics,
  fabricGroups,
  fabricTags,
  settings,
  auth,
  giftCards,
  reviews,
  orders,
  payments,
  promotionCodes,
});

export type TRPCRouter = typeof trpcRouter;

export type TRPCRouterInput = inferRouterInputs<TRPCRouter>;
export type TRPCRouterOutput = inferRouterOutputs<TRPCRouter>;
