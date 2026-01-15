-- Add branding fields to events table (if not already present)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS brand_color TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS show_logo_on_banner BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_url_slug TEXT;

-- Create exhibitors table
CREATE TABLE IF NOT EXISTS exhibitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  booth_number TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  category TEXT,
  products_services TEXT[],
  social_links JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for exhibitors
CREATE INDEX IF NOT EXISTS idx_exhibitors_event_id ON exhibitors(event_id);

-- Create sponsors table
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL DEFAULT 'partner' CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'partner')),
  logo_url TEXT,
  banner_url TEXT,
  website_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  booth_number TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  social_links JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sponsors
CREATE INDEX IF NOT EXISTS idx_sponsors_event_id ON sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON sponsors(tier);
CREATE INDEX IF NOT EXISTS idx_sponsors_display_order ON sponsors(display_order);

-- Create speaker_messages table
CREATE TABLE IF NOT EXISTS speaker_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  speaker_id UUID REFERENCES speakers(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for speaker_messages
CREATE INDEX IF NOT EXISTS idx_speaker_messages_event_id ON speaker_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_speaker_messages_speaker_id ON speaker_messages(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_messages_read_at ON speaker_messages(read_at);

-- Enable RLS on new tables
ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaker_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for exhibitors (allow all authenticated users for now)
CREATE POLICY "Exhibitors are viewable by authenticated users" ON exhibitors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Exhibitors are insertable by authenticated users" ON exhibitors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Exhibitors are updatable by authenticated users" ON exhibitors
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Exhibitors are deletable by authenticated users" ON exhibitors
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS policies for sponsors (allow all authenticated users for now)
CREATE POLICY "Sponsors are viewable by authenticated users" ON sponsors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sponsors are insertable by authenticated users" ON sponsors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Sponsors are updatable by authenticated users" ON sponsors
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Sponsors are deletable by authenticated users" ON sponsors
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS policies for speaker_messages (allow all authenticated users for now)
CREATE POLICY "Speaker messages are viewable by authenticated users" ON speaker_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Speaker messages are insertable by authenticated users" ON speaker_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Speaker messages are deletable by authenticated users" ON speaker_messages
  FOR DELETE
  TO authenticated
  USING (true);
