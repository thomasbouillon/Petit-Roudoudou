import { CarrierOffer, PickupPoint } from './interface-contracts';
import axios, { type Axios } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { BoxtalCarrier, SupportedCountry, defaultParamsByCountry, formattedOffersWhitelist } from './constants';
import { getOffersResponseSchema, pickupPointsResponseSchema } from './dto';

export type { BoxtalCarrier };

export class BoxtalClient {
  private client: Axios;

  constructor(
    baseUrl: string,
    user: string,
    secret: string,
    private options: {
      ENABLE_VAT_PASS_THROUGH: boolean;
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
}
