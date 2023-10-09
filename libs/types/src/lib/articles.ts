export type Article = {
  _id?: string;
  name: string;
  description: string;
  images: string[];
  // caracteristics: Record<string, string>;
  // skus: Sku[];
  // customizables: Customizable[];
  seo: {
    title: string;
    description: string;
  };
};

export type Sku = {
  name: string;
  caracteristics: Record<string, string>;
  price: number;
  stock?: number;
  enabled: boolean;
};

export type Customizable = {
  name: string;
  // TODO
};
