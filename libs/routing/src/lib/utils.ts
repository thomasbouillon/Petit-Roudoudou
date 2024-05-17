type Return = {
  discriminator: 't' | 'g' | 'a';
  slug: string;
} | null;

export function explodeShopArticlePath(articlePath: string[] | undefined): Return {
  const [discriminator, slug] = articlePath ?? [];
  if (!discriminator || !slug || !['t', 'g', 'a'].includes(discriminator)) return null;

  return {
    discriminator: discriminator as NonNullable<Return>['discriminator'],
    slug,
  };
}
