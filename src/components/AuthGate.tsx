import { useState } from 'react';
import { supabase } from '../supabase';
import type { Session } from '@supabase/supabase-js';

type Mode = 'login' | 'signup';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useState(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  });

  if (!ready) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl">🚗</span>
          <p className="text-slate-500 text-sm">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!session) return <AuthForm onAuth={setSession} />;
  return <>{children}</>;
}

function AuthForm({ onAuth }: { onAuth: (s: Session) => void }) {
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
        if (data.session) onAuth(data.session);
        else setConfirmSent(true);
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        if (data.session) onAuth(data.session);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Invalid login')) setError('Email o password errati');
      else if (msg.includes('already registered')) setError('Email già registrata — prova ad accedere');
      else if (msg.includes('Password should')) setError('La password deve avere almeno 6 caratteri');
      else setError(msg || 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }

  if (confirmSent) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-4">
        <div className="card w-full max-w-sm text-center">
          <div className="text-5xl mb-5">📧</div>
          <h2 className="text-xl font-bold text-white mb-2">Controlla la tua email</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Abbiamo inviato un link di conferma a<br />
            <span className="text-white font-medium">{email}</span>
          </p>
          <button onClick={() => setConfirmSent(false)} className="mt-6 text-sm text-red-400 hover:text-red-300 transition-colors underline">
            Torna al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4 text-3xl shadow-lg shadow-red-600/30">
            🚗
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Pandino</h1>
          <p className="text-slate-500 text-sm mt-1">Panda Cross 2023 · Nera</p>
        </div>

        <div className="card">
          {/* Tab switcher */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Mario Rossi" required className="input-field" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="mario@esempio.it" required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Minimo 6 caratteri" required minLength={6} className="input-field" />
            </div>

            {error && (
              <div className="bg-red-950/60 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? 'Attendere...' : mode === 'login' ? 'Accedi' : 'Crea account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
