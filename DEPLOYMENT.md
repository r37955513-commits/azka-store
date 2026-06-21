# 🚀 دليل النشر على Vercel

هذا الدليل يشرح كل الخطوات لتشغيل **أذكى متجر** على Vercel بسلاسة وبدون مشاكل.

---

## ✅ قبل البدء (تم إعداده في الكود مسبقاً)

- إعداد Vercel الرسمي `vercelPreset()` مفعّل في `react-router.config.ts`.
- رفع الصور يستخدم **Vercel Blob** تلقائياً عند وجود `BLOB_READ_WRITE_TOKEN` (لأن نظام ملفات Vercel لا يسمح بالحفظ على القرص).
- Neon متوافق بالكامل مع بيئة Vercel serverless.

---

## الخطوات

### 1️⃣ جهّز قاعدة بيانات Neon
1. أنشئ حساباً مجانياً على [neon.tech](https://neon.tech) وأنشئ مشروعاً.
2. انسخ رابط الاتصال (Connection String) — سيكون `DATABASE_URL`.
3. شغّل السكربت لإنشاء الجداول (مرة واحدة من جهازك):
   ```bash
   DATABASE_URL="postgresql://..." npm run db:setup
   ```
   (أو الصق محتوى `db/schema.sql` و `db/seed.sql` في محرر SQL داخل Neon.)

### 2️⃣ اربط المستودع بـ Vercel
1. ادخل [vercel.com](https://vercel.com) وسجّل بحساب GitHub.
2. **Add New → Project** ثم اختر مستودع `azka-store`.
3. Vercel سيكتشف React Router تلقائياً (Framework Preset: **React Router**). اترك الإعدادات الافتراضية:
   - Build Command: `react-router build`
   - Output: تلقائي (عبر الـ preset)

### 3️⃣ أنشئ Blob Store للصور
1. في مشروع Vercel → **Storage → Create → Blob**.
2. بعد الإنشاء سيُضاف `BLOB_READ_WRITE_TOKEN` تلقائياً إلى متغيرات البيئة.

### 4️⃣ أضف متغيرات البيئة
من **Settings → Environment Variables** أضف التالي (لـ Production و Preview):

| المتغير | مطلوب؟ | الوصف |
|---|---|---|
| `DATABASE_URL` | ✅ | رابط Neon |
| `ADMIN_PASSWORD` | ✅ | كلمة مرور لوحة التحكم |
| `SESSION_SECRET` | ✅ | نص عشوائي طويل لتوقيع الجلسات |
| `BLOB_READ_WRITE_TOKEN` | ✅ | يُضاف تلقائياً مع Blob Store |
| `WHATSAPP_TOKEN` | ⚪ | توكن WhatsApp Cloud API |
| `WHATSAPP_PHONE_ID` | ⚪ | معرّف رقم المُرسِل |
| `ADMIN_WHATSAPP_NUMBER` | ⚪ | رقم الأدمن للإشعارات |
| `WHATSAPP_VERIFY_TOKEN` | ⚪ | للتحقق من webhook |

> ⚪ = اختياري (الإشعارات تُتجاهل بهدوء إذا لم تُضبط). لا تضع `PORT` على Vercel.

### 5️⃣ انشر
اضغط **Deploy**. بعد دقائق سيعمل الموقع على رابط `https://azka-store-xxxx.vercel.app`.

> 💡 إذا أضفت متغيرات البيئة بعد أول نشر، اضغط **Redeploy**.

---

## 🔗 ربط WhatsApp (اختياري)
1. أنشئ تطبيقاً على [Meta for Developers](https://developers.facebook.com) وفعّل WhatsApp.
2. ضع `WHATSAPP_TOKEN` و `WHATSAPP_PHONE_ID` و `ADMIN_WHATSAPP_NUMBER` في Vercel.
3. للـ webhook: الرابط هو `https://your-domain.vercel.app/api/whatsapp/webhook` وتوكن التحقق هو `WHATSAPP_VERIFY_TOKEN`.

---

## 🧪 التحقق بعد النشر
- افتح `/` → تظهر المنتجات حسب الفئات.
- افتح `/api/health` → يجب أن يعيد `{"status":"ok"}` (تأكيد اتصال الخادم).
- افتح `/wallet` → جرّب طلب شحن مع رفع صورة (يجب أن تُحفظ على Blob).
- افتح `/admin/login` → ادخل بـ `ADMIN_PASSWORD`.

---

## ⚠️ أخطاء شائعة وحلولها

| المشكلة | السبب / الحل |
|---|---|
| خطأ `DATABASE_URL غير مضبوط` | أضف المتغير في Vercel ثم Redeploy |
| الصور لا تُحفظ | تأكد من إنشاء Blob Store ووجود `BLOB_READ_WRITE_TOKEN` |
| جداول غير موجودة | شغّل `npm run db:setup` مقابل رابط Neon |
| الأدمن يُخرجك فوراً | تأكد من ضبط `SESSION_SECRET` |
| خطأ في البناء حول `./+types/...` | تأكد أن جميع استيرادات الأنواع تستخدم `import type` (مطبّق بالفعل) |

---

## 🗄️ بدائل الاستضافة
لو أردت تشغيل خادم Hono المخصص (بدل Vercel) على Railway / Render / VPS:
```bash
npm run build && npm start   # يشغل server.js على المنفذ PORT
```
على هذه البيئات يمكنك استخدام القرص المحلي للصور (دون Blob) إن رغبت.
