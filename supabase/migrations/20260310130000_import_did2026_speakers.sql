-- Import DID 2026 faculty, leaders, and guest speakers
DO $$
DECLARE
  v_event_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'diversity-in-dermatology-2026' LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'DID 2026 event not found';
  END IF;

  -- ============================================================
  -- FACULTY (role='faculty') — 15 speakers from CSV + bios
  -- ============================================================

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Roni Bolton', 'ARNP, DCNP', 'roni@psrxbodyandskin.com',
   'Roni Bolton, MSN, FNP-C is a board-certified nurse practitioner. Her patients lovingly call her Nurse Roni B. She opened PSRx Body and Skin in 2018 after gaining considerable experience in dermatology, plastic surgery, and aesthetic medicine. Nurse Roni B. received her Masters of Nursing Practice at Rush University in Chicago and is currently pursuing her doctorate. She has gained special clinical experience in dermatology through Illinois Dermatology Institute and Advocate Pediatric Dermatology and is a member of the Dermatology Nurse''s Association.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Tracee Blackburn', 'MMIS, PA-C', 'pa.derm@yahoo.com',
   'Tracee Blackburn is a Board-Certified Physician Assistant, nationally certified by the National Commission on Certification of Physician Assistants (NCCPA) and licensed by the state of Illinois. She has been serving in the healthcare industry since 1998 and has specialized as a PA in Dermatology since 2005. She also had the privilege of practicing in Adolescent and Pediatric Health and enjoys interacting with and treating children and teens. Tracee graduated from Midwestern University in Downers Grove, Illinois in 2005. She has worked in several entities of healthcare, but found her passion in Dermatology where she has extensive experience in general, surgical, and cosmetic dermatology. Her special interests are anything that has to do with skin and hair, but specifically; acne, alopecia, eczema, psoriasis, hidradenitis suppurativa, and skin lesions. Tracee likes to focus her attention on patient education, as she believes it is a vital part to every patient''s recovery. She also holds a Masters degree in Integrative Medicine and specializes in Integrative Dermatology. She is an active member of the Society of Dermatology Physician Assistants, and an active member and former President and Director at Large of the Illinois SDPA. She enjoys volunteering her time where needed, such as the National Eczema Association, and has also participated in medical mission trips with CHAI to Haiti. Currently she is serving as the Co-chair of Integrative Dermatology for Diversity in Dermatology. Tracee is a published author and has written three childrens'' books entitled "Wally The Wart", "Xzema, A Children''s Guide to Happy Skin", and "My Eczellent Day at Camp" (in collaboration with Sanofi-Regeneron.) She is also a speaker, mentor, and creator of Project Skin-X, her passion project to help those in need of their dermatologic concerns, while helping to boost their self-confidence.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Adriana Cruz', 'MD', 'adricruza@gmail.com',
   'Adriana R. Cruz, MD, is a board-certified dermatologist with more than 20 years of clinical, academic, and research experience. Trained at Universidad del Valle and UConn Health, she has led initiatives in STDs, tropical dermatology, integrative dermatology, and Medical Affairs across Latin America and the United States. She currently practices dermatology and contributes to population-health and value-based-care programs in Southern Maryland. Committed to social responsibility, Adriana has participated in community health brigades serving underserved regions. Beyond her professional life, she is a proud mother of three, happily married, and finds joy in nature, outdoor adventures, and time with loved ones.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Ahuva Cices', 'MD', 'adcices@gmail.com',
   'Dr. Cices is a comprehensive medical and cosmetic dermatologist. She provides personalized, compassionate care to all her patients. Having trained in New York City and completed a fellowship at the Mount Sinai Skin of Color Center, Dr. Cices is well prepared to care for patients of all skin types and backgrounds. Dr. Cices graduated summa cum laude and Phi Beta Kappa with a degree in Biology from Rutgers University. She earned her medical degree from SUNY Downstate Medical Center in Brooklyn where she was elected to the Alpha Omega Alpha (AOA) honor society and was the recipient of the prestigious American Medical Women''s Association Glasgow-Rubin Award for academic excellence. After medical school, Dr. Cices completed her medical internship at Mount Sinai, followed by a two-year dermatopharmacology fellowship at Mount Sinai as part of the Skin of Color Center. She also completed her dermatology residency at Mount Sinai, where she served as Chief Resident in her final year. Dr. Cices has served as an investigator in numerous clinical trials involving a wide range of skin conditions, is well published in peer-reviewed medical journals and textbooks, and has presented her research at national medical and aesthetic dermatology conferences.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Diego DaSilva', 'MD', 'ddasilvamd@gmail.com',
   'Dr. Diego Ruiz Dasilva is an Ivy-League trained, board-certified dermatologist practicing in Virginia Beach and Hampton, Virginia. He was born in Brazil and raised in South Florida where he attended the University of Miami for his undergraduate degree and was inducted into the Phi Beta Kappa Honor Society and the Mortar Board National College Senior Honor Society. He graduated summa cum laude with degrees in Art History, Biology, and Chemistry. Dr. Dasilva was then granted a full scholarship to attend the prestigious Perelman School of Medicine at the University of Pennsylvania. He subsequently completed his internship and Dermatology Residency at the Hospital of the University of Pennsylvania, the top-ranked dermatology residency program in the country. He received rigorous training in adult and pediatric dermatology at some of the nation''s best hospitals with world-renowned experts in dermatology which allowed him to develop an expertise in chronic pruritus, psychodermatology/dysesthesia, skin of color, skin cancer, nail surgery, and cosmetics. Dr. Dasilva has authored several scientific papers in prestigious publications such as the Journal of the American Academy of Dermatology, Dermatopathology, and the Dermatology Online Journal. Dr. Dasilva specializes in both pediatric and adult dermatology, practicing medical, surgical, and cosmetic dermatology. Dr. Dasilva is fluent in English, Portuguese, and Spanish.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Scott Drew', 'DO, FAAD', 'spfxv@aol.com',
   'Dr. Scott Drew is a board-certified dermatologist who has practiced in Marion, OH, since 1992. He earned his medical degree from A.T. Still University of Health Sciences, followed by a rotating internship at Normandy Hospitals in St. Louis, MO, a Family Practice Residency in Stratford, NJ, and a Dermatology Residency at Deaconess Medical Center in St. Louis, MO. He is board certified in both Dermatology and Family Practice. Dr. Drew practices medical and surgical dermatology, provides cosmetic dermatologic services, and participates in multiple dermatologic research protocols at five locations in central Ohio. He has been published in numerous peer-reviewed journals, contributed to scientific symposia, and authored textbook chapters. He is passionate about education, frequently teaching in didactic, bedside, and podium settings, and has lectured extensively across the U.S. and internationally on medical, surgical, and cosmetic dermatology. As a dedicated volunteer, Dr. Drew also serves as Vice President for Dermatologic Services with Power of a Nickel, an organization combining international medical outreach with medical student education. He has participated in more than 20 medical missions in Uganda, Kenya, Malawi, India, Vietnam, Peru, Cuba, and Nicaragua.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Walter Liszewski', 'MD', 'walter.liszewski@nm.org',
   'Walter Liszewski is an Associate Professor of Dermatology and Cancer Epidemiology at Northwestern University in Chicago. He runs one of the busiest patch testing clinics in the country where he tests over 50 patients per month. Dr. Liszewski has served on the board of the American Contact Dermatitis Society, and he has published over 80 peer-reviewed papers. At Northwestern, he serves as the clinic practice director, runs numerous clinical trials, and he has specialty clinics in atopic dermatitis, chronic urticaria, and men''s health. In his spare time, he enjoys playing retro video games.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Amanda Hill', 'MD', 'ahill@docsdermgroup.com',
   NULL,
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Naiem Issa', 'MD, PhD', 'drnaiemissa@gmail.com',
   'Dr. Naiem Issa is a board-certified dermatologist and dermatologic surgeon who trained at the University of Miami. Through his training and his 12-year education at Georgetown University, Dr. Issa has seen and treated both common, complex, and rare skin conditions and novel treatment options for them. As a physician, Dr. Issa believes in the idea of caring for the whole person. His practice of medicine revolves around his patients, not just their illnesses. He strives to know his patients in the most comprehensive manner so they are comfortable and confident in their journey through care. As a dermatologist and prolific researcher in drug development, Dr. Issa gets to be a detective, surgeon, and researcher day in and day out. He has made numerous advancements such as discovering the use of the anti-hookworm medication mebendazole as an anti-cancer agent and being the first to try the JAK-inhibitor ruxolitinib in a rare deadly case of cutaneous lymphoma. Additionally, he is an expert in hair medicine, having trained under the renowned Dr. Antonella Tosti (Miami) and Dr. Sergio Vano-Galvan (Spain) as a member of the American Hair Research Society mentorship program. He strives to bring the newest technologies to his patients to optimize hair treatments. Dr. Issa is a native of Springfield, Virginia, and spent most of his life in Northern Virginia and Washington, D.C. Dr. Issa is fluent in English, Arabic, and Spanish.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Meena Julapalli', 'MD', 'drjulapalli@bluebirddermatology.com',
   'Growing up in Alabama, Louisiana, and Texas, Dr. Julapalli is a Southern girl through and through. She graduated cum laude from Rice University with a B.A. in Ancient Mediterranean Civilizations. She completed medical school, pediatrics residency, and dermatology residency at Baylor College of Medicine and fellowship training in pediatric dermatology at the University of Colorado. She became board-certified in pediatrics, dermatology, and pediatric dermatology, and served on faculty at Dell Children''s Medical Center and Children''s Hospital Colorado as an Assistant Professor of Dermatology. After practicing for the last 7 years in Austin and Denver, Dr. Julapalli knew it was time to return to her hometown of Houston, Texas. She is proud and excited to help her fellow Houstonians with all their unique skin care needs! As a pediatric dermatologist, Dr. Julapalli has a passion for providing comprehensive care that acknowledges and supports more than just the physical aspects of her patients'' skin conditions, but also the social and emotional needs of her patients as well. She believes that when children and families affected by skin disease have a space and community where they feel loved and supported, it empowers and transforms them in profound and life-changing ways.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Karan Lal', 'DO, FAAD', 'kdermlal@gmail.com',
   'Dr. Karan Lal is a double board-certified dermatologist, who specializes in pediatrics and adult dermatology, laser surgery, soft tissue filler augmentation, body sculpting, and pigmentary abnormalities of the skin and enjoys treating patients from birth onwards. He is on the ELLE magazine and Good Housekeeping medical advisory boards. He is an internationally renowned speaker.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Ginger Lore', 'Esq', 'ginger@gingerlore.com',
   'Ginger earned an undergraduate degree in Communication from Florida State University in Tallahassee, Florida in 1994. After college she relocated to Orlando and worked for a law firm for several years. Ginger attended law school at DePaul University College of Law in Chicago, Illinois and graduated with a Juris Doctor degree in 2002. Ginger and her husband returned to the Orlando area in 2002. For several years she worked in the area of insurance defense for a well-known Orlando firm where she primarily handled medical malpractice and premises liability matters. Ginger also served as in-house counsel for a small company and handled family law matters before finding her true passion in the area of estate planning, probate, elder law and guardianship. Ginger served as a Guardian ad Litem for children who have been neglected and abused for 3 years and served on the board for Lift Disability Network for 2 years. She has also served as a Guardian ad Litem for injured children since 2008. Ginger is an active member of her community and enjoys spending time with her family and running. Ginger enjoys working with clients of all ages and their families to plan for the future or to resolve current legal issues.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Ted Rosen', 'MD', 'vampireted@aol.com',
   'Dr. Rosen, a native of Chicago, attended Michigan State University as a National Merit Scholar, and graduated from the University of Michigan Medical School cum laude. He trained in internal medicine at the University of Alabama and dermatology at Baylor College of Medicine, where he currently serves as Professor and Vice-Chair. Dr. Rosen served on the Board of Directors and is past Vice-President of the American Academy of Dermatology. He is also past-President and Secretary-Treasurer of the Houston Dermatological Society and prior Chairman and Secretary-Treasurer of the Dermatology Section, Southern Medical Association. Dr. Rosen was the 2017 recipient of the AAD Thomas G. Pearson Memorial Award for lifelong achievement in education and the 2021 recipient of the Robert J. Freeman Memorial Leadership and Mentoring Award from the Texas Dermatological Society. Dr. Rosen has written over 325 peer-reviewed journal articles, 28 textbook chapters and 4 textbooks, including the award-winning Atlas of Black Dermatology. Dr. Rosen has given over 500 CME talks, including plenary presentations to the national dermatology societies of: Argentina, Australia, Canada, Chile, China, Hong Kong, Italy, South Korea, Mexico, New Zealand, and Taiwan.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Lisa Swanson', 'MD', 'lisaswansonmd@gmail.com',
   'Dr. Swanson is a board-certified dermatologist and pediatric dermatologist. She was born in New Orleans, Louisiana, and raised in Scottsdale, Arizona. She attended college at the University of Colorado at Boulder, graduating with honors as an English major. After that she obtained her medical degree from Tulane University School of Medicine in New Orleans. She performed her internship at Mayo Clinic in Scottsdale, Arizona, and went on to complete her dermatology residency at Mayo Clinic in Rochester, Minnesota. After that, she completed a fellowship in Pediatric Dermatology at Phoenix Children''s Hospital in Arizona. She was in private practice in Colorado from 2011 thru 2020. She moved to Boise, Idaho in summer 2020 to become the first and only pediatric dermatologist in the state of Idaho. She is active in local and national medical societies and organizations. She loves lecturing at conferences discussing pediatric dermatology with audiences across the country. Since moving to Idaho, she works in private practice at Ada West Dermatology and she is on staff at St Luke''s Children''s Hospital where she sees hospital consults and performs procedures.',
   'faculty');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Shannon Trotter', 'DO, FAAD', 'strotter@docsdermgroup.com',
   'Dr. Trotter graduated medical school from the Ohio University Heritage College of Osteopathic Medicine in Athens, OH. She completed a dermatology residency at OhioHealth O''Bleness Memorial Hospital. After residency, Dr. Trotter completed a fellowship in cutaneous oncology at Boston University and acted as Director of the Pigmented Lesion Clinic at the Ohio State University. She serves as faculty for the OhioHealth Dermatology Residency Program in Columbus, OH, and is an assistant clinical professor at Ohio University Heritage College of Osteopathic Medicine in Athens, OH. Dr. Trotter has several clinical interests, including prevention, detection and treatment of skin cancer, medical education, health policy and advocacy. She is a past president of the Ohio Dermatological Association and serves on the American Academy of Dermatology State Policy Committee. In addition, she is the District 2 councilor for the Ohio State Medical Association and an alternate delegate to the American Medical Association. Dr. Trotter has been recognized nationally for being in the top ten percent of physicians for patient satisfaction.',
   'faculty');

  -- ============================================================
  -- DID LEADERS (role='leader') — 9 from faculty CSV
  -- ============================================================

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Andrea Hagins', NULL, NULL, NULL, 'leader'),
  (v_event_id, 'Shanna Miranti', 'MPAS, PA-C', NULL, NULL, 'leader'),
  (v_event_id, 'Cindy Sershen', 'DNP, DCNP, FNP-BC', NULL, NULL, 'leader'),
  (v_event_id, 'Brittany Scurto', 'PA-C', NULL, NULL, 'leader'),
  (v_event_id, 'Kendra Joseph', NULL, NULL, NULL, 'leader'),
  (v_event_id, 'Terry Faleye', NULL, NULL, NULL, 'leader'),
  (v_event_id, 'Thais Delgado', NULL, NULL, NULL, 'leader'),
  (v_event_id, 'Divine Mengue', NULL, NULL, NULL, 'leader'),
  (v_event_id, 'Jade Trevino', NULL, NULL, NULL, 'leader');

  -- ============================================================
  -- GUEST SPEAKERS (role='guest') — from schedule, not in faculty CSV
  -- ============================================================

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Michael Jones', 'MD', NULL, NULL, 'guest');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Risha Bellomo', 'CEO', NULL, NULL, 'guest');

  INSERT INTO speakers (event_id, full_name, credentials, email, bio, role) VALUES
  (v_event_id, 'Elizabeth Swanson', 'MD', NULL,
   'Dr. Swanson is a board-certified dermatologist and pediatric dermatologist. She was born in New Orleans, Louisiana, and raised in Scottsdale, Arizona. She attended college at the University of Colorado at Boulder, graduating with honors as an English major. After that she obtained her medical degree from Tulane University School of Medicine in New Orleans. She performed her internship at Mayo Clinic in Scottsdale, Arizona, and went on to complete her dermatology residency at Mayo Clinic in Rochester, Minnesota. After that, she completed a fellowship in Pediatric Dermatology at Phoenix Children''s Hospital in Arizona. She was in private practice in Colorado from 2011 thru 2020. She moved to Boise, Idaho in summer 2020 to become the first and only pediatric dermatologist in the state of Idaho.',
   'guest');

END $$;
