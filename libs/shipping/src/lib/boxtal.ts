import { CarrierOffer, PickupPoint } from './interface-contracts';
import axios, { type Axios } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { BoxtalCarrier, SupportedCountry, defaultParamsByCountry, formattedOffersWhitelist } from './constants';
import { getOffersResponseSchema, getOrderResponseSchema, pickupPointsResponseSchema } from './dto';

export type { BoxtalCarrier };

export class BoxtalClient {
  private client: Axios;

  constructor(
    baseUrl: string,
    user: string,
    secret: string,
    private options: {
      ENABLE_VAT_PASS_THROUGH: boolean;
      ROUDOUDOU_API_BASE_URL: string;
      SENDER_LASTNAME: string;
      SENDER_FIRSTNAME: string;
      SENDER_ADDRESS: string;
      SENDER_PHONE: string;
      SENDER_EMAIL: string;
      SENDER_ZIPCODE: string;
      SENDER_CITY: string;
      SENDER_COUNTRY: string;
    }
  ) {
    this.client = axios.create({
      baseURL: baseUrl,
      auth: {
        username: user,
        password: secret,
      },
      responseType: 'document',
    });
  }

  /**
   * List pickup points available in a country for a given carrier
   */
  async listPickUpPoints(params: {
    carrierId: BoxtalCarrier;
    country: SupportedCountry;
    zipCode: string;
  }): Promise<PickupPoint[]> {
    const res = await this.client.get<string>(params.carrierId + '/listpoints', {
      params: {
        pays: params.country,
        cp: params.zipCode,
      },
    });

    const parser = new XMLParser();
    const data = parser.parse(res.data);
    const parsed = pickupPointsResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('Failed to parse response from boxtal when listing pickup points');
      console.debug(data);
      throw parsed.error;
    }
    return parsed.data.points;
  }

  /**
   * List available offers for a given shipment depending on the destination
   */
  async getOffers(params: { country: keyof typeof defaultParamsByCountry; weight: number }): Promise<CarrierOffer[]> {
    const boxtalParams = {
      'colis_0.poids': params.weight / 1000,
      code_contenu: 40110,
      'destinataire.type': 'particulier',
      'destinataire.pays': params.country,
      ...defaultParamsByCountry[params.country],
      ...formattedOffersWhitelist,
    };
    return await this.getAndParseOffers(boxtalParams);
  }

  async getPrice(params: {
    carrierId: BoxtalCarrier;
    offerId: string;
    weight: number;
    country: keyof typeof defaultParamsByCountry;
  }): Promise<CarrierOffer> {
    const boxtalParams = {
      'colis_0.poids': params.weight / 1000,
      code_contenu: 40110,
      'destinataire.type': 'particulier',
      'destinataire.pays': params.country,
      ...defaultParamsByCountry[params.country],
      'offers[0]': `${params.carrierId}${params.offerId}`,
    };
    const offers = await this.getAndParseOffers(boxtalParams);
    if (offers.length < 1) throw 'Could not find offer from the given parameters';
    if (offers.length > 1) console.warn('Found multiple offers');
    return offers[0];
  }

  private async getAndParseOffers(params: Record<string, string | number>) {
    const xmlRes = await this.client.get<string>('/cotation', {
      params,
    });

    const parser = new XMLParser();
    const data = parser.parse(xmlRes.data);

    const parsed = getOffersResponseSchema(this.options.ENABLE_VAT_PASS_THROUGH).safeParse(data);

    if (!parsed.success) {
      console.error('Failed to parse response from boxtal');
      console.debug(data);
      throw parsed.error;
    }

    return parsed.data.offers;
  }

  async buyShippingLabel(params: {
    carrierId: BoxtalCarrier;
    offerId: string;
    weight: number;
    sendAt: string; // YYYY-MM-DD
    sendToPickupPoint?: string;
    recipient: {
      firstname: string;
      lastname: string;
      address: string;
      address2?: string;
      zipCode: string;
      city: string;
      country: SupportedCountry;
      phone: string;
      email: string;
    };
    order: {
      reference: string;
      totalTaxIncluded: number;
    };
  }) {
    const boxtalParams: Record<string, string> = {
      raison: 'sale',
      service: params.offerId,
      collecte: params.sendAt,
      operator: params.carrierId,
      url_push: new URL(
        '/boxtal-webhook?reference=' + params.order.reference,
        this.options.ROUDOUDOU_API_BASE_URL
      ).toString(),
      code_contenu: '40110',
      'colis.valeur': params.order.totalTaxIncluded.toString(),
      'colis_0.poids': (params.weight / 1000).toString(),
      'colis_0.longueur': '30',
      'colis_0.largeur': '40',
      'colis_0.hauteur': '50',
      'expediteur.type': 'entreprise',
      'expediteur.nom': this.options.SENDER_LASTNAME,
      'expediteur.prenom': this.options.SENDER_FIRSTNAME,
      'expediteur.adresse': this.options.SENDER_ADDRESS,
      'expediteur.code_postal': this.options.SENDER_ZIPCODE,
      'expediteur.ville': this.options.SENDER_CITY,
      'expediteur.pays': this.options.SENDER_COUNTRY,
      'expediteur.societe': 'Petit Roudoudou',
      'expediteur.tel': this.options.SENDER_PHONE,
      'expediteur.email': this.options.SENDER_EMAIL,
      'destinataire.type': 'particulier',
      'destinataire.prenom': params.recipient.firstname,
      'destinataire.nom': params.recipient.lastname,
      'destinataire.adresse': [params.recipient.address, params.recipient.address2].filter(Boolean).join(', '),
      'destinataire.code_postal': params.recipient.zipCode,
      'destinataire.ville': params.recipient.city,
      'destinataire.pays': params.recipient.country,
      'destinataire.tel': params.recipient.phone,
      'destinataire.email': params.recipient.email,
      'colis.description': 'Commande de Petit Roudoudou, articles textiles pour bébé',
      reference_externe: params.order.reference,
    };

    if (params.sendToPickupPoint) {
      boxtalParams['retrait.pointrelais'] = params.sendToPickupPoint;
    }

    const xmlRes = await this.client.post<string>('/order', new URLSearchParams(boxtalParams));

    const parser = new XMLParser();
    const data = parser.parse(xmlRes.data);

    const parsed = getOrderResponseSchema(this.options.ENABLE_VAT_PASS_THROUGH).safeParse(data);

    if (!parsed.success) {
      console.error('Failed to parse response from boxtal');
      console.debug(data);
      throw parsed.error;
    }

    return parsed.data.shipment;
  }
}
