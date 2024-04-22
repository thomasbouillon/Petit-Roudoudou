import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { SettingKey } from '@prisma/client';
import { Context } from '../../context';

export default publicProcedure.input(z.nativeEnum(SettingKey)).query(async ({ input, ctx }) => {
  return await getSettingValue(ctx, input);
});

export async function getSettingValue(ctx: Context, key: SettingKey) {
  const setting = await ctx.orm.setting.findFirst({
    where: {
      key,
    },
  });
  return setting?.data ?? false;
}
