import { Form, useActionData, useNavigation, data, redirect } from "react-router";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Lock, ShieldCheck } from "lucide-react";
import type { Route } from "./+types/admin.login";
import { sessionStorage, getSession, isAdmin } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  if (await isAdmin(request)) throw redirect("/admin");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const expected = process.env.ADMIN_PASSWORD || "admin";

  if (password !== expected) {
    return data({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  }

  const session = await getSession(request);
  session.set("isAdmin", true);
  return redirect("/admin", {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export default function AdminLogin() {
  const result = useActionData<typeof action>();
  const nav = useNavigation();

  useEffect(() => {
    if (result?.error) toast.error(result.error);
  }, [result]);

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-extrabold text-slate-800">لوحة تحكم الأدمن</h1>
          <p className="text-sm text-slate-400">أذكى متجر</p>
        </div>
        <Form method="post" className="space-y-4">
          <div className="relative">
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              name="password"
              placeholder="كلمة المرور"
              className="input pr-9"
              required
              autoFocus
            />
          </div>
          <button className="btn-primary w-full" disabled={nav.state !== "idle"}>
            {nav.state !== "idle" ? "جارٍ الدخول..." : "تسجيل الدخول"}
          </button>
        </Form>
      </div>
    </div>
  );
}
