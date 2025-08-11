export type SubscriptionTier = "Free" | "Basic" | "Pro";

export interface GumroadWebhookEvent {
  seller_id: string;
  product_id: string;
  product_name: string;
  permalink: string;
  product_permalink: string;
  short_product_id: string;
  email: string;
  price: string;
  gumroad_fee: string;
  currency: string;
  quantity: string;
  discover_fee_charged: string;
  can_contact: string;
  referrer: string;
  "card[visual]": string;
  "card[type]": string;
  "card[bin]": string;
  "card[expiry_month]": string;
  "card[expiry_year]": string;
  order_number: string;
  sale_id: string;
  sale_timestamp: string;
  purchaser_id: string;
  subscription_id: string;
  "variants[Tier]": string;
  test: string;
  ip_country: string;
  recurrence: string;
  is_gift_receiver_purchase: string;
  refunded: string;
  disputed: string;
  dispute_won: string;
}
