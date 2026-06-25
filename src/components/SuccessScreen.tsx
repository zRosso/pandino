import type { Booking } from '../types';
import { calculateCosts, formatEuro } from '../utils';

interface Props {
  booking: Booking;
  onViewAll: () => void;
  onNew: () => void;
}

export default function SuccessScreen({ booking, onViewAll, onNew }: Props) {
  const costs = calculateCosts(booking.trip, booking.passengers);
  const date = new Date(booking.trip.date).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="card text-center">
      {/* Icon */}
      <div className="w-16 h-16 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">
        ✅
      </div>

      <h2 className="text-xl font-bold text-white mb-1">Prenotazione confermata</h2>
      <p className="text-slate-500 text-sm mb-6">Salvata con successo su Supabase</p>

      <div className="card-inner text-left mb-6">
        <p className="font-bold text-white text-base mb-0.5">
          {booking.trip.from} <span className="text-red-500">→</span> {booking.trip.to}
        </p>
        <p className="text-slate-500 text-sm mb-4">{date} · {booking.trip.time}</p>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-700/60 pt-4">
          <div>
            <p className="text-slate-600 text-xs">Passeggeri</p>
            <p className="text-white font-semibold text-sm">{booking.passengers.length}</p>
          </div>
          <div>
            <p className="text-slate-600 text-xs">Quota p. passeggero</p>
            <p className="text-red-400 font-bold text-sm">{formatEuro(costs.costPerPassenger)}</p>
          </div>
          <div>
            <p className="text-slate-600 text-xs">Totale viaggio</p>
            <p className="text-white font-semibold text-sm">{formatEuro(costs.totalCost)}</p>
          </div>
          <div>
            <p className="text-slate-600 text-xs">Codice</p>
            <p className="text-slate-400 font-mono text-xs mt-0.5">#{booking.id}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onViewAll} className="btn-secondary flex-1 text-sm">Lista prenotazioni</button>
        <button onClick={onNew} className="btn-primary flex-1 text-sm">+ Nuovo viaggio</button>
      </div>
    </div>
  );
}
