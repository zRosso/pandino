import type { Booking } from '../types';
import { LUGGAGE_OPTIONS, SEAT_LABELS } from '../types';
import { calculateCosts, calcTrunkUsage, formatEuro } from '../utils';

interface Props {
  bookings: Booking[];
  onDelete: (id: string) => void;
  onNew: () => void;
}

export default function BookingsList({ bookings, onDelete, onNew }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🚗</div>
        <h2 className="text-2xl font-bold text-white mb-2">Nessuna prenotazione</h2>
        <p className="text-slate-400 mb-8">Crea il tuo primo viaggio sulla Panda Cross!</p>
        <button onClick={onNew} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition-colors">
          + Nuovo viaggio
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Le tue prenotazioni</h2>
        <button onClick={onNew} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-5 rounded-xl transition-colors text-sm">
          + Nuovo viaggio
        </button>
      </div>

      <div className="space-y-4">
        {bookings.map((b) => {
          const costs = calculateCosts(b.trip, b.passengers);
          const { usedL } = calcTrunkUsage(b.passengers);
          const date = new Date(b.trip.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

          return (
            <div key={b.id} className="step-card hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm bg-red-900/40 text-red-400 border border-red-800 rounded px-2 py-0.5 font-mono text-xs">
                      #{b.id}
                    </span>
                    <span className="text-xs text-slate-500">{date} · {b.trip.time}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {b.trip.from} <span className="text-red-400">→</span> {b.trip.to}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {b.trip.distanceKm} km · {b.passengers.length} passeggeri · {usedL} L bagagli
                  </p>

                  {/* Seat badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {b.passengers.map((p) => {
                      const lug = LUGGAGE_OPTIONS.find(o => o.size === p.luggage)!;
                      return (
                        <span key={p.seat} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300">
                          🪑 {SEAT_LABELS[p.seat]} {lug.emoji}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">per passeggero</p>
                  <p className="text-2xl font-black text-red-400">{formatEuro(costs.costPerPassenger)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">tot. {formatEuro(costs.totalCost)}</p>
                  <button
                    onClick={() => onDelete(b.id)}
                    className="mt-3 text-xs text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
