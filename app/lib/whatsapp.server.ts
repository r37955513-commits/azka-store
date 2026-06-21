import { fmt } from "./money";

/**
 * إشعارات WhatsApp عبر Meta Cloud API.
 */
export async function notifyAdmin(message: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;

  if (!token || !phoneId || !adminNumber) {
    console.warn("[whatsapp] مفاتيح WhatsApp غير مضبوطة — تم تخطّي الإشعار.");
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: adminNumber,
          type: "text",
          text: { body: message },
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("[whatsapp] فشل الإرسال:", res.status, text);
    }
  } catch (err) {
    console.error("[whatsapp] خطأ في الاتصال:", err);
  }
}

export function newOrderMessage(opts: {
  orderId: number;
  product: string;
  total: string;
  phone: string;
}) {
  return (
    `🛒 طلب جديد في أذكى متجر\n` +
    `رقم الطلب: #${opts.orderId}\n` +
    `الخدمة: ${opts.product}\n` +
    `الإجمالي: ${fmt(opts.total)}\n` +
    `هاتف العميل: ${opts.phone}`
  );
}

export function newTopupMessage(opts: {
  topupId: number;
  amount: string;
  phone: string;
}) {
  return (
    `💰 طلب شحن محفظة جديد\n` +
    `رقم الطلب: #${opts.topupId}\n` +
    `المبلغ: ${fmt(opts.amount)}\n` +
    `هاتف العميل: ${opts.phone}\n` +
    `يرجى مراجعة صورة الإشعار في لوحة التحكم.`
  );
}
