import React from 'react';
import { generateMetadata } from '@couture-next/utils';
import { CmsImage } from '../cmsImage';
import { routes } from '@couture-next/routing';
import { Partner, Partners } from '@couture-next/cms';
import { fetchFromCMS, partnersFields } from 'apps/storefront/directus';

export const metadata = generateMetadata({
  title: 'Partenaires',
  alternates: { canonical: routes().partners().index() },
  description:
    'Retrouvez tous les intervenants de l&apos;univers de Petit roudoudou. Boutiques, Professionnels du bien-être ainsi les entitées qui nous soutiennent',
});

export default async function Page() {
  const partners = await fetchFromCMS<Partners>('partners', { fields: partnersFields.join(',') });
  const groupedShops =
    partners.shops.reduce((acc, shop) => {
      const deparment = shop.zipCode?.slice(0, 2) ?? '';
      if (!acc[deparment]) {
        acc[deparment] = [];
      }
      acc[deparment].push(shop);
      return acc;
    }, {} as Record<string, Partners['shops']>) ?? {};

  return (
    <div className="">
      <h1 className="sr-only">Nos partenaires</h1>
      <section className="group">
        <div className="group-even:bg-light-100 group-odd:bg-white px-8 flex flex-col items-center pt-16 pb-8">
          <h2 className="font-serif text-3xl text-center">Boutiques partenaires</h2>
          <ul className="flex flex-col sm:flex-row justify-center items-center flex-grow ">
            {Object.entries(groupedShops).map(([department, shops]) => (
              <li key={department} className="mt-8">
                <h3 className="text-xl pl-8 underline underline-offset-4 decoration-primary-100 font-bold">
                  {department}
                </h3>
                <ul className="pl-8 mt-2 space-y-4">
                  {shops.map((shop) => (
                    <li key={shop.name} className="flex flex-row-reverse justify-end gap-4">
                      <div>
                        <h4 className="font-bold">{shop.name}</h4>
                        <p>
                          {shop.address}
                          <br />
                          {shop.zipCode} {shop.city}
                        </p>
                        {!!shop.url && (
                          <a href={shop.url} target="_blank" className="break-all">
                            {shop.url}
                          </a>
                        )}
                      </div>
                      {!!shop.image && <PartnerImage image={shop.image.filename_disk} name={shop.name} />}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <div className="triangle-bottom group-even:bg-light-100 group-odd:bg-white group-last:hidden"></div>
      </section>
      <PartnersSection title="Professionnels du bien-être" partners={partners.healthProfessionals} />
      <PartnersSection title="Approuvé par" partners={partners.trustedBy} />
      <PartnersSection title="Soutenu par" partners={partners.supportedBy} />
      <AwardsSection awards={partners.awards} />
    </div>
  );
}

const PartnersSection: React.FC<{ title: string; partners: Partner[] }> = ({ title, partners }) => {
  if (partners.length === 0) return null;
  return (
    <section className="group">
      <div className="triangle-top group-even:bg-light-100 group-odd:bg-white"></div>
      <div className="px-8 group-even:bg-light-100 group-odd:bg-white">
        <h2 className="font-serif text-3xl text-center">{title}</h2>
        <ul className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 w-full ">
          {partners.map((partner) => (
            <PartnerLine key={partner.name} partner={partner} />
          ))}
        </ul>
      </div>
      <div className="triangle-bottom group-even:bg-light-100 group-odd:bg-white"></div>
    </section>
  );
};

const AwardsSection: React.FC<{ awards: Partners['awards'] }> = ({ awards }) => {
  if (awards.length === 0) return null;
  return (
    <section className="group">
      <div className="triangle-top group-even:bg-light-100 group-odd:bg-white"></div>
      <div className="px-8 group-even:bg-light-100 group-odd:bg-white">
        <h2 className="font-serif text-3xl text-center">Récompenses</h2>
        <ul className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-full">
          {awards.map((award) => (
            <li key={award.name} className="p-4 flex flex-col items-center gap-2">
              <CmsImage
                src={award.image.filename_disk}
                alt={award.name}
                width={100}
                height={100}
                className="w-24 h-24 object-contain bg-gray-100"
              />
              <p>{award.name}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="triangle-bottom group-even:bg-light-100 group-odd:bg-white"></div>
    </section>
  );
};

const PartnerLine: React.FC<{ partner: Partner }> = ({ partner }) => {
  if (partner.url)
    return (
      <li className="p-4 h-auto max-w-72 ">
        <a href={partner.url} target="_blank" className="underline flex flex-col items-center gap-2 mb-2">
          <PartnerImage image={partner.image.filename_disk} name={partner.name} />
          <p>{partner.name}</p>
        </a>
        <p className="empty:hidden">{partner.description}</p>
        <p>
          {partner.address}
          <br />
          {partner.zipCode} {partner.city}
        </p>
      </li>
    );

  return (
    <li className="p-4 flex flex-col items-center gap-2 h-auto max-w-72">
      <PartnerImage image={partner.image.filename_disk} name={partner.name} />
      <div>
        <p className="text-center mb-2">{partner.name}</p>
        <p className="empty:hidden">{partner.description}</p>
        <p>
          {partner.address}
          <br />
          {partner.zipCode} {partner.city}
        </p>
      </div>
    </li>
  );
};

function PartnerImage(partner: { image: string; name: string }) {
  return (
    <CmsImage
      src={partner.image}
      alt={partner.name}
      width={100}
      height={100}
      className="w-24 h-24 object-contain bg-gray-100"
    />
  );
}
