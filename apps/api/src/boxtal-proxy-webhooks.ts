import { Request, Response } from 'express';

export default async function (req: Request, res: Response) {
  console.log('Received webhook from Boxtal');
  console.debug(JSON.stringify(req.query, null, 2));
  res.status(200).send('OK');
}
