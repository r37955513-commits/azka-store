import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";

/**
 * يحفظ صورة إشعار التحويل.
 * - على Vercel (وأي بيئة إنتاج): يستخدم Vercel Blob (تخزين سحابي دائم).
 * - محلياً (تطوير): يحفظ في public/uploads.
 *
 * ملاحظة: نظام ملفات Vercel للقراءة فقط ومؤقت، لذلك لا يمكن الحفظ على القرص هناك.
 */
export async function saveReceipt(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("حجم الصورة يتجاوز 5 ميجابايت");
  }

  const ext = extname(file.name) || ".jpg";
  const base = `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;

  // الإنتاج / Vercel: استخدم Blob إذا كان التوكن مضبوطاً
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`receipts/${base}`, file, { access: "public" });
    return blob.url;
  }

  // التطوير المحلي: احفظ على القرص
  const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, base), buffer);
  return `/uploads/${base}`;
}
