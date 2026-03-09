-- Migration: Import real DID 2026 attendees and industry partners
-- Generated from Excel spreadsheets

-- Use a DO block to reference the DID 2026 event dynamically
DO $$
DECLARE
  v_event_id UUID;
  v_org_id UUID;
BEGIN
  -- Get the DID 2026 event
  SELECT id, organization_id INTO v_event_id, v_org_id
  FROM events WHERE slug = 'did-2026' LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'DID 2026 event not found. Run the previous migration first.';
  END IF;

  -- =============================================
  -- Import 142 Attendees
  -- =============================================
  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Neeraj', 'Harry', 'neil@comprehensivelaser.com', 'PA-C', 'Aesthetics', 'Comprehensive Laser & Aesthetics', '1386920007', '10500 Little Patuxent Parkway', 'Suite 400', 'Columbia', 'MD', '21044', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Adriana', 'Cruz', 'adricruza@gmail.com', 'MD', 'Dermatology', 'MEDSTAR SHAH', '762465', '44980 Hamptons Blv', 'APT 315', 'Leonardtown', 'MD', '20650', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Aileen', 'Cassidy', 'aileenpcassidy@gmail.com', 'PAC', 'Dermatology', 'Anne Arundel Dermatology', '1790989127', '4731 Williamsburg Blvd', NULL, 'Arlington', 'VA', '22207', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Alexa', 'Limes', 'alexa.limes@gmail.com', 'PA-C', 'Dermatology', 'Schweiger Dermatology Group', '1689199077', '517 Elwood Road', NULL, 'East Northport', 'NY', '11731', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Alexandra', 'Lunardi', 'alexandra.lunardi@galderma.com', 'PhamD', 'MSL', 'Galderma', NULL, '105 Barnsfield Ct', NULL, 'Gaithersburg', 'MD', '20878', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Alexandra', 'Dillon', 'alexandran.dillon@gmail.com', 'PA-C', 'Dermatology', 'Anne Arundel Dermatology', '1265175160', '8049 Tuckerman Lane', 'P', 'Potomac', 'MD', '20854', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Alexandria', 'Fuller', 'alexlesleyfuller@gmail.com', 'Student', 'N/A', 'N/A', NULL, '2009 8th St NW', 'Apt 419', 'Wahington', 'DC', '20001', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Alice', 'Adarkwa', 'adarkwaalice@gmail.com', 'PAS', 'Physician Assistant Student', 'Physician Assistant Student', NULL, '14307 Kimono Circle', NULL, 'Boyds', 'MD', '20841', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Alicia', 'Jones', 'aliciaj04@gmail.com', 'NP', 'Dermatology', 'Carter Snell Skin Center', '1699465682', '2918 Montgomery Cir', NULL, 'Commerce Charter Township', 'MI', '48390', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Alyssa', 'Ortega', 'almortega@gwu.edu', 'PA-C', 'Dermatology', 'Carolina Skin Care', '1841803244', '100 carousel st', NULL, 'West end', 'NC', '27376', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Amanda', 'Smay', 'amanda.m.smay@gmail.com', 'PA-C', 'Dermatology', 'PH Dermatology', '1467102541', '600 Lakeview Road', 'St A', 'Clearwater', 'FL', '33756', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Amanda', 'Cardoza', 'apcardoza11@gmail.com', 'PA-C', 'Medical Dermatology', 'Texas Dermatology', '1831780311', '10728 Gemsbuck Ldg', NULL, 'San Antonio', 'TX', '78245', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Amy', 'Cabrera', 'amyrcabrera@gmail.com', 'PA-C', 'Family Medicine', 'Unity Health Care', '1467272948', '9 Port Haven Ct', NULL, 'Germantown', 'MD', '20874', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Ashton', 'Frulla', 'ashtonfrulla@gmail.com', 'NP-C, DCNP', 'Dermatology', 'Dermatology Institute of Boston', '1235657560', '131 Appleton St', 'Apt 2', 'Boston', 'MA', '02116', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Ayana', 'Gates', 'ayanagates@gmail.com', 'PA-C', 'Dermatology', 'Heidelberg Dermatology', '1952841207', '16577 Warwick St', NULL, 'Detroit', 'Michigan', '48219', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Betsy', 'Benton', 'elizabeth.benton@piedmonthealthcare.com', 'PA-C', 'Dermatology', 'Lake Nor', '1447557269', '14131 Garden District Row', NULL, 'Huntersville', 'NC', '28078', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Brandice', 'Brazell', 'bmbrazell2@gmail.com', 'M.S, M.S, PA-C', 'Dermatology', 'Arlington Dermatology', '1720336118', '5S557 Arlington Avenue', NULL, 'Naperville', 'Illinois', '60540', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Brandie', 'Yancy', 'brandiemd@yahoo.com', 'MPH, PA-C', 'Family Medicine', 'Yo', NULL, '15112 Evers St', NULL, 'Dolton', 'IL', '60419', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Brian', 'Klein', 'iraqizhome@yahoo.com', 'PA-C', 'Dermatology', 'Suncoast Dermtology', '1700134640', '15771 SE 170th Ave', NULL, 'Weirsdale', 'FL', '32195', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Brooke', 'Hughes', 'brookievvl@gmail.com', 'MSHS, PA-C', 'Dermatology', 'Watson Clinic', NULL, '1417 Harbour Walk Rd', NULL, 'Tampa', 'FL', '33602', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Caitlin', 'Liberatore', 'liberatorece@gmail.com', 'PA', 'Dermatology', 'U.S. Dermatology Partners', '1508521253', '6514 10th Street', NULL, 'Alexandria', 'VA', '22307', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Carolyn', 'Stolte', 'carolynstolte@gmail.com', 'CRNP', 'Dermatology', 'University of Maryland Dermatology', '1285241653', '1200 West 41st Street', NULL, 'BALTIMORE', 'MD', '21211', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Chanda', 'Copeland', 'clc46@georgetown.edu', 'DCNP, FNP-BC', 'Dermatology', 'Advanced Dermatology & Cosmetic Surgery', '1477820769', '2114 Barrowfield Road', NULL, 'Fort Washington', 'Maryland', '20744', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Chikoti', 'Wheat', 'chikotim@gmail.com', 'MD', 'Dermatology', 'Anne Arundel Dermatology', '1619210598', '6400 S Wind Circle', NULL, 'Columbia', 'MD', '21044', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Christine', 'Straessle', 'christinestraessle@gmail.com', 'DNP', 'Dermatology', 'Advanced Dermatology & Cosmetic Surgery', '1194378554', '25244 Compana Court', NULL, 'Punta Gorda', 'FL', '33983', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Connie', 'Wang', 'connie.wang@sanofi.com', 'PharmD', 'Dermatology', 'Sanofi', '1851983720', '9419 Corsica Dr', NULL, 'Bethesda', 'MD', '20814', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Courtney', 'Green', 'cgreen@kindredhairandskin.com', 'PA-C', 'Dermatology', 'Kindred Hair and Skin Center', '1457993222', '7552 Moraine Dr', NULL, 'Hanover', 'MD', '21076', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Crystal', 'Bonds', 'crystalcolbert@my.unt.edu', 'PhD', 'Oncology', 'N/A', NULL, '2300 Zaide way', NULL, 'Celina', 'TEXAS', '75009', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Cynthia', 'Spencer', 'cynspencer@yahoo.com', 'NP', 'Dermatology', 'Suncoast Skin Solutions', '1154705515', '2001 Siesta Drive Suite 201', NULL, 'sarasota', 'FL', '34239', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Danielle', 'LeClair', 'danielle.leclair@mac.com', 'CRNP', 'Dermatology', 'Clear Skin For You', '1225121098', '3213 Corporate Ct', NULL, 'Ellicott City', 'MD', '21042', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'David', 'Said', 'david.said@sanofi.com', 'PharmB,BCPS', 'Next Gen Immunology', 'Sanofi', '1346746401', '51 Rutgers Ave', NULL, 'Colonia', 'NJ', '07067', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Dianne', 'Aguilar-Zurita', 'graceaguilarzurita1@gmail.com', 'Student', 'Student', 'Student', NULL, '301 Tolbelt Ct', NULL, 'Stafford', 'VA', '22554', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Donna', 'Lam', 'dermwithdonna@gmail.com', 'PA-C', 'Dermatology', 'Center For Dermatology', '1760244719', '33 Monticello drive', NULL, 'Brewster', 'NY', '10509', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Edmundo', 'Barreto', 'edbarreto76@gmail.com', 'MSN, APRN, FNP-C', 'Dermatology', 'ADCS', '1346909421', '615 Williams Ave', NULL, 'Lehigh Acres', 'Florida', '33972', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Elana', 'Gebhard-Koenigstein', 'elanagebhard@gmail.com', 'NP-C', 'Dermatology', 'Emory Clinic', '1316516875', '1525 Clifton Rd NE', 'Floor 3', 'Atlanta', 'GA', '30322', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Emily', 'Moya', 'emchmoya@gmail.com', 'PA-C, MPAS', 'Dermatology', 'Advocate Health Wake Forest Baptist Health', '1205672862', '3729 Single Leaf Cir.', NULL, 'high point', 'NC', '27265', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Emily', 'Erickson', 'erickson.emilyr@gmail.com', 'PA-C', 'Dermatology', 'Central Iowa Dermatology', '1376776898', '14812 Walnut Meadows Dr', NULL, 'Urbandale', 'IA', '50323', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Emma', 'Cristiani-Nguyen', 'doc@moxieaura.com', 'DNP, FNP-BC', 'Aesthetic Medicine', 'Moxie Aura Aesthetics & Wellness', '1508057944', '5738 Mallow Trail', NULL, 'Lorton', 'VA', '22079', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Enid', 'Martinez', 'enidbeth3@gmail.com', 'PA-C', 'Dermatology', 'Advanced dermatology specialties', '1992007280', '9705 Blue Stone Cir', NULL, 'Fort Myers', 'FL', '33913', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Erica', 'Richmond', 'erica.richmond@lilly.com', 'PhD', 'Atopic Dermatitis', 'NA', NULL, '3275 E Nightingale Lane', NULL, 'Gilbert', 'Arizona', '85298', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Erin', 'Russell', 'eruss3179@yshoo.com', 'PA-C', 'Dermatology', 'Blackburn Woolfolk Dermatology', '1730591744', '6714 Old Settlers Way', NULL, 'Dallas', 'TX', '75236', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Eva', 'Zaragoza', 'evaamorzc@gmail.com', 'PA-C', 'Dermatology', 'Carolinas Dermatology and Plastic Surgery', '1972299121', '2352 Lang Ct', NULL, 'Columbia', 'South Carolina', '29204', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Evelina', 'Ingersoll', 'eingersoll@wederm.com', 'APRN', 'Dermatology', 'Water''s Edge Dermatology', '1124698527', '217 SE Kitching Circle', NULL, 'Stuart', 'FL', '34994', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Geneen', 'Gin', 'gtg2003@gmail.com', 'DO', 'Family Medicine', 'Family Medicine', '1144255217', '7149 caminito pantoja', NULL, 'San Diego', 'CA', '92122', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Gloria', 'Gooray', 'gmart86@yahoo.com', 'CRNP', 'Dermatology', 'Anne Arundel Dermatology', '1285398081', '15881 Kruhm Rd', NULL, 'Burtonsville', 'MD', '20866', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Halima', 'Archer-Idodo', 'halima.aidodo@gmail.com', 'PA-C', 'Dermatology', 'BSWH', '1386299261', '9900 China Spring Rd', 'Apt 2008', 'Waco', 'TX', '76708', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Hannah', 'Leonard', 'hannah2joy@yahoo.com', 'PA-C', 'Dermatology', 'ADCS clinics', '1154871887', '1955 Hillcrest Oak Drive', NULL, 'Deland', 'Florida', '32720', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Harish', 'Kasetty', 'harishkasetty@gmail.com', 'PA-C', 'Dermatology', 'Advanced Dermatology and Cosmetic Surgery', '1730851635', '260 S Osceola Ave', 'Unit 608', 'Orlando', 'FL', '32801', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Hersh', 'Joshi', 'hershjoshi2@gmail.com', 'PharmD', 'Pharmacy', 'Cook Children', '1083073639', '1459 Perrin Ln', NULL, 'Farmers Branch', 'TX', '75234', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Hiep', 'Ma', 'hiepma@me.com', 'MHS, PA-C', 'Dermatology', 'UC Davis', '1790328250', '2674 Cleat Ln', NULL, 'Sacramento', 'CA', '95818', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Hui', 'Lin', 'huilincatskillderm@gmail.com', 'PA-C', 'dermatology', 'Forefront derm', '1912687695', '4800 Dorsey Hall Dr Suite 140', NULL, 'Ellicott City', 'MD', '21042', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Jamie', 'Raisor', 'jbraisor@gmail.com', 'FNP', 'Dermatology', 'Dermatology Institute', '1235392424', '207 Junewood Dr', NULL, 'LaGrange', 'GA', '30241', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Jennifer', 'Silva', 'silvajennm@gmail.com', 'APRN', 'Dermatology', 'Central CT dermatology', '1093252462', '6 MIDDLEFIELD DR', NULL, 'West Hartford, CT', 'CT', '06107', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Jennifer', 'Middlebrooks', 'jsmith8866@gmail.com', 'PA-C', 'Dermatology', 'Malcolm Grow Medical Clinics & Surgery Center', '1922472711', '2627 E Meredith Dr', NULL, 'Vienna', 'VA', '22181', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Jennifer', 'Kallio', 'gatorjennpa@gmail.com', 'PA-C', 'Dermatology', 'Intergrated Dermatology', '1528022001', '12000 Inspiration St', '3308', 'Reston', 'VA', '20190', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Jessica', 'Mason', 'jessicawackowski@gmail.com', 'PA-C', 'Dermatology', 'Galaria Plastic Surgery and Dermatology', '1992992382', '24805 pinebrook rd', 'Suite 105', 'Chantilly', 'VA', '20152', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Joy', 'Green', 'joylgreen@gmail.com', 'PA-C', 'Dermatology', 'Onsite Dermatology', '1205289196', '3419 Southern Ave', NULL, 'Suitland', 'MD', '20746', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Juan Carlos', 'Delgado', 'juancarlosdelgado84@gmail.co', 'BSN', 'Dermatology', 'Vesper Aesthetics', '041492566', '3042 North Ashland Avenue', 'Apt 3', 'Chicago', 'IL', '60657', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Julie', 'Maughan', 'julieannemd@yahoo.com', 'MD', 'Dermatology', 'Wasatch Dermatology', '1114098357', '5734 South 1475 East', 'Suite 300', 'South Ogden', 'Utah', '84403', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Kadi', 'Sillah', 'silka2011@yahoo.com', 'FNP Student - 2nd year', 'Intervention Radiology', 'Howard University Hospital', '000000000', '10914 Georgia Ave', 'Apt 651', 'Silver Spring', 'MD', '20902', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Kamala', 'Nola', 'kamala.nola@sanofi.com', 'PharmD', 'Dermatology', 'Sanofi', '1013134311', '753 Bresslyn Rd', NULL, 'Nashville', 'TN', '37205', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Karem', 'Saund', 'karem.saund.pa@gmail.com', 'PA-C', 'Dermatology', 'ADCS - Alexandria', '1679169890', '1010 S Taylor Ct', NULL, 'Arlington', 'VA', '22204', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Karla', 'Navarro', 'karlan922@gmail.com', 'BA', 'Medicine', 'N/A', NULL, '1565 Woodside Dr', NULL, 'East Lansing', 'Michigan', '48823-7777', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Katherine', 'Wagner', 'kewagner18@gmail.com', 'PA-C', 'Dermatology', 'Forefront Dermatology', '1972345072', '7523 Thistledown Trail', NULL, 'Fairfax Station', 'VA', '22039', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Katy', 'Duffy', 'katyduffy12@gmail.com', 'PA-C', 'Dermatology', 'Forefront Dermatology', '1851708291', '2085 SE Parkview Crossing Dr', NULL, 'Waukee', 'IA', '50263', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Kellie Smaldore', 'Smaldore', 'drksmaldore@mdvip.com', 'DO', 'Family  medicine', 'DRS STEVE & KELLIE  SMALDORE FAMILY PRACTICE, INC', '1356335095', '2227 Old Emmorton Rd  Ste 218', 'Bel AIr MD 21015', 'Bel Air', 'Maryland', '21015', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Kelly', 'Linero', 'kelkraw@gmail.com', 'MS, PA-C', 'Family Practice/Pediatrics', 'Mary''s Center', '1487794095', '3415b S Stafford St', NULL, 'Arlington', 'VA', '22206', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Kendra', 'Salazar', 'kendra.salazar@forefrontderm.com', 'MPAS, PA-C', 'Dermatology', 'Advanced dermatology a forefront dermatology practice', '1770796872', '1235 lake pointe parkway', 'Ste 200', 'Sugarland', 'Texas', '77478', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Kennedy', 'Lewis', 'kennlewisss@gmail.com', 'DMS, PA-C', 'Primary care', 'Kelly Collaborative Medicine', '1740968239', '10801 Lockwood Dr', NULL, 'Silver Spring', 'MD', '20901', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Kimberly', 'Bertrand', 'kbeezee05@gmail.com', 'PA-C', 'ENT', 'Pursuing Higher Education', '1619253937', '11608 Brookston Dr', NULL, 'Ocean Springs', 'MS', '39564', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Kimberly', 'McPeeks', 'kimberly.mcpeeks@advocatehealth.org', 'PA-C', 'Dermatology', 'AHWFB Dermatology', '1629544689', '4618 Country Club Road', NULL, 'Winston Salem', 'NC', '27104', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Lauren', 'Sukri', 'lauren.sukri@gmail.com', 'PA-C', 'Dermatology', 'Anne Arundel Dermatology', '1164290656', '330 Community Center Ave', NULL, 'Gaithersburg', 'Maryland', '20878', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Leslie', 'Thompson', 'mslesliethompson1@gmail.com', 'RN, FNP-S', 'Dermatology', 'Student', NULL, '2001 W Cold Spring Ln', 'Apt 538', 'Baltimore', 'MD', '21209', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Lindita', 'Vinca', 'lvinca@me.com', 'DNP, APRN', 'Dermatology', 'Dermatology Physicians of CT', '1396093993', '32 Cedar Hill Road', NULL, 'Newtown', 'CT', '06470', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Lisa', 'Harewood', 'lkhare08@yahoo.com', 'PA-C', 'Dermatology', 'Central Dermatology Center', '1124094537', '812 Clausun Dr', NULL, 'Durham', 'NC', '27713', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Luisa', 'Ramos', 'lramos27@me.com', 'RN', 'Aesthetics', 'Anne Arundel Dermatology', NULL, '8011 Gabriels Ct', NULL, 'Jessup', 'MD', '20794', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Lynn', 'Luckett', 'info@shaperzwellness.com', 'APRN', 'Aesthetics', 'Shaperz Elite Wellness and Aesthetics', '1114438249', '3135 W 111TH ST, Unit R', NULL, 'Chicago', 'IL', '60655', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Margaret', 'Mayer', 'mayerm2@sunyit.edu', 'DCNP', 'Dermatology', 'Invision Health Dermatology', '1124436506', '30-3 Carriage Drive', NULL, 'Orchard Park', 'New York', '14127', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Margarita', 'Vega Suarez', 'mvsuareznp@att.net', 'NP-C', 'Dermatology', 'Whittington Dermatology', '1003368606', '7835 Grand BLVD', NULL, 'Hobart', 'In', '46342', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Maria', 'Abuawad Oropeza', 'maria.abuawad@yahoo.com', 'Physician Assistant', 'dermatology', 'Tamjidi Skin Institute', '1346849569', '2 Wisconsin Ave', NULL, 'Chevy Chase', 'Maryland', '20815', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Maria', 'Kabushinskaya', 'mkabushinskaya@yahoo.com', 'PA-C', 'Dermatology', 'Riverchase Dermatology', '1952811283', '10036 Ravello blvd', NULL, 'Fort Myers', 'Florida', '33905', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Mariam', 'Rabiu', 'mariamorabiu@gmail.com', 'DNP, FNP-BC', 'Dermatology', 'New Grad FNP - Transitioning into Dermatology', '1821847559', '4641 Montrose Blvd', 'Apt 832', 'Houston', 'TX', '77006', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Marianne', 'Woody', 'marianne.woody@gmail.com', 'NP', 'Dermatology', 'Pittsburgh Dermatology-Monroeville', '1447299946', '2217 Woodmont Drive', NULL, 'Export', 'PA', '15632', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Marlicia', 'Perry', 'marlicia.perry@gmail.com', 'DNP, APRN, FNP-BC', 'Primary Care', 'VA', '1952166860', '6306 Camino Drive', NULL, 'Apollo Beach', 'FL', '33572', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Mary', 'Carmon', 'marycarmon@bellsouth.net', 'NP', 'Dermatology', 'Dermatology Associates Skin & Cancer Center', '1558781534', '1034 W 8th St', NULL, 'Panama City', 'FL', '32401', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Maryann', 'Thomas', 'maryann@comprehensivelaser.com', 'FNP-C', 'Aesthetic Dermatology', 'Comprehensive Laser and Aesthetics', '1528649605', '13061 Clarksburg Square Rd', NULL, 'Clarksburg', 'Maryland', '20871', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Maxine', 'Pascal', 'maxinepascal1@gmail.com', 'PA-C', 'Dermatology', 'Aura Dermatology', '1356064380', '85 village drive', NULL, 'Morristown', 'New Jersey', '07960', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Maya', 'Sandlin', 'maya.sandlin@gmail.com', 'Student', 'Student', 'Student', NULL, '35 Madison Drive', NULL, 'Laurel Springs', 'NJ', '08021', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Megan', 'Urquhart', 'megan.urquhart@arlingtondermatology.net', 'PA-C', 'Dermatology', 'Arlington Dermatology', '1790313146', '5301 Keystone Ct', NULL, 'Rolling Meadows', 'IL', '60008', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Meghan', 'Bramer', 'mashley727@gmail.com', 'MMS, PA-C', 'Dermatology', 'Oak Dermatology', '1437484367', '3100 Theodore Street', 'Ste 203', 'Joliet', 'Illinois', '60435', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Melanie', 'Snyder', 'msniemeyer22@gmail.com', 'PA-C', 'Dermatology', 'Marjan Yousefi, M.D., PA', '1487069605', '2524 Heathcliff Lane', NULL, 'Reston', 'VA', '20191', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Morgan', 'Stomel', 'morgan.stomel@gmail.com', 'PA-C', 'Dermatology', 'Brinton Lake Dermatology', '1699443358', '25 Stanwyck Rd', NULL, 'mount laurel', 'nj', '08054', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Morgan', 'Jackson', 'morgan.r.jackson@outlook.com', 'PA-C', 'Dermatology', 'Brevard Medical Dermatology', '1073075453', '4700 Ocean Beach Blvd', 'Unit 504', 'Cocoa Beach', 'Florida', '32931', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Natasha', 'McIver', 'npmciver@gmail.com', 'RN', 'Dermatology-Oncology', 'Inova Schar Cancer Institute', NULL, '11803 Carriage House Drive', NULL, 'Silver Spring', 'MD', '20904-2284', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Nichola', 'DiBattista', 'yeomansn@yahoo.com', 'PA-C', 'Emergency', 'Paoli hospital', NULL, '6 Jenkins Dr', NULL, 'Downingtown', 'Pennsylvania', '19335', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Nicolas', 'Betancourt', 'nicolas.betancourt@duke.edu', 'MD, PGY3', 'Dermatology', 'Duke Dermatology Residency', '1124720339', '116 Tamworth Crk', NULL, 'Durham', 'NC', '27707', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Nicole', 'Richards', 'nyrichards71@gmail.com', 'RN, BSN, MSN', 'Family Medicine', 'Nephrology Associates', '1033302955', '2259 Rutledge Street', NULL, 'Gary', 'Indiana', '464010', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Nilana', 'Gunasekaran', 'nilana.s.gunasekaran@kp.org', 'MD', 'Family Medicine', 'Northwest Permanente PC', '1942393673', '2527 NE 26th Avenue', NULL, 'Portland', 'OR', '97212', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Nina', 'Harry', 'nina@comprehensivelaser.com', 'FNP-BC', 'Cosmetic Dermatology', 'Comprehensive Laser & Aesthetics', '1417461005', '10500 Little Patuxent Parkway', 'Suite 400', 'Columbia', 'MD', '21044', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Nina', 'Rusiana', 'nina.rusiana13@gmail.com', 'DNP, APRN, FNP-BC', 'Dermatology', 'Midwest Dermatology', '1376828194', '1311 Summersweet Ln', NULL, 'Bartlett', 'IL', '60103', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Nyshia', 'Garcia', 'nyshiag13@gmail.com', 'PA-C', 'Dermatology', 'UIHC', '1710510987', '1287 Terrapin Drive', NULL, 'Iowa City', 'Iowa', '52240', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Obehi', 'Oriaifo', 'contact@dermanp.com', 'DNP, FNP-BC, DCNP', 'Dermatology', 'VA CENTRAL IOWA', '1487351649', '3902 NW 14TH CT', NULL, 'ANKENY', 'IOWA', '50023', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Olga', 'Forman', 'osaprygina@gmail.com', 'PA-C', 'Dermatology', 'Schweiger Dermatology Group', '1659505675', '14445 Cedar Hill Drive', NULL, 'Winter Garden', 'FL', '34787', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Paola', 'Gonzalez', 'paolagonzalez.pac@gmail.com', 'MPAS, PA-C', 'Oncology', 'UT MD Anderson Cancer Center', '1407895204', '2610 Lazy Vine Ln', NULL, 'Missouri City', 'Texas', '77459', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Parth', 'Patel', 'ppatel@alumis.com', 'PA-C', 'Dermatology', 'Alumis', '1447744453', '280 East Grand Avenue', NULL, 'South San Francisco', 'CA', '94080', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Patrice', 'Simon', 'lily3797@gmail.com', 'MPAS, PA-C', 'Dermatology', 'Legacy Dermatology and Restoration Center', '1427326198', '4236 Live Springs Rd', NULL, 'Frisco', 'TX', '75036', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Patty', 'Debosz', 'patty27d@gmail.com', 'PA-C', 'Dermatology', 'Franciscan Physician Network', '1588478713', '3073 Pemberly Dr', 'Ap 214', 'West Lafayette', 'IN', '47906', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Paula', 'Atueyi', 'pcatueyi@gmail.com', 'DNP, FNP-BC', 'Dermatology', 'Lahey Hospital and Medical Center', '1700826186', '4966 Lockard Dr', NULL, 'Owings Mills', 'MD', '21117', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Phoebe', 'Pelkey', 'phoebep2@gmail.com', 'PA-C MPAS', 'Dermatology', 'Four Seasons Dermatology', '1811990104', '20 Winooski St', NULL, 'Waterbury', 'VT', '05676', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Rachael', 'Eaton', 'rachaeleaton02@gmail.com', 'PharmD, MBA', 'Dermatology', 'Organon LLC', '1124645478', '610 Deer Run Road', NULL, 'Westerville', 'OH', '43081', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Rachel', 'Keller', 'rkeller@icderm.com', 'PA', 'Dermatology', 'intracoastal dermatology', '1366969735', '971 bent creek drive', NULL, 'St. Johns', 'fl', '32259', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'RaeAnn', 'Raisor', 'raeann.raisor@gmail.com', 'NP-C', 'Urgent Care', 'The Little Clinic', '1245754738', '9195 w 89th ct', NULL, 'Westminster', 'CO', '80023', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Ravy', 'Chan', 'ravychan.pa@gmail.com', 'DMSc, PA-C', 'Dermatology', 'SDG', '1902116296', '3088 MILES AVE', NULL, 'BRONX', 'NY', '10465', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Renita', 'White', 'renitapac@gmail.com', 'PA-C', 'Urgent Care/Addiction Medicine', 'USAR/Miles Square Auburn Gresham', '1396871687', '3060 Valentina Way', 'Apt 201', 'Fayetteville', 'NC', '28303', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Richard', 'Cox', 'arcox2@gmail.com', 'PhD', 'Clinical Research', 'UTHealth Houston', NULL, '1825 Pressler St', NULL, 'Houston', 'TX', '77459', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Ritu', 'Gupta', 'rgzilch@gmail.com', 'Clinical Assoc. Director', 'Dermatology', 'Juvon Skincare & Wellness', '1922344399', 'Po 471', NULL, 'Three Bridges', 'Nj', '08887', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Roshni', 'Padhiar', 'rpadhiar@dermpartners.com', 'PA-C', 'Dermatology', 'Dermatology Partners', '1154297893', '10 Fila Way Suite 205', NULL, 'Sparks', 'Maryland', '21152', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Roxanne', 'Anthony', 'roxanne.edwards18@gmail.com', 'PA', 'Dermatology', 'Emory Healthcare', '1841793817', '4223 Perimeter Park E', NULL, 'Chamblee', 'GA', '30341', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Ruby', 'Bush', 'r.trujillo08@hotmail.com', 'PA-C', 'Dermatology', 'Advanced Dermatology', '1598398018', '1223 Nantes Ct', NULL, 'PUNTA GORDA', 'FL', '33983', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Sabrina', 'Li', 'sabrinali888@gmail.com', 'PA-S2', 'Dermatology', 'US Dermatology Partners', '1295606788', '9701 Fields Rd Apt #908', 'Apt 908', 'GAITHERSBURG', 'MD', '20878', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Sara', 'Pulayya', 'saracox.pa@hotmail.com', 'PA-C', 'Dermatology', 'Intracoastal Dermatology', '1225558703', '5372 Grey Heron Lane', NULL, 'Jacksonville', 'FL', '32257', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Sarah', 'Truex', 's.truex@aol.com', 'FNP-BC, DCNP', 'Dermatology', 'OHIO VALLEY DERMATOLOGY', '1689926180', '3829 MARLAND HEIGHTS ROAD', NULL, 'WEIRTON', 'WV', '26062', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Sarah', 'Burkart', 'sburkart16@yahoo.com', 'MPAS, PA-C', 'Dermatology', 'Riverchase Dermatology', '1396810511', '4749 Turnstone Ct', NULL, 'Naples', 'FL', '34119', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Sharona', 'Loewenstein', 'srl@tampabay.rr.com', 'PA-C', 'Internal Medicine/Dermatology', 'Access Healthcare, LLC', '1558458471', '5444 Fern Drive', NULL, 'Week Wachee', 'Florida', '34607', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Shelley', 'Fox', 'shelleyhfox@gmail.com', 'DNP', 'Dermatology', 'Boutique Dermatology', '1255603817', '1400 S Orlando Ave, Winter Park, FL 32789, USA', 'Suite 101', 'Winter Park', 'FL', '32751', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Silvio', 'Coelho', 'silvio.gbissau@gmail.com', NULL, 'Dermatologista', 'Silvio Coelho', '00253021', 'Guiné Bissau,', 'Antula Rua Lisboa 1ra casa direita', 'Bissau', 'Bissau', 'Bissau', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Simone', 'Bergman', 'sbergman@som.umaryland.edu', 'FNP BC', 'Dermatology', 'University of Maryland', '1558171835', '419 w redwood street', 'suite 160', 'baltimore', 'MD', '21201', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Sonja', 'Baer', 'srbaer369@gmail.com', 'MSE MPAS PAC', 'Dermatology', 'Academic Alliance in Dermatology', '1265611966', '12122 54th Dr E', 'Apt F-405', 'Bradenton', 'IA', '34211', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Stacey', 'Villegas', 'stacey@vibrant-aesthetics.com', 'NP', 'Aesthetics', 'Vesper Aesthetics', '1225803042', '4343 N Clarendon Ave', 'Unit 1512', 'Chicago', 'IL', '60613', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Stacy', 'Hernandez', 'stacya67@yahoo.com', 'FNP-BC', 'Dermatology', 'Forefront Dermatology', '1215434253', '2027 Genevieve Trl', NULL, 'Williamsburg', 'VA', '23185', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Steve', 'Smaldore', 'drssmaldore@mdvip.com', 'DO', 'Family medicine', 'Drs. Steve and Kellie Smaldore Family Practice', '1427042167', '1004 Walters Mill Road', NULL, 'FOREST HILL', 'MD', '21050-1418', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Takirah', 'Bond', 'takirah.bond@adcsclinics.com', 'PA-C', 'Dermatology', 'Advanced Dermatology', '1184426694', '21759 Hunter Circle North', NULL, 'Taylor', 'Michigan', '48180', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Tamara', 'Boskovic', 'boskovic.tam@gmail.com', 'PA-C', 'Dermatology', 'Skin & Laser Dermatology', '1184402638', '1824 Belmont Rd NW', 'Apt 42', 'Washington', 'DC', '20009', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Tierra', 'Hurd', 'tierra.hurd23@gmail.com', 'PA-C', 'Dermatology', 'Johns Hopkins', '1679744296', '7654 Maple Lawn Blvd', 'Unit 1', 'Fulton', 'MD', '20759', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Tina', 'Davis', 'tina.davis@regeneron.com', 'FNP', 'Family', 'Regeneron', '1568962611', '16 Elwood Lane', NULL, 'Pine Grove', 'PA', '17963', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Tyler', 'Le', 'thai12396@gmail.com', 'PA-C', 'Urgent Care', 'Endeavor Health', '1831905124', '3740 N Halsted St', 'Apt #408', 'Chicago', 'IL', '60613', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Umparrys', 'Witherspoon', 'glmrgrl98@gmail.com', 'DNP, FNP-BC', 'Dermatology', 'Skintuition & Wellness', '1700336799', '20211 W Hollyhock St', NULL, 'Buckeye', 'AZ', '85396', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Yanique', 'Roberts', 'yroberts11235@gmail.com', 'RN BSN', 'Pediatrics', 'Walter reed military hospital', NULL, '18047 cottage garden dr', 'Apt 101', 'Germantown', 'Md', '20874', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Yasmin', 'Mathlin', 'ymathlin@gmail.com', 'DNP, DCNP', 'Dermatology', 'Maximus', '1902385784', '641 Walker St.', NULL, 'Fayetteville', 'North Carolina', '28311', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Yewande', 'Komolafe', 'yewandearike@gmail.com', 'PA-C', 'Allergy and Aesthetics', 'June Skin and ILERA Allergy', '1023833571', '2918 Galeshead Drive', NULL, 'UPPER MARLBORO', 'MD', '20774', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Zach', 'Dawson', 'zach.dawson@lilly.com', 'PhD', 'Dermatology', 'NA', NULL, '4724 Auburn Ford', NULL, 'Greenwood', 'IN', '46142', 'attendee', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, credentials, specialty, institution, npi_number, street_address, street_address_2, city, state, postal_code, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Zayna', 'Qaissi', 'z0qais01@louisville.edu', 'MD Candidate', 'Internal', 'Associates in Derm', '1821849811', '9514 Dabney Carr Drive', NULL, 'Louisville', 'KY', '40299', 'attendee', false, false, false);

  -- Total attendees inserted: 142

  -- =============================================
  -- Import Industry Partners (badge_type = 'industry')
  -- =============================================
  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Yaasmeen', 'Spencer', 'yaasmeen.spencer@abbvie.com', 'AbbVie', 'US Strategic Marketing Dermatology', 'North Chicago', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Gianna', 'Jablonowski', 'gianna.jablonowski@abbvie.com', 'AbbVie', 'US Strategic Marketing Dermatology', 'North Chicago', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'George', 'Howard', 'george.howard@abbvie.com', 'AbbVie', 'US Strategic Marketing Dermatology', 'North Chicago', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Brittany', 'Clause', 'brittany.clause@abbvie.com', 'AbbVie', 'US Strategic Marketing Dermatology', 'North Chicago', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Jennifer', 'Bennett', 'jennifer.bennett@chiesi.com', 'Chiesi', 'Rare Disease Partner', 'Nashville', 'TN', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Rob', 'Morales', 'rob.morales@chiesi.com', 'Chiesi Global Rare Diseases', 'Key Account Manager', 'Boston', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Pia', 'Shawa', 'pia.shawa@galderma.com', 'Galderma', 'Executive Account Manager, Immunology', 'Miami', 'FL', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Karen', 'Merchant', 'karen.merchant@galderma.com', 'Galderma', 'Dermatology Skin Health Professional', 'Miami', 'FL', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Patricia', 'Batista', 'pbatista@incyte.com', 'Incyte', 'Associate Director Field Access', 'Wilmington', 'DE', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Tim', 'Bentley', 'tbentley@incyte.com', 'Incyte', NULL, 'Wilmington', 'DE', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Archana', 'Sangha', 'asangha@incyte.com', 'Incyte', NULL, 'Wilmington', 'DE', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Christina', 'Chaney', 'cchaney@incyte.com', 'Incyte', NULL, 'Wilmington', 'DE', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Rebecca', 'Klausman', 'rklausman@incyte.com', 'Incyte', NULL, 'Wilmington', 'DE', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Jim', 'Rigby', 'jrigby@incyte.com', 'Incyte', NULL, 'Wilmington', 'DE', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Colleen', 'Sanders', 'csanders@incyte.com', 'Incyte', NULL, 'Wilmington', 'DE', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Mike', 'Carruth', 'mcarrut4@its.jnj.com', 'J&J', 'Director, TLL', 'Argyle', 'TX', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Stephanie', 'Best', 'sbest1@its.jnj.com', 'Johnson & Johnson', 'Executive Key Account Specialist', 'Annapolis', 'MD', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Cordella', 'Torbert', 'ctorbert@its.jnj.com', 'Johnson & Johnson', 'Senior Immunology Specialist, Dermatology', 'Mechanicsville', 'MD', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Yuneisla', 'Harris', 'harris-yharris2@its.jnj.com', 'Johnson & Johnson', 'Dermatology Sales Specialist', 'Washington DC', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Beverly', 'O''Connor', 'boconnor@its.jnj.com', 'Johnson & Johnson', 'District Manager', 'Washington DC', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Edward', 'Saidat', 'esaidat@its.jnj.com', 'Johnson & Johnson', 'Thought Leader Liaison', 'Des Moines', 'IA', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Sarah', 'Lewis', 'salew@leo-pharma.com', 'LEO Pharma', 'Therapeutic Sales Specialist', 'Rockville. Maryland', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Juanita', 'McGowan', 'jumco@leo-pharma.com', 'Leo Pharma', 'Rare Disease Sales Consultant', 'Atlanta', 'GA', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Sindhu', 'Sahadevan', 'sisah@leo-pharma.com', 'LEO Pharma', 'Medical Science Liaison', 'Richmond', 'VA', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Chuck', 'McAllister', 'chuck.mcallister@organon.com', 'Organon', 'Strategic Relations Director', 'Baton Rouge', 'Louisiana', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Dee', 'Campbell', 'dee.campbell@organon.com', 'Organon', 'Territory Business Manager', 'BALTIMORE', 'MD', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Kevin', 'Speyer', 'kevin.speyer@organon.com', 'Organon', 'Director of Strategic Relations', 'Medina', 'Ohio', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Tamar', 'Kasbarian', 'tamar.kasbarian@organon.com', 'Organon', 'Territory Business Manager', 'WASHINGTON', 'DC', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Alissa', 'Bramble', 'abramble@sknv.com', 'SKNV', 'Consultant', 'Pompano Beach', 'FL', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Rick', 'Cocchi', 'rcocchi@sknv.com', 'SKNV', 'Manager', 'Pompano Beach', 'FL', 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Chanwook', 'Kim', 'chanwook.kim@takeda.com', 'Takeda', 'Medical Sciences Liasion', 'Cambridge', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Evelyne', 'Ntam', 'evelyne.ntam@takeda.com', 'Takeda', 'Senior MSL', 'Cambridge', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Marilynn', 'Oliphant', 'marilynn.oliphant@takeda.com', 'Takeda', 'Director', 'Cambridge', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Michele', 'Dahan', 'michele.dahan@takeda.com', 'Takeda', 'Associate Director', 'Cambridge', NULL, 'industry', false, false, false);

  INSERT INTO attendees (event_id, organization_id, first_name, last_name, email, institution, title, city, state, badge_type, checked_in, badge_generated, badge_printed)
  VALUES (v_event_id, v_org_id, 'Rhonda', 'Peebles', 'rhonda.peebles@ucb.com', 'UCB, Inc.', 'Head of Dermatology - US', 'Smyrna', NULL, 'industry', false, false, false);

  -- Total industry partners inserted: 35

END $$;