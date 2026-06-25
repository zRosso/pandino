import type { Booking } from '../types';
import { calculateCosts, formatEuro } from '../utils';

interface Props {
  booking: Booking;
  onViewAll: () => void;
  onNew: () => void;
}

export default function SuccessScreen({ booking, onViewAll, onNew }: Props) {
  const costs = calculateCosts(booking.trip, booking.passengers);

  return (
    <div className="step-card max-w-xl mx-auto text-center">
      <div className="text-6xl mb-4 animate-bounce">✅</div>
      <h2 className="text-2xl font-bold text-white mb-2">Prenotazione confermata!</h2>
      <p className="text-slate-400 mb-6">Il tuo viaggio è stato salvato con successo.</p>

      <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-left">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Dettagli</p>
        <p className="text-white font-bold text-lg mb-1">
          {booking.trip.from} → {booking.trip.to}
        </p>
        <p className="text-slate-400 text-sm mb-3">
          {new Date(booking.trip.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} · {booking.trip.time}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm border-t border-slate-700 pt-3">
          <div>
            <p className="text-slate-500 text-xs">Passeggeri</p>
            <p className="text-white font-medium">{booking.passengers.length}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Costo per passeggero</p>
            <p className="text-red-400 font-bold">{formatEuro(costs.costPerPassenger)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Totale viaggio</p>
            <p className="text-white font-medium">{formatEuro(costs.totalCost)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Codice prenotazione</p>
            <p className="text-slate-300 font-mono text-xs">#{booking.id}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onViewAll} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors">
          Tutte le prenotazioni
        </button>
        <button onClick={onNew} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors">
          + Nuovo viaggio
        </button>
      </div>
    </div>
  );
}
