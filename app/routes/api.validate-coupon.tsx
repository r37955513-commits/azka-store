import { data } from "react-router";
import type { Route } from "./+types/api.validate-coupon";
import { validateCoupon } from "~/lib/coupons.server";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const code = String(form.get("code") || "").trim();
  const subtotal = Number(form.get("subtotal") || 0);

  if (!code) return data({ ok: false, error: "أدخل كود الكوبون" });

  const result = await validateCoupon(code, subtotal);
  if (!result.ok) return data({ ok: false, error: result.error });

  return data({
    ok: true,
    discount: result.discount,
    code: result.coupon.code,
    type: result.coupon.discount_type,
    value: result.coupon.discount_value,
  });
}
