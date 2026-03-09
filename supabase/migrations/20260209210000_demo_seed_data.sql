-- =============================================
-- COMPREHENSIVE DEMO SEED DATA
-- Populates: profiles (fixes), event_photos, conversations,
--            messages, community_posts, post_comments, session_questions
-- =============================================

-- =============================================
-- 1. FIX PROFILE NAMES (update NULLs)
-- =============================================

-- Rep 1: Sarah Chen
UPDATE profiles
SET first_name = 'Sarah', last_name = 'Chen',
    email = COALESCE(email, 'sarah.chen@bcimedical.com'),
    organization_id = COALESCE(organization_id, '00000000-0000-0000-0000-000000000001')
WHERE id = '00000000-0000-0000-0000-000000000099'
  AND (first_name IS NULL OR last_name IS NULL);

-- Rep 2: Mike Rivera
UPDATE profiles
SET first_name = 'Mike', last_name = 'Rivera',
    email = COALESCE(email, 'mike.rivera@bcimedical.com'),
    organization_id = COALESCE(organization_id, '00000000-0000-0000-0000-000000000001')
WHERE id = '00000000-0000-0000-0000-000000000098'
  AND (first_name IS NULL OR last_name IS NULL);

-- Rep 3: Jessica Park (the zero UUID)
UPDATE profiles
SET first_name = 'Jessica', last_name = 'Park',
    email = COALESCE(email, 'jessica.park@bcimedical.com'),
    organization_id = COALESCE(organization_id, '00000000-0000-0000-0000-000000000001')
WHERE id = '00000000-0000-0000-0000-000000000000'
  AND (first_name IS NULL OR last_name IS NULL);

-- Admin 2: fix name if null
UPDATE profiles
SET first_name = 'David', last_name = 'Thompson'
WHERE id = 'a564aa11-f742-449d-8f48-cfbfc2f591a2'
  AND (first_name IS NULL OR last_name IS NULL);


-- =============================================
-- 2. EVENT PHOTOS (15 entries for the active event)
-- =============================================
-- Using DID 2026 event (id 00000000-0000-0000-0000-000000000002)

