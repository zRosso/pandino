import type { SeatId, Trip } from '../types';
import { SEAT_LABELS } from '../types';

interface SeatConfig {
  id: SeatId;
  taken?: boolean;
}

interface Props {
  trip: Trip;
  selectedSeats: SeatId[];
  onToggleSeat: (id: SeatId) => void;
  onBack: () => void;
  onNext: () => void;
}

const REAR_SEATS: SeatConfig[] = [
  { id: 'rear-left' as SeatId },
  { id: 'rear-center' as SeatId },
  { id: 'rear-right' as SeatId },
];

export default function SeatSelector({ trip, selectedSeats, onToggleSeat, onBack, onNext }: Props) {
  function seatClass(id: SeatId) {
    if (selectedSeats.includes(id)) return 'seat-btn seat-selected';
    return 'seat-btn seat-available';
  }

  return (
    <div className="step-card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Selezione posti</h2>
      <p className="text-slate-400 mb-2 text-sm">
        {trip.from} → {trip.to} · {new Date(trip.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} {trip.time}
      </p>
      <p className="text-slate-500 text-xs mb-8">
        Seleziona i posti che vuoi mettere a disposizione dei passeggeri
      </p>

      {/* Car interior top-down view */}
      <div className="relative mx-auto" style={{ maxWidth: 280 }}>
        {/* Car outline */}
        <div className="bg-slate-800 border-2 border-slate-600 rounded-3xl p-6 mx-auto relative">

          {/* Windshield top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-3 bg-slate-600 rounded-b-xl opacity-60" style={{ top: -2 }} />

          {/* Label */}
          <div className="text-center text-xs text-slate-500 mb-4 font-medium tracking-widest uppercase">
            Fiat Panda Cross
          </div>

          {/* Front row */}
          <div className="flex justify-between items-center mb-6 px-2">
            {/* Driver seat — always mine */}
            <div className="flex flex-col items-center gap-1">
              <div className="seat-btn border-2 border-yellow-500 bg-yellow-900/40 opacity-80" style={{ cursor: 'default' }}>
                <span className="text-yellow-400 text-lg">👤</span>
              </div>
              <span className="text-xs text-yellow-400 font-medium">Tu</span>
            </div>

            {/* Steering wheel center */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-500 flex items-center justify-center text-slate-400 text-xs">
                🔘
              </div>
              <span className="text-xs text-slate-600 mt-1">Sterzo</span>
            </div>

            {/* Front passenger */}
            <div className="flex flex-col items-center gap-1">
              <button
                className={seatClass('passenger-front')}
                onClick={() => onToggleSeat('passenger-front')}
                title={SEAT_LABELS['passenger-front']}
              >
                {selectedSeats.includes('passenger-front') ? (
                  <span className="text-white text-base">✓</span>
                ) : (
                  <span className="text-slate-400 text-base">+</span>
                )}
              </button>
              <span className="text-xs text-slate-400">Dx</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700 mx-4 mb-6 relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-800 px-2 text-xs text-slate-600">
              posteriore
            </span>
          </div>

          {/* Rear row */}
          <div className="flex justify-around items-center px-1">
            {REAR_SEATS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <button
                  className={seatClass(s.id)}
                  onClick={() => onToggleSeat(s.id)}
                  title={SEAT_LABELS[s.id]}
                >
                  {selectedSeats.includes(s.id) ? (
                    <span className="text-white text-base">✓</span>
                  ) : (
                    <span className="text-slate-400 text-base">+</span>
                  )}
                </button>
                <span className="text-xs text-slate-400 text-center leading-tight">
                  {s.id === 'rear-left' ? 'Sx' : s.id === 'rear-center' ? 'Cnt' : 'Dx'}
                </span>
              </div>
            ))}
          </div>

          {/* Rear windshield */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-2 bg-slate-600 rounded-t-xl opacity-60" style={{ bottom: -2 }} />
        </div>

        {/* Legend */}
        <div className="flex gap-4 justify-center mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-yellow-500 bg-yellow-900/40" />
            <span className="text-slate-400">Guidatore (tu)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-red-500 bg-red-600" />
            <span className="text-slate-400">Selezionato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-slate-500 bg-slate-700" />
            <span className="text-slate-400">Disponibile</span>
          </div>
        </div>
      </div>

      {/* Selected summary */}
      <div className="mt-6 bg-slate-800/50 rounded-xl p-4">
        <p className="text-sm text-slate-300">
          <span className="font-bold text-white">{selectedSeats.length}</span> posti selezionati
          {selectedSeats.length > 0 && (
            <span className="text-slate-400">
              {' '}— {selectedSeats.map(s => SEAT_LABELS[s]).join(', ')}
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors">
          ← Indietro
        </button>
        <button
          onClick={onNext}
          disabled={selectedSeats.length === 0}
          className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Continua → Bagagli
        </button>
      </div>
    </div>
  );
}
