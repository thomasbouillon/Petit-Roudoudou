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
      print: (ids: string[]) =>
        `/admin/commandes/imprimer?${ids.map((id) => 'id=' + id).join(',')}`,
      order: (id: string) => ({
        show: () => `/admin/commandes/${id}`,
      }),
    }),
  }),
  account: () => ({
    index: () => '/mon-compte',
    orders: () => ({
      index: () => '/mon-compte/commandes',
      order: (id: string) => `/mon-compte/commandes/${id}`,
    }),
  }),
  shop: () => ({
    index: () => '/boutique',
    customize: (slug: string) => `/personnaliser/${slug}`,
    show: (stockIndex: number, slug: string) =>
      `/boutique/${stockIndex}/${slug}`,
  }),
  fabrics: () => ({
    index: () => '/tissus',
  }),
  auth: () => ({
    login: (redirectTo?: string) =>
      '/connexion' +
      (redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''),
    register: (redirectTo?: string) =>
      '/inscription' +
      (redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''),
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
