// يهيّئ قاعدة البيانات: ينفّذ schema.sql ثم seed.sql على Neon.
// التشغيل:  DATABASE_URL="..."  node scripts/setup-db.js
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL غير مضبوط");
  process.exit(1);
}

const sql = neon(url);

function splitStatements(text) {
  return text
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));
}

async function run(file) {
  const text = readFileSync(join(__dirname, "..", "db", file), "utf8");
  for (const stmt of splitStatements(text)) {
    await sql.query(stmt);
  }
  console.log(`✅ تم تنفيذ ${file}`);
}

try {
  await run("schema.sql");
  await run("seed.sql");
  console.log("🎉 قاعدة البيانات جاهزة!");
} catch (e) {
  console.error("❌ خطأ:", e.message);
  process.exit(1);
}
