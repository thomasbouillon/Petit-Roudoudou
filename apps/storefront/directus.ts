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
