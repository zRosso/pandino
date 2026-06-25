import { useState } from 'react';
import { supabase } from '../supabase';

interface Props {
  children: React.ReactNode;
}

type Mode = 'login' | 'signup';

export default function AuthGate({ children }: Props) {
  const [session, setSession] = useState(() => {
    // Supabase persiste la sessione in localStorage automaticamente
    return null as import('@supabase/supabase-js').Session | null;
  });
  const [initialized, setInitialized] = useState(false);

  // Ascolta i cambi di sessione
  useState(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialized(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  });

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Caricamento...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthForm onAuth={setSession} />;
  }

  return <>{children}</>;
}

function AuthForm({ onAuth }: { onAuth: (s: import('@supabase/supabase-js').Session) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (err) throw err;
        if (data.session) {
          onAuth(data.session);
        } else {
          setConfirmSent(true);
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        if (data.session) onAuth(data.session);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      if (msg.includes('Invalid login credentials')) setError('Email o password errati');
      else if (msg.includes('already registered')) setError('Email già registrata — prova ad accedere');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (confirmSent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="step-card max-w-sm w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-white mb-2">Controlla la tua email</h2>
          <p className="text-slate-400 text-sm">
            Abbiamo inviato un link di conferma a <span className="text-white">{email}</span>.<br />
            Clicca il link per attivare il tuo account.
          </p>
          <button
            onClick={() => setConfirmSent(false)}
            className="mt-6 text-sm text-red-400 hover:text-red-300 underline"
          >
            Torna al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="step-card max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-4xl">🚗</span>
          <h1 className="text-2xl font-black text-white mt-2">Pandino</h1>
          <p className="text-slate-400 text-sm">Panda Cross 2023 · Nera</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'login' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Accedi
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mario Rossi"
                required
                className="input-field"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mario@esempio.it"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
              required
              minLength={6}
              className="input-field"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Attendere...' : mode === 'login' ? 'Accedi' : 'Crea account'}
          </button>
        </form>
      </div>
    </div>
  );
}
