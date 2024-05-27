import { generateMetadata } from '@couture-next/utils';
import Image from 'next/image';
import { loader } from '../../utils/next-image-firebase-storage-loader';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-server';
import { Fabric, FabricGroup } from '@prisma/client';
import clsx from 'clsx';

const fetchGroups = () =>
  trpc.fabricGroups.list.query().then((groups) => {
    return groups.concat({ id: 'others', name: 'Autres', fabricIds: [] }).reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {} as Record<string, FabricGroup>);
  });

const fetchFabrics = () => {
  return trpc.fabrics.list.query(/* undefined, { context: { revalidate: 1 } } */);
};

export const metadata = generateMetadata({
  title: 'Tissus',
  alternates: { canonical: routes().fabrics().index() },
  description:
    'Venez découvrir tous les tissus disponibles pour personnaliser vos créations à VOTRE image ! Choisissez parmi une large variété de motifs et de couleurs.',
});

export default async function Page() {
  const [fabrics, groups] = await Promise.all([fetchFabrics(), fetchGroups()]);

  const allFabricsByGroup = fabrics.reduce((acc, fabric) => {
    fabric.groupIds.forEach((groupId) => {
      if (!acc[groupId]) acc[groupId] = [];
      acc[groupId].push(fabric);
    });
    if (fabric.groupIds.length === 0) {
      if (!acc['others']) acc['others'] = [];
      acc['others'].push(fabric);
    }
    return acc;
  }, {} as Record<string, Fabric[]>);

  return (
    <ul className="mx-auto max-w-7xl px-4 mt-8 my-8">
      <h1 className="text-4xl text-center font-serif mb-6">Tous les tissus</h1>
      {Object.entries(allFabricsByGroup ?? {}).map(([groupId, fabrics]) => (
        <li
          className="grid grid-cols-[repeat(auto-fill,min(100%,14rem))] gap-4 place-content-center mt-8"
          key={groupId}
        >
          <h2 className="text-2xl font-serif col-span-full">{groups[groupId].name}</h2>
          <ul className="grid grid-cols-subgrid col-span-full gap-4">
            {fabrics.map((fabric) => (
              <li key={fabric.id}>
                <FabricCard fabric={fabric} />
                <p className="text-center px-4 mt-1">{fabric.name}</p>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

const FabricCard = ({ fabric }: { fabric: Fabric }) => {
  const image = fabric.previewImage ?? fabric.image;
  return (
    <div className="relative">
      <Image
        loader={loader}
        src={image.url}
        width={224}
        height={224}
        alt={"Tissu '" + fabric.name + "'"}
        placeholder={image.placeholderDataUrl ? 'blur' : 'empty'}
        blurDataURL={image.placeholderDataUrl ?? undefined}
        className={clsx('border rounded-sm aspect-square object-cover object-center', !fabric.enabled && 'opacity-50')}
      />
      {/* <div className="absolute bottom-2 right-2 flex items-center justify-end flex-wrap-reverse max-w-full">
    {fabric.tags.map((tag) => (
      <span
        key={tag}
        className="bg-white block border rounded-full py-1 px-2 shadow-sm"
      >
        {tag}
      </span>
    ))}
  </div> */}
      {!fabric.enabled && (
        <p className="absolute text-center w-full top-1/2 -translate-y-1/2 left-0 px-4">
          <div className="bg-white shadow-sm text-red-500">Momentanément indisponible</div>
        </p>
      )}
    </div>
  );
};
