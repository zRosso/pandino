-- MIGRAZIONE v2: aggiunge autenticazione utenti
-- Da eseguire nel SQL Editor di Supabase DOPO lo schema v1

-- 1. Aggiungi colonne utente alla tabella bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 2. Rimuovi la vecchia policy permissiva
DROP POLICY IF EXISTS "public access" ON bookings;

-- 3. Nuove policy: solo utenti autenticati
CREATE POLICY "utenti autenticati vedono tutte le prenotazioni" ON bookings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "utenti inseriscono le proprie prenotazioni" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "utenti cancellano le proprie prenotazioni" ON bookings
  FOR DELETE USING (auth.uid() = user_id);
