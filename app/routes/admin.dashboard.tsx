import { useLoaderData } from "react-router";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Wallet,
  TrendingUp,
} from "lucide-react";
import type { Route } from "./+types/admin.dashboard";
import { requireAdmin } from "~/lib/session.server";
import { sql } from "~/lib/db.server";
import { fmt } from "~/lib/money";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);

  const [sales] = await sql`
    SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE status = 'completed'
  `;
  const [orders] = await sql`SELECT COUNT(*)::int AS c FROM orders`;
  const [pending] = await sql`SELECT COUNT(*)::int AS c FROM orders WHERE status='pending'`;
  const [pendingTopups] = await sql`SELECT COUNT(*)::int AS c FROM topups WHERE status='pending'`;
  const [walletSum] = await sql`SELECT COALESCE(SUM(balance),0) AS total FROM wallets`;

  const recent = await sql`
    SELECT o.id, o.product_name, o.total, o.status, o.created_at, u.phone
    FROM orders o JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC LIMIT 8
  `;

  return {
    totalSales: sales.total,
    totalOrders: orders.c,
    pendingOrders: pending.c,
    pendingTopups: pendingTopups.c,
    walletTotal: walletSum.total,
    recent,
  };
}

export default function Dashboard() {
  const d = useLoaderData<typeof loader>();

  const cards = [
    { label: "إجمالي المبيعات", value: fmt(d.totalSales), icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "عدد الطلبات", value: d.totalOrders, icon: ShoppingBag, color: "bg-brand-50 text-brand-600" },
    { label: "طلبات قيد الانتظار", value: d.pendingOrders, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "طلبات شحن معلّقة", value: d.pendingTopups, icon: Wallet, color: "bg-rose-50 text-rose-600" },
    { label: "إجمالي أرصدة المحافظ", value: fmt(d.walletTotal), icon: TrendingUp, color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-800">الإحصائيات</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-extrabold text-slate-800">{c.value}</p>
            <p className="text-sm text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <h2 className="border-b border-slate-100 p-4 font-bold text-slate-700">
          أحدث الطلبات
        </h2>
        <div className="table-wrapper overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3 font-semibold">#</th>
                <th className="p-3 font-semibold">الخدمة</th>
                <th className="p-3 font-semibold">الهاتف</th>
                <th className="p-3 font-semibold">الإجمالي</th>
                <th className="p-3 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {d.recent.map((o: any) => (
                <tr key={o.id}>
                  <td className="p-3 font-bold text-slate-400">#{o.id}</td>
                  <td className="p-3 text-slate-700">{o.product_name}</td>
                  <td className="p-3 text-slate-500">{o.phone}</td>
                  <td className="p-3 font-bold text-brand-700">{fmt(o.total)}</td>
                  <td className="p-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
