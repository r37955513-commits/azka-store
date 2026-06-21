import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("wallet", "routes/wallet.tsx"),
  route("checkout/:productId", "routes/checkout.tsx"),

  // واجهات API (resource routes)
  route("api/validate-coupon", "routes/api.validate-coupon.tsx"),
  route("api/health", "routes/api.health.tsx"),
  route("api/whatsapp/webhook", "routes/api.whatsapp.webhook.tsx"),

  // الأدمن
  route("admin/login", "routes/admin.login.tsx"),
  layout("routes/admin.tsx", [
    route("admin", "routes/admin.dashboard.tsx"),
    route("admin/orders", "routes/admin.orders.tsx"),
    route("admin/topups", "routes/admin.topups.tsx"),
    route("admin/coupons", "routes/admin.coupons.tsx"),
  ]),
] satisfies RouteConfig;
