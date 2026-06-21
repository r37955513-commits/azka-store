import type { Route } from "./+types/api.whatsapp.webhook";

/** التحقق من webhook (Meta verification) */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

/** استقبال أحداث WhatsApp */
export async function action({ request }: Route.ActionArgs) {
  const body = await request.json().catch(() => ({}));
  console.log("[whatsapp webhook]", JSON.stringify(body));
  return Response.json({ received: true });
}
