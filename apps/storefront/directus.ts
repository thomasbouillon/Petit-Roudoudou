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

export type Event = {
  month: number;
  day: string;
  city: string;
  description: string;
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
