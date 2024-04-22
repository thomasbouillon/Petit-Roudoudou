/** Mondial Relay | La poste */
export type BoxtalCarrier = 'MONR' | 'POFR';

export type SupportedCountry = keyof typeof defaultParamsByCountry;

export const knownCarriersWithServices = [
  {
    carrier: 'POFR' satisfies BoxtalCarrier,
    services: [
      {
        code: 'ColissimoAccess',
        kind: 'deliver-at-home' as const,
      },
    ],
  },
  {
    carrier: 'MONR' satisfies BoxtalCarrier,
    services: [
      {
        code: 'CpourToi',
        kind: 'deliver-at-pickup-point' as const,
      },
      {
        code: 'CpourToiEurope',
        kind: 'deliver-at-pickup-point' as const,
      },
      {
        code: 'DomicileEurope',
        kind: 'deliver-at-home' as const,
      },
    ],
  },
];

// { offers[0]={CARRIERID}{SERVICEID}, ...}
export const formattedOffersWhitelist = knownCarriersWithServices
  .reduce(
    (acc, offer) => acc.concat(...offer.services.map((service) => `${offer.carrier}${service.code}`)),
    [] as string[]
  )
  .reduce((acc, formattedOfferId, i) => ({ ...acc, [`offers[${i}]`]: formattedOfferId }), {} as Record<string, string>);

const defaultShipmentParams = {
  'colis_0.longueur': 40,
  'colis_0.largeur': 50,
  'colis_0.hauteur': 30,
};

const defaultSenderParams = {
  'expediteur.pays': 'FR',
  'expediteur.code_postal': '54000',
  'expediteur.type': 'entreprise',
  'expediteur.ville': 'Nancy',
};

export const defaultParamsByCountry = {
  FR: {
    'destinataire.code_postal': '54000',
    'destinataire.ville': 'Nancy',
    ...defaultShipmentParams,
    ...defaultSenderParams,
  },
  BE: {
    'destinataire.code_postal': '1000',
    'destinataire.ville': 'Bruxelles',
    ...defaultShipmentParams,
    ...defaultSenderParams,
  },
  CH: {
    'destinataire.code_postal': '1201',
    'destinataire.ville': 'Genève',
    ...defaultShipmentParams,
    ...defaultSenderParams,
  },
};
