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

function PandinoApp() {
  const [step, setStep] = useState<Step>('list');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  // Draft state
  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SeatId[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);

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
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function startNew() {
    setTrip(null);
    setSelectedSeats([]);
    setPassengers([]);
    setStep('trip');
  }

  function handleTripSubmit(t: Trip) {
    setTrip(t);
    setStep('seats');
  }

  function handleToggleSeat(id: SeatId) {
    setSelectedSeats((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      setPassengers((pax) => {
        const kept = pax.filter((p) => next.includes(p.seat));
        const added = next
          .filter((s) => !pax.some((p) => p.seat === s))
          .map((seat): Passenger => ({ name: '', seat, luggage: 'none' }));
        return [...kept, ...added];
      });
      return next;
    });
  }

  function handleUpdateLuggage(seat: SeatId, size: LuggageSize) {
    setPassengers((prev) =>
      prev.map((p) => (p.seat === seat ? { ...p, luggage: size } : p))
    );
  }

  async function handleConfirm(booking: Booking) {
    const fullBooking: Booking = {
      ...booking,
      id: generateId(),
      createdAt: new Date().toISOString(),
      userId: currentUser?.id ?? '',
      userName: currentUser?.name ?? 'Sconosciuto',
    };
    try {
      await insertBooking(fullBooking);
      setBookings((prev) => [fullBooking, ...prev]);
      setLastBooking(fullBooking);
      setStep('success');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore nel salvataggio');
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore nella cancellazione');
    }
  }

  async function handleSignOut() {
    await signOut();
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button onClick={() => setStep('list')} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            <span className="text-2xl">🚗</span>
            <div>
              <span className="font-black text-white text-lg leading-none block">Pandino</span>
              <span className="text-xs text-slate-400 leading-none">Panda Cross 2023 · Nera</span>
            </div>
          </button>

          {/* Step indicator */}
          {step !== 'list' && step !== 'success' && (
            <div className="flex items-center gap-1 text-xs">
              {(['trip', 'seats', 'luggage', 'summary'] as Step[]).map((s, i) => {
                const stepIndex = ['trip', 'seats', 'luggage', 'summary'].indexOf(step);
                const isActive = s === step;
                const isDone = i < stepIndex;
                return (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isDone ? 'bg-green-600 text-white' : isActive ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    {i < 3 && <div className={`w-4 h-0.5 ${isDone ? 'bg-green-600' : 'bg-slate-700'}`} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* User + actions */}
          <div className="flex items-center gap-2 shrink-0">
            {step === 'list' && (
              <button onClick={startNew} className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-1.5 px-4 rounded-lg transition-colors">
                + Nuovo
              </button>
            )}
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-2.5 py-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-700 flex items-center justify-center text-xs font-bold text-white">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-300 hidden sm:block">{currentUser.name}</span>
                </div>
                <button onClick={handleSignOut} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-1">
                  Esci
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-800 px-4 py-2 text-sm text-red-300 text-center">
          ⚠️ {error}
          <button onClick={() => setError(null)} className="ml-3 underline text-red-400 hover:text-red-300">Chiudi</button>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {step === 'list' && (
          loading ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-slate-400">Caricamento...</p>
            </div>
          ) : (
            <BookingsList
              bookings={bookings}
              currentUserId={currentUser?.id ?? ''}
              onDelete={handleDelete}
              onNew={startNew}
            />
          )
        )}
        {step === 'trip' && <TripForm onSubmit={handleTripSubmit} />}
        {step === 'seats' && trip && (
          <SeatSelector
            trip={trip}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            onBack={() => setStep('trip')}
            onNext={() => setStep('luggage')}
          />
        )}
        {step === 'luggage' && trip && (
          <LuggageSelector
            trip={trip}
            selectedSeats={selectedSeats}
            passengers={passengers}
            onUpdateLuggage={handleUpdateLuggage}
            onBack={() => setStep('seats')}
            onNext={() => setStep('summary')}
          />
        )}
        {step === 'summary' && trip && (
          <Summary
            trip={trip}
            passengers={passengers}
            onBack={() => setStep('luggage')}
            onConfirm={handleConfirm}
          />
        )}
        {step === 'success' && lastBooking && (
          <SuccessScreen
            booking={lastBooking}
            onViewAll={() => setStep('list')}
            onNew={startNew}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <PandinoApp />
    </AuthGate>
  );
}
