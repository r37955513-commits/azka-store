-- بيانات تجريبية لأذكى متجر

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('ألعاب',   'games', 'gamepad-2', 1),
  ('تطبيقات', 'apps',  'smartphone', 2),
  ('بطاقات',  'cards', 'credit-card', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, description, price, image_url) VALUES
  ((SELECT id FROM categories WHERE slug='games'), 'شحن جواهر فري فاير 100', 'شحن فوري عبر معرّف اللاعب', 5.00,  null),
  ((SELECT id FROM categories WHERE slug='games'), 'شحن شدات ببجي 660',       'شحن مباشر لحساب ببجي',      9.50,  null),
  ((SELECT id FROM categories WHERE slug='games'), 'عملات كول أوف ديوتي',     'CP لحساب كول أوف ديوتي',    12.00, null),
  ((SELECT id FROM categories WHERE slug='apps'),  'اشتراك متابعين انستقرام 1000', 'متابعون عالي الجودة',  3.00,  null),
  ((SELECT id FROM categories WHERE slug='apps'),  'مشاهدات تيك توك 5000',     'مشاهدات فورية',            2.50,  null),
  ((SELECT id FROM categories WHERE slug='cards'), 'بطاقة iTunes 10$',         'كود رقمي يُرسل فوراً',      10.50, null),
  ((SELECT id FROM categories WHERE slug='cards'), 'بطاقة Google Play 25$',    'كود رقمي يُرسل فوراً',      26.00, null),
  ((SELECT id FROM categories WHERE slug='cards'), 'بطاقة PlayStation 20$',    'كود رقمي يُرسل فوراً',      21.00, null)
ON CONFLICT DO NOTHING;

INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, is_active) VALUES
  ('WELCOME10', 'percent', 10, 5,  100, TRUE),
  ('SAVE5',     'fixed',   5,  20, 50,  TRUE)
ON CONFLICT (code) DO NOTHING;
