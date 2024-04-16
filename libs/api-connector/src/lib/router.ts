import reviews from './reviews';
import auth from './routers/auth';
import fabricGroups from './routers/fabric-groups';
import fabricTags from './routers/fabric-tags';
import fabrics from './routers/fabrics';
import giftCards from './routers/giftCards';
import promotionCodes from './routers/promotionCodes';
import settings from './routers/settings';
import tmp from './routers/tmp';
import { router } from './trpc';

export const trpcRouter = router({
  fabrics,
  fabricGroups,
  fabricTags,
  settings,
  auth,
  giftCards,
  tmp,
  reviews,
  promotionCodes,
});

export type TRPCRouter = typeof trpcRouter;
