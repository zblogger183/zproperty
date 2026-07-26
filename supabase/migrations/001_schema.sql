-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CITIES
CREATE TABLE cities (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  province      TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  image_url     TEXT,
  lat           DECIMAL(10,8),
  lng           DECIMAL(11,8),
  listing_count INTEGER DEFAULT 0,
  meta_title    TEXT,
  meta_desc     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- AREAS
CREATE TABLE areas (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  city_id       UUID REFERENCES cities(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  lat           DECIMAL(10,8),
  lng           DECIMAL(11,8),
  bounds        JSONB,
  is_active     BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  listing_count INTEGER DEFAULT 0,
  UNIQUE(city_id, slug)
);

-- SOCIETIES
CREATE TABLE societies (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  area_id         UUID REFERENCES areas(id),
  city_id         UUID REFERENCES cities(id),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  established_yr  INTEGER,
  developer_name  TEXT,
  total_plots     INTEGER,
  total_phases    INTEGER,
  amenities       JSONB DEFAULT '[]',
  cover_image_url TEXT,
  gallery_images  JSONB DEFAULT '[]',
  lat             DECIMAL(10,8),
  lng             DECIMAL(11,8),
  bounds          JSONB,
  avg_price_marla DECIMAL(15,2),
  avg_price_sqft  DECIMAL(10,2),
  is_featured     BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  listing_count   INTEGER DEFAULT 0,
  meta_title      TEXT,
  meta_desc       TEXT,
  schema_json     JSONB,
  UNIQUE(city_id, slug)
);

-- USERS (mirrors auth.users — same id)
CREATE TABLE users (
  id              UUID PRIMARY KEY,
  email           TEXT UNIQUE,
  phone           TEXT UNIQUE,
  name            TEXT NOT NULL,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'buyer'
                  CHECK (role IN ('super_admin','admin','agent','developer','buyer')),
  email_verified  BOOLEAN DEFAULT false,
  phone_verified  BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- AGENCIES
CREATE TABLE agencies (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id        UUID REFERENCES users(id),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  logo_url        TEXT,
  cover_url       TEXT,
  description     TEXT,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  whatsapp        TEXT,
  cities_served   UUID[] DEFAULT '{}',
  established_yr  INTEGER,
  total_agents    INTEGER DEFAULT 0,
  total_listings  INTEGER DEFAULT 0,
  is_verified     BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'free',
  subscription_end  TIMESTAMPTZ,
  meta_title      TEXT,
  meta_desc       TEXT,
  schema_json     JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- AGENT PROFILES
CREATE TABLE agent_profiles (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  profile_slug     TEXT UNIQUE NOT NULL,
  headline         TEXT,
  bio              TEXT,
  experience_years INTEGER DEFAULT 0,
  specialties      TEXT[] DEFAULT '{}',
  cities_served    UUID[] DEFAULT '{}',
  languages        TEXT[] DEFAULT '{"Urdu","English"}',
  whatsapp         TEXT,
  facebook_url     TEXT,
  instagram_url    TEXT,
  youtube_url      TEXT,
  cnic_number      TEXT,
  cnic_front_url   TEXT,
  cnic_back_url    TEXT,
  cnic_verified    BOOLEAN DEFAULT false,
  cnic_verified_at TIMESTAMPTZ,
  cnic_verified_by UUID REFERENCES users(id),
  agency_id        UUID REFERENCES agencies(id),
  total_listings   INTEGER DEFAULT 0,
  active_listings  INTEGER DEFAULT 0,
  total_leads      INTEGER DEFAULT 0,
  meta_title       TEXT,
  meta_desc        TEXT,
  og_image_url     TEXT,
  subscription_tier TEXT DEFAULT 'free'
                   CHECK (subscription_tier IN ('free','pro','elite')),
  subscription_end  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- LISTINGS
CREATE TABLE listings (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id         UUID REFERENCES users(id),
  agency_id        UUID REFERENCES agencies(id),
  city_id          UUID REFERENCES cities(id),
  area_id          UUID REFERENCES areas(id),
  society_id       UUID REFERENCES societies(id),
  address          TEXT,
  lat              DECIMAL(10,8),
  lng              DECIMAL(11,8),
  location_point   GEOMETRY(Point,4326),
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  purpose          TEXT NOT NULL CHECK (purpose IN ('buy','rent')),
  type             TEXT NOT NULL CHECK (type IN (
    'house','flat','upper_portion','lower_portion','room',
    'residential_plot','commercial_plot','agricultural_land',
    'office','shop','warehouse','building','other'
  )),
  price            DECIMAL(15,2) NOT NULL,
  price_currency   TEXT DEFAULT 'PKR',
  is_negotiable    BOOLEAN DEFAULT false,
  area_sqft        DECIMAL(10,2),
  area_marla       DECIMAL(8,2),
  area_kanal       DECIMAL(8,2),
  beds             INTEGER,
  baths            INTEGER,
  floors           INTEGER,
  floor_number     INTEGER,
  total_floors     INTEGER,
  parking_spaces   INTEGER DEFAULT 0,
  age_years        INTEGER,
  furnished_status TEXT DEFAULT 'unfurnished'
                   CHECK (furnished_status IN ('unfurnished','semi_furnished','furnished')),
  description      TEXT,
  features         JSONB DEFAULT '{}',
  primary_image_url TEXT,
  og_image_url     TEXT,
  video_url        TEXT,
  virtual_tour_url TEXT,
  image_count      INTEGER DEFAULT 0,
  has_video        BOOLEAN DEFAULT false,
  status           TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending','active','rejected','paused','expired','sold')),
  reject_reason    TEXT,
  is_featured      BOOLEAN DEFAULT false,
  is_hot_deal      BOOLEAN DEFAULT false,
  is_top_search    BOOLEAN DEFAULT false,
  featured_until   TIMESTAMPTZ,
  hot_deal_until   TIMESTAMPTZ,
  views_count      INTEGER DEFAULT 0,
  calls_count      INTEGER DEFAULT 0,
  whatsapp_count   INTEGER DEFAULT 0,
  leads_count      INTEGER DEFAULT 0,
  saves_count      INTEGER DEFAULT 0,
  published_at     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  meta_title       TEXT,
  meta_desc        TEXT,
  focus_keyword    TEXT,
  robots           TEXT DEFAULT 'index,follow',
  canonical_url    TEXT,
  schema_json      JSONB
);

-- LISTING IMAGES
CREATE TABLE listing_images (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id       UUID REFERENCES listings(id) ON DELETE CASCADE,
  thumb_url        TEXT NOT NULL,
  medium_url       TEXT NOT NULL,
  large_url        TEXT NOT NULL,
  og_url           TEXT NOT NULL,
  original_filename TEXT,
  original_size_kb  INTEGER,
  webp_size_kb     INTEGER,
  compression_ratio DECIMAL(4,2),
  width            INTEGER,
  height           INTEGER,
  alt_text         TEXT,
  display_order    INTEGER DEFAULT 0,
  is_primary       BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE projects (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  developer_id      UUID REFERENCES users(id),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  tagline           TEXT,
  type              TEXT CHECK (type IN ('residential','commercial','mixed')),
  property_type     TEXT CHECK (property_type IN ('flats','plots','shops','houses','offices','mixed')),
  city_id           UUID REFERENCES cities(id),
  area_id           UUID REFERENCES areas(id),
  society_id        UUID REFERENCES societies(id),
  address           TEXT,
  lat               DECIMAL(10,8),
  lng               DECIMAL(11,8),
  description       TEXT,
  amenities         JSONB DEFAULT '{}',
  status            TEXT DEFAULT 'pre_launch'
                    CHECK (status IN ('pre_launch','launching','under_construction','ready','completed')),
  launch_date       DATE,
  possession_date   DATE,
  completion_pct    INTEGER DEFAULT 0,
  total_units       INTEGER,
  min_price         DECIMAL(15,2),
  max_price         DECIMAL(15,2),
  min_area          DECIMAL(10,2),
  max_area          DECIMAL(10,2),
  cover_image_url   TEXT,
  og_image_url      TEXT,
  master_plan_url   TEXT,
  video_url         TEXT,
  virtual_tour_url  TEXT,
  brochure_url      TEXT,
  is_featured       BOOLEAN DEFAULT false,
  is_verified       BOOLEAN DEFAULT false,
  status_platform   TEXT DEFAULT 'pending'
                    CHECK (status_platform IN ('pending','active','rejected','paused')),
  views_count       INTEGER DEFAULT 0,
  leads_count       INTEGER DEFAULT 0,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  meta_title        TEXT,
  meta_desc         TEXT,
  schema_json       JSONB
);

-- PROJECT IMAGES
CREATE TABLE project_images (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  thumb_url     TEXT,
  type          TEXT CHECK (type IN ('gallery','floor_plan','master_plan','brochure','amenity')),
  title         TEXT,
  display_order INTEGER DEFAULT 0
);

-- PAYMENT PLANS
CREATE TABLE payment_plans (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id          UUID REFERENCES projects(id) ON DELETE CASCADE,
  unit_type           TEXT,
  total_price         DECIMAL(15,2),
  advance_pct         DECIMAL(5,2),
  advance_amount      DECIMAL(15,2),
  installment_yrs     INTEGER,
  monthly_installment DECIMAL(12,2),
  on_possession_pct   DECIMAL(5,2),
  on_possession_amt   DECIMAL(12,2),
  notes               TEXT,
  is_active           BOOLEAN DEFAULT true
);

-- LEADS
CREATE TABLE leads (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id    UUID REFERENCES listings(id),
  project_id    UUID REFERENCES projects(id),
  agent_id      UUID REFERENCES users(id),
  developer_id  UUID REFERENCES users(id),
  buyer_id      UUID REFERENCES users(id),
  name          TEXT,
  phone         TEXT,
  email         TEXT,
  message       TEXT,
  lead_type     TEXT CHECK (lead_type IN ('call','whatsapp','email','form')),
  source_page   TEXT,
  status        TEXT DEFAULT 'new'
                CHECK (status IN ('new','contacted','qualified','viewing','negotiating','won','lost','spam')),
  lost_reason   TEXT,
  assigned_to   UUID REFERENCES users(id),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  next_followup TIMESTAMPTZ,
  deal_value    DECIMAL(15,2),
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- LEAD NOTES
CREATE TABLE lead_notes (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id    UUID REFERENCES leads(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id),
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAD ACTIVITIES
CREATE TABLE lead_activities (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id    UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  activity   TEXT NOT NULL,
  old_value  TEXT,
  new_value  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTION PLANS
CREATE TABLE subscription_plans (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name                      TEXT NOT NULL,
  slug                      TEXT UNIQUE NOT NULL,
  price_monthly             DECIMAL(10,2) NOT NULL,
  price_annual              DECIMAL(10,2),
  currency                  TEXT DEFAULT 'PKR',
  max_listings              INTEGER,
  max_photos                INTEGER DEFAULT 20,
  has_video                 BOOLEAN DEFAULT true,
  featured_credits_monthly  INTEGER DEFAULT 0,
  has_crm                   BOOLEAN DEFAULT true,
  has_advanced_crm          BOOLEAN DEFAULT false,
  has_whatsapp_bot          BOOLEAN DEFAULT false,
  has_analytics             BOOLEAN DEFAULT true,
  has_verified_badge        BOOLEAN DEFAULT false,
  has_account_manager       BOOLEAN DEFAULT false,
  has_api_access            BOOLEAN DEFAULT false,
  is_active                 BOOLEAN DEFAULT true,
  sort_order                INTEGER DEFAULT 0
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  agency_id       UUID REFERENCES agencies(id),
  plan_id         UUID REFERENCES subscription_plans(id),
  status          TEXT DEFAULT 'active'
                  CHECK (status IN ('active','cancelled','expired','suspended','trial')),
  billing_cycle   TEXT DEFAULT 'monthly'
                  CHECK (billing_cycle IN ('monthly','annual')),
  price_paid      DECIMAL(10,2),
  currency        TEXT DEFAULT 'PKR',
  starts_at       TIMESTAMPTZ DEFAULT NOW(),
  ends_at         TIMESTAMPTZ NOT NULL,
  trial_ends_at   TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  grace_period_end TIMESTAMPTZ,
  stripe_sub_id   TEXT,
  jazzcash_ref    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENT TRANSACTIONS
CREATE TABLE payment_transactions (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES users(id),
  subscription_id  UUID REFERENCES subscriptions(id),
  amount           DECIMAL(10,2) NOT NULL,
  currency         TEXT DEFAULT 'PKR',
  method           TEXT CHECK (method IN ('stripe','jazzcash','easypaisa','bank_transfer')),
  status           TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending','processing','completed','failed','refunded')),
  gateway_txn_id   TEXT,
  gateway_ref      TEXT,
  receipt_url      TEXT,
  bank_slip_url    TEXT,
  bank_verified_by UUID REFERENCES users(id),
  bank_verified_at TIMESTAMPTZ,
  bank_notes       TEXT,
  stripe_pi_id     TEXT,
  stripe_charge_id TEXT,
  initiated_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  invoice_number   TEXT UNIQUE,
  invoice_url      TEXT
);

-- LISTING BOOSTS
CREATE TABLE boost_packages (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT CHECK (type IN ('featured','hot_deal','top_search')),
  duration_days INTEGER,
  price         DECIMAL(8,2),
  currency      TEXT DEFAULT 'PKR',
  description   TEXT,
  is_active     BOOLEAN DEFAULT true
);

CREATE TABLE listing_boosts (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id  UUID REFERENCES listings(id) ON DELETE CASCADE,
  agent_id    UUID REFERENCES users(id),
  package_id  UUID REFERENCES boost_packages(id),
  payment_id  UUID REFERENCES payment_transactions(id),
  starts_at   TIMESTAMPTZ DEFAULT NOW(),
  ends_at     TIMESTAMPTZ NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- BLOG
CREATE TABLE blog_categories (
  id    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name  TEXT NOT NULL,
  slug  TEXT UNIQUE NOT NULL,
  description TEXT,
  sort  INTEGER DEFAULT 0
);

CREATE TABLE blog_posts (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  excerpt       TEXT,
  content       JSONB NOT NULL DEFAULT '{}',
  cover_url     TEXT,
  og_image_url  TEXT,
  author_id     UUID REFERENCES users(id),
  category_id   UUID REFERENCES blog_categories(id),
  tags          TEXT[] DEFAULT '{}',
  status        TEXT DEFAULT 'draft'
                CHECK (status IN ('draft','published','scheduled','archived')),
  published_at  TIMESTAMPTZ,
  reading_time  INTEGER,
  views_count   INTEGER DEFAULT 0,
  is_featured   BOOLEAN DEFAULT false,
  meta_title    TEXT,
  meta_desc     TEXT,
  focus_keyword TEXT,
  robots        TEXT DEFAULT 'index,follow',
  canonical_url TEXT,
  schema_json   JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- AREA GUIDES
CREATE TABLE area_guides (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  society_id       UUID UNIQUE REFERENCES societies(id),
  content          JSONB DEFAULT '{}',
  overview         TEXT,
  pros             TEXT[] DEFAULT '{}',
  cons             TEXT[] DEFAULT '{}',
  nearby_places    JSONB DEFAULT '{}',
  amenities_detail JSONB DEFAULT '{}',
  price_trends     JSONB DEFAULT '{}',
  review_summary   TEXT,
  is_published     BOOLEAN DEFAULT false,
  meta_title       TEXT,
  meta_desc        TEXT,
  schema_json      JSONB,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- MEDIA LIBRARY
CREATE TABLE media_library (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  uploaded_by   UUID REFERENCES users(id),
  filename      TEXT NOT NULL,
  original_name TEXT,
  url           TEXT NOT NULL,
  thumb_url     TEXT,
  webp_url      TEXT,
  file_size_kb  INTEGER,
  width         INTEGER,
  height        INTEGER,
  mime_type     TEXT,
  alt_text      TEXT,
  folder        TEXT DEFAULT 'general',
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  data       JSONB DEFAULT '{}',
  is_read    BOOLEAN DEFAULT false,
  channel    TEXT CHECK (channel IN ('app','email','whatsapp','sms')),
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  category   TEXT DEFAULT 'general',
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAGE SEO
CREATE TABLE page_seo (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  path        TEXT UNIQUE NOT NULL,
  title       TEXT,
  description TEXT,
  og_image    TEXT,
  robots      TEXT DEFAULT 'index,follow',
  canonical   TEXT,
  schema_json JSONB,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- REDIRECTS
CREATE TABLE redirects (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_path  TEXT UNIQUE NOT NULL,
  to_path    TEXT NOT NULL,
  type       INTEGER DEFAULT 301 CHECK (type IN (301,302)),
  is_active  BOOLEAN DEFAULT true,
  hit_count  INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WHITE LABEL
CREATE TABLE white_label_clients (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id               UUID REFERENCES agencies(id),
  domain                  TEXT UNIQUE NOT NULL,
  custom_domain_verified  BOOLEAN DEFAULT false,
  logo_url                TEXT,
  primary_color           TEXT DEFAULT '#1C4B42',
  secondary_color         TEXT DEFAULT '#B4E717',
  accent_color            TEXT DEFAULT '#2A6B5F',
  site_title              TEXT,
  tagline                 TEXT,
  footer_text             TEXT,
  show_powered_by         BOOLEAN DEFAULT true,
  is_active               BOOLEAN DEFAULT false,
  setup_fee_paid          BOOLEAN DEFAULT false,
  monthly_fee_pkr         DECIMAL(8,2) DEFAULT 10000,
  setup_fee_pkr           DECIMAL(8,2) DEFAULT 15000,
  billing_day             INTEGER DEFAULT 1,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTY ALERTS
CREATE TABLE property_alerts (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT,
  city_id     UUID REFERENCES cities(id),
  area_id     UUID REFERENCES areas(id),
  purpose     TEXT,
  type        TEXT,
  min_price   DECIMAL(15,2),
  max_price   DECIMAL(15,2),
  min_beds    INTEGER,
  max_beds    INTEGER,
  min_area    DECIMAL(10,2),
  max_area    DECIMAL(10,2),
  frequency   TEXT DEFAULT 'daily'
              CHECK (frequency IN ('instant','daily','weekly')),
  channel     TEXT DEFAULT 'email'
              CHECK (channel IN ('email','whatsapp','both')),
  is_active   BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- DIGITAL MARKETING CLIENTS
CREATE TABLE dm_clients (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id      UUID REFERENCES agencies(id),
  contact_name   TEXT NOT NULL,
  contact_phone  TEXT,
  contact_email  TEXT,
  business_name  TEXT,
  service_type   TEXT,
  package_name   TEXT,
  monthly_fee    DECIMAL(10,2),
  status         TEXT DEFAULT 'prospect'
                 CHECK (status IN ('prospect','active','paused','churned')),
  start_date     DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dm_monthly_reports (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id   UUID REFERENCES dm_clients(id),
  month       DATE,
  report_url  TEXT,
  leads_count INTEGER,
  spend_pkr   DECIMAL(10,2),
  cpl         DECIMAL(8,2),
  notes       TEXT,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- FORUM
CREATE TABLE forum_topics (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT CHECK (category IN ('buying','renting','investing','construction','legal','general')),
  city_id     UUID REFERENCES cities(id),
  is_pinned   BOOLEAN DEFAULT false,
  is_closed   BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forum_replies (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic_id   UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  body       TEXT NOT NULL,
  is_answer  BOOLEAN DEFAULT false,
  likes      INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTO-UPDATE updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_listings_updated
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_agent_profiles_updated
  BEFORE UPDATE ON agent_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_blog_posts_updated
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
