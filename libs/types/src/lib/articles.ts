type ArticleBase = {
  name: string;
  namePlural: string;
  slug: string;
  description: string;
  treeJsModel: { uid: string; url: string };
  images: { url: string; uid: string; placeholderDataUrl?: string }[];
  characteristics: Record<string, Characteristic>;
  customizables: Customizable[];
  skus: Sku[];
  seo: {
    title: string;
    description: string;
  };
  stocks: ArticleStock[];
};

export type ArticleStock = {
  uid: string;
  slug: string;
  sku: string;
  stock: number;
  images: { url: string; uid: string; placeholderDataUrl?: string }[];
  title: string;
  description: string;
};

export type Article = ArticleBase & {
  _id: string;
};

export type NewArticle = ArticleBase;

export type Characteristic = {
  label: string;
  values: Record<string, string>;
};

export type Sku = {
  uid: string;
  characteristics: Record<string, string>;
  price: number;
  weight: number;
  enabled: boolean;
};

export type Customizable = {
  label: string;
  uid: string;
} & CustomizablePart;

export type CustomizablePart = {
  type: 'customizable-part';
  fabricListId: string;
  treeJsModelPartId: string;
  size: [number, number];
};
