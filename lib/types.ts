export type ArtworkStatus = "available" | "reserved" | "sold";
export type OrderStatus = "created" | "paid" | "shipped" | "cancelled";

export interface Artwork {
  id: string;
  title: string;
  description: string | null;
  medium: string | null;
  dimensions: string | null;
  price_inr: number;
  image_path: string | null;
  status: ArtworkStatus;
  reserved_by: string | null;
  reserved_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  kind: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  artwork_id: string;
  amount_inr: number;
  status: OrderStatus;
  shipping_address_id: string | null;
  billing_address_id: string | null;
  shipping_snapshot: string | null;
  billing_snapshot: string | null;
  razorpay_payment_link_id: string | null;
  razorpay_payment_id: string | null;
  utr: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
}

export const STATUS_LABEL: Record<ArtworkStatus, string> = {
  available: "Available",
  reserved: "Pending Verification",
  sold: "Sold",
};
