import type { Booking } from '../types';
import { LUGGAGE_OPTIONS, SEAT_LABELS } from '../types';
import { calculateCosts, calcTrunkUsage, formatEuro } from '../utils';

interface Props {
  bookings: Booking[];
  currentUserId: string;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export default function BookingsList({ bookings, currentUserId, onDelete, onNew }: Props) {
  const userCounts = bookings.reduce<Record<string, { name: string; count: number }>>((acc, b) => {
    if (!acc[b.userId]) acc[b.userId] = { name: b.userName, count: 0 };
    acc[b.userId].count++;
    return acc;
  }, {});
  const topUsers = Object.values(userCounts).sort((a, b) => b.count - a.count);

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-4xl mb-5">🚗</div>
        <h2 className="text-xl font-bold text-white mb-2">Nessuna prenotazione</h2>
        <p className="text-slate-500 text-sm mb-8 max-w-xs">
          Crea il tuo primo viaggio e condividi i costi con i passeggeri.
        </p>
        <button onClick={onNew} className="btn-primary" style={{ width: 'auto', padding: '12px 32px' }}>
          + Nuovo viaggio
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Passengers stats */}
      {topUsers.length > 0 && (
        <div className="card mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Passeggeri</p>
          <div className="space-y-2">
            {topUsers.map(u => (
              <div key={u.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-700/30 border border-red-700/40 flex items-center justify-center text-sm font-bold text-red-300 shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-200 flex-1">{u.name}</span>
                <span className="text-xs font-semibold text-red-400 tabular-nums">
                  {u.count} {u.count === 1 ? 'viaggio' : 'viaggi'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings */}
      <div className="space-y-3">
        {bookings.map(b => {
          const costs = calculateCosts(b.trip, b.passengers);
          const { usedL } = calcTrunkUsage(b.passengers);
          const isOwn = b.userId === currentUserId;
          const date = new Date(b.trip.date).toLocaleDateString('it-IT', {
            weekday: 'short', day: 'numeric', month: 'short',
          });

          return (
            <div key={b.id} className="card group hover:border-slate-700 transition-colors">
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs bg-slate-800 text-slate-400 rounded px-1.5 py-0.5">#{b.id}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="w-4 h-4 rounded-md bg-slate-700 inline-flex items-center justify-center text-[10px] font-bold shrink-0">
                        {b.userName.charAt(0).toUpperCase()}
                      </span>
                      {b.userName}
                    </span>
                  </div>
                  <p className="font-bold text-white text-base leading-tight truncate">
                    {b.trip.from} <span className="text-red-500">→</span> {b.trip.to}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">{date} · {b.trip.time} · {b.trip.distanceKm} km</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-600 mb-0.5">p. pass.</p>
                  <p className="text-xl font-black text-red-400 tabular-nums">{formatEuro(costs.costPerPassenger)}</p>
                  <p className="text-xs text-slate-600">{formatEuro(costs.totalCost)} tot.</p>
                </div>
              </div>

              {/* Seats row */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {b.passengers.map(p => {
                  const lug = LUGGAGE_OPTIONS.find(o => o.size === p.luggage)!;
                  return (
                    <span key={p.seat} className="bg-slate-800 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-400">
                      {SEAT_LABELS[p.seat]} {lug.emoji}
                    </span>
                  );
                })}
                <span className="bg-slate-800 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-500">
                  {usedL} L
                </span>
              </div>

              {isOwn && (
                <button onClick={() => onDelete(b.id)}
                  className="text-xs text-slate-600 hover:text-red-400 transition-colors">
                  Elimina
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
