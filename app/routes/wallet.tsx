import { Form, useActionData, useNavigation, data } from "react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Wallet, Upload, Phone, History } from "lucide-react";
import type { Route } from "./+types/wallet";
import { sql, getOrCreateUser, getWallet } from "~/lib/db.server";
import { saveReceipt } from "~/lib/uploads.server";
import { notifyAdmin, newTopupMessage } from "~/lib/whatsapp.server";
import { Navbar } from "~/components/Navbar";
import { fmt } from "~/lib/money";

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  const phone = String(form.get("phone") || "").trim();

  if (!/^\+?\d{8,15}$/.test(phone)) {
    return data({ error: "أدخل رقم هاتف صحيح" }, { status: 400 });
  }
  const user = await getOrCreateUser(phone);

  if (intent === "check") {
    const wallet = await getWallet(user.id);
    const txns = await sql`
      SELECT wt.* FROM wallet_transactions wt
      JOIN wallets w ON w.id = wt.wallet_id
      WHERE w.user_id = ${user.id}
      ORDER BY wt.created_at DESC LIMIT 10
    `;
    return { ok: true, phone, balance: wallet?.balance ?? "0.00", txns };
  }

  if (intent === "topup") {
    const amount = Number(form.get("amount"));
    if (!amount || amount <= 0) {
      return data({ error: "اختر مبلغاً صحيحاً" }, { status: 400 });
    }
    const receipt = form.get("receipt") as File | null;
    let receiptUrl: string | null = null;
    try {
      if (receipt) receiptUrl = await saveReceipt(receipt);
    } catch (e) {
      return data({ error: (e as Error).message }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO topups (user_id, amount, receipt_url, status)
      VALUES (${user.id}, ${amount}, ${receiptUrl}, 'pending')
      RETURNING id
    `;
    await notifyAdmin(
      newTopupMessage({ topupId: rows[0].id, amount: amount.toFixed(2), phone })
    );
    return { ok: true, topupRequested: true, phone };
  }

  return data({ error: "طلب غير معروف" }, { status: 400 });
}

export default function WalletPage() {
  const result = useActionData<typeof action>();
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  const [amount, setAmount] = useState<number>(10000);

  useEffect(() => {
    if (result && "error" in result && result.error) toast.error(result.error);
    if (result && "topupRequested" in result && result.topupRequested) {
      toast.success("تم إرسال طلب الشحن! سيراجعه الأدمن قريباً.");
    }
  }, [result]);

  const balance =
    result && "balance" in result ? (result.balance as string) : null;
  const txns = result && "txns" in result ? (result.txns as any[]) : [];

  return (
    <div className="min-h-screen">
      <Navbar balance={balance} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-slate-800">
          <Wallet className="h-6 w-6 text-brand-600" /> محفظتي
        </h1>

        <div className="card mb-6 bg-gradient-to-l from-brand-700 to-brand-500 p-6 text-white">
          <p className="text-sm text-brand-50">الرصيد الحالي</p>
          <p className="mt-1 text-4xl font-extrabold">
            {balance != null ? fmt(balance) : "—"}
          </p>
          <Form method="post" className="mt-4 flex gap-2">
            <input type="hidden" name="intent" value="check" />
            <div className="relative flex-1">
              <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <input
                name="phone"
                placeholder="رقم هاتفك"
                className="input bg-white/10 pr-9 text-white placeholder:text-white/60"
                required
              />
            </div>
            <button className="btn bg-white text-brand-700" disabled={busy}>
              عرض الرصيد
            </button>
          </Form>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
            <Upload className="h-5 w-5 text-brand-600" /> طلب شحن رصيد
          </h2>
          <Form method="post" encType="multipart/form-data" className="space-y-4">
            <input type="hidden" name="intent" value="topup" />
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">
                رقم الهاتف
              </label>
              <input name="phone" placeholder="مثال: 2499xxxxxxxx" className="input" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                المبلغ
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setAmount(a)}
                    className={`rounded-xl border px-4 py-2 font-bold transition ${
                      amount === a
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-200 text-slate-600 hover:border-brand-300"
                    }`}
                  >
                    {fmt(a)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                name="amount"
                min={1}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="input mt-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">
                صورة إشعار التحويل
              </label>
              <input
                type="file"
                name="receipt"
                accept="image/*"
                className="input file:ml-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700"
                required
              />
            </div>

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "جارٍ الإرسال..." : "إرسال طلب الشحن"}
            </button>
          </Form>
        </div>

        {txns.length > 0 && (
          <div className="card mt-6 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
              <History className="h-5 w-5 text-brand-600" /> آخر الحركات
            </h2>
            <ul className="divide-y divide-slate-100">
              {txns.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-500">{t.type}</span>
                  <span
                    className={
                      Number(t.amount) >= 0
                        ? "font-bold text-emerald-600"
                        : "font-bold text-rose-600"
                    }
                  >
                    {Number(t.amount) >= 0 ? "+" : ""}
                    {fmt(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
