import { publicProcedure } from '../../trpc';

export default publicProcedure.query(async ({ ctx }) => {
  return await ctx.orm.piping.findMany();
});
