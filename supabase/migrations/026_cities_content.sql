-- Some KP districts in the postal-code dataset have very few distinct
-- postal codes (former tribal agencies routed through one centralized
-- office) but real, useful explanatory content about how mail routing
-- works there. `cities` had no free-text content field to hold that --
-- unlike societies, which already have `area_guides.content` for exactly
-- this purpose. Mirrors that same TipTap-JSON convention, scoped directly
-- on `cities` since the relationship is 1:1 (no pros/cons/nearby_places
-- complexity a join table would justify).
alter table cities add column if not exists content jsonb;
