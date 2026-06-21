import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import { Toaster } from "react-hot-toast";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>أذكى متجر — الخدمات الرقمية</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontFamily: "Cairo, sans-serif", direction: "rtl" },
            success: { iconTheme: { primary: "#1d5ff1", secondary: "#fff" } },
          }}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "حدث خطأ غير متوقع";
  let details = "نعتذر، حدث خطأ. حاول مرة أخرى لاحقاً.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "الصفحة غير موجودة" : "خطأ";
    details = error.statusText || details;
  } else if (error instanceof Error) {
    details = error.message;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-3xl font-extrabold text-slate-800">{message}</h1>
      <p className="text-slate-500">{details}</p>
      <a href="/" className="btn-primary mt-4">العودة للرئيسية</a>
    </main>
  );
}
