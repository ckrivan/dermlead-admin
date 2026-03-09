-- Update sponsors tier constraint to include title_sponsor
ALTER TABLE sponsors DROP CONSTRAINT IF EXISTS sponsors_tier_check;
ALTER TABLE sponsors ADD CONSTRAINT sponsors_tier_check
  CHECK (tier IN ('title_sponsor', 'presidents_circle', 'platinum', 'gold', 'silver', 'bronze', 'partner'));

-- Import DID 2026 sponsors and exhibitors
DO $$
DECLARE
  v_event_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'diversity-in-dermatology-2026' LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'DID 2026 event not found';
  END IF;

  -- ============================================================
  -- SPONSORS
  -- ============================================================

  -- Title Sponsors (4)
  INSERT INTO sponsors (event_id, company_name, tier, display_order, is_featured) VALUES
  (v_event_id, 'AbbVie', 'title_sponsor', 1, true),
  (v_event_id, 'Eli Lilly', 'title_sponsor', 2, true),
  (v_event_id, 'Incyte', 'title_sponsor', 3, true),
  (v_event_id, 'Pfizer', 'title_sponsor', 4, true);

  -- President's Circle Sponsors (5)
  INSERT INTO sponsors (event_id, company_name, tier, display_order, is_featured) VALUES
  (v_event_id, 'Arcutis Biotherapeutics', 'presidents_circle', 5, true),
  (v_event_id, 'Johnson & Johnson', 'presidents_circle', 6, true),
  (v_event_id, 'Leo Pharma', 'presidents_circle', 7, true),
  (v_event_id, 'Sanofi Regeneron', 'presidents_circle', 8, true),
  (v_event_id, 'UCB', 'presidents_circle', 9, true);

  -- Bronze Sponsors (5)
  INSERT INTO sponsors (event_id, company_name, tier, display_order, is_featured) VALUES
  (v_event_id, 'AMGEN', 'bronze', 10, false),
  (v_event_id, 'Ortho Dermatologics', 'bronze', 11, false),
  (v_event_id, 'Organon', 'bronze', 12, false),
  (v_event_id, 'Takeda', 'bronze', 13, false),
  (v_event_id, 'Novartis Pharmaceuticals', 'bronze', 14, false);

  -- ============================================================
  -- EXHIBITORS
  -- ============================================================

  INSERT INTO exhibitors (event_id, company_name) VALUES
  (v_event_id, 'Castle Biosciences'),
  (v_event_id, 'Galderma'),
  (v_event_id, 'Kenvue'),
  (v_event_id, 'Pfizer'),
  (v_event_id, 'SKNV'),
  (v_event_id, 'GoodRX Prescription Services'),
  (v_event_id, 'Chiesi Global Rare Diseases');

END $$;
