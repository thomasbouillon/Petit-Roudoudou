import { routes } from '@couture-next/routing';
import { generateMetadata } from '@couture-next/utils';
import { BlogPost, fetchFromCMS } from 'apps/storefront/directus';
import Link from 'next/link';
import slugify from 'slugify';
import { CmsImage } from '../cmsImage';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { WithDecorativeDotsWrapper } from '@couture-next/ui/WithDecorativeDotsWrapper';
import { StorageImage } from '../StorageImage';

export const metadata = generateMetadata({
  title: 'Blog',
  alternates: { canonical: routes().blog().index() },
  description:
    'Découvrez les dernières actualités et conseils de Justine, la spécialiste bébé et créatrice de Petit Roudoudou.',
});

export default async function Page() {
  const blogPosts = await fetchFromCMS<Pick<BlogPost, 'title' | 'id' | 'image' | 'description' | 'date_created'>[]>(
    '/posts',
    {
      fields: 'id,title,image.*,description,date_created',
    }
  );
  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  return (
    <div className="">
      <WithDecorativeDotsWrapper dotsPosition="bottom-left">
        <StorageImage
          src="public/images/blog-hero.jpg"
          alt="Image d'un bébé dans une couverture."
          priority
          width={1440}
          height={268}
          sizes="100vw"
          className="w-full"
        />
      </WithDecorativeDotsWrapper>
      <div className="max-w-3xl mx-auto mb-16 mt-8">
        <h1 className="text-3xl text-center font-serif mb-8">Blog des Petits Roudoudous</h1>
        <ul className="space-y-4 px-4 empty:hidden">
          {blogPosts.length === 0 && (
            <div>
              <ExclamationTriangleIcon className="w-6 h-6 text-primary-100 mx-auto" />
              <p className="text-center">Nous faisons au plus vite pour rédiger des articles !</p>
            </div>
          )}
          {blogPosts.map((post) => (
            <li key={post.id}>
              <Link
                className="flex bg-light-100 rounded-md overflow-hidden items-center flex-col sm:flex-row sm:items-start sm:h-48"
                aria-label={`Lire l'article "${post.title}"`}
                href={routes()
                  .blog()
                  .post(slugify(post.title, { lower: true }), post.id.toString())}
              >
                {!!post.image && (
                  <div className="relative w-full aspect-[2/1] sm:aspect-[4/3] sm:w-auto sm:h-full">
                    <CmsImage
                      src={post.image.filename_disk}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 256px, 100vw"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="relative p-4 flex flex-col h-full max-sm:pb-12">
                  <strong className="block mb-2 sm:mb-0 text-2xl font-serif text-pretty">{post.title}</strong>
                  <p className="line-clamp-3">{post.description}</p>
                  <div className="relative -bottom-2 flex justify-between">
                    <span className="text-gray-700">Publié le {formatDate(post.date_created)}</span>
                    <span className="text-primary-100 font-bold underline">Lire l&apos;article</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