INSERT INTO event_photos (event_id, photo_url, caption, created_at)
VALUES
    -- Day 1 photos
    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
     'Opening Keynote - Dr. Williams addresses a packed Hall A',
     NOW() - INTERVAL '2 days 6 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
     'Registration desk buzzing with early arrivals',
     NOW() - INTERVAL '2 days 8 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1587825140708-dfaf18c4f4ac?w=800',
     'Exhibitor hall - attendees exploring the latest innovations',
     NOW() - INTERVAL '2 days 4 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
     'Networking reception on the terrace',
     NOW() - INTERVAL '1 day 18 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
     'Hands-on laser workshop with Dr. Nakamura',
     NOW() - INTERVAL '2 days 2 hours'),

    -- Day 2 photos
    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=800',
     'Poster presentations drawing great discussion',
     NOW() - INTERVAL '1 day 5 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800',
     'Coffee break networking - new connections being made',
     NOW() - INTERVAL '1 day 7 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800',
     'Panel discussion: Melanoma Detection in Diverse Skin Tones',
     NOW() - INTERVAL '1 day 4 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800',
     'Award ceremony - Dr. Okafor receives the Research Excellence Award',
     NOW() - INTERVAL '1 day 1 hour'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
     'Gala dinner at the Grand Ballroom',
     NOW() - INTERVAL '18 hours'),

    -- Day 3 photos
    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
     'Morning yoga session before the final day of sessions',
     NOW() - INTERVAL '10 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1558403194-611308249627?w=800',
     'AI and Machine Learning workshop - standing room only',
     NOW() - INTERVAL '6 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
     'BCI Medical team at our exhibitor booth',
     NOW() - INTERVAL '5 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
     'Closing keynote: Our Collective Path Forward',
     NOW() - INTERVAL '3 hours'),

    ('00000000-0000-0000-0000-000000000002',
     'https://images.unsplash.com/photo-1529543544282-ea99407407c1?w=800',
     'Farewell lunch - until next year!',
     NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;


-- =============================================
-- 3. CONVERSATIONS & MESSAGES
-- =============================================
-- Existing conversation: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001
--   Between 099 (Sarah Chen) and 098 (Mike Rivera) - 5 messages
-- We add 5 more conversations with diverse pairings

-- Conversation 2: Sarah Chen (rep 099) <-> Admin David Thompson
INSERT INTO conversations (id, event_id, participant_1, participant_2, last_message_at, created_at)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000099',
    'a564aa11-f742-449d-8f48-cfbfc2f591a2',
    NOW() - INTERVAL '25 minutes',
    NOW() - INTERVAL '1 day 4 hours'
) ON CONFLICT DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, message_text, read_at, created_at)
VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb010',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
     '00000000-0000-0000-0000-000000000099',
     'David, quick question - what time does the exhibitor hall close today?',
     NOW() - INTERVAL '1 day 3 hours',
     NOW() - INTERVAL '1 day 4 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb011',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
     'a564aa11-f742-449d-8f48-cfbfc2f591a2',
     'Hall closes at 6 PM tonight. Make sure you visit the SkinVision booth before they pack up - they have some great new screening tech.',
     NOW() - INTERVAL '1 day 2 hours 45 minutes',
     NOW() - INTERVAL '1 day 3 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb012',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
     '00000000-0000-0000-0000-000000000099',
     'Perfect, thanks! Also, Charles mentioned we need to coordinate the lead review meeting. When works for you?',
     NOW() - INTERVAL '1 day 2 hours',
     NOW() - INTERVAL '1 day 2 hours 30 minutes'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb013',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
     'a564aa11-f742-449d-8f48-cfbfc2f591a2',
     'How about tomorrow morning at 7:30 before the first session? We can use the small meeting room off the lobby.',
     NOW() - INTERVAL '1 day 1 hour',
     NOW() - INTERVAL '1 day 1 hour 30 minutes'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb014',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
     '00000000-0000-0000-0000-000000000099',
     'Works for me. I will let Mike and Jessica know too.',
     NOW() - INTERVAL '23 hours',
     NOW() - INTERVAL '1 day'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb015',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
     'a564aa11-f742-449d-8f48-cfbfc2f591a2',
     'Great. Also heads up - we have 47 leads captured so far. Ahead of last year at this point!',
     NULL,
     NOW() - INTERVAL '25 minutes')
ON CONFLICT DO NOTHING;

-- Conversation 3: Mike Rivera (rep 098) <-> Jessica Park (rep 000)
INSERT INTO conversations (id, event_id, participant_1, participant_2, last_message_at, created_at)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000098',
    '00000000-0000-0000-0000-000000000000',
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '1 day 6 hours'
) ON CONFLICT DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, message_text, read_at, created_at)
VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb020',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
     '00000000-0000-0000-0000-000000000098',
     'Jessica, did you make it to the laser workshop this morning?',
     NOW() - INTERVAL '1 day 5 hours',
     NOW() - INTERVAL '1 day 6 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb021',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
     '00000000-0000-0000-0000-000000000000',
     'Yes! Dr. Nakamura demo was incredible. Several attendees asked about our product right after.',
     NOW() - INTERVAL '1 day 4 hours 30 minutes',
     NOW() - INTERVAL '1 day 5 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb022',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
     '00000000-0000-0000-0000-000000000098',
     'Nice! I was covering the exhibitor booth. Captured 8 leads just this morning - a couple from university hospitals.',
     NOW() - INTERVAL '1 day 3 hours',
     NOW() - INTERVAL '1 day 4 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb023',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
     '00000000-0000-0000-0000-000000000000',
     'That is amazing. Dr. Williams from Emory was really interested in our new biologics line. I scored her a 5 on lead quality.',
     NOW() - INTERVAL '1 day 2 hours',
     NOW() - INTERVAL '1 day 2 hours 30 minutes'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb024',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
     '00000000-0000-0000-0000-000000000098',
     'Definitely follow up on that one. Want to split up the afternoon sessions? I can cover the melanoma panel and you take the business of diversity talk.',
     NOW() - INTERVAL '50 minutes',
     NOW() - INTERVAL '1 day 1 hour'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb025',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
     '00000000-0000-0000-0000-000000000000',
     'Sounds good. I will take notes on any potential contacts and share them with the team tonight.',
     NULL,
     NOW() - INTERVAL '45 minutes')
