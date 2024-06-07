export const routes = () => ({
  admin: () => ({
    index: () => '/admin',
    accounting: () => ({
      index: () => '/admin/comptabilite',
    }),
    products: () => ({
      index: () => '/admin/creations',
      new: () => '/admin/creations/nouveau',
      product: (id: string) => ({
        edit: () => `/admin/creations/${id}/modifier`,
      }),
    }),
    articleThemes: () => ({
      index: () => '/admin/themes',
      articleTheme: (id: string) => ({
        edit: () => `/admin/themes/${id}/modifier`,
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
    pipings: () => ({
      index: () => '/admin/passepoils',
      new: () => '/admin/passepoils/nouveau',
      piping: (id: string) => ({
        edit: () => `/admin/passepoils/${id}/modifier`,
      }),
    }),
    embroideryColors: () => ({
      index: () => '/admin/fils-pour-broderies',
      new: () => '/admin/fils-pour-broderies/nouveau',
      embroideryColor: (id: string) => ({
        edit: () => `/admin/fils-pour-broderies/${id}/modifier`,
      }),
    }),
    promotionCodes: () => ({
      index: () => '/admin/codes-promotionnels',
      new: () => '/admin/codes-promotionnels/nouveau',
      promotionCode: (id: string) => ({
        edit: () => `/admin/codes-promotionnels/${id}/modifier`,
      }),
    }),
    trackingLinks: () => ({
      index: () => '/admin/liens-de-tracking',
      new: () => '/admin/liens-de-tracking/nouveau',
      trackingLink: (id: string) => ({
        edit: () => `/admin/liens-de-tracking/${id}/modifier`,
      }),
    }),
    users: () => ({
      index: () => '/admin/fichiers-clients',
      user: (id: string) => ({
        show: () => `/admin/fichiers-clients/${id}`,
      }),
    }),
  }),
  account: () => ({
    index: () => '/mon-compte',
    orders: () => ({
      index: () => '/mon-compte/commandes',
      order: (id: string) => ({
        show: () => `/mon-compte/commandes/${id}`,
        review: () => `/mon-compte/commandes/${id}/avis`,
      }),
    }),
  }),
  blog: () => ({
    index: () => '/blog',
    post: (slug: string, id: string) => `/blog/${slug}-${id}`,
  }),
  shop: () => ({
    index: () => '/boutique',
    theme: (slug: string) => ({
      index: () => `/boutique/s/t/${slug}`,
    }),
    listCustomizableArticles: () => '/personnaliser',
    customize: (slug: string) => `/personnaliser/${slug}`,
    createGiftCard: () => '/personnaliser/carte-cadeau',
    article: (articleSlug: string) => ({
      index: () => `/boutique/s/a/${articleSlug}`,
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
    resetPassword: (email?: string) => '/mot-de-passe-oublie' + (email ? `?email=${encodeURIComponent(email)}` : ''),
    changePasswordWithToken: (token: string) => `/changer-mon-mot-de-passe/${token}`,
  }),
  events: () => ({
    index: () => '/evenements',
  }),
  partners: () => ({
    index: () => '/partenaires',
  }),
  faq: () => ({
    index: () => '/foire-aux-questions',
  }),
  cart: () => ({
    index: () => '/panier',
    finalize: () => '/panier/recapitulatif',
    confirm: (orderReferenceToWatch: number) => '/panier/confirmation?orderReference=' + orderReferenceToWatch,
  }),
  contactUs: () => '/nous-contacter',
  index: () => '/',
  legal: () => ({
    cgu: () => '/cgu',
    cgv: () => '/cgv',
    noticies: () => '/mentions-legales',
  }),
});
