import { BoxtalClientContract, BoxtalCarriers, GetPricesParams, BuyShippingParams } from './interface-contracts';
import axios, { type Axios } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

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

    const responseSchema = z.object({
      points: z
        .preprocess(
          (data) => {
            // No pickup points causes an empty string
            if (data === '') return { point: [] };
            return data;
          },
          z.object({
            point: z.array(
              z.object({
                code: z.string(),
                name: z.string(),
                address: z.string(),
                city: z.string(),
                zipcode: z.number(),
                country: z.string(),
                latitude: z.number(),
                longitude: z.number(),
                // phone: z.string(),
                // description: z.string(),
              })
            ),
          })
        )
        .transform((data) => data.point),
    });

    const parser = new XMLParser();
    const data = parser.parse(res.data);
    const pickupPoints = responseSchema.parse(data).points;

    return pickupPoints;
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
    const data = parser.parse(xmlRes.data);

    const quotation = quotationSchema.parse(data);
    const offer = quotation.cotation.shipment.offer;

    return {
      taxInclusive: offer.price['tax-inclusive'],
      taxExclusive: offer.price['tax-exclusive'],
    };
  }

  async buyShipping<T extends BoxtalCarriers>(params: BuyShippingParams<T>) {
    const now = new Date();
    const collectionDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
      .getDate()
      .toString()
      .padStart(2, '0')}`;

    const boxtalPayload = {
      'colis_0.poids': params.weight / 1000,
      'colis_0.longueur': 40,
      'colis_0.largeur': 50,
      'colis_0.hauteur': 30,
      code_contenu: '40110',
      'expediteur.type': 'entreprise',
      'expediteur.nom': 'Auproux',
      'expediteur.prenom': 'Justine',
      'expediteur.societe': 'Petit Roudoudou',
      'expediteur.titre': 'Mme',
      'expediteur.adresse': '3 rue du chemin blanc',
      'expediteur.code_postal': '54000',
      'expediteur.ville': 'Nancy',
      'expediteur.pays': 'FR',
      'expediteur.tel': '0695495077',
      'expediteur.email': 'justine.auproux@petit-roudoudou.fr',
      'destinataire.type': 'particulier',
      'destinataire.nom': params.address.lastName,
      'destinataire.prenom': params.address.firstName,
      'destinataire.adresse':
        params.address.address + (params.address.addressComplement ? ' ' + params.address.addressComplement : ''),
      'destinataire.code_postal': params.address.zipCode,
      'destinataire.ville': params.address.city,
      'destinataire.pays': params.address.country,
      'destinataire.tel': params.user.phone,
      'destinataire.email': params.user.email,
      collecte: collectionDate,
      'colis.description': params.contentDescription,
      operateur: params.carrier,
      service: params.carrier === BoxtalCarriers.COLISSIMO ? 'ColissimoAccess' : 'CpourToi',
      url_push: params.webhookUrl,
      'assurance.selection': 0,
      reference_externe: params.internalReference,
    };

    if (params.carrier === BoxtalCarriers.MONDIAL_RELAY) {
      (boxtalPayload as any)['retrait.pointrelais'] = params.pickupPointCode;
    }

    console.log('Boxtal payload', JSON.stringify(boxtalPayload, null, 2));

    const xmlRes = await this.client.post<string>('/order', undefined, { params: boxtalPayload });
    const parser = new XMLParser();
    const data = parser.parse(xmlRes.data);
    const response = orderShippingResponseSchema.parse(data);

    return {
      boxtalReference: response.order.shipment.reference,
      boxtalComments: response.order.characteristics,
      taxInclusive: response.order.offer.price['tax-inclusive'],
      taxExclusive: response.order.offer.price['tax-exclusive'],
      estimatedDeliveryDate: response.order.delivery.date,
    };
  }
}

const orderShippingResponseSchema = z.object({
  order: z.object({
    shipment: z.object({
      reference: z.string(),
    }),
    offer: z.object({
      price: z.object({
        'tax-exclusive': z.number(),
        'tax-inclusive': z.number(),
      }),
    }),
    delivery: z.object({
      date: z.string().transform((date) => {
        const parsed = new Date(); // YYYY-MM-DD
        parsed.setFullYear(Number(date.substring(0, 4)));
        parsed.setMonth(Number(date.substring(5, 7)) - 1);
        parsed.setDate(Number(date.substring(8, 10)));
        return `${parsed.getDate()}/${parsed.getMonth() + 1}/${parsed.getFullYear()}`;
      }),
    }),
    characteristics: z.preprocess(
      (data) => (data === '' ? [] : data),
      z
        .array(
          z.object({
            label: z.string(),
          })
        )
        .transform((data) => data.map((characteristic) => characteristic.label).join('\n'))
    ),
  }),
});

const quotationSchema = z.object({
  cotation: z.object({
    shipment: z.object({
      offer: z
        .union([
          z.object({
            price: z.object({
              'tax-exclusive': z.number(),
              'tax-inclusive': z.number(),
            }),
          }),
          z.array(
            z.object({
              price: z.object({
                'tax-exclusive': z.number(),
                'tax-inclusive': z.number(),
              }),
            })
          ),
        ])
        .transform((offer) => (Array.isArray(offer) ? offer[0] : offer)),
    }),
  }),
});
