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
    fabricGroups: () => ({
      index: () => '/admin/groupes-de-tissus',
    }),
    orders: () => ({
      index: () => '/admin/commandes',
      print: (ids: string[]) => `/admin/commandes/imprimer?${ids.map((id) => 'id=' + id).join(',')}`,
      order: (id: string) => ({
        show: () => `/admin/commandes/${id}`,
      }),
    }),
    promotionCodes: () => ({
      index: () => '/admin/codes-promotionnels',
      new: () => '/admin/codes-promotionnels/nouveau',
      promotionCode: (id: string) => ({
        edit: () => `/admin/codes-promotionnels/${id}/modifier`,
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
    index: (queryOptions?: { customizableOnly?: boolean }) =>
      '/boutique' + (queryOptions?.customizableOnly ? '?customizableOnly=true' : ''),
    customize: (slug: string) => `/personnaliser/${slug}`,
    article: (articleSlug: string) => ({
      index: () => `/boutique/${articleSlug}`,
      showInStock: (inStockSlug: string) => `/boutique/${articleSlug}/${inStockSlug}`,
    }),
  }),
  fabrics: () => ({
    index: () => '/tissus',
  }),
  auth: () => ({
    login: (redirectTo?: string) => '/connexion' + (redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''),
    register: (redirectTo?: string) =>
      '/inscription' + (redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''),
  }),
  events: () => ({
    index: () => '/evenements',
  }),
  partners: () => ({
    index: () => '/partenaires',
  }),
  cart: () => ({
    index: () => '/panier',
    finalize: () => '/panier/recapitulatif',
    confirm: (orderIdToWatch: string) => '/panier/confirmation?orderId=' + orderIdToWatch,
  }),
  contactUs: () => '/nous-contacter',
  index: () => '/',
});