ON CONFLICT DO NOTHING;

-- Conversation 4: Admin Charles Krivan <-> Sarah Chen (rep 099) about logistics
INSERT INTO conversations (id, event_id, participant_1, participant_2, last_message_at, created_at)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004',
    '00000000-0000-0000-0000-000000000002',
    '5da41a95-304d-47e1-8f5a-cf695254a445',
    '00000000-0000-0000-0000-000000000099',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 days'
) ON CONFLICT DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, message_text, read_at, created_at)
VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb030',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004',
     '5da41a95-304d-47e1-8f5a-cf695254a445',
     'Sarah, how is the booth setup going? Everything in place for tomorrow?',
     NOW() - INTERVAL '1 day 23 hours',
     NOW() - INTERVAL '2 days'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb031',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004',
     '00000000-0000-0000-0000-000000000099',
     'All good! Banners are up, iPads charged, and brochures are stacked. We are in booth 147 right by the main entrance.',
     NOW() - INTERVAL '1 day 22 hours',
     NOW() - INTERVAL '1 day 23 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb032',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004',
     '5da41a95-304d-47e1-8f5a-cf695254a445',
     'Great location. Remember - focus on dermatologists with 5+ years in practice for the premium product line. Those are our highest-converting leads.',
     NOW() - INTERVAL '1 day 21 hours',
     NOW() - INTERVAL '1 day 22 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb033',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004',
     '00000000-0000-0000-0000-000000000099',
     'Got it. We also set up the lead capture app on all three iPads. QR scanning is working perfectly.',
     NOW() - INTERVAL '1 day 20 hours',
     NOW() - INTERVAL '1 day 21 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb034',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004',
     '5da41a95-304d-47e1-8f5a-cf695254a445',
     'We just hit 50 leads total for this event. Outstanding work from the whole team!',
     NULL,
     NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Conversation 5: Jessica Park (rep 000) <-> Admin David Thompson
INSERT INTO conversations (id, event_id, participant_1, participant_2, last_message_at, created_at)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'a564aa11-f742-449d-8f48-cfbfc2f591a2',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '1 day 2 hours'
) ON CONFLICT DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, message_text, read_at, created_at)
VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb040',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005',
     '00000000-0000-0000-0000-000000000000',
     'David, I need more brochures for the biologics line. We ran out faster than expected.',
     NOW() - INTERVAL '1 day 1 hour',
     NOW() - INTERVAL '1 day 2 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb041',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005',
     'a564aa11-f742-449d-8f48-cfbfc2f591a2',
     'I have an extra box in storage room B. I will have them brought to the booth within the hour.',
     NOW() - INTERVAL '23 hours',
     NOW() - INTERVAL '1 day'
    ),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb042',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005',
     '00000000-0000-0000-0000-000000000000',
     'Thanks! Also, Dr. Okafor from Johns Hopkins asked about setting up a follow-up meeting next month. Should I coordinate that through the office?',
     NOW() - INTERVAL '5 hours',
     NOW() - INTERVAL '6 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb043',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005',
     'a564aa11-f742-449d-8f48-cfbfc2f591a2',
     'Yes, loop in the regional manager. Dr. Okafor is a tier-1 contact. Make sure you have her captured as a lead with detailed notes.',
     NOW() - INTERVAL '4 hours',
     NOW() - INTERVAL '5 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb044',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005',
     '00000000-0000-0000-0000-000000000000',
     'Already done - lead score 5, noted her interest in the clinical trial partnership program.',
     NULL,
     NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- Conversation 6: Attendee Charles Kraven <-> Admin Charles Krivan (cross-role)
