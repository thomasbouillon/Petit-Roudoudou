import { publicProcedure } from '../../trpc';

export default publicProcedure.query(async ({ ctx }) => {
  const articles = await ctx.orm.article.findMany();
  return articles;
});
