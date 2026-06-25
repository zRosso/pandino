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

export default function LuggageSelector({ trip, selectedSeats, passengers, onUpdateLuggage, onBack, onNext }: Props) {
  const { usedL, usedKg } = calcTrunkUsage(passengers);
  const pct = trunkPercentage(usedL);
  const overWeight = usedKg > PANDA_SPECS.trunkMaxWeightKg;
  const overVolume = usedL > PANDA_SPECS.trunkLiters;

  function getLuggage(seat: SeatId): LuggageSize {
    return passengers.find((p) => p.seat === seat)?.luggage ?? 'none';
  }

  return (
    <div className="step-card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Bagagli</h2>
      <p className="text-slate-400 mb-2 text-sm">
        {trip.from} → {trip.to} · {selectedSeats.length} passeggeri
      </p>
      <p className="text-slate-500 text-xs mb-6">
        Portabagagli Panda Cross: <span className="text-white font-medium">225 litri</span> · peso max consigliato: <span className="text-white font-medium">50 kg</span>
      </p>

      {/* Trunk fill indicator */}
      <div className="bg-slate-800/60 rounded-xl p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-300 font-medium">Portabagagli</span>
          <span className={`font-bold ${overVolume ? 'text-red-400' : pct > 80 ? 'text-yellow-400' : 'text-green-400'}`}>
            {usedL} / {PANDA_SPECS.trunkLiters} L
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${overVolume ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1.5">
          <span>Peso: {usedKg} kg {overWeight && <span className="text-red-400">⚠ sopra il limite</span>}</span>
          <span>{pct}% occupato</span>
        </div>
      </div>

      {/* Per-seat luggage selection */}
      <div className="space-y-5">
        {selectedSeats.map((seat) => {
          const current = getLuggage(seat);
          return (
            <div key={seat} className="bg-slate-800/40 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-200 mb-3">
                🪑 Posto {SEAT_LABELS[seat]}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LUGGAGE_OPTIONS.map((opt) => {
                  const selected = current === opt.size;
                  return (
                    <button
                      key={opt.size}
                      onClick={() => onUpdateLuggage(seat, opt.size)}
                      className={`rounded-xl border-2 p-3 text-left transition-all duration-150 ${
                        selected
                          ? 'border-red-500 bg-red-900/30'
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{opt.emoji}</div>
                      <div className="text-xs font-bold text-white leading-tight">{opt.label}</div>
                      {opt.size !== 'none' && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {opt.volumeL} L · {opt.weightKg} kg
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {LUGGAGE_OPTIONS.find(o => o.size === current)?.description}
              </p>
            </div>
          );
        })}
      </div>

      {(overVolume || overWeight) && (
        <div className="mt-4 bg-red-900/30 border border-red-700 rounded-xl p-3 text-sm text-red-300">
          ⚠️ {overVolume ? 'Il volume supera la capacità del portabagagli (225 L).' : ''}{' '}
          {overWeight ? 'Il peso supera il limite consigliato (50 kg).' : ''}{' '}
          Riduci il bagaglio di qualche passeggero.
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors">
          ← Indietro
        </button>
        <button
          onClick={onNext}
          disabled={overVolume || overWeight}
          className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Continua → Riepilogo
        </button>
      </div>
    </div>
  );
}
