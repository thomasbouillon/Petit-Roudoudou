export type Partners = {
  shops: Partner[];
  healthProfessionals: Partner[];
  trustedBy: Partner[];
  supportedBy: Partner[];
  awards: Award[];
};

export type Partner = {
  name: string;
  description: string;
  address: string;
  zipCode: string;
  city: string;
  image: Image;
  url?: string;
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

type Award = {
  name: string;
  image: Image;
};

export type Home = {
  news: News[];
  links: HomeLink[];
  home_info_text: string;
  home_info_background: Image;
  banner_infos: { text: string }[];
  articleShowcases: { productUid: string }[];
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
