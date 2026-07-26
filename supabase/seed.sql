-- SUBSCRIPTION PLANS
INSERT INTO subscription_plans
  (name, slug, price_monthly, price_annual, max_listings, max_photos,
   has_video, featured_credits_monthly, has_crm, has_advanced_crm,
   has_whatsapp_bot, has_analytics, has_verified_badge,
   has_account_manager, has_api_access, sort_order)
VALUES
  ('Free',  'free',  0,     0,      5,   5,  false, 0, true,  false, false, true,  false, false, false, 0),
  ('Pro',   'pro',   4999,  49990,  50,  20, true,  2, true,  true,  false, true,  true,  false, false, 1),
  ('Elite', 'elite', 12999, 129990, NULL,50, true,  5, true,  true,  true,  true,  true,  true,  false, 2);

-- BOOST PACKAGES
INSERT INTO boost_packages (name, type, duration_days, price, description) VALUES
  ('Featured 7 Days',    'featured',   7,  1499, 'Show at top of search results for 7 days'),
  ('Featured 30 Days',   'featured',   30, 4999, 'Show at top of search results for 30 days'),
  ('Hot Deal 7 Days',    'hot_deal',   7,  999,  'Hot Deal badge for 7 days'),
  ('Top Search 7 Days',  'top_search', 7,  1999, 'Appear in Top Search section for 7 days');

-- CITIES
INSERT INTO cities (name, slug, province, display_order, lat, lng) VALUES
  ('Lahore',       'lahore',       'Punjab',         1, 31.5204,  74.3587),
  ('Karachi',      'karachi',      'Sindh',           2, 24.8607,  67.0011),
  ('Islamabad',    'islamabad',    'Islamabad',       3, 33.6844,  73.0479),
  ('Rawalpindi',   'rawalpindi',   'Punjab',         4, 33.5651,  73.0169),
  ('Faisalabad',   'faisalabad',   'Punjab',         5, 31.4504,  73.1350),
  ('Multan',       'multan',       'Punjab',         6, 30.1575,  71.5249),
  ('Peshawar',     'peshawar',     'KPK',             7, 34.0151,  71.5249),
  ('Quetta',       'quetta',       'Balochistan',     8, 30.1798,  66.9750),
  ('Gujranwala',   'gujranwala',   'Punjab',         9, 32.1877,  74.1945),
  ('Sialkot',      'sialkot',      'Punjab',        10, 32.4945,  74.5229);

-- LAHORE AREAS
INSERT INTO areas (city_id, name, slug, display_order) VALUES
  ((SELECT id FROM cities WHERE slug='lahore'), 'DHA',            'dha',            1),
  ((SELECT id FROM cities WHERE slug='lahore'), 'Bahria Town',    'bahria-town',    2),
  ((SELECT id FROM cities WHERE slug='lahore'), 'Gulberg',        'gulberg',        3),
  ((SELECT id FROM cities WHERE slug='lahore'), 'Model Town',     'model-town',     4),
  ((SELECT id FROM cities WHERE slug='lahore'), 'Johar Town',     'johar-town',     5),
  ((SELECT id FROM cities WHERE slug='lahore'), 'Garden Town',    'garden-town',    6),
  ((SELECT id FROM cities WHERE slug='lahore'), 'Cantt',          'cantt',          7),
  ((SELECT id FROM cities WHERE slug='lahore'), 'Wapda Town',     'wapda-town',     8),
  ((SELECT id FROM cities WHERE slug='lahore'), 'Sui Gas Housing','sui-gas-housing',9),
  ((SELECT id FROM cities WHERE slug='lahore'), 'Raiwind Road',   'raiwind-road',  10);

-- KARACHI AREAS
INSERT INTO areas (city_id, name, slug, display_order) VALUES
  ((SELECT id FROM cities WHERE slug='karachi'), 'DHA',          'dha',          1),
  ((SELECT id FROM cities WHERE slug='karachi'), 'Bahria Town',  'bahria-town',  2),
  ((SELECT id FROM cities WHERE slug='karachi'), 'Clifton',      'clifton',      3),
  ((SELECT id FROM cities WHERE slug='karachi'), 'Gulshan-e-Iqbal','gulshan-iqbal',4),
  ((SELECT id FROM cities WHERE slug='karachi'), 'PECHS',        'pechs',        5),
  ((SELECT id FROM cities WHERE slug='karachi'), 'Scheme 33',    'scheme-33',    6),
  ((SELECT id FROM cities WHERE slug='karachi'), 'North Nazimabad','north-nazimabad',7),
  ((SELECT id FROM cities WHERE slug='karachi'), 'Federal B Area','federal-b-area',8);

-- ISLAMABAD AREAS
INSERT INTO areas (city_id, name, slug, display_order) VALUES
  ((SELECT id FROM cities WHERE slug='islamabad'), 'F-7',           'f-7',           1),
  ((SELECT id FROM cities WHERE slug='islamabad'), 'F-10',          'f-10',          2),
  ((SELECT id FROM cities WHERE slug='islamabad'), 'F-11',          'f-11',          3),
  ((SELECT id FROM cities WHERE slug='islamabad'), 'E-11',          'e-11',          4),
  ((SELECT id FROM cities WHERE slug='islamabad'), 'DHA',           'dha',           5),
  ((SELECT id FROM cities WHERE slug='islamabad'), 'Bahria Town',   'bahria-town',   6),
  ((SELECT id FROM cities WHERE slug='islamabad'), 'Blue Area',     'blue-area',     7),
  ((SELECT id FROM cities WHERE slug='islamabad'), 'G-11',          'g-11',          8);

-- DEFAULT SETTINGS
INSERT INTO settings (key, value, category) VALUES
  ('site_name',       '"SarZameenz.com"',             'general'),
  ('site_tagline',    '"Pakistan Real Estate Growth Ecosystem"', 'general'),
  ('contact_email',   '"info@sarzameenz.com"',         'general'),
  ('contact_phone',   '""',                            'general'),
  ('whatsapp_number', '""',                            'general'),
  ('maintenance_mode',  'false',                       'general'),
  ('robots_txt',      '"User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /dashboard/\nDisallow: /api/\nSitemap: https://sarzameenz.com/sitemap.xml"', 'seo'),
  ('listing_expiry_days', '90',                        'listings'),
  ('max_free_listings',   '5',                         'listings'),
  ('jazzcash_sandbox',    'true',                      'payments'),
  ('easypaisa_sandbox',   'true',                      'payments');

-- BLOG CATEGORIES
INSERT INTO blog_categories (name, slug, sort) VALUES
  ('Market Updates',   'market-updates',   1),
  ('Buying Guide',     'buying-guide',     2),
  ('Renting Guide',    'renting-guide',    3),
  ('Investment',       'investment',       4),
  ('Construction',     'construction',     5),
  ('Legal',            'legal',            6),
  ('Agent Tips',       'agent-tips',       7),
  ('City News',        'city-news',        8);
