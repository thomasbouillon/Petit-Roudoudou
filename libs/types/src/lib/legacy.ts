export type LegacyPaidOrder = {
  id: number;
  user_id: number;
  total: number;
  state: 'pending' | 'unfinished' | 'done' | 'waiting_payment';
  completed: string;
  base: number;
  payment_session: string | null;
  shipping_method: string | null;
  shipping_first_name: string | null;
  shipping_cost: number | null;
  shipping_address: string | null;
  shipping_last_name: string | null;
  shipping_phone_number: string | null;
  shipping_point: string | null; // Mondial Relay ID
  sent_at: string | null;
  shipping_code: string | null; // suivi
  shipping_city: string | null;
  shipping_zip_code: string | null;
  ref: number | null;
  hidden: boolean;
  annotation: string | null;
  submitted_at: string | null;
  last_review_email_sent_at: string | null;
  shipping_address_complement: string | null;
  is_validated: boolean;
  is_prioritary: boolean;
  shipping_country: string | null;
  is_accelerated: boolean;
  review_id: number | null;
};

export type LegacyCart = Omit<LegacyPaidOrder, 'completed' | 'submitted_at'> & { completed: null; submitted_at: null };

export type LegacyOrder = LegacyCart | LegacyPaidOrder;
