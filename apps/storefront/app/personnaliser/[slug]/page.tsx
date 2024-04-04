import { routes } from '@couture-next/routing';
import { generateMetadata as prepareMetadata } from '@couture-next/utils';
import { App } from './app';

type PageProps = {
  params: {
    slug: string;
  };
};

export const generateMetadata = ({ params }: PageProps) =>
  prepareMetadata({
    title: 'Personnaliser', // TODO improve with article desc
    alternates: { canonical: routes().shop().customize(params.slug) },
    description: 'Personnalisez votre article à votre image !',
  });

export default function Page() {
  return <App />;
}
