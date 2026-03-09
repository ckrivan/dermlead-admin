-- =============================================
-- EVENT MESSAGING: Conversations & Messages
-- =============================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_1 UUID NOT NULL REFERENCES profiles(id),
    participant_2 UUID NOT NULL REFERENCES profiles(id),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, participant_1, participant_2)
);

-- 2. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id),
    message_text TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_event ON conversations(event_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- =============================================
-- 3. RLS POLICIES
-- =============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations: participants can see their own conversations
-- In dev mode (no auth.uid), allow all for testing
CREATE POLICY "conversations_select" ON conversations FOR SELECT
USING (
    auth.uid() = participant_1
    OR auth.uid() = participant_2
    OR auth.uid() IS NULL
);

CREATE POLICY "conversations_insert" ON conversations FOR INSERT
WITH CHECK (
    auth.uid() = participant_1
    OR auth.uid() = participant_2
    OR auth.uid() IS NULL
);

CREATE POLICY "conversations_update" ON conversations FOR UPDATE
USING (
    auth.uid() = participant_1
    OR auth.uid() = participant_2
    OR auth.uid() IS NULL
);

-- Messages: conversation participants can see/send messages
CREATE POLICY "messages_select" ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM conversations
        WHERE participant_1 = auth.uid()
           OR participant_2 = auth.uid()
    )
    OR auth.uid() IS NULL
);

CREATE POLICY "messages_insert" ON messages FOR INSERT
WITH CHECK (
    conversation_id IN (
        SELECT id FROM conversations
        WHERE participant_1 = auth.uid()
           OR participant_2 = auth.uid()
    )
    OR auth.uid() IS NULL
);

CREATE POLICY "messages_update" ON messages FOR UPDATE
USING (
    sender_id = auth.uid()
    OR auth.uid() IS NULL
);

-- =============================================
-- 4. SEED DEMO DATA
-- =============================================

-- Demo conversations between existing profiles
-- Profile 1: 00000000-0000-0000-0000-000000000099 (Sarah Chen, rep)
-- Profile 2: 00000000-0000-0000-0000-000000000098 (Marcus Williams, rep)
-- Event:     00000000-0000-0000-0000-000000000002

INSERT INTO conversations (id, event_id, participant_1, participant_2, last_message_at, created_at)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000099',
     '00000000-0000-0000-0000-000000000098',
     NOW() - INTERVAL '10 minutes',
     NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Messages in that conversation
INSERT INTO messages (id, conversation_id, sender_id, message_text, read_at, created_at)
VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001',
     '00000000-0000-0000-0000-000000000099',
     'Hey Marcus, did you get a chance to talk to Dr. Sterling at the booth?',
     NOW() - INTERVAL '1 hour 50 minutes',
     NOW() - INTERVAL '2 hours'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001',
     '00000000-0000-0000-0000-000000000098',
     'Yes! She was very interested in the new laser platform. I captured her as a lead.',
     NOW() - INTERVAL '1 hour 40 minutes',
     NOW() - INTERVAL '1 hour 50 minutes'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001',
     '00000000-0000-0000-0000-000000000099',
     'Great work! She is a high-priority contact. Make sure you follow up next week.',
     NOW() - INTERVAL '1 hour 30 minutes',
     NOW() - INTERVAL '1 hour 40 minutes'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001',
     '00000000-0000-0000-0000-000000000098',
     'Already on it. I also spoke with Dr. Patel from Stanford - she needs 500 units by Q3.',
     NOW() - INTERVAL '30 minutes',
     NOW() - INTERVAL '30 minutes'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb005',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001',
     '00000000-0000-0000-0000-000000000099',
     'Perfect. Let us sync up after the keynote session tomorrow.',
     NULL,
     NOW() - INTERVAL '10 minutes')
ON CONFLICT DO NOTHING;
