import type { SeatId, Trip } from '../types';
import { SEAT_LABELS } from '../types';

interface Props {
  trip: Trip;
  selectedSeats: SeatId[];
  onToggleSeat: (id: SeatId) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function SeatSelector({ trip, selectedSeats, onToggleSeat, onBack, onNext }: Props) {
  const date = new Date(trip.date).toLocaleDateString('it-IT', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  function seatClass(id: SeatId) {
    if (selectedSeats.includes(id)) return 'seat-btn seat-selected';
    return 'seat-btn seat-available';
  }

  return (
    <div className="card">
      {/* Header */}
      <h2 className="text-xl font-bold text-white mb-0.5">Selezione posti</h2>
      <p className="text-slate-500 text-sm mb-6">
        {trip.from} → {trip.to} · {date} {trip.time}
      </p>

      {/* Car visualization */}
      <div className="card-inner mb-6">
        {/* Car label */}
        <p className="text-center text-xs text-slate-600 font-semibold tracking-widest uppercase mb-5">
          Fiat Panda Cross
        </p>

        {/* Front row */}
        <div className="mb-3">
          <p className="text-xs text-slate-600 uppercase tracking-wider mb-3 text-center">Anteriore</p>
          <div className="flex items-end justify-center gap-6">
            {/* Driver */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-20 flex flex-col items-center justify-center gap-1
                              rounded-t-2xl rounded-b-lg border-2 border-amber-500/60 bg-amber-950/40">
                <span className="text-2xl">👤</span>
                <span className="text-[10px] text-amber-400 font-semibold leading-none">TU</span>
              </div>
              <span className="text-xs text-amber-400/80 font-medium">Guida</span>
            </div>

            {/* Steering wheel divider */}
            <div className="flex flex-col items-center gap-1 pb-8 opacity-30">
              <div className="w-10 h-10 rounded-full border-2 border-slate-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-500" />
              </div>
            </div>

            {/* Front passenger */}
            <div className="flex flex-col items-center gap-2">
              <button className={seatClass('passenger-front')} onClick={() => onToggleSeat('passenger-front')}>
                {selectedSeats.includes('passenger-front')
                  ? <span className="text-xl font-bold text-white">✓</span>
                  : <span className="text-slate-500 text-xl">+</span>}
                <span className="text-[10px] text-slate-400 leading-none">PASS</span>
              </button>
              <span className="text-xs text-slate-500">Davanti Dx</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-600 uppercase tracking-wider">Posteriore</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Rear row */}
        <div>
          <div className="flex items-end justify-center gap-3 sm:gap-5">
            {(['rear-left', 'rear-center', 'rear-right'] as SeatId[]).map((id) => (
              <div key={id} className="flex flex-col items-center gap-2">
                <button className={seatClass(id)} onClick={() => onToggleSeat(id)}>
                  {selectedSeats.includes(id)
                    ? <span className="text-xl font-bold text-white">✓</span>
                    : <span className="text-slate-500 text-xl">+</span>}
                  <span className="text-[10px] text-slate-400 leading-none">
                    {id === 'rear-left' ? 'SX' : id === 'rear-center' ? 'CTR' : 'DX'}
                  </span>
                </button>
                <span className="text-xs text-slate-500 text-center leading-tight">
                  {id === 'rear-left' ? 'Dietro Sx' : id === 'rear-center' ? 'Centro' : 'Dietro Dx'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center mt-6 pt-5 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-4 h-4 rounded border-2 border-amber-500/60 bg-amber-950/40" />
            Guidatore (tu)
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-700" />
            Selezionato
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-4 h-4 rounded border-2 border-slate-600 bg-slate-800" />
            Disponibile
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-800/40 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
        <span className="text-sm text-slate-400">Posti selezionati</span>
        <div className="flex items-center gap-2">
          {selectedSeats.length === 0
            ? <span className="text-slate-600 text-sm">Nessuno</span>
            : selectedSeats.map(s => (
              <span key={s} className="bg-red-900/40 border border-red-800/60 text-red-300 text-xs rounded-lg px-2 py-1">
                {SEAT_LABELS[s]}
              </span>
            ))
          }
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">← Indietro</button>
        <button onClick={onNext} disabled={selectedSeats.length === 0} className="btn-primary flex-1">
          Bagagli →
        </button>
      </div>
    </div>
  );
}
