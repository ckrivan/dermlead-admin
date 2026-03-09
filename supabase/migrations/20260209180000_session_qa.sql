-- Session Q&A: Questions table for interactive session Q&A
-- Allows attendees to ask questions, upvote, and admins to answer/pin

-- =============================================
-- 1. SESSION QUESTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS session_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    asked_by UUID REFERENCES profiles(id),
    asker_name TEXT NOT NULL,
    question_text TEXT NOT NULL,
    is_answered BOOLEAN DEFAULT false,
    answered_by UUID REFERENCES profiles(id),
    answer_text TEXT,
    upvotes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_questions_session ON session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_event ON session_questions(event_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_upvotes ON session_questions(session_id, upvotes DESC);

-- =============================================
-- 2. RLS POLICIES
-- =============================================
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can read questions
CREATE POLICY "session_questions_select" ON session_questions FOR SELECT
    USING (true);

-- Any authenticated user can ask questions (or anonymous in dev)
CREATE POLICY "session_questions_insert" ON session_questions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR true);

-- Admin only for updates (answering, pinning)
CREATE POLICY "session_questions_update" ON session_questions FOR UPDATE
    USING (
        asked_by = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admin only for delete
CREATE POLICY "session_questions_delete" ON session_questions FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- 3. SEED DEMO QUESTIONS
-- =============================================
-- Insert demo questions for existing sessions
INSERT INTO session_questions (session_id, event_id, asker_name, question_text, upvotes, is_answered, answer_text, is_pinned, created_at)
SELECT
    s.id,
    s.event_id,
    q.asker_name,
    q.question_text,
    q.upvotes,
    q.is_answered,
    q.answer_text,
    q.is_pinned,
    NOW() - (q.minutes_ago || ' minutes')::INTERVAL
FROM sessions s
CROSS JOIN (VALUES
    ('Dr. Sarah Mitchell', 'What are the latest guidelines for biologics in moderate psoriasis?', 12, true, 'Great question! The updated AAD guidelines now recommend biologics as first-line for moderate-to-severe cases. We will cover this in detail during the session.', true, 45),
    ('James Rodriguez', 'Can you discuss the cost-effectiveness of newer JAK inhibitors?', 8, false, NULL, false, 30),
    ('Dr. Emily Chen', 'How do you approach combination therapy in resistant cases?', 15, true, 'Combination therapy is increasingly supported by evidence. I recommend starting with a biologic backbone and adding targeted topicals. See the recent JEADV meta-analysis for data.', false, 60),
    ('Michael Torres', 'Are there any new biomarkers for treatment response prediction?', 6, false, NULL, false, 20),
    ('Dr. Lisa Park', 'What is your protocol for monitoring liver function with methotrexate?', 10, true, 'We follow the ACR monitoring guidelines - baseline LFTs, then every 4-8 weeks for the first 6 months, then every 8-12 weeks if stable.', false, 55)
) AS q(asker_name, question_text, upvotes, is_answered, answer_text, is_pinned, minutes_ago)
WHERE s.session_type IN ('presentation', 'keynote', 'panel', 'workshop')
ORDER BY s.session_date, s.start_time
LIMIT 5;

-- Add a second batch for another session
INSERT INTO session_questions (session_id, event_id, asker_name, question_text, upvotes, is_answered, answer_text, is_pinned, created_at)
SELECT
    s.id,
    s.event_id,
    q.asker_name,
    q.question_text,
    q.upvotes,
    q.is_answered,
    q.answer_text,
    q.is_pinned,
    NOW() - (q.minutes_ago || ' minutes')::INTERVAL
FROM sessions s
CROSS JOIN (VALUES
    ('Dr. Amanda White', 'What imaging modalities do you prefer for deep tissue evaluation?', 9, false, NULL, false, 15),
    ('Robert Kim', 'How has AI-assisted diagnosis changed your clinical workflow?', 14, true, 'AI tools have significantly improved our triage process. We use them primarily for melanoma screening and have seen a 23% improvement in early detection rates.', true, 40),
    ('Dr. Nicole Adams', 'Can you share your experience with teledermatology post-pandemic?', 7, false, NULL, false, 25)
) AS q(asker_name, question_text, upvotes, is_answered, answer_text, is_pinned, minutes_ago)
WHERE s.session_type IN ('presentation', 'keynote', 'panel', 'workshop')
ORDER BY s.session_date, s.start_time
OFFSET 1 LIMIT 1;

SELECT 'Session Q&A table created with demo data.' as status;
