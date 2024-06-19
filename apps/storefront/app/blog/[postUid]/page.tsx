import { BlogPost, fetchFromCMS } from 'apps/storefront/directus';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import { firebaseServerImageLoader, generateMetadata as prepareMetadata } from '@couture-next/utils';
import { getImageProps } from 'next/image';
import { WithStructuredDataWrapper } from '@couture-next/ui/seo/WithStructuredDataWrapper';
import { Article } from 'schema-dts';
import env from '../../../env';
import { routes } from '@couture-next/routing';
import slugify from 'slugify';
import BlogPostNav from './BlogPostNav';

type Props = {
  params: {
    postUid: string;
  };
};

const blogPostByIdFn = async (id: string) => {
  return await fetchFromCMS<BlogPost>('posts/' + id).catch((e: Response) => {
    if (e.status === 403) throw notFound();
    throw e;
  });
};

export const generateMetadata = async ({ params }: Props) => {
  const { postUid: postSlugWithId } = params;
  const postId = postSlugWithId.split('-').pop();
  if (!postId) return notFound();

  const blogPost = await blogPostByIdFn(postId);
  return prepareMetadata({
    title: blogPost.title,
    alternates: {
      canonical: routes()
        .blog()
        .post(slugify(blogPost.title, { lower: true }), postId),
    },
    description: blogPost.description,
  });
};

export default async function Page({ params }: Props) {
  const { postUid: postSlugWithId } = params;
  const postId = postSlugWithId.split('-').pop();
  if (!postId) return notFound();

  const blogPost = await blogPostByIdFn(postId);

  console.log(blogPost.content);
  blogPost.content = blogPost.content
    // remove empty paragraphs
    .replace(/<p(\s*style="[^"]*")?>&nbsp;<\/p>/g, '<br>')
    // remove style override for text indents
    .replace(/text-indent:\s?-?[0-9\.]+pt;?/g, '')
    .replace(/mso[^:]+:[^;]+;/g, '');
  // .replace(/text-indent:-18.0pt/)

  const imageLoader = firebaseServerImageLoader({
    cdnBaseUrl: env.CDN_BASE_URL,
    preventOriginal: true,
  });

  const { memory, transformTags } = sanitizeHtmlTransformTags();

  const sanitizedPostContent = sanitizeHtml(blogPost.content, {
    allowedTags: ['h2', 'h3', 'a', 'img', 'p', 'br', 'ol', 'ul', 'li', 'strong', 'blockquote'],
    allowedAttributes: {
      h2: ['class', 'style', 'id'],
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
      ...transformTags,
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

  const titleCount = memory.idCounter - 1;

  return (
    <WithStructuredDataWrapper
      as="div"
      className="max-w-3xl mx-auto px-8 pt-16 pb-8"
      stucturedData={getStucturedData(blogPost)}
    >
      <h1 className="text-4xl font-serif text-center mb-8">{blogPost.title}</h1>
      <p className="text-end text-gray-700 mb-4">Publié par Justine, le {formatDate(blogPost.date_created)}</p>
      <BlogPostNav titleCount={titleCount} />
      <div className="space-y-4 text-lg" dangerouslySetInnerHTML={{ __html: sanitizedPostContent }}></div>
    </WithStructuredDataWrapper>
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

const sanitizeHtmlTransformTags: () => {
  memory: { idCounter: number };
  transformTags: Record<string, sanitizeHtml.Transformer>;
} = () => {
  const memory = {
    idCounter: 1,
  };

  return {
    memory,
    transformTags: {
      h2: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          id: `heading-${memory.idCounter++}`,
          class: 'text-2xl font-serif !mt-12 !mb-8',
        },
      }),
      h3: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          class: 'text-xl font-serif !mt-8 !mb-6',
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
          class: 'list-disc pl-6 space-y-4',
        },
      }),
      ol: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          class: 'list-decimal pl-6 space-y-4',
        },
      }),
      strong: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          class: 'font-bold',
        },
      }),
      blockquote: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          class: 'border-l-4 border-primary-100 pl-4 italic',
        },
      }),
    },
  };
};
