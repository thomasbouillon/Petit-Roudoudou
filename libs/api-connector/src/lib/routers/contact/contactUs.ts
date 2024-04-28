import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import sanitize from 'sanitize-html';

export default publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      subject: z.string().transform((v) => sanitize(v, { allowedTags: [], allowedAttributes: {} })),
      message: z.string().transform((v) => sanitize(v, { allowedTags: [], allowedAttributes: {} })),
      recaptchaToken: z.string(),
    })
  )
  .use(async ({ ctx, input, next }) => {
    const validRecaptcha = await ctx.validateRecaptcha(input.recaptchaToken);
    if (!validRecaptcha) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid recaptcha token',
      });
    }
    console.log('Recaptcha token is valid');
    return next();
  })
  .mutation(async ({ ctx, input }) => {
    ctx.mailer.sendEmail('contact', ctx.environment.ADMIN_EMAIL, {
      EMAIL: input.email,
      SUBJECT: input.subject,
      MESSAGE: input.message,
    });
  });
