import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL غير مضبوط. أضفه إلى ملف .env");
}

export const sql = neon(databaseUrl);

export type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
};

export type Product = {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_active: boolean;
};

export type Order = {
  id: number;
  user_id: number;
  product_name: string;
  player_id: string | null;
  quantity: number;
  subtotal: string;
  discount: string;
  total: string;
  coupon_code: string | null;
  payment_method: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  phone?: string;
};

export type Topup = {
  id: number;
  user_id: number;
  amount: string;
  receipt_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  phone?: string;
};

export type Coupon = {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  min_order: string;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

export async function getOrCreateUser(phone: string, name?: string) {
  const existing = await sql`SELECT * FROM users WHERE phone = ${phone} LIMIT 1`;
  if (existing.length > 0) return existing[0] as { id: number; phone: string; name: string | null };

  const created = await sql`
    INSERT INTO users (phone, name) VALUES (${phone}, ${name ?? null})
    RETURNING *
  `;
  const user = created[0] as { id: number; phone: string; name: string | null };
  await sql`INSERT INTO wallets (user_id, balance) VALUES (${user.id}, 0)
            ON CONFLICT (user_id) DO NOTHING`;
  return user;
}

export async function getWallet(userId: number) {
  const rows = await sql`SELECT * FROM wallets WHERE user_id = ${userId} LIMIT 1`;
  return rows[0] as { id: number; user_id: number; balance: string } | undefined;
}

export async function adjustWallet(
  userId: number,
  amount: number,
  type: string,
  reference?: string
) {
  const wallet = await getWallet(userId);
  if (!wallet) throw new Error("المحفظة غير موجودة");
  const updated = await sql`
    UPDATE wallets
    SET balance = balance + ${amount}, updated_at = now()
    WHERE user_id = ${userId}
    RETURNING *
  `;
  await sql`
    INSERT INTO wallet_transactions (wallet_id, amount, type, reference)
    VALUES (${wallet.id}, ${amount}, ${type}, ${reference ?? null})
  `;
  return updated[0] as { id: number; balance: string };
}
