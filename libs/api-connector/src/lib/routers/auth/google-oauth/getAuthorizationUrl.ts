import { publicProcedure } from '../../../trpc';

export default publicProcedure.query(async ({ ctx }) => {
  const url = ctx.auth.googleOAuth.getAuthorizationUrl();
  return { url };
});
