import { BlogPost, fetchFromCMS } from 'apps/storefront/directus';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import { firebaseServerImageLoader, generateMetadata as prepareMetadata } from '@couture-next/utils';
import { getImageProps } from 'next/image';
import { cache } from 'react';
import { WithStructuedDataWrapper } from '@couture-next/ui';
import { Article } from 'schema-dts';
import env from '../../../env';

type Props = {
  params: {
    postUid: string;
  };
};

const cachedBlogPostByIdFn = cache(async (id: string) => {
  return await fetchFromCMS<BlogPost>('posts/' + id).catch((e: Response) => {
    if (e.status === 403) throw notFound();
    throw e;
  });
});

export const generateMetadata = async ({ params }: Props) => {
  const { postUid } = params;
  const postId = postUid.split('-').pop();
  if (!postId) return notFound();

  const blogPost = await cachedBlogPostByIdFn(postId);
  return prepareMetadata({
    title: blogPost.title,
    description: blogPost.description,
  });
};

export default async function Page({ params }: Props) {
  const { postUid } = params;
  const postId = postUid.split('-').pop();
  if (!postId) return notFound();

  const blogPost = await cachedBlogPostByIdFn(postId);

  blogPost.content = blogPost.content.replace(/<p(\s*style="[^"]*")?>&nbsp;<\/p>/g, '<br>');

  const imageLoader = firebaseServerImageLoader({
    cdnBaseUrl: env.BASE_URL,
    preventOriginal: true,
  });

  const sanitizedPostContent = sanitizeHtml(blogPost.content, {
    allowedTags: ['h2', 'h3', 'a', 'img', 'p', 'br', 'ol', 'ul', 'li', 'strong', 'blockquote'],
    allowedAttributes: {
      h2: ['class', 'style'],
      h3: ['class', 'style'],
      a: ['href', 'class', 'style'],
      p: ['style'],
      ul: ['class', 'style'],
      ol: ['class', 'style'],
      li: ['style'],
      strong: ['class', 'style'],
      blockquote: ['class', 'style'],
      img: ['src', 'srcSet', 'loading', 'decoding', 'width', 'height', 'alt', 'style'],
    },
    transformTags: {
      ...sanitizeHtmlTransformTags,
      img: (tagName, attribs) => {
        const { src, style } = attribs;

        const imgName = src.split('/').pop()?.split('?').shift();
        if (!imgName) throw 'Impossible';

        const orgSrcSearchParams = new URLSearchParams(src.split('?').pop() || '');
        const orgWidth = orgSrcSearchParams.get('width') ?? '';
        const orgHeight = orgSrcSearchParams.get('height') ?? '';

        const imageProps = getImageProps({
          src: 'https://url-host-is-ignor.ed/cms%2F' + imgName,
          loader: imageLoader,
          alt: attribs.alt,
          width: `${parseInt(orgWidth) || 400}`,
          height: `${parseInt(orgHeight) || 400}`,
        }).props;

        return {
          tagName,
          attribs: {
            src: imageProps.src,
            srcSet: imageProps.srcSet || '',
            alt: attribs.alt,
            decoding: imageProps.decoding || 'async',
            loading: imageProps.loading || 'lazy',
            width: `${imageProps.width}`,
            height: `${imageProps.height}`,
            style,
          },
        };
      },
    },
  });

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <WithStructuedDataWrapper
      as="div"
      className="max-w-3xl mx-auto px-4 pt-16 pb-8"
      stucturedData={getStucturedData(blogPost)}
    >
      <h1 className="text-4xl font-serif text-center mb-4">{blogPost.title}</h1>
      <p className="text-end text-gray-700">Publié par Justine, le {formatDate(blogPost.date_created)}</p>
      <div className="space-y-2" dangerouslySetInnerHTML={{ __html: sanitizedPostContent }}></div>
    </WithStructuedDataWrapper>
  );
}

const getStucturedData = (blogPost: BlogPost): Article => ({
  '@type': 'Article',
  headline: blogPost.title,
  abstract: blogPost.description,
  datePublished: blogPost.date_created,
  dateModified: blogPost.date_updated,
  inLanguage: 'fr-FR',
  articleBody: htmlToText(blogPost.content),
});

const htmlToText = (unsafe: string) => sanitizeHtml(unsafe, { allowedTags: [], allowedAttributes: {} });

const sanitizeHtmlTransformTags: Record<string, sanitizeHtml.Transformer> = {
  h2: (tagName, attribs) => ({
    tagName,
    attribs: {
      ...attribs,
      class: 'text-2xl font-serif mt-8 mb-4',
    },
  }),
  h3: (tagName, attribs) => ({
    tagName,
    attribs: {
      ...attribs,
      class: 'text-xl font-serif mt-6 mb-4',
    },
  }),
  a: (tagName, attribs) => ({
    tagName,
    attribs: {
      ...attribs,
      href: attribs.href,
      class: 'text-primary-100 underline',
    },
  }),
  ul: (tagName, attribs) => ({
    tagName,
    attribs: {
      ...attribs,
      class: 'list-disc pl-6',
    },
  }),
  ol: (tagName, attribs) => ({
    tagName,
    attribs: {
      ...attribs,
      class: 'list-decimal pl-6',
    },
  }),
  strong: (tagName, attribs) => ({
    tagName,
    attribs: {
      ...attribs,
      class: 'font-bold text-primary-100',
    },
  }),
  blockquote: (tagName, attribs) => ({
    tagName,
    attribs: {
      ...attribs,
      class: 'border-l-4 border-primary-100 pl-4 italic',
    },
  }),
};
