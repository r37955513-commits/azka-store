import { Form, useActionData, useLoaderData, data } from "react-router";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Ticket, Plus, Power, Trash2 } from "lucide-react";
import type { Route } from "./+types/admin.coupons";
import { requireAdmin } from "~/lib/session.server";
import { sql, type Coupon } from "~/lib/db.server";
import { fmt } from "~/lib/money";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const coupons = (await sql`SELECT * FROM coupons ORDER BY created_at DESC`) as Coupon[];
  return { coupons };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "create") {
    const code = String(form.get("code") || "").trim().toUpperCase();
    const type = String(form.get("discount_type"));
    const value = Number(form.get("discount_value"));
    const minOrder = Number(form.get("min_order") || 0);
    const maxUses = form.get("max_uses") ? Number(form.get("max_uses")) : null;
    const expires = form.get("expires_at") ? String(form.get("expires_at")) : null;

    if (!code || !value) return data({ error: "أكمل بيانات الكوبون" }, { status: 400 });
    try {
      await sql`
        INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, expires_at)
        VALUES (${code}, ${type}, ${value}, ${minOrder}, ${maxUses}, ${expires})
      `;
    } catch {
      return data({ error: "الكود مستخدم مسبقاً" }, { status: 400 });
    }
    return { ok: true, created: true };
  }

  if (intent === "toggle") {
    const id = Number(form.get("id"));
    await sql`UPDATE coupons SET is_active = NOT is_active WHERE id = ${id}`;
    return { ok: true };
  }

  if (intent === "delete") {
    const id = Number(form.get("id"));
    await sql`DELETE FROM coupons WHERE id = ${id}`;
    return { ok: true };
  }

  return data({ error: "طلب غير معروف" }, { status: 400 });
}

export default function AdminCoupons() {
  const { coupons } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();

  useEffect(() => {
    if (result && "error" in result && result.error) toast.error(result.error);
    if (result && "created" in result && result.created) toast.success("تم إنشاء الكوبون");
  }, [result]);

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-slate-800">
        <Ticket className="h-6 w-6 text-brand-600" /> إدارة الكوبونات
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card h-fit p-5 lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
            <Plus className="h-4 w-4" /> كوبون جديد
          </h2>
          <Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value="create" />
            <input name="code" placeholder="الكود (مثل SUMMER20)" className="input" required />
            <div className="grid grid-cols-2 gap-2">
              <select name="discount_type" className="input">
                <option value="percent">نسبة %</option>
                <option value="fixed">مبلغ ثابت (ج.س)</option>
              </select>
              <input
                type="number"
                name="discount_value"
                step="0.01"
                placeholder="القيمة"
                className="input"
                required
              />
            </div>
            <input
              type="number"
              name="min_order"
              step="0.01"
              placeholder="الحد الأدنى للطلب (ج.س)"
              className="input"
            />
            <input
              type="number"
              name="max_uses"
              placeholder="أقصى عدد استخدامات (اختياري)"
              className="input"
            />
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                تاريخ الانتهاء (اختياري)
              </label>
              <input type="date" name="expires_at" className="input" />
            </div>
            <button className="btn-primary w-full">إنشاء الكوبون</button>
          </Form>
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="table-wrapper overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3 font-semibold">الكود</th>
                  <th className="p-3 font-semibold">الخصم</th>
                  <th className="p-3 font-semibold">حد أدنى</th>
                  <th className="p-3 font-semibold">الاستخدام</th>
                  <th className="p-3 font-semibold">الحالة</th>
                  <th className="p-3 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold text-slate-700">{c.code}</td>
                    <td className="p-3 text-slate-600">
                      {c.discount_type === "percent"
                        ? `${c.discount_value}%`
                        : fmt(c.discount_value)}
                    </td>
                    <td className="p-3 text-slate-500">{fmt(c.min_order)}</td>
                    <td className="p-3 text-slate-500">
                      {c.used_count}
                      {c.max_uses ? ` / ${c.max_uses}` : ""}
                    </td>
                    <td className="p-3">
                      <span
                        className={`badge ${
                          c.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {c.is_active ? "مفعّل" : "معطّل"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="toggle" />
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            title="تفعيل/تعطيل"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50"
                          >
                            <Power className="h-4 w-4 text-amber-600" />
                          </button>
                        </Form>
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            title="حذف"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </button>
                        </Form>
                      </div>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      لا توجد كوبونات بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
