import { Form, NavLink, Outlet, redirect } from "react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Ticket,
  LogOut,
  Sparkles,
} from "lucide-react";
import type { Route } from "./+types/admin";
import { requireAdmin, getSession, sessionStorage } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  session.unset("isAdmin");
  return redirect("/admin/login", {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

const NAV = [
  { to: "/admin", label: "الإحصائيات", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { to: "/admin/topups", label: "شحن المحفظة", icon: Wallet },
  { to: "/admin/coupons", label: "الكوبونات", icon: Ticket },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-l border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="font-extrabold text-slate-800">أذكى متجر</p>
            <p className="text-[11px] text-slate-400">لوحة التحكم</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" /> {label}
            </NavLink>
          ))}
        </nav>
        <Form method="post">
          <button className="btn-ghost w-full text-rose-600">
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </button>
        </Form>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white p-2 md:hidden">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-500"
                }`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </div>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
