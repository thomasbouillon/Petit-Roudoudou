import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { router } from './trpc';
import accounting from './routers/accounting';
import articles from './routers/articles';
import articleThemes from './routers/articleThemes';
import auth from './routers/auth';
import carts from './routers/carts';
import contact from './routers/contact';
import embroideryColors from './routers/embroidery-colors';
import fabricGroups from './routers/fabric-groups';
import fabrics from './routers/fabrics';
import fabricTags from './routers/fabric-tags';
import giftCards from './routers/giftCards';
import newsletter from './routers/newsletter';
import orders from './routers/orders';
import payments from './routers/payments';
import pipings from './routers/pipings';
import promotionCodes from './routers/promotionCodes';
import reviews from './reviews';
import settings from './routers/settings';
import shipping from './routers/shipping';
import trackingLinks from './trackingLinks';
import users from './routers/users';
import workshopSessions from './routers/workshopSessions';

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
  trackingLinks,
  users,
  workshopSessions,
});

export type TRPCRouter = typeof trpcRouter;

export type TRPCRouterInput = inferRouterInputs<TRPCRouter>;
export type TRPCRouterOutput = inferRouterOutputs<TRPCRouter>;
