import { mkdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function saveReceipt(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("حجم الصورة يتجاوز 5 ميجابايت");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = extname(file.name) || ".jpg";
  const filename = `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
