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

/**
 * SET shipping_method = collectAtWorkshop FOR:
 * 
SELECT pc.code, pc.strategy_id, opc.amount, o.* 
FROM `order` o 
LEFT JOIN order_promotion_code opc ON o.id = opc.user_order_id
LEFT JOIN promotion_code pc ON pc.id = opc.promotion_code_id
WHERE o.hidden = 0 AND o.submitted_at IS NOT NULL AND shipping_method IS NULL;
 */

/**
 * GENERATE EXPORT:
 *
SELECT 
pc.code, pc.strategy_id, opc.amount, 
oc.image oc_image, oc.id oc_id, oc.total*100 oc_total, COALESCE(a.weight, COALESCE(oq.weight, 0))*oc.quantity oc_total_weight, COALESCE(q.title, COALESCE(v.label, 'Carte cadeau')) oc_description, IF(oc.article_id IS NOT NULL, 'customized', IF(oc.order_quickbuy_id IS NOT NULL, 'inStock', 'giftCard')) oc_type, oc.quantity oc_quantity, 
u.firstname u_firstname, u.lastname u_lastname, u.email u_email, u.usr_address u_address, u.country u_country, u.usr_address_complement u_address_complement, u.city u_city, u.zip_code u_zip_code,
o.*,
REPLACE(oc.comment, ';', ',') oc_user_comment
FROM `order` o 
LEFT JOIN order_promotion_code opc ON o.id = opc.user_order_id
LEFT JOIN promotion_code pc ON pc.id = opc.promotion_code_id
LEFT JOIN order_content oc on oc.user_order_id = o.id 
LEFT JOIN order_quickbuy oq on oq.id = oc.order_quickbuy_id 
LEFT JOIN quick_buy q on oq.quickbuy_id = q.id 
LEFT JOIN article a on a.id = oc.article_id
LEFT JOIN cost c on c.id = a.variant_cost_id
LEFT JOIN variant v on c.variant_id = v.id
LEFT JOIN user u on o.user_id = u.id
WHERE o.hidden = 0 AND o.submitted_at IS NOT NULL
ORDER BY o.id
 */
