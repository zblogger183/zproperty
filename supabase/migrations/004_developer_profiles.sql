-- 001_schema.sql gives agents a dedicated agent_profiles table but has no
-- equivalent for developers (projects.developer_id references users(id)
-- directly). Registration needs somewhere to store a developer's company
-- name, city, and website, so add a matching profile table here.

CREATE TABLE developer_profiles (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  city_id      UUID REFERENCES cities(id),
  website      TEXT,
  logo_url     TEXT,
  is_verified  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_developer_profiles_user ON developer_profiles(user_id);
CREATE INDEX idx_developer_profiles_city ON developer_profiles(city_id);

CREATE TRIGGER trg_developer_profiles_updated
  BEFORE UPDATE ON developer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY developer_profiles_select_own ON developer_profiles
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY developer_profiles_insert ON developer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY developer_profiles_update ON developer_profiles
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());
