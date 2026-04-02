-- CC ACCELERATOR — Run this in Supabase SQL Editor
-- (Click the terminal/code icon in the left sidebar, or press Cmd+K and search "SQL")

-- Simple key-value store — one table, that's it
CREATE TABLE IF NOT EXISTS cc_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public access
ALTER TABLE cc_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON cc_store FOR ALL USING (true) WITH CHECK (true);
