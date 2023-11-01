type ArticleBase = {
  name: string;
  slug: string;
  description: string;
  treeJsModel: { id: string; url: string };
  images: { url: string; id: string }[];
  characteristics: Record<string, Characteristic>;
  customizables: Customizable[];
  skus: Sku[];
  seo: {
    title: string;
    description: string;
  };
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
  stock: number;
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
