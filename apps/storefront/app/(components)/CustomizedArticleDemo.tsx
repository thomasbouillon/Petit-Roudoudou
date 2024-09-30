import env from 'apps/storefront/env';

const getVideoUrl = (pathname: string) => new URL(pathname, env.CDN_BASE_URL).toString();

export default function CustomizedArticleDemo() {
  return (
    <video className="max-w-[256px] aspect-square shadow rounded-sm" autoPlay muted loop playsInline>
      <source src={getVideoUrl('public/videos/CustomArticles.mp4')} type="video/mp4" />
      <source src={getVideoUrl('public/videos/CustomArticles.webm')} type="video/webm" />
      Video de présentation de plusieurs articles avec différents tissus dans notre outil de personnalisation en ligne
    </video>
  );
}
