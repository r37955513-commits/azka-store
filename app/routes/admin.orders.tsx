import { Form, useLoaderData, useNavigation, data } from "react-router";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { Route } from "./+types/admin.orders";
import { requireAdmin } from "~/lib/session.server";
import { sql, adjustWallet, type Order } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const filter = url.searchParams.get("status") || "all";

  const orders = (await (filter === "all"
    ? sql`SELECT o.*, u.phone FROM orders o JOIN users u ON u.id=o.user_id
          ORDER BY o.created_at DESC LIMIT 100`
    : sql`SELECT o.*, u.phone FROM orders o JOIN users u ON u.id=o.user_id
          WHERE o.status = ${filter} ORDER BY o.created_at DESC LIMIT 100`)) as Order[];

  return { orders, filter };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const orderId = Number(form.get("order_id"));
  const status = String(form.get("status"));

  const rows = (await sql`SELECT * FROM orders WHERE id = ${orderId}`) as Order[];
  const order = rows[0];
  if (!order) return data({ error: "الطلب غير موجود" }, { status: 404 });

  if (
    status === "cancelled" &&
    order.status !== "cancelled" &&
    order.payment_method === "wallet"
  ) {
    await adjustWallet(order.user_id, Number(order.total), "refund", `order#${orderId}`);
  }

  await sql`UPDATE orders SET status = ${status}, updated_at = now() WHERE id = ${orderId}`;
  return { ok: true };
}

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "قيد الانتظار" },
  { key: "completed", label: "مكتمل" },
  { key: "cancelled", label: "ملغي" },
];

export default function AdminOrders() {
  const { orders, filter } = useLoaderData<typeof loader>();
  const nav = useNavigation();

  useEffect(() => {
    if (nav.state === "idle") return;
  }, [nav.state]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-800">إدارة الطلبات</h1>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <a
              key={f.key}
              href={`/admin/orders?status=${f.key}`}
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

      <div className="card overflow-hidden">
        <div className="table-wrapper overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3 font-semibold">#</th>
                <th className="p-3 font-semibold">الخدمة</th>
                <th className="p-3 font-semibold">معرّف اللاعب</th>
                <th className="p-3 font-semibold">الهاتف</th>
                <th className="p-3 font-semibold">الإجمالي</th>
                <th className="p-3 font-semibold">الدفع</th>
                <th className="p-3 font-semibold">الحالة</th>
                <th className="p-3 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="p-3 font-bold text-slate-400">#{o.id}</td>
                  <td className="p-3 text-slate-700">{o.product_name}</td>
                  <td className="p-3 text-slate-500">{o.player_id || "—"}</td>
                  <td className="p-3 text-slate-500">{o.phone}</td>
                  <td className="p-3 font-bold text-brand-700">{o.total}$</td>
                  <td className="p-3 text-slate-500">
                    {o.payment_method === "wallet" ? "محفظة" : "يدوي"}
                  </td>
                  <td className="p-3"><StatusBadge status={o.status} /></td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <ActionBtn orderId={o.id} status="completed" title="إكمال">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </ActionBtn>
                      <ActionBtn orderId={o.id} status="pending" title="إرجاع لقيد الانتظار">
                        <RotateCcw className="h-4 w-4 text-amber-600" />
                      </ActionBtn>
                      <ActionBtn orderId={o.id} status="cancelled" title="إلغاء">
                        <XCircle className="h-4 w-4 text-rose-600" />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد طلبات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  orderId,
  status,
  title,
  children,
}: {
  orderId: number;
  status: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Form method="post" className="inline">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <button
        title={title}
        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50"
      >
        {children}
      </button>
    </Form>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-rose-50 text-rose-700",
  };
  const label: Record<string, string> = {
    pending: "قيد الانتظار",
    completed: "مكتمل",
    cancelled: "ملغي",
  };
  return <span className={`badge ${map[status] ?? ""}`}>{label[status] ?? status}</span>;
}
