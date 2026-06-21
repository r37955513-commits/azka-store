-- بيانات تجريبية لأذكى متجر (الأسعار بالجنيه السوداني — سعر الصرف 1$ = 4900 ج.س)

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('ألعاب',   'games', 'gamepad-2', 1),
  ('تطبيقات', 'apps',  'smartphone', 2),
  ('بطاقات',  'cards', 'credit-card', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, description, price, image_url) VALUES
  ((SELECT id FROM categories WHERE slug='games'), 'شحن جواهر فري فاير 100', 'شحن فوري عبر معرّف اللاعب', 24500,  null),
  ((SELECT id FROM categories WHERE slug='games'), 'شحن شدات ببجي 660',       'شحن مباشر لحساب ببجي',      46550,  null),
  ((SELECT id FROM categories WHERE slug='games'), 'عملات كول أوف ديوتي',     'CP لحساب كول أوف ديوتي',    58800, null),
  ((SELECT id FROM categories WHERE slug='apps'),  'اشتراك متابعين انستقرام 1000', 'متابعون عالي الجودة',  14700,  null),
  ((SELECT id FROM categories WHERE slug='apps'),  'مشاهدات تيك توك 5000',     'مشاهدات فورية',            12250,  null),
  ((SELECT id FROM categories WHERE slug='cards'), 'بطاقة iTunes 10$',         'كود رقمي يُرسل فوراً',      51450, null),
  ((SELECT id FROM categories WHERE slug='cards'), 'بطاقة Google Play 25$',    'كود رقمي يُرسل فوراً',      127400, null),
  ((SELECT id FROM categories WHERE slug='cards'), 'بطاقة PlayStation 20$',    'كود رقمي يُرسل فوراً',      102900, null)
ON CONFLICT DO NOTHING;

INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, is_active) VALUES
  ('WELCOME10', 'percent', 10,    20000, 100, TRUE),
  ('SAVE5000',  'fixed',   5000,  50000, 50,  TRUE)
ON CONFLICT (code) DO NOTHING;
