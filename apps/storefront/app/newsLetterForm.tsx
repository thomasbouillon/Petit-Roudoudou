'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ButtonWithLoading } from '@couture-next/ui';
import toast from 'react-hot-toast';
import { trpc } from '../trpc-client';

const schema = z.object({
  name: z.string().min(1, "Le prénom n'est pas valide."),
  email: z.string().email("L'email n'est pas valide."),
  category: z.enum(['future-parent', 'parent', 'for-me']),
  privacy: z.literal(true, { errorMap: () => ({ message: 'Tu dois accepter les conditions.' }) }),
});

type SchemaType = z.infer<typeof schema>;

export function NewsletterForm() {
  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
  });

  const subscribeToNewsLetterMutation = trpc.newsletter.registerToNewsLetter.useMutation();
  const onSubmit = form.handleSubmit((data) => {
    return subscribeToNewsLetterMutation
      .mutateAsync(data)
      .catch(() => toast.error('Une erreur est survenue, réessaye plus tard.'));
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col items-center gap-4 mt-8 max-w-xs w-full mx-auto">
      <p className="text-red-500 empty:hidden text-sm">{form.formState.errors.name?.message}</p>
      <input
        type="text"
        className="placeholder:text-primary-100 shadow-md p-4 w-full text-center"
        aria-label="Prénom"
        placeholder="Prénom"
        required
        {...form.register('name')}
      />
      <p className="text-red-500 empty:hidden text-sm">{form.formState.errors.email?.message}</p>
      <input
        type="text"
        className="placeholder:text-primary-100 shadow-md p-4 w-full text-center"
        aria-label="Email"
        placeholder="Email"
        required
        {...form.register('email')}
      />
      <p className="text-red-500 empty:hidden text-sm">{form.formState.errors.category?.message}</p>
      <div className="text-primary-100">
        <label className="block py-1">
          <input type="radio" className="mr-2 accent-current" value="future-parent" {...form.register('category')} />
          Futur parent
        </label>
        <label className="block py-1">
          <input type="radio" className="mr-2 accent-current" value="parent" {...form.register('category')} />
          Parent
        </label>
        <label className="block py-1">
          <input type="radio" className="mr-2 accent-current" value="for-me" {...form.register('category')} />
          Juste moi 🙈
        </label>
      </div>
      <p className="text-red-500 empty:hidden text-sm">{form.formState.errors.privacy?.message}</p>
      <label className="text-[0.7rem] leading-[0.75rem] pl-0">
        <input type="checkbox" className="mr-2 accent-primary-100" {...form.register('privacy')} />
        <span className="bg-light-100">
          J'accepte de recevoir des emails dans le cadre de la newsletter. Tu recevras des offres et des infos. Tu
          pourras te désabonner à tout moment. Nous utilisons Brevo pour nos envois d'email, en t'abonnant à la
          newsletter, ces données seront également transmises à{' '}
          <a href="https://www.brevo.com/fr/legal/privacypolicy/" className="underline">
            Brevo
          </a>
          .
        </span>
      </label>
      <ButtonWithLoading
        type="submit"
        className={clsx(
          'btn-primary w-full shadow-sm',
          form.formState.isDirty && !form.formState.isValid && 'opacity-50 cursor-not-allowed'
        )}
        loading={form.formState.isSubmitting}
      >
        Rejoindre
      </ButtonWithLoading>
    </form>
  );
}