INSERT INTO conversations (id, event_id, participant_1, participant_2, last_message_at, created_at)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006',
    '00000000-0000-0000-0000-000000000002',
    '30fb2d61-d238-425a-97d9-aec71d7cd74e',
    '5da41a95-304d-47e1-8f5a-cf695254a445',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '1 day 3 hours'
) ON CONFLICT DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, message_text, read_at, created_at)
VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb050',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006',
     '30fb2d61-d238-425a-97d9-aec71d7cd74e',
     'Hi Charles, I attended the AI workshop this morning. Is there a way to get the slides?',
     NOW() - INTERVAL '1 day 2 hours',
     NOW() - INTERVAL '1 day 3 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb051',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006',
     '5da41a95-304d-47e1-8f5a-cf695254a445',
     'Absolutely! All presentation materials will be emailed to registered attendees within 48 hours after the event.',
     NOW() - INTERVAL '1 day 1 hour',
     NOW() - INTERVAL '1 day 2 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb052',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006',
     '30fb2d61-d238-425a-97d9-aec71d7cd74e',
     'Great, thanks. The keynote on health disparities was really eye-opening. Definitely the highlight of the conference for me.',
     NOW() - INTERVAL '5 hours',
     NOW() - INTERVAL '6 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb053',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006',
     '5da41a95-304d-47e1-8f5a-cf695254a445',
     'Glad to hear it! Make sure to check out the photo gallery in the app - some great shots from the event.',
     NULL,
     NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;


-- =============================================
-- 4. MORE COMMUNITY POSTS + COMMENTS
-- =============================================
-- Using event 1 (the one that already has posts)

DO $$
DECLARE
    v_event_id UUID := '00000000-0000-0000-0000-000000000001';
    v_post_id UUID;
