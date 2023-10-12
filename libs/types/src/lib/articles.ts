export type Article = {
  _id?: string;
  name: string;
  description: string;
  images: string[];
  characteristics: Record<string, Characteristic>;
  skus: Sku[];
  // customizables: Customizable[];
  seo: {
    title: string;
    description: string;
  };
};

export type Characteristic = {
  label: string;
  values: Record<string, string>;
};

export type Sku = {
  characteristics: Record<string, string>;
  price: number;
  stock?: number;
  weight: number;
  enabled: boolean;
};

export type Customizable = {
  name: string;
  // TODO
};
