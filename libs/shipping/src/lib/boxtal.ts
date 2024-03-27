import { BoxtalClientContract, BoxtalCarriers, GetPricesParams } from './interface-contracts';
import axios, { type Axios } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

export class BoxtalClient implements BoxtalClientContract {
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
    console.log(data);

    const quotation = quotationSchema.parse(data);
    const offer = quotation.cotation.shipment.offer;

    return {
      taxInclusive: offer.price['tax-inclusive'],
      taxExclusive:
        this.options?.ENABLE_VAT_PASS_THROUGH !== false ? offer.price['tax-exclusive'] : offer.price['tax-inclusive'],
    };
  }
}

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
