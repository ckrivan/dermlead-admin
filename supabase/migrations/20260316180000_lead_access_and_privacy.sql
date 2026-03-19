-- Lead retrieval access control: which companies can use lead capture per event
CREATE TABLE IF NOT EXISTS lead_access_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, company_name)
);

-- Dev-mode RLS
ALTER TABLE lead_access_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to lead_access_companies" ON lead_access_companies;
DROP POLICY IF EXISTS "Allow public write access to lead_access_companies" ON lead_access_companies;

CREATE POLICY "Allow public read access to lead_access_companies"
ON lead_access_companies FOR SELECT USING (true);

CREATE POLICY "Allow public write access to lead_access_companies"
ON lead_access_companies FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lead_access_event ON lead_access_companies(event_id);
