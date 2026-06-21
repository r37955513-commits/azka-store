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

  route("api/validate-coupon", "routes/api.validate-coupon.tsx"),

  route("admin/login", "routes/admin.login.tsx"),
  layout("routes/admin.tsx", [
    route("admin", "routes/admin.dashboard.tsx"),
    route("admin/orders", "routes/admin.orders.tsx"),
    route("admin/topups", "routes/admin.topups.tsx"),
    route("admin/coupons", "routes/admin.coupons.tsx"),
  ]),
] satisfies RouteConfig;
