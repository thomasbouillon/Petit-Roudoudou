import { BoxtalClientContract, BoxtalCarriers, PickupPoint } from './interface-contracts';
import axios, { type Axios } from 'axios';
import { XMLParser } from 'fast-xml-parser';

export class BoxtalClient implements BoxtalClientContract {
  private client: Axios;

  constructor(baseUrl: string, user: string, secret: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      auth: {
        username: user,
        password: secret
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
}

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