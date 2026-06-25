import { useEffect, useState } from 'react';
import './App.css';
import AuthGate from './components/AuthGate';
import BookingsList from './components/BookingsList';
import LuggageSelector from './components/LuggageSelector';
import SeatSelector from './components/SeatSelector';
import SuccessScreen from './components/SuccessScreen';
import Summary from './components/Summary';
import TripForm from './components/TripForm';
import { supabase } from './supabase';
import type { Booking, LuggageSize, Passenger, SeatId, Trip } from './types';
import { fetchBookings, generateId, insertBooking, removeBooking, signOut } from './utils';

type Step = 'list' | 'trip' | 'seats' | 'luggage' | 'summary' | 'success';
const WIZARD_STEPS: Step[] = ['trip', 'seats', 'luggage', 'summary'];
const STEP_LABELS = ['Viaggio', 'Posti', 'Bagagli', 'Riepilogo'];

function PandinoApp() {
  const [step, setStep]           = useState<Step>('list');
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  const [trip, setTrip]               = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SeatId[]>([]);
  const [passengers, setPassengers]   = useState<Passenger[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          name: (data.user.user_metadata?.name as string) ?? data.user.email ?? 'Utente',
        });
      }
    });
    fetchBookings()
      .then(setBookings)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function startNew() {
    setTrip(null); setSelectedSeats([]); setPassengers([]);
    setStep('trip');
  }

  function handleToggleSeat(id: SeatId) {
    setSelectedSeats(prev => {
      const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      setPassengers(pax => {
        const kept  = pax.filter(p => next.includes(p.seat));
        const added = next.filter(s => !pax.some(p => p.seat === s))
                         .map((seat): Passenger => ({ name: '', seat, luggage: 'none' }));
        return [...kept, ...added];
      });
      return next;
    });
  }

  function handleUpdateLuggage(seat: SeatId, size: LuggageSize) {
    setPassengers(prev => prev.map(p => p.seat === seat ? { ...p, luggage: size } : p));
  }

  async function handleConfirm(booking: Booking) {
    if (!currentUser) { setError('Sessione scaduta — effettua il login di nuovo'); return; }
    const full: Booking = {
      ...booking,
      id: generateId(),
      createdAt: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
    };
    try {
      await insertBooking(full);
      setBookings(prev => [full, ...prev]);
      setLastBooking(full);
      setStep('success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Errore nel salvataggio';
      if (msg.includes('user_id') || msg.includes('user_name') || msg.includes('schema cache')) {
        setError('Devi eseguire la migrazione v2 su Supabase — copia il file supabase-schema-v2.sql nel SQL Editor');
      } else {
        setError(msg);
      }
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore nella cancellazione');
    }
  }

  const wizardIndex = WIZARD_STEPS.indexOf(step);
  const inWizard = wizardIndex !== -1;

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm">
        <div className="page-content py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => setStep('list')} className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm shadow-sm shadow-red-600/40">
              🚗
            </div>
            <div className="leading-none">
              <span className="font-black text-white text-base block">Pandino</span>
              <span className="text-slate-600 text-[11px]">Panda Cross 2023</span>
            </div>
          </button>

          {/* Step indicator (wizard only) */}
          {inWizard && (
            <div className="flex items-center gap-1 sm:gap-2">
              {WIZARD_STEPS.map((s, i) => {
                const done   = i < wizardIndex;
                const active = i === wizardIndex;
                return (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                      done   ? 'bg-emerald-600 text-white' :
                      active ? 'bg-red-600 text-white' :
                               'bg-slate-800 text-slate-600'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`hidden sm:block text-xs transition-colors ${
                      active ? 'text-white font-medium' : done ? 'text-slate-500' : 'text-slate-700'
                    }`}>
                      {STEP_LABELS[i]}
                    </span>
                    {i < WIZARD_STEPS.length - 1 && (
                      <div className={`w-4 h-px mx-0.5 ${done ? 'bg-emerald-600' : 'bg-slate-800'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {step === 'list' && (
              <button onClick={startNew} className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors">
                + Nuovo
              </button>
            )}
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-red-400">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <button onClick={async () => { await signOut(); window.location.reload(); }}
                  className="hidden sm:block text-xs text-slate-600 hover:text-slate-400 transition-colors">
                  Esci
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-950/70 border-b border-red-900 px-4 py-3 text-sm text-red-300 text-center">
          ⚠️ {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-500 hover:text-red-300 transition-colors text-xs underline">
            Chiudi
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <main className="flex-1 page-content py-6">
        {step === 'list' && (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-2 border-slate-700 border-t-red-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Caricamento...</p>
            </div>
          ) : (
            <BookingsList bookings={bookings} currentUserId={currentUser?.id ?? ''} onDelete={handleDelete} onNew={startNew} />
          )
        )}

        {step === 'trip' && <TripForm onSubmit={t => { setTrip(t); setStep('seats'); }} />}

        {step === 'seats' && trip && (
          <SeatSelector trip={trip} selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat} onBack={() => setStep('trip')} onNext={() => setStep('luggage')} />
        )}

        {step === 'luggage' && trip && (
          <LuggageSelector trip={trip} selectedSeats={selectedSeats} passengers={passengers}
            onUpdateLuggage={handleUpdateLuggage} onBack={() => setStep('seats')} onNext={() => setStep('summary')} />
        )}

        {step === 'summary' && trip && (
          <Summary trip={trip} passengers={passengers} onBack={() => setStep('luggage')} onConfirm={handleConfirm} />
        )}

        {step === 'success' && lastBooking && (
          <SuccessScreen booking={lastBooking} onViewAll={() => setStep('list')} onNew={startNew} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return <AuthGate><PandinoApp /></AuthGate>;
}