BEGIN
    -- Announcement: Evening Reception Details
    INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at, updated_at)
    VALUES (
        v_event_id,
        'Event Organizer',
        'Evening Reception - 6:00 PM Grand Terrace',
        'Join us for tonight''s networking reception on the Grand Terrace (3rd floor). Heavy hors d''oeuvres, cocktails, and live music will be provided. Business casual attire. This is a fantastic opportunity to connect with speakers and fellow attendees in a relaxed setting. Sponsored by BCI Medical.',
        'announcement',
        true,
        15,
        4,
        NOW() - INTERVAL '14 hours',
        NOW() - INTERVAL '6 hours'
    ) RETURNING id INTO v_post_id;

    -- Comments on reception post
    IF v_post_id IS NOT NULL THEN
        INSERT INTO post_comments (post_id, author_name, content, created_at) VALUES
            (v_post_id, 'Dr. Lisa Wang', 'Looking forward to it! Will the speakers from the morning keynote be there?', NOW() - INTERVAL '12 hours'),
            (v_post_id, 'Event Organizer', 'Yes, Dr. Williams and Dr. Nakamura have both confirmed they will attend.', NOW() - INTERVAL '11 hours'),
            (v_post_id, 'Dr. Robert Hayes', 'Is there a vegetarian menu option? Asking for a colleague.', NOW() - INTERVAL '9 hours'),
            (v_post_id, 'Event Organizer', 'Absolutely - full vegetarian and vegan options will be available. Just let the catering staff know.', NOW() - INTERVAL '8 hours');
    END IF;

    -- Discussion: Favorite sessions so far
    INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at, updated_at)
    VALUES (
        v_event_id,
        'Dr. James Kim',
        'What has been your favorite session so far?',
        'Day 2 is wrapping up and I am blown away by the quality of presentations. The melanoma detection panel was outstanding. What sessions have stood out to you?',
        'discussion',
        false,
        9,
        5,
        NOW() - INTERVAL '8 hours',
        NOW() - INTERVAL '4 hours'
    ) RETURNING id INTO v_post_id;

    IF v_post_id IS NOT NULL THEN
        INSERT INTO post_comments (post_id, author_name, content, created_at) VALUES
            (v_post_id, 'Dr. Amanda Foster', 'The laser treatments workshop was hands-down the best. Dr. Nakamura is an incredible presenter.', NOW() - INTERVAL '7 hours'),
            (v_post_id, 'Dr. Michael Torres', 'I really enjoyed the health disparities keynote. Very thought-provoking data on access to care.', NOW() - INTERVAL '6 hours 30 minutes'),
            (v_post_id, 'Dr. Emily Park', 'The hair loss breakout session had some groundbreaking research. Definitely going to change my practice.', NOW() - INTERVAL '5 hours 45 minutes'),
            (v_post_id, 'Dr. Sarah Chen', 'The business of diversity panel had some actionable insights for growing a culturally competent practice.', NOW() - INTERVAL '5 hours'),
            (v_post_id, 'Dr. Alex Rivera', 'Agreed on the melanoma panel. The AI-assisted detection demo was incredible.', NOW() - INTERVAL '4 hours');
    END IF;

    -- Discussion: Networking tips for first-time attendees
    INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at, updated_at)
    VALUES (
        v_event_id,
        'Dr. Nicole Adams',
        'Networking tips for first-timers?',
        'This is my first major dermatology conference and I am a bit overwhelmed by the size. Any tips from veteran attendees on how to make the most of the networking opportunities?',
        'discussion',
        false,
        11,
        3,
        NOW() - INTERVAL '1 day 2 hours',
        NOW() - INTERVAL '20 hours'
    ) RETURNING id INTO v_post_id;

    IF v_post_id IS NOT NULL THEN
        INSERT INTO post_comments (post_id, author_name, content, created_at) VALUES
            (v_post_id, 'Dr. Robert Hayes', 'Attend the smaller breakout sessions - much easier to have meaningful conversations than in the big lectures.', NOW() - INTERVAL '1 day'),
            (v_post_id, 'Dr. Lisa Wang', 'The coffee breaks and receptions are where the real connections happen. Don''t skip those!', NOW() - INTERVAL '22 hours'),
            (v_post_id, 'Dr. James Kim', 'Exchange contact info through the app messaging feature. So much easier than collecting business cards.', NOW() - INTERVAL '20 hours');
    END IF;

    -- Question: Next year's event
    INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at, updated_at)
    VALUES (
        v_event_id,
        'Dr. Robert Hayes',
        'Any word on next year''s location?',
        'This event has been phenomenal. Does anyone know if they have announced the venue for next year? I want to book travel early.',
        'question',
        false,
        6,
        2,
        NOW() - INTERVAL '5 hours',
        NOW() - INTERVAL '3 hours'
    ) RETURNING id INTO v_post_id;

    IF v_post_id IS NOT NULL THEN
        INSERT INTO post_comments (post_id, author_name, content, created_at) VALUES
            (v_post_id, 'Event Organizer', 'We will be making a big announcement during the closing keynote tomorrow. Stay tuned!', NOW() - INTERVAL '4 hours'),
            (v_post_id, 'Dr. Amanda Foster', 'Rumor has it San Diego. That would be amazing!', NOW() - INTERVAL '3 hours');
    END IF;

    -- Question: CME certificate timeline
    INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at, updated_at)
    VALUES (
        v_event_id,
        'Dr. Lisa Wang',
        'When will CME certificates be available?',
        'I need to submit my continuing education credits to my hospital by the end of the month. Does anyone know when the official CME certificates will be issued?',
        'question',
        false,
        8,
        2,
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '1 hour'
    ) RETURNING id INTO v_post_id;

    IF v_post_id IS NOT NULL THEN
        INSERT INTO post_comments (post_id, author_name, content, created_at) VALUES
            (v_post_id, 'Event Organizer', 'Certificates will be emailed within 5 business days after the event concludes. If you need an expedited copy, visit the registration desk.', NOW() - INTERVAL '2 hours'),
            (v_post_id, 'Dr. Alex Rivera', 'I asked at the desk and they said they can print a preliminary certificate on-site. Very helpful!', NOW() - INTERVAL '1 hour');
    END IF;

    -- Discussion: Exhibitor highlights
    INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at, updated_at)
    VALUES (
        v_event_id,
        'Dr. Amanda Foster',
        'Must-visit exhibitor booths',
        'With so many exhibitors, it is hard to see them all. Which booths have you found most worthwhile? I am particularly interested in new diagnostic tools and treatment options.',
        'discussion',
        false,
        10,
        3,
        NOW() - INTERVAL '10 hours',
        NOW() - INTERVAL '7 hours'
    ) RETURNING id INTO v_post_id;

    IF v_post_id IS NOT NULL THEN
        INSERT INTO post_comments (post_id, author_name, content, created_at) VALUES
            (v_post_id, 'Dr. Michael Torres', 'BCI Medical in booth 147 has some impressive new laser systems. Definitely worth a visit.', NOW() - INTERVAL '9 hours'),
            (v_post_id, 'Dr. Nicole Adams', 'SkinVision (booth 203) has an AI screening tool that blew my mind. Ask for the live demo.', NOW() - INTERVAL '8 hours'),
            (v_post_id, 'Dr. James Kim', 'DermPath Solutions has a new digital pathology platform that integrates with most EMR systems. Booth 89.', NOW() - INTERVAL '7 hours');
    END IF;

