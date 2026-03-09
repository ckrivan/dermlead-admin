-- Update session_type constraint to include all needed types
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_session_type_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_session_type_check
  CHECK (session_type IN ('keynote', 'presentation', 'workshop', 'panel', 'symposium', 'breakout', 'networking', 'meal', 'break', 'registration', 'other'));

-- Import DID 2026 schedule/sessions from the conference agenda
DO $$
DECLARE
  v_event_id UUID;
  v_session_id UUID;
  v_speaker_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'diversity-in-dermatology-2026' LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'DID 2026 event not found';
  END IF;

  -- ============================================================
  -- THURSDAY, APRIL 16, 2026
  -- ============================================================

  -- Breakfast
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Breakfast', 'meal', '2026-04-16', '07:30', '09:00');

  -- PDT for Infectious Diseases
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'PDT for Infectious Diseases', 'presentation', '2026-04-16', '07:30', '08:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Scott Drew' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Scabies, Crusted Scabies, and Mass Drug Administration Programs
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Scabies, Crusted Scabies, and Mass Drug Administration Programs', 'presentation', '2026-04-16', '08:00', '08:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Ted Rosen' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Product Theater - AbbVie
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Product Theater', 'Sponsored by AbbVie', 'symposium', '2026-04-16', '08:30', '09:15');

  -- Best Ways to Serve Your Underserved Patients
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Best Ways to Serve Your Underserved Patients that have Limited Resources', 'presentation', '2026-04-16', '09:15', '09:45')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Tracee Blackburn' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Brittany Scurto' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 1);
  END IF;

  -- Leprosy: Clinical Spectrum and Current Global Control
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Leprosy: Clinical Spectrum and Current Global Control', 'presentation', '2026-04-16', '09:45', '10:15')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Ted Rosen' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Product Theater
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Product Theater', 'symposium', '2026-04-16', '10:15', '11:00');

  -- SPIN for SKIN
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'SPIN for SKIN', 'other', '2026-04-16', '11:00', '11:15');

  -- Dermatology in Humanitarian Missions
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Dermatology in Humanitarian Missions: Scope and Challenges', 'presentation', '2026-04-16', '11:15', '11:40')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Scott Drew' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Rare but Real: Quick-Hit Case Challenge
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Rare but Real: Quick-Hit Case Challenge', 'presentation', '2026-04-16', '11:40', '12:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Ted Rosen' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Scott Drew' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 1);
  END IF;

  -- Lunch
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Lunch', 'meal', '2026-04-16', '12:00', '13:00');

  -- Lunch Product Theater - Pfizer
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Lunch Product Theater', 'Sponsored by Pfizer', 'symposium', '2026-04-16', '12:45', '13:30');

  -- AI in Dermatology
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'AI in Dermatology: Promise, Pitfalls, and Practice Integration', 'presentation', '2026-04-16', '13:00', '13:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Amanda Hill' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Access Equals Outcomes
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Access Equals Outcomes: How Specialty Pharmacies Improve Dermatology', 'presentation', '2026-04-16', '13:30', '14:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Shanna Miranti' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Estate Planning for Providers
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Estate Planning for Providers: Protecting your Legacy and Family', 'presentation', '2026-04-16', '14:00', '14:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Ginger Lore' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Risha Bellomo' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 1);
  END IF;

  -- Product Theater - Arcutis
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Product Theater', 'Sponsored by Arcutis', 'symposium', '2026-04-16', '14:30', '15:15');

  -- SPIN for SKIN
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'SPIN for SKIN', 'other', '2026-04-16', '15:15', '15:30');

  -- Doctor Keloid Management
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Doctor Keloid Management of Hypertrophic Scars and Keloids', 'presentation', '2026-04-16', '15:30', '16:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Michael Jones' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Leading Through Innovation
  INSERT INTO sessions (event_id, title, location, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Leading Through Innovation: Career Accelerator Session', 'Penn Terrace', 'networking', '2026-04-16', '16:15', '17:15');

  -- DID Exchange Mixer
  INSERT INTO sessions (event_id, title, location, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'DID Exchange Mixer', 'Penn Terrace', 'networking', '2026-04-16', '17:15', '18:30');

  -- HS Master Class
  INSERT INTO sessions (event_id, title, description, location, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'HS Master Class', 'Sponsored by Incyte', 'Salon G', 'workshop', '2026-04-16', '18:30', '20:30');

  -- ============================================================
  -- FRIDAY, APRIL 17, 2026
  -- ============================================================

  -- Breakfast
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Breakfast', 'meal', '2026-04-17', '07:30', '09:00');

  -- Topicals Reinvented
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Topicals Reinvented: Innovations in Dermatology Formulations', 'presentation', '2026-04-17', '07:30', '08:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Naiem Issa' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Product Theater - AbbVie
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Product Theater', 'Sponsored by AbbVie', 'symposium', '2026-04-17', '08:00', '08:45');

  -- SPIN for SKIN
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'SPIN for SKIN', 'other', '2026-04-17', '08:45', '09:00');

  -- The TH2 Revolution
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'The TH2 Revolution: AD, Prurigo Nodularis, CSU, and Beyond', 'presentation', '2026-04-17', '09:00', '09:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Walter Liszewski' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- TH 17/23 Blockade
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'TH 17/23 Blockade in Psoriasis and HS: Where are We Now?', 'presentation', '2026-04-17', '09:30', '10:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Naiem Issa' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Product Theater - Sanofi Regeneron
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Product Theater', 'Sponsored by Sanofi Regeneron', 'symposium', '2026-04-17', '10:00', '10:30');

  -- Break with Exhibitors
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Break with Exhibitors', 'break', '2026-04-17', '10:30', '11:00');

  -- TNF, TH1, and Beyond
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'TNF, TH1, and Beyond: Old Targets, New Roles', 'presentation', '2026-04-17', '11:00', '11:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Walter Liszewski' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- JAK Inhibitor as the Central Hub
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'JAK Inhibitor as the Central Hub: Cutting Across Pathways in Dermatology and The Future Frontier of Therapeutics', 'presentation', '2026-04-17', '11:30', '12:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Naiem Issa' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Lunch
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Lunch', 'meal', '2026-04-17', '12:00', '13:00');

  -- Product Theater - Incyte
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Product Theater', 'Sponsored by Incyte', 'symposium', '2026-04-17', '12:15', '13:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Naiem Issa' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Dermatologic Care in Transgender Youth
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Dermatologic Care in Transgender and Gender-Diverse Youth: Medical Challenges and Sensitivities', 'presentation', '2026-04-17', '13:00', '13:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Karan Lal' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Atopic Dermatitis in Children
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Atopic Dermatitis in Children: Biologics, JAK Inhibitors, and Beyond Daily Management', 'presentation', '2026-04-17', '13:30', '14:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Lisa Swanson' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Challenges and Acne and Hidradenitis in Adolescents
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Challenges and Acne and Hidradenitis in Adolescents: Targeted Therapies and Treatment Across Diverse Populations', 'presentation', '2026-04-17', '14:00', '14:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Karan Lal' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Elizabeth Swanson' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 1);
  END IF;

  -- Product Theater - Lilly
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Product Theater', 'Sponsored by Lilly', 'symposium', '2026-04-17', '14:30', '15:15');

  -- SPIN for SKIN
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'SPIN for SKIN', 'other', '2026-04-17', '15:15', '15:30');

  -- Break with Exhibitors
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Break with Exhibitors', 'break', '2026-04-17', '15:30', '16:00');

  -- Hair and Scalp Disorders in Children
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Hair and Scalp Disorders in Children: Advances in Alopecia Areata, Infectious Mimics, and Scarring Alopecia', 'presentation', '2026-04-17', '16:00', '16:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Karan Lal' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Tracee Blackburn' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 1);
  END IF;

  -- Psychosocial Dimensions
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Psychosocial Dimensions: Supporting Pediatric Patients with Diverse Identities', 'presentation', '2026-04-17', '16:30', '16:50')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Karan Lal' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Cindy Sershen' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 1);
  END IF;

  -- Superficial Infections in Children
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Superficial Infections in Children: Antimicrobial Resistance, Emerging Pathogens, and Updated Management', 'presentation', '2026-04-17', '16:50', '17:20')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Elizabeth Swanson' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Around the World Reception
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Around the World Reception - Shades of Service', NULL, 'networking', '2026-04-17', '18:30', '22:00');

  -- ============================================================
  -- SATURDAY, APRIL 18, 2026
  -- ============================================================

  -- Breakfast
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Breakfast', 'meal', '2026-04-18', '07:30', '09:00');

  -- Lupus, Dermatomyositis
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Lupus, Dermatomyositis, and the Expanding Therapeutic Landscape', 'presentation', '2026-04-18', '07:30', '08:15')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Ted Rosen' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Product Theater - J&J
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Product Theater', 'Sponsored by Johnson & Johnson', 'symposium', '2026-04-18', '08:15', '09:00');

  -- Bullous Diseases
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Bullous Diseases: From Bench to Bedside', 'presentation', '2026-04-18', '09:00', '09:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Diego DaSilva' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Product Theater - Leo
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Product Theater', 'Sponsored by Leo Pharma', 'symposium', '2026-04-18', '09:30', '10:15');

  -- SPIN for SKIN
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'SPIN for SKIN', 'other', '2026-04-18', '10:15', '10:30');

  -- Break with Exhibitors
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Break with Exhibitors', 'break', '2026-04-18', '10:30', '11:00');

  -- Scleroderma, Sjogren's
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, E'Scleroderma, Sj\u00F6gren\u2019s, and Connective Tissue Overlap Syndromes: When Skin Leads the Diagnosis', 'presentation', '2026-04-18', '11:00', '11:45')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Scott Drew' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Pyoderma Gangrenosum
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Pyoderma Gangrenosum and Neutrophilic Dermatoses: Complex Cases, Practical Pearls', 'presentation', '2026-04-18', '11:45', '12:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Diego DaSilva' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Lunch
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Lunch', 'meal', '2026-04-18', '12:30', '13:30');

  -- Product Theater - Eli Lilly
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Product Theater', 'Sponsored by Eli Lilly', 'symposium', '2026-04-18', '12:45', '13:30');

  -- Impact of Diet
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Impact of Diet and Metabolic Health in Inflammatory Disease', 'presentation', '2026-04-18', '13:30', '14:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Ahuva Cices' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Epigenetics
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Epigenetics of Inflammatory Skin Disease: Can Lifestyle Modify Gene Expression?', 'presentation', '2026-04-18', '14:00', '14:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Ahuva Cices' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Product Theater - UCB
  INSERT INTO sessions (event_id, title, description, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Product Theater', 'Sponsored by UCB', 'symposium', '2026-04-18', '14:30', '15:15');

  -- SPIN for SKIN
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'SPIN for SKIN', 'other', '2026-04-18', '15:15', '15:30');

  -- Break with Exhibitors
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Break with Exhibitors', 'break', '2026-04-18', '15:30', '16:00');

  -- Joyology in Dermatology
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Joyology in Dermatology: The Science of Happiness, Stress, and Skin Health', 'presentation', '2026-04-18', '16:00', '16:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Meena Julapalli' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- The Chocolate Lecture
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'The Chocolate Lecture: Flavanols, Skin Health, and a Sweet Case Study', 'presentation', '2026-04-18', '16:30', '17:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Adriana Cruz' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- VIP/Faculty Reception
  INSERT INTO sessions (event_id, title, description, location, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'VIP/Faculty Reception', 'VIP Industry Partners and Faculty Only', 'Flight Club in the Victorian Room', 'networking', '2026-04-18', '18:00', '20:00');

  -- ============================================================
  -- SUNDAY, APRIL 19, 2026
  -- ============================================================

  -- Breakfast
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Breakfast', 'meal', '2026-04-19', '08:00', '09:30');

  -- Hair Restoration Techniques
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Hair Restoration Techniques: From PRP to Hairceuticals', 'presentation', '2026-04-19', '08:00', '08:45')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Karan Lal' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Medical Symposium
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time) VALUES
  (v_event_id, 'Medical Symposium', 'symposium', '2026-04-19', '08:45', '09:30');

  -- Beyond Wrinkles
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Beyond Wrinkles: Addressing Ageism in Dermatology and Aesthetics', 'presentation', '2026-04-19', '09:30', '10:00')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Shannon Trotter' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Nutraceuticals
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Nutraceuticals in Aesthetic and Medical Dermatology: Sorting Science from Marketing', 'presentation', '2026-04-19', '10:00', '10:30')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Shannon Trotter' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Lasers and Energy-Based Devices
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Lasers and Energy-Based Devices in Skin of Color: Safety, Science, and Best Practices', 'presentation', '2026-04-19', '10:30', '11:15')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Roni Bolton' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Beyond the Mirror
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Beyond the Mirror: Managing Unrealistic Expectations and Body Image Concerns', 'presentation', '2026-04-19', '11:15', '11:45')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Karan Lal' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;

  -- Rapid Fire Skincare
  INSERT INTO sessions (event_id, title, session_type, session_date, start_time, end_time)
  VALUES (v_event_id, 'Rapid Fire Skincare', 'presentation', '2026-04-19', '11:45', '12:15')
  RETURNING id INTO v_session_id;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Karan Lal' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 0);
  END IF;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Shannon Trotter' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 1);
  END IF;
  SELECT id INTO v_speaker_id FROM speakers WHERE event_id = v_event_id AND full_name = 'Roni Bolton' LIMIT 1;
  IF v_speaker_id IS NOT NULL THEN
    INSERT INTO session_speakers (session_id, speaker_id, role, display_order) VALUES (v_session_id, v_speaker_id, 'speaker', 2);
  END IF;

END $$;
