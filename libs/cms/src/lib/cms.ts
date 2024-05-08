import { Home, ManufacturingTimes, Offers } from './types';

const fetchFromCMS = <TData = unknown>(
  CMS_BASE_URL: string,
  path: string,
  { fields }: { fields?: string } = {}
): Promise<TData> => {
  const url = new URL(CMS_BASE_URL);
  if (!path.startsWith('/')) path = '/' + path;
  url.pathname += path;
  if (fields) url.searchParams.append('fields', fields);

  return fetch(url.toString(), {
    // nextjs ISR support
    next: { tags: ['cms', 'cms-' + path] },
  } as any)
    .then((response) => {
      if (!response.ok) throw response;
      return response.json();
    })
    .then((rs) => {
      return rs.data as TData;
    });
};

export type CmsClient = ReturnType<typeof getCmsClient>;

export const getCmsClient = (CMS_BASE_URL: string) => {
  return {
    getManufacturingTimes: () => fetchFromCMS<ManufacturingTimes>(CMS_BASE_URL, 'manufacturing_times'),
    getOffers: () => fetchFromCMS<Offers>(CMS_BASE_URL, 'offers'),
    getHome: () => fetchFromCMS<Home>(CMS_BASE_URL, 'home', { fields: '*.*' }),
  };
};

export const monthFromId = (id: number) => {
  switch (id) {
    case 1:
      return 'Janvier';
    case 2:
      return 'Février';
    case 3:
      return 'Mars';
    case 4:
      return 'Avril';
    case 5:
      return 'Mai';
    case 6:
      return 'Juin';
    case 7:
      return 'Juillet';
    case 8:
      return 'Août';
    case 9:
      return 'Septembre';
    case 10:
      return 'Octobre';
    case 11:
      return 'Novembre';
    case 12:
      return 'Décembre';
    default:
      return '';
  }
};
