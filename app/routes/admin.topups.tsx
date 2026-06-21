import { Form, useLoaderData, data } from "react-router";
import { Check, X, ImageOff, ExternalLink } from "lucide-react";
import type { Route } from "./+types/admin.topups";
import { requireAdmin } from "~/lib/session.server";
import { sql, adjustWallet, type Topup } from "~/lib/db.server";
import { notifyAdmin } from "~/lib/whatsapp.server";
import { fmt } from "~/lib/money";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const filter = url.searchParams.get("status") || "pending";

  const topups = (await (filter === "all"
    ? sql`SELECT t.*, u.phone FROM topups t JOIN users u ON u.id=t.user_id
          ORDER BY t.created_at DESC LIMIT 100`
    : sql`SELECT t.*, u.phone FROM topups t JOIN users u ON u.id=t.user_id
          WHERE t.status = ${filter} ORDER BY t.created_at DESC LIMIT 100`)) as Topup[];

  return { topups, filter };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const id = Number(form.get("topup_id"));
  const decision = String(form.get("decision"));

  const rows = (await sql`SELECT * FROM topups WHERE id = ${id}`) as Topup[];
  const topup = rows[0];
  if (!topup) return data({ error: "الطلب غير موجود" }, { status: 404 });
  if (topup.status !== "pending") {
    return data({ error: "تمت معالجة هذا الطلب مسبقاً" }, { status: 400 });
  }

  if (decision === "approve") {
    await adjustWallet(topup.user_id, Number(topup.amount), "topup", `topup#${id}`);
    await sql`UPDATE topups SET status='approved', updated_at=now() WHERE id=${id}`;
    await notifyAdmin(`✅ تم اعتماد شحن المحفظة #${id} بمبلغ ${fmt(topup.amount)}`);
  } else {
    await sql`UPDATE topups SET status='rejected', updated_at=now() WHERE id=${id}`;
  }
  return { ok: true };
}

const FILTERS = [
  { key: "pending", label: "قيد المراجعة" },
  { key: "approved", label: "معتمد" },
  { key: "rejected", label: "مرفوض" },
  { key: "all", label: "الكل" },
];

export default function AdminTopups() {
  const { topups, filter } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-800">طلبات شحن المحفظة</h1>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <a
              key={f.key}
              href={`/admin/topups?status=${f.key}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                filter === f.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topups.map((t) => (
          <div key={t.id} className="card overflow-hidden">
            <div className="grid h-44 place-items-center bg-slate-100">
              {t.receipt_url ? (
                <a href={t.receipt_url} target="_blank" rel="noreferrer" className="group relative h-full w-full">
                  <img src={t.receipt_url} alt="إشعار التحويل" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 hidden place-items-center bg-black/40 text-white group-hover:grid">
                    <ExternalLink className="h-6 w-6" />
                  </span>
                </a>
              ) : (
                <div className="flex flex-col items-center text-slate-300">
                  <ImageOff className="h-8 w-8" />
                  <span className="text-xs">لا توجد صورة</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">#{t.id}</span>
                <span className="text-lg font-extrabold text-brand-700">{fmt(t.amount)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">الهاتف: {t.phone}</p>
              <p className="text-xs text-slate-400">
                {new Date(t.created_at).toLocaleString("ar")}
              </p>

              {t.status === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <Form method="post" className="flex-1">
                    <input type="hidden" name="topup_id" value={t.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <button className="btn-primary w-full py-2 text-sm">
                      <Check className="h-4 w-4" /> اعتماد
                    </button>
                  </Form>
                  <Form method="post" className="flex-1">
                    <input type="hidden" name="topup_id" value={t.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <button className="btn-danger w-full py-2 text-sm">
                      <X className="h-4 w-4" /> رفض
                    </button>
                  </Form>
                </div>
              ) : (
                <span
                  className={`badge mt-3 ${
                    t.status === "approved"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {t.status === "approved" ? "معتمد" : "مرفوض"}
                </span>
              )}
            </div>
          </div>
        ))}
        {topups.length === 0 && (
          <p className="col-span-full py-12 text-center text-slate-400">
            لا توجد طلبات شحن
          </p>
        )}
      </div>
    </div>
  );
}
