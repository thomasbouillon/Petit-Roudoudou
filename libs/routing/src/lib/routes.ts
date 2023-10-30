export const routes = () => ({
  admin: () => ({
    index: () => '/admin',
    products: () => ({
      index: () => '/admin/creations',
      new: () => '/admin/creations/nouveau',
      product: (id: string) => ({
        edit: () => `/admin/creations/${id}/modifier`,
      }),
    }),
    fabrics: () => ({
      index: () => '/admin/tissus',
      new: () => '/admin/tissus/nouveau',
      fabric: (id: string) => ({
        edit: () => `/admin/tissus/${id}/modifier`,
      }),
    }),
  }),
  shop: () => ({
    index: () => '/boutique',
    customize: (slug: string) => `/boutique/personnaliser/${slug}`,
  }),
  auth: () => ({
    login: () => '/connexion',
    register: () => '/inscription',
  }),
  events: () => ({
    index: () => '/evenements',
  }),
  partners: () => ({
    index: () => '/partenaires',
  }),
  cart: () => ({
    index: () => '/panier',
    confirm: () => '/panier/confirmation',
  }),
  index: () => '/',
});
