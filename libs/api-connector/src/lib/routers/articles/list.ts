import { publicProcedure } from '../../trpc';

export default publicProcedure.query(async ({ ctx }) => {
  console.log('finding articles');
  const articles = await ctx.orm.article.findMany();
  console.log('found articles', articles.length);
  return articles;
});
