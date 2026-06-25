-- MIGRAZIONE v2: aggiunge autenticazione utenti
-- Da eseguire nel SQL Editor di Supabase DOPO lo schema v1
-- Sicuro da rieseguire più volte (IF NOT EXISTS / IF EXISTS)

-- 1. Aggiungi colonne utente
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id   UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 2. Rimuovi tutte le policy esistenti
DROP POLICY IF EXISTS "public access"                                   ON bookings;
DROP POLICY IF EXISTS "utenti autenticati vedono tutte le prenotazioni" ON bookings;
DROP POLICY IF EXISTS "utenti inseriscono le proprie prenotazioni"      ON bookings;
DROP POLICY IF EXISTS "utenti cancellano le proprie prenotazioni"       ON bookings;

-- 3. Policy unica: qualsiasi utente autenticato può fare tutto
--    (app personale — controllo chi cancella viene fatto via UI)
CREATE POLICY "auth: accesso completo utenti autenticati" ON bookings
  FOR ALL
  USING  (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
