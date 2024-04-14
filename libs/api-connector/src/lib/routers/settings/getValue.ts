import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { SettingKey } from '@prisma/client';

export default publicProcedure.input(z.nativeEnum(SettingKey)).query(async ({ input, ctx }) => {
  const setting = await ctx.orm.setting.findFirst({
    where: {
      key: input,
    },
  });
  return setting?.data ?? false;
});
