-- Every housing society structures itself differently (DHA: Phase -> Block;
-- Bahria Town: Sector/Precinct; many smaller societies: no sub-structure at
-- all), so this doesn't try to hard-code one hierarchy. Instead it adds two
-- lightweight per-society lookup tables that grow organically: an agent
-- picks an existing phase/block or types a new one, which becomes available
-- to every other agent listing in that same society from then on — same
-- cascading-dropdown shape as cities -> areas -> societies, just one level
-- deeper and agent-extensible instead of admin-curated.
--
-- Blocks reference their phase optionally (not every society groups blocks
-- under phases) and always reference the society directly, so "Block A with
-- no phase" and "Block L under Phase 6" both work without forcing a phase
-- that doesn't exist for that society.

CREATE TABLE society_phases (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  society_id  UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (society_id, name)
);

CREATE TABLE society_blocks (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  society_id  UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  phase_id    UUID REFERENCES society_phases(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (society_id, phase_id, name)
);

CREATE INDEX idx_society_phases_society ON society_phases(society_id);
CREATE INDEX idx_society_blocks_society ON society_blocks(society_id);
CREATE INDEX idx_society_blocks_phase ON society_blocks(phase_id);

ALTER TABLE society_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY society_phases_public_read ON society_phases FOR SELECT USING (true);
CREATE POLICY society_phases_authenticated_insert ON society_phases
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY society_phases_admin_all ON society_phases FOR ALL USING (is_admin());

CREATE POLICY society_blocks_public_read ON society_blocks FOR SELECT USING (true);
CREATE POLICY society_blocks_authenticated_insert ON society_blocks
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY society_blocks_admin_all ON society_blocks FOR ALL USING (is_admin());

-- Learned the hard way in 009_public_grants.sql / this session's own
-- saved_listings bug: RLS policies alone do nothing without the base
-- PostgREST grant underneath them. Read is public (listing pages show
-- phase/block names to anonymous visitors); insert is authenticated-only
-- (also enforced by the WITH CHECK above, but no reason to grant it to
-- anon at all).
GRANT SELECT ON society_phases TO anon, authenticated;
GRANT SELECT ON society_blocks TO anon, authenticated;
GRANT INSERT ON society_phases TO authenticated;
GRANT INSERT ON society_blocks TO authenticated;

ALTER TABLE listings ADD COLUMN phase_id UUID REFERENCES society_phases(id);
ALTER TABLE listings ADD COLUMN block_id UUID REFERENCES society_blocks(id);
ALTER TABLE listings ADD COLUMN plot_number TEXT;
