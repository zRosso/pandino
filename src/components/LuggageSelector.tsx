import type { LuggageSize, Passenger, SeatId, Trip } from '../types';
import { LUGGAGE_OPTIONS, PANDA_SPECS, SEAT_LABELS } from '../types';
import { calcTrunkUsage, trunkPercentage } from '../utils';

interface Props {
  trip: Trip;
  selectedSeats: SeatId[];
  passengers: Passenger[];
  onUpdateLuggage: (seat: SeatId, size: LuggageSize) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function LuggageSelector({ selectedSeats, passengers, onUpdateLuggage, onBack, onNext }: Props) {
  const { usedL, usedKg } = calcTrunkUsage(passengers);
  const pct = trunkPercentage(usedL);
  const overVolume = usedL > PANDA_SPECS.trunkLiters;
  const overWeight = usedKg > PANDA_SPECS.trunkMaxWeightKg;
  const blocked = overVolume || overWeight;

  const barColor = overVolume ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = overVolume ? 'text-red-400' : pct > 80 ? 'text-amber-400' : 'text-emerald-400';

  function getLuggage(seat: SeatId): LuggageSize {
    return passengers.find(p => p.seat === seat)?.luggage ?? 'none';
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-white mb-1">Bagagli</h2>
      <p className="text-slate-500 text-sm mb-6">
        Portabagagli Panda Cross: <span className="text-slate-300">225 L</span> · max <span className="text-slate-300">50 kg</span>
      </p>

      {/* Trunk gauge */}
      <div className="card-inner mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-medium text-slate-300">Portabagagli</span>
          <span className={`text-sm font-bold tabular-nums ${textColor}`}>{usedL} / 225 L</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden mb-2">
          <div className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-600">
          <span>{usedKg} kg{overWeight && <span className="text-red-400 ml-1">⚠ limite superato</span>}</span>
          <span>{pct}% occupato</span>
        </div>
      </div>

      {/* Per-seat selection */}
      <div className="space-y-4 mb-6">
        {selectedSeats.map(seat => {
          const current = getLuggage(seat);
          return (
            <div key={seat} className="card-inner">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-xs">🪑</div>
                <span className="text-sm font-semibold text-slate-200">{SEAT_LABELS[seat]}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {LUGGAGE_OPTIONS.map(opt => {
                  const active = current === opt.size;
                  return (
                    <button key={opt.size} onClick={() => onUpdateLuggage(seat, opt.size)}
                      className={`rounded-xl border-2 p-3 text-left transition-all duration-150 active:scale-95 ${
                        active
                          ? 'border-red-500 bg-red-950/50'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                      }`}>
                      <div className="text-xl mb-1">{opt.emoji}</div>
                      <div className="text-xs font-semibold text-white leading-tight">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {opt.size === 'none' ? 'Gratis' : `${opt.volumeL} L · ${opt.weightKg} kg`}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                {LUGGAGE_OPTIONS.find(o => o.size === current)?.description}
              </p>
            </div>
          );
        })}
      </div>

      {blocked && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300 mb-5">
          {overVolume && '⚠ Volume supera la capacità del portabagagli (225 L). '}
          {overWeight && '⚠ Peso supera il limite (50 kg). '}
          Riduci il bagaglio.
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">← Indietro</button>
        <button onClick={onNext} disabled={blocked} className="btn-primary flex-1">Riepilogo →</button>
      </div>
    </div>
  );
}
