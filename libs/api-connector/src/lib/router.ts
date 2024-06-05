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
import shipping from './routers/shipping';
import newsletter from './routers/newsletter';
import contact from './routers/contact';
import pipings from './routers/pipings';
import accounting from './routers/accounting';
import users from './routers/users';
import articleThemes from './routers/articleThemes';
import embroideryColors from './routers/embroidery-colors';

export const trpcRouter = router({
  accounting,
  articles,
  articleThemes,
  auth,
  carts,
  contact,
  embroideryColors,
  fabrics,
  fabricGroups,
  fabricTags,
  giftCards,
  newsletter,
  orders,
  payments,
  pipings,
  promotionCodes,
  reviews,
  settings,
  shipping,
  users,
});

export type TRPCRouter = typeof trpcRouter;

export type TRPCRouterInput = inferRouterInputs<TRPCRouter>;
export type TRPCRouterOutput = inferRouterOutputs<TRPCRouter>;
