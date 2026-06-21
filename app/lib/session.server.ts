import { createCookieSessionStorage, redirect } from "react-router";

const sessionSecret = process.env.SESSION_SECRET || "dev-insecure-secret";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__azka_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  },
});

export function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function requireAdmin(request: Request) {
  const session = await getSession(request);
  if (session.get("isAdmin") !== true) {
    throw redirect("/admin/login");
  }
  return true;
}

export async function isAdmin(request: Request) {
  const session = await getSession(request);
  return session.get("isAdmin") === true;
}
