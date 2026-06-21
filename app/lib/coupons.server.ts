import { sql, type Coupon } from "./db.server";
import { fmt } from "./money";

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string };

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponResult> {
  const rows = await sql`SELECT * FROM coupons WHERE UPPER(code) = UPPER(${code}) LIMIT 1`;
  const coupon = rows[0] as Coupon | undefined;

  if (!coupon) return { ok: false, error: "الكوبون غير موجود" };
  if (!coupon.is_active) return { ok: false, error: "الكوبون غير مفعّل" };

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { ok: false, error: "انتهت صلاحية الكوبون" };
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { ok: false, error: "تم استنفاد عدد مرات استخدام الكوبون" };
  }
  if (subtotal < Number(coupon.min_order)) {
    return {
      ok: false,
      error: `الحد الأدنى للطلب لتطبيق هذا الكوبون هو ${fmt(coupon.min_order)}`,
    };
  }

  let discount =
    coupon.discount_type === "percent"
      ? (subtotal * Number(coupon.discount_value)) / 100
      : Number(coupon.discount_value);

  discount = Math.min(discount, subtotal);
  discount = Math.round(discount * 100) / 100;

  return { ok: true, coupon, discount };
}

export async function incrementCouponUsage(code: string) {
  await sql`UPDATE coupons SET used_count = used_count + 1
            WHERE UPPER(code) = UPPER(${code})`;
}
