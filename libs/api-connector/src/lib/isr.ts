import axios from 'axios';
import { Context } from './context';

type ISREvent =
  | {
      resource: 'articles';
      event: 'update' | 'create' | 'delete';
      article: {
        id: string;
        slug: string;
      };
    }
  | {
      resource: 'fabrics';
      event: 'update' | 'create' | 'delete';
      fabric: {
        id: string;
      };
    }
  | {
      resource: 'fabricGroups';
      event: 'update' | 'create' | 'delete';
    }
  | {
      resource: 'articleGroups';
      event: 'update' | 'create' | 'delete';
      articleGroup: {
        id: string;
        slug: string;
      };
    }
  | {
      resource: 'articleThemes';
      event: 'update' | 'create' | 'delete';
      articleTheme: {
        id: string;
        slug: string;
      };
    };

export async function triggerISR(context: Context, event: ISREvent): Promise<void> {
  try {
    return await axios.post(context.environment.ISR_URL, event, {
      headers: {
        'X-ISR-TOKEN': context.environment.ISR_SECRET,
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    console.warn('ISR failed, skipping. Error:', e);
  }
}
