import { StyledWrapper } from '@couture-next/ui';
import Image from 'next/image';
import { loader } from '../../utils/next-image-directus-loader';
import React from 'react';
import { Partners, fetchFromCMS } from '../../directus';
import { generateMetadata } from '@couture-next/utils';

type PartnersApiResponse = {
  shops: {
    name: string;
    address: string;
    department: string;
  }[];
  brands: {
    name: string;
    image: string;
  }[];
};

export const metadata = generateMetadata({
  title: 'Partenaires',
  description:
    'Retrouvez tous les intervenants de l&apos;univers de Petit roudoudou. Boutiques, Professionnels du bien-être ainsi les entitées qui nous soutiennent',
});

export default async function Page() {
  const partners = await fetchFromCMS<Partners>('partners', { fields: '*.*' });

  const groupedShops =
    partners.shops.reduce((acc, shop) => {
      if (!acc[shop.department]) {
        acc[shop.department] = [];
      }
      acc[shop.department].push(shop);
      return acc;
    }, {} as Record<string, PartnersApiResponse['shops']>) ?? {};

  return (
    <div className="bg-light-100 -mb-8">
      <h1 className="sr-only">Nos partenaires</h1>
      <section className="px-8 flex flex-col items-center pt-16 pb-8">
        <h2 className="font-serif text-3xl text-center">
          Boutiques partenaires
        </h2>
        <ul>
          {Object.entries(groupedShops).map(([department, shops]) => (
            <li key={department} className="mt-8">
              <h3 className="text-xl font-bold">{department}</h3>
              <ul className="pl-8 mt-2 space-y-4">
                {shops.map((shop) => (
                  <li key={shop.name}>
                    <h4 className="font-bold">{shop.name}</h4>
                    <p>
                      {shop.address.split('\n').map((line, i) => (
                        <React.Fragment key={line + i}>
                          {line}
                          <br />
                        </React.Fragment>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
      <StyledWrapper className="bg-white">
        <section className="px-8">
          <h2 className="font-serif text-3xl text-center">
            Marques partenaires
          </h2>
          <ul className="flex flex-wrap justify-center mt-8">
            {partners.brands.map((brand) => (
              <li key={brand.name} className="p-4 flex items-center gap-2">
                <Image
                  src={brand.image}
                  alt={brand.name}
                  width={100}
                  height={100}
                  className="w-24 h-24 object-contain"
                  loader={loader}
                />
                <p>{brand.name}</p>
              </li>
            ))}
          </ul>
        </section>
      </StyledWrapper>
    </div>
  );
}
