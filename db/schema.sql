-- =====================================================================
--  أذكى متجر - مخطط قاعدة البيانات (PostgreSQL / Neon)
-- =====================================================================

-- الفئات (ألعاب، تطبيقات، بطاقات ...)
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT DEFAULT 'package',
  sort_order  INT  DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- المنتجات / الخدمات
CREATE TABLE IF NOT EXISTS products (
  id           SERIAL PRIMARY KEY,
  category_id  INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  image_url    TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- المستخدمون (يُعرّف المستخدم برقم الهاتف)
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  phone       TEXT NOT NULL UNIQUE,
  name        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- المحافظ الرقمية (محفظة واحدة لكل مستخدم)
CREATE TABLE IF NOT EXISTS wallets (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- حركات المحفظة (سجل تدقيق)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id          SERIAL PRIMARY KEY,
  wallet_id   INT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL,
  type        TEXT NOT NULL,
  reference   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- الكوبونات
CREATE TABLE IF NOT EXISTS coupons (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  min_order     NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_uses      INT,
  used_count    INT NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- الطلبات
CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id    INT REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  player_id     TEXT,
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal      NUMERIC(12,2) NOT NULL,
  discount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total         NUMERIC(12,2) NOT NULL,
  coupon_code   TEXT,
  payment_method TEXT NOT NULL DEFAULT 'wallet',
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','completed','cancelled')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- طلبات شحن المحفظة
CREATE TABLE IF NOT EXISTS topups (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  receipt_url   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  admin_note    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user       ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_topups_status     ON topups(status);
