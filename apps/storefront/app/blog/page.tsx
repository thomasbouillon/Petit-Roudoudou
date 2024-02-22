import { routes } from '@couture-next/routing';
import { generateMetadata } from '@couture-next/utils';
import { BlogPost, fetchFromCMS } from 'apps/storefront/directus';
import Link from 'next/link';
import slugify from 'slugify';

export const metadata = generateMetadata({
  title: 'Blog',
  description:
    'Découvrez les dernières actualités et conseils de Justine, la spécialiste bébé et créatrice de Petit Roudoudou.',
});

export default async function Page() {
  const blogPosts = await fetchFromCMS<BlogPost[]>('/posts', {
    fields: 'id,title',
  });

  return (
    <div className="max-w-xl mx-auto mt-8 mb-16">
      <h1 className="text-3xl text-center font-serif mb-8">Blog</h1>
      <ul className="space-y-4">
        {blogPosts.map((post) => (
          <li key={post.id}>
            <Link
              className="block bg-light-100 rounded-md p-4"
              href={routes()
                .blog()
                .post(slugify(post.title, { lower: true }), post.id.toString())}
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
