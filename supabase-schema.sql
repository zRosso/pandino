-- Crea la tabella bookings per Pandino
-- Da eseguire nel SQL Editor di Supabase

CREATE TABLE IF NOT EXISTS bookings (
  id                  TEXT PRIMARY KEY,
  from_location       TEXT NOT NULL,
  to_location         TEXT NOT NULL,
  date                TEXT NOT NULL,
  time                TEXT NOT NULL,
  distance_km         FLOAT NOT NULL,
  fuel_price_per_liter FLOAT NOT NULL,
  passengers          JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Abilita Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: chiunque può leggere e scrivere (app personale, nessun auth)
CREATE POLICY "public access" ON bookings
  FOR ALL USING (true) WITH CHECK (true);
