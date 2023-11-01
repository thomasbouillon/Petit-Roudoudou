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
    orders: () => ({
      index: () => '/admin/commandes',
      order: (id: string) => ({
        show: () => `/admin/commandes/${id}`,
      }),
    }),
  }),
  shop: () => ({
    index: () => '/boutique',
    customize: (slug: string) => `/personnaliser/${slug}`,
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
    confirm: (orderIdToWatch: string) =>
      '/panier/confirmation?orderId=' + orderIdToWatch,
  }),
  index: () => '/',
});