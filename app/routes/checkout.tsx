import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  data,
  redirect,
} from "react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Tag, Wallet, HandCoins, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Route } from "./+types/checkout";
import {
  sql,
  getOrCreateUser,
  getWallet,
  adjustWallet,
  type Product,
} from "~/lib/db.server";
import { validateCoupon, incrementCouponUsage } from "~/lib/coupons.server";
import { notifyAdmin, newOrderMessage } from "~/lib/whatsapp.server";
import { Navbar } from "~/components/Navbar";

export async function loader({ params }: Route.LoaderArgs) {
  const rows = (await sql`
    SELECT * FROM products WHERE id = ${Number(params.productId)} AND is_active = TRUE
  `) as Product[];
  if (rows.length === 0) throw new Response("المنتج غير موجود", { status: 404 });
  return { product: rows[0] };
}

export async function action({ request, params }: Route.ActionArgs) {
  const form = await request.formData();
  const phone = String(form.get("phone") || "").trim();
  const playerId = String(form.get("player_id") || "").trim();
  const quantity = Math.max(1, Number(form.get("quantity") || 1));
  const couponCode = String(form.get("coupon") || "").trim();
  const paymentMethod = String(form.get("payment_method") || "wallet");

  if (!/^\+?\d{8,15}$/.test(phone)) {
    return data({ error: "أدخل رقم هاتف صحيح" }, { status: 400 });
  }

  const rows = (await sql`SELECT * FROM products WHERE id = ${Number(params.productId)}`) as Product[];
  const product = rows[0];
  if (!product) return data({ error: "المنتج غير موجود" }, { status: 404 });

  const subtotal = Number(product.price) * quantity;
  let discount = 0;
  let appliedCoupon: string | null = null;

  if (couponCode) {
    const cr = await validateCoupon(couponCode, subtotal);
    if (!cr.ok) return data({ error: cr.error }, { status: 400 });
    discount = cr.discount;
    appliedCoupon = cr.coupon.code;
  }

  const total = Math.round((subtotal - discount) * 100) / 100;
  const user = await getOrCreateUser(phone);

  if (paymentMethod === "wallet") {
    const wallet = await getWallet(user.id);
    if (!wallet || Number(wallet.balance) < total) {
      return data(
        { error: "رصيد المحفظة غير كافٍ. اشحن محفظتك أو اختر الطلب اليدوي." },
        { status: 400 }
      );
    }
  }

  const orderRows = await sql`
    INSERT INTO orders
      (user_id, product_id, product_name, player_id, quantity,
       subtotal, discount, total, coupon_code, payment_method, status)
    VALUES
      (${user.id}, ${product.id}, ${product.name}, ${playerId || null}, ${quantity},
       ${subtotal}, ${discount}, ${total}, ${appliedCoupon}, ${paymentMethod}, 'pending')
    RETURNING id
  `;
  const orderId = orderRows[0].id as number;

  if (paymentMethod === "wallet") {
    await adjustWallet(user.id, -total, "purchase", `order#${orderId}`);
  }
  if (appliedCoupon) await incrementCouponUsage(appliedCoupon);

  await notifyAdmin(
    newOrderMessage({ orderId, product: product.name, total: total.toFixed(2), phone })
  );

  return redirect(`/checkout/${product.id}?success=${orderId}`);
}

export default function Checkout() {
  const { product } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const nav = useNavigation();
  const couponFetcher = useFetcher<{ ok: boolean; discount?: number; error?: string }>();
  const busy = nav.state !== "idle";

  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [method, setMethod] = useState<"wallet" | "manual">("wallet");

  const subtotal = Number(product.price) * quantity;
  const discount = couponFetcher.data?.ok ? couponFetcher.data.discount ?? 0 : 0;
  const total = Math.max(0, subtotal - discount);

  const successId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("success")
      : null;

  useEffect(() => {
    if (result && "error" in result && result.error) toast.error(result.error);
  }, [result]);

  useEffect(() => {
    if (couponFetcher.data?.error) toast.error(couponFetcher.data.error);
    if (couponFetcher.data?.ok) toast.success("تم تطبيق الكوبون!");
  }, [couponFetcher.data]);

  if (successId) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto grid max-w-md place-items-center px-4 py-20 text-center">
          <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
          <h1 className="text-2xl font-extrabold text-slate-800">تم استلام طلبك!</h1>
          <p className="mt-2 text-slate-500">
            رقم الطلب <span className="font-bold text-brand-700">#{successId}</span> — سيتم
            تنفيذه قريباً وستصلك إشعارات بالحالة.
          </p>
          <Link to="/" className="btn-primary mt-6">
            متابعة التسوق <ArrowRight className="h-4 w-4" />
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500">
          <ArrowRight className="h-4 w-4" /> رجوع للمتجر
        </Link>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 p-5">
            <div className="grid h-16 w-16 place-items-center rounded-xl bg-white text-brand-400">
              <Tag className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800">{product.name}</h1>
              <p className="text-brand-700 font-bold">{product.price}$</p>
            </div>
          </div>

          <Form method="post" className="space-y-5 p-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">
                رقم الهاتف
              </label>
              <input name="phone" placeholder="2499xxxxxxxx" className="input" required />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">
                معرّف اللاعب / الحساب (إن وُجد)
              </label>
              <input name="player_id" placeholder="ID اللاعب أو رابط الحساب" className="input" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">الكمية</label>
              <input
                type="number"
                name="quantity"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="input"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">
                كود الخصم
              </label>
              <div className="flex gap-2">
                <input
                  name="coupon"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="WELCOME10"
                  className="input"
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() =>
                    couponFetcher.submit(
                      { code: coupon, subtotal: String(subtotal) },
                      { method: "post", action: "/api/validate-coupon" }
                    )
                  }
                >
                  تطبيق
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                طريقة الدفع
              </label>
              <input type="hidden" name="payment_method" value={method} />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("wallet")}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-bold transition ${
                    method === "wallet"
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <Wallet className="h-5 w-5" /> الدفع من المحفظة
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("manual")}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-bold transition ${
                    method === "manual"
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <HandCoins className="h-5 w-5" /> طلب يدوي
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <Row label="المجموع الفرعي" value={`${subtotal.toFixed(2)}$`} />
              {discount > 0 && (
                <Row label="الخصم" value={`- ${discount.toFixed(2)}$`} accent />
              )}
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-700">الإجمالي</span>
                <span className="text-lg font-extrabold text-brand-700">
                  {total.toFixed(2)}$
                </span>
              </div>
            </div>

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "جارٍ تنفيذ الطلب..." : "تأكيد الطلب"}
            </button>
          </Form>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-slate-500">{label}</span>
      <span className={accent ? "font-bold text-emerald-600" : "font-semibold text-slate-700"}>
        {value}
      </span>
    </div>
  );
}
