import axios from 'axios';
import env from './env';

type Events = {
  orderPaid: Record<string, never>;
  orderSubmitted: Record<string, never>;
  orderDelivered: { REVIEW_HREF: string };
  orderReviewed: Record<string, never>;
  cartUpdated: Record<string, never>;
};

export function getClient() {
  const client = axios.create({
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ma-key': env.CRM_CLIENT_SECRET,
    },
  });

  return {
    async sendEvent<T extends keyof Events>(event: T, email: string, data: Events[T]) {
      if (env.CRM_SANDBOX)
        return console.debug('Skipping CRM event', event, 'to', email, 'because CRM_SANDBOX is enabled');

      console.debug('Sending event', event, 'to CRM');
      await client.post('https://in-automate.sendinblue.com/api/v2/trackEvent', {
        event,
        email,
        eventdata: data,
      });
    },
  };
}
