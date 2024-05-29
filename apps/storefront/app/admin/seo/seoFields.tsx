import z from 'zod';

const schema = z.object({
  seo: z.object({
    title: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
    description: z.string().min(3, 'La description doit faire au moins 3 caractères'),
  }),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        uid: z.string().min(1),
        placeholderDataUrl: z.string().optional(),
      })
    )
    .min(1, 'Il faut au moins une image'),
  stocks: z.array(
    z.object({
      seo: z.object({
        title: z.string().min(3, 'Le titre de la page doit faire au moins 3 caractères'),
        description: z.string().min(3, 'La description doit faire au moins 3 caractères'),
      }),
      inherits: z.object({ customizables: z.record(z.literal(true)) }),
    })
  ),
});

export type ArticleFormType = z.infer<typeof schema>;

export function Form() {
  const SubmitButton = <button type="submit"></button>;

  return (
    <form className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md px-4 border">
      <div className="flex justify-end border-t px-4 py-4 mt-6">{SubmitButton}</div>
    </form>
  );
}
