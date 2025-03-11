import env from './env';

// TODO remove and use lib

export type Partners = {
  shops: Partner[];
  healthProfessionals: Partner[];
  trustedBy: Partner[];
  supportedBy: Partner[];
  awards: Award[];
};

type Partner = {
  name: string;
  description: string;
  address?: string;
  zipCode?: string;
  city?: string;
  image: Image;
  url?: string;
};

type Award = {
  name: string;
  image: Image;
};

type News = {
  id: number;
  title: string;
  hideTitle: boolean;
  image: Image;
  imageDesktop?: Image;
  imageAlt: string;
  href?: string;
};

export type Home = {
  news: News[];
  links: HomeLink[];
  home_info_text: string;
  home_info_background: Image;
  banner_infos: { text: string }[];
};

type HomeLink = {
  label: string;
  href: string;
  image: Image;
  imageDesktop?: Image;
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
  startAt: string;
  endAt: string;
  city: string;
  description: string;
};

export type ManufacturingTimes = {
  text: string;
  min: number;
  max: number;
  unit: 'weeks' | 'months';
};

export type Faq = {
  question: string;
  answer: string;
  image?: Image;
};

export type BlogPost = {
  id: number;
  status: string;
  sort: number;
  title: string;
  image?: Image;
  description: string;
  content: string;
  date_created: string;
  date_updated: string;
};

export type Offers = {
  freeShippingThreshold: number | null;
  giftThreshold: number | null;
};

export const partnerFields = ['name', 'description', 'address', 'zipCode', 'city', 'image.*', 'url'];
export const partnersFields = [
  ...partnerFields.map((field) => `shops.${field}`),
  ...partnerFields.map((field) => `healthProfessionals.${field}`),
  ...partnerFields.map((field) => `trustedBy.${field}`),
  ...partnerFields.map((field) => `supportedBy.${field}`),
  'awards.name',
  'awards.image.*',
];
export const newsFields = ['id', 'title', 'hideTitle', 'image.*', 'imageDesktop.*', 'imageAlt', 'href'];
export const homeLinkFields = ['label', 'href', 'image.*', 'imageDesktop.*', 'image_placeholder'];
export const homeFields = [
  ...newsFields.map((field) => `news.${field}`),
  ...homeLinkFields.map((field) => `links.${field}`),
  'home_info_text',
  'home_info_background.*',
  'banner_infos.text',
  'awards',
];

export const fetchFromCMS = <TData = unknown>(path: string, { fields }: { fields?: string } = {}): Promise<TData> => {
  const url = new URL(env.DIRECTUS_BASE_URL);
  if (!path.startsWith('/')) path = '/' + path;
  url.pathname += path;
  if (fields) url.searchParams.append('fields', fields);

  return fetch(url.toString(), {
    next: { tags: ['cms', 'cms-' + path] },
  })
    .then((response) => {
      if (!response.ok) throw response;
      return response.json();
    })
    .then((rs) => {
      return rs.data as TData;
    });
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
