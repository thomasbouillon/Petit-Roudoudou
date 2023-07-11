import { StyledWrapper } from '@couture-next/ui';
import Image from 'next/image';
import { useMemo } from 'react';

const shops = [
  {
    department: '54 - Meurthe-et-Moselle',
    name: "C'est papa qui l'a dit",
    address: '9 Rue clodion, 54000 Nancy',
  },
  {
    department: '54 - Meurthe-et-Moselle',
    name: "C'est papa qui l'a dit",
    address: '9 Rue clodion, 54000 Nancy',
  },
  {
    department: '54 - Meurthe-et-Moselle',
    name: "C'est papa qui l'a dit",
    address: '9 Rue clodion, 54000 Nancy',
  },
  {
    department: '57 - Moselle',
    name: "C'est papa qui l'a dit",
    address: '9 Rue clodion, 54000 Nancy',
  },
];

const brands = [
  {
    name: 'Les petits culottés',
    image: '/tmp/1.jpg',
  },
  {
    name: 'Laboratoire téane',
    image: '/tmp/2.jpg',
  },
];

export default function Page() {
  const groupedShops = useMemo(
    () =>
      shops.reduce((acc, shop) => {
        if (!acc[shop.department]) {
          acc[shop.department] = [];
        }
        acc[shop.department].push(shop);
        return acc;
      }, {} as Record<string, typeof shops>),
    [shops]
  );

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
                    <p>{shop.address}</p>
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
            {brands.map((brand) => (
              <li key={brand.name} className="p-4 flex items-center gap-2">
                <Image
                  src={brand.image}
                  alt={brand.name}
                  width={100}
                  height={100}
                  className="w-24 h-24 object-contain"
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
