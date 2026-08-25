-- 0001 — stub
--
-- The real `0001_beta_analytics.sql` belongs to the product this subsystem was
-- exported FROM and is not part of the archive. Two things in the shipped
-- migrations reach for it:
--
--   * `solvex_forget_user()` calls `beta_analytics_forget_user(uuid)`.
--     Migration 0007 already made that call conditional on the function
--     existing, so consent revocation works without this file.
--   * Comments reference `beta_events`. Nothing executable does.
--
-- This file exists so the numbering has no hole — a missing 0001 invites
-- someone to "restore" it from the upstream product and import a whole
-- analytics schema this product has no use for and no consent to collect.
--
-- Deliberately empty of DDL.

select 1;
