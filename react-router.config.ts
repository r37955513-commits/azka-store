import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  // Server-side rendering enabled (full-stack mode)
  ssr: true,
  // إعداد Vercel الرسمي لـ React Router 7 (يُستخدم تلقائياً عند النشر على Vercel)
  presets: [vercelPreset()],
} satisfies Config;
