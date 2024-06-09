import ArticlesForms from './ArticlesForms';
import BlockBodyScroll from './BlockBodyScroll';

export default function Page() {
  return (
    <div className="sm:fixed sm:left-0 sm:top-[3.5rem] sm:w-screen sm:h-[100dvh-3.5rem] bg-white z-10 p-4">
      <h1 className="text-3xl font-serif text-center mb-6">Seo</h1>
      <BlockBodyScroll />
      <ArticlesForms />
    </div>
  );
}