END $$;


-- =============================================
-- 5. MORE SESSION Q&A QUESTIONS (across different sessions)
-- =============================================

-- Questions for the Melanoma Panel (session 204)
INSERT INTO session_questions (session_id, event_id, asker_name, question_text, upvotes, is_answered, answer_text, is_pinned, created_at)
VALUES
    ('22222222-2222-2222-2222-222222222204',
     '00000000-0000-0000-0000-000000000002',
     'Dr. Kevin Washington',
     'What dermoscopy features are most predictive of melanoma in darker skin tones?',
     18, true,
     'Great question. In darker skin, focus on irregular blotches, regression structures, and asymmetric pigment distribution. The traditional ABCDE criteria can be less reliable. We published a modified scoring system in JAAD last year.',
     true,
     NOW() - INTERVAL '1 day 3 hours');

INSERT INTO session_questions (session_id, event_id, asker_name, question_text, upvotes, is_answered, answer_text, is_pinned, created_at)
VALUES
    ('22222222-2222-2222-2222-222222222204',
     '00000000-0000-0000-0000-000000000002',
     'Dr. Maria Santos',
     'Are there disparities in stage at diagnosis between different ethnic groups?',
     14, true,
     'Unfortunately yes. Studies consistently show later-stage diagnosis in Black and Hispanic patients. This is multifactorial - delayed presentation, lower screening rates, and provider education gaps all contribute.',
     false,
     NOW() - INTERVAL '1 day 2 hours 30 minutes');

-- Questions for the Hair Loss Breakout (session 211)
INSERT INTO session_questions (session_id, event_id, asker_name, question_text, upvotes, is_answered, answer_text, is_pinned, created_at)
VALUES
    ('22222222-2222-2222-2222-222222222211',
     '00000000-0000-0000-0000-000000000002',
     'Dr. Aisha Johnson',
     'What is your experience with low-level laser therapy for central centrifugal cicatricial alopecia?',
     11, false, NULL, false,
     NOW() - INTERVAL '8 hours');

-- Questions for the AI Workshop (session 218)
INSERT INTO session_questions (session_id, event_id, asker_name, question_text, upvotes, is_answered, answer_text, is_pinned, created_at)
VALUES
    ('22222222-2222-2222-2222-222222222218',
     '00000000-0000-0000-0000-000000000002',
     'Dr. Thomas Lee',
     'How do you handle bias in training datasets when developing AI models for diverse skin types?',
     22, true,
     'This is critical. We use a diverse training dataset with proportional representation of Fitzpatrick types IV-VI. We also validate performance across demographic groups separately before deployment.',
     true,
     NOW() - INTERVAL '5 hours');

INSERT INTO session_questions (session_id, event_id, asker_name, question_text, upvotes, is_answered, answer_text, is_pinned, created_at)
VALUES
    ('22222222-2222-2222-2222-222222222218',
     '00000000-0000-0000-0000-000000000002',
     'Dr. Rachel Green',
     'What is the regulatory pathway for clinical AI tools in dermatology? FDA approval timeline?',
     16, false, NULL, false,
     NOW() - INTERVAL '4 hours 30 minutes');

SELECT 'Demo seed data migration complete.' AS status;
