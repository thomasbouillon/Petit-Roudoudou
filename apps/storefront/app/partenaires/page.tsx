'use client';

import { StyledWrapper } from '@couture-next/ui';
import env from '../../env';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { loader } from '../../utils/next-image-directus-loader';

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

export default function Page() {
  const [partners, setPartners] = useState<PartnersApiResponse | null>(null);
  useEffect(() => {
    fetch(env.DIRECTUS_BASE_URL + '/partners?fields=*.*')
      .then((response) => response.json())
      .then((rs) => {
        setPartners(rs.data);
      });
  }, []);

  const groupedShops =
    partners?.shops.reduce((acc, shop) => {
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
                      {shop.address.split('\n').map((line) => (
                        <>
                          {line}
                          <br />
                        </>
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
            {partners?.brands.map((brand) => (
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
