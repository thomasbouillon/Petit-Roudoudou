import { BoxtalClientContract, BoxtalCarriers, PickupPoint, GetPricesParams } from './interface-contracts';
import axios, { type Axios } from 'axios';
import { XMLParser } from 'fast-xml-parser';

export class BoxtalClient implements BoxtalClientContract {
  private client: Axios;

  constructor(baseUrl: string, user: string, secret: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      auth: {
        username: user,
        password: secret,
      },
      responseType: 'document',
    });
  }

  async listPickUpPoints(zipCode: string) {
    const res = await this.client.get<string>(BoxtalCarriers.MONDIAL_RELAY + '/listpoints', {
      params: {
        pays: 'FR',
        cp: zipCode,
      },
    });
    const parser = new XMLParser();
    const data = parser.parse(res.data) as { points: { point: unknown } };
    if (!arePoints(data.points.point)) {
      throw new Error('Invalid response from Boxtal');
    }
    return data.points.point;
  }

  async getPrice(params: GetPricesParams) {
    const boxtalParams = {
      'colis_0.poids': params.weight / 1000,
      'colis_0.longueur': 40,
      'colis_0.largeur': 50,
      'colis_0.hauteur': 30,
      code_contenu: 40110,
      'expediteur.pays': 'FR',
      'expediteur.code_postal': '54000',
      'expediteur.type': 'entreprise',
      'expediteur.ville': 'Nancy',
      'destinataire.type': 'particulier',
      'destinataire.pays': 'FR',
      'destinataire.code_postal': '54000',
      'destinataire.ville': 'Nancy',
      operator: params.carrier,
      service: params.carrier === BoxtalCarriers.COLISSIMO ? 'ColissimoAccess' : 'CpourToi',
    };

    const xmlRes = await this.client.get<any>('/cotation', {
      params: boxtalParams,
    });

    const parser = new XMLParser();
    const data = parser.parse(xmlRes.data) as {
      cotation: { shipment: unknown };
    };

    const price = extractPrice(data?.cotation?.shipment);

    return {
      taxInclusive: price.price['tax-inclusive'],
      taxExclusive: price.price['tax-exclusive'],
    };
  }
}

const extractPrice = (shipment: unknown) => {
  if (!isShipmentOffer(shipment)) {
    throw new Error('Invalid response from Boxtal');
  }
  return Array.isArray(shipment.offer) ? shipment.offer[0] : shipment.offer;
};

function arePoints(points: unknown): points is PickupPoint[] {
  if (!Array.isArray(points)) return false;
  return points.every((point) => {
    if (
      typeof point !== 'object' ||
      typeof point.code !== 'string' ||
      typeof point.name !== 'string' ||
      typeof point.address !== 'string' ||
      typeof point.city !== 'string' ||
      typeof point.zipcode !== 'number' ||
      typeof point.country !== 'string' ||
      typeof point.latitude !== 'number' ||
      typeof point.longitude !== 'number' // ||
      // typeof point.phone !== 'string' ||
      // typeof point.description !== 'string'
    ) {
      return false;
    }
    return true;
  });
}

type ShipmentOffer = {
  price: { 'tax-exclusive': number; 'tax-inclusive': number };
};
function isShipmentOffer(shipment: unknown): shipment is {
  offer: ShipmentOffer | ShipmentOffer[];
} {
  type UnknownShipment = Record<string, unknown>;
  type UnknownOffer = Record<string, unknown>;
  type UnknownOfferWithPrice = {
    price: Record<string, unknown>;
  };
  if (typeof shipment !== 'object') return false;
  let offers = (shipment as UnknownShipment)['offer'];
  if (typeof offers !== 'object') return false;
  if (!Array.isArray(offers)) offers = [offers];
  if (
    !(offers as UnknownOffer[]).every((offer) => {
      if (typeof offer !== 'object') return false;
      if (typeof (offer as UnknownOffer)['price'] !== 'object') return false;
      if (typeof (offer as UnknownOfferWithPrice).price['tax-exclusive'] !== 'number') return false;
      if (typeof (offer as UnknownOfferWithPrice).price['tax-inclusive'] !== 'number') return false;

      return true;
    })
  ) {
    return false;
  }
  return true;
}
