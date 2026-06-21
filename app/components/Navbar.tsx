import { Link } from "react-router";
import { Wallet, Sparkles, ShieldCheck } from "lucide-react";

export function Navbar({ balance }: { balance?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-extrabold text-slate-800">أذكى متجر</p>
            <p className="text-[11px] text-slate-400">الخدمات الرقمية</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/wallet" className="btn-ghost">
            <Wallet className="h-4 w-4 text-brand-600" />
            <span className="hidden sm:inline">المحفظة</span>
            {balance != null && (
              <span className="badge bg-brand-50 text-brand-700">{balance}$</span>
            )}
          </Link>
          <Link to="/admin/login" className="btn-ghost" title="لوحة التحكم">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
