import React from 'react';
import { Partners, fetchFromCMS } from '../../directus';
import { generateMetadata } from '@couture-next/utils';
import { CmsImage } from '../cmsImage';

export const metadata = generateMetadata({
  title: 'Partenaires',
  description:
    'Retrouvez tous les intervenants de l&apos;univers de Petit roudoudou. Boutiques, Professionnels du bien-être ainsi les entitées qui nous soutiennent',
});

export default async function Page() {
  const partners = await fetchFromCMS<Partners>('partners', { fields: '*.*.*' });

  const groupedShops =
    partners.shops.reduce((acc, shop) => {
      if (!acc[shop.department]) {
        acc[shop.department] = [];
      }
      acc[shop.department].push(shop);
      return acc;
    }, {} as Record<string, Partners['shops']>) ?? {};

  return (
    <div className="bg-light-100 -mb-8">
      <h1 className="sr-only">Nos partenaires</h1>
      <section className="px-8 flex flex-col items-center pt-16 pb-8">
        <h2 className="font-serif text-3xl text-center">Boutiques partenaires</h2>
        <ul>
          {Object.entries(groupedShops).map(([department, shops]) => (
            <li key={department} className="mt-8">
              <h3 className="text-xl font-bold">{department}</h3>
              <ul className="pl-8 mt-2 space-y-4">
                {shops.map((shop) => (
                  <li key={shop.name} className="flex flex-row-reverse justify-end gap-4">
                    <div>
                      <h4 className="font-bold">{shop.name}</h4>
                      <p>
                        {shop.address.split('\n').map((line, i) => (
                          <React.Fragment key={line + i}>
                            {line}
                            <br />
                          </React.Fragment>
                        ))}
                      </p>
                      {!!shop.url && (
                        <a href={shop.url} target="_blank">
                          {shop.url}
                        </a>
                      )}
                    </div>
                    {!!shop.logo && <PartnerImage image={shop.logo.filename_disk} name={shop.name} />}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
      <div className="triangle-top bg-white"></div>

      <section className="px-8 bg-white pb-[20svh]">
        <h2 className="font-serif text-3xl text-center">Partenaires</h2>
        <ul className="flex flex-wrap justify-center mt-8">
          {partners.brands.map((brand) => (
            <Partner key={brand.name} partner={brand} />
          ))}
        </ul>
      </section>
    </div>
  );
}

const Partner: React.FC<{ partner: Partners['brands'][number] }> = ({ partner }) => {
  if (partner.url)
    return (
      <li className="p-4">
        <a href={partner.url} target="_blank" className="underline flex flex-col items-center gap-2">
          <PartnerImage image={partner.image.filename_disk} name={partner.name} />
          <p>{partner.name}</p>
        </a>
      </li>
    );

  return (
    <li className="p-4 flex flex-col items-center gap-2">
      <PartnerImage image={partner.image.filename_disk} name={partner.name} />
      <p>{partner.name}</p>
    </li>
  );
};

function PartnerImage(partner: { image: string; name: string }) {
  return (
    <CmsImage src={partner.image} alt={partner.name} width={100} height={100} className="w-24 h-24 object-contain" />
  );
}
