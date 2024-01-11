import env from './env';

export type Partners = {
  shops: PartnerShop[];
  brands: PartnerBrand[];
};

type PartnerShop = {
  name: string;
  address: string;
  department: string;
};

type PartnerBrand = {
  name: string;
  image: string;
};

type News = {
  id: number;
  title: string;
  image: Image;
  imageDesktop?: Image;
  imageAlt: string;
  href?: string;
};

export type Home = {
  news: News[];
  links: HomeLink[];
  inspirations: Inspiration[];
  home_info_text: string;
  home_info_background: Image;
  articleShowcases: { productUid: string }[];
};

type HomeLink = {
  label: string;
  href: string;
  image: Image;
  image_placeholder: string;
};

type Image = {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  folder: null;
  uploaded_by: string;
  uploaded_on: string;
  modified_by: null;
  modified_on: string;
  charset: null;
  filesize: number;
  width: number;
  height: number;
  duration: null;
  embed: null;
  description: null;
  location: null;
  tags: null;
  metadata: unknown;
};

export type Event = {
  month: number;
  day: string;
  city: string;
  description: string;
};

export type ManufacturingTimes = {
  text: string;
  min: number;
  max: number;
  unit: 'weeks' | 'months';
};

export type Inspiration = {
  image: Image;
};

export const fetchFromCMS = <TData = unknown>(path: string, { fields }: { fields?: string } = {}): Promise<TData> => {
  const url = new URL(env.DIRECTUS_BASE_URL);
  if (!path.startsWith('/')) path = '/' + path;
  url.pathname += path;
  if (fields) url.searchParams.append('fields', fields);

  return fetch(url.toString(), { cache: 'no-cache' })
    .then((response) => response.json())
    .then((rs) => rs.data as TData);
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
