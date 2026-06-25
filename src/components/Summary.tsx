import type { Booking, Passenger, Trip } from '../types';
import { LUGGAGE_OPTIONS, PANDA_SPECS, SEAT_LABELS } from '../types';
import { calculateCosts, calcTrunkUsage, formatEuro, trunkPercentage } from '../utils';

interface Props {
  trip: Trip;
  passengers: Passenger[];
  onBack: () => void;
  onConfirm: (booking: Booking) => void;
}

export default function Summary({ trip, passengers, onBack, onConfirm }: Props) {
  const costs = calculateCosts(trip, passengers);
  const { usedL, usedKg } = calcTrunkUsage(passengers);
  const pct = trunkPercentage(usedL);
  const tripDate = new Date(trip.date).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-white mb-1">Riepilogo</h2>
      <p className="text-slate-500 text-sm mb-6">Controlla tutto prima di confermare</p>

      {/* Trip */}
      <div className="card-inner mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-base">🚗</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-base leading-tight">
              {trip.from} <span className="text-red-500">→</span> {trip.to}
            </p>
            <p className="text-slate-500 text-sm mt-0.5">{tripDate} · {trip.time}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/60">
          <Stat label="Distanza" value={`${trip.distanceKm} km`} />
          <Stat label="Passeggeri" value={`${passengers.length}`} />
          <Stat label="Benzina" value={`${trip.fuelPricePerLiter.toFixed(2)} €/L`} />
        </div>
      </div>

      {/* Seats & luggage */}
      <div className="card-inner mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Posti e bagagli</p>
        <div className="space-y-2.5">
          {passengers.map(p => {
            const lug = LUGGAGE_OPTIONS.find(o => o.size === p.luggage)!;
            return (
              <div key={p.seat} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">🪑 {SEAT_LABELS[p.seat]}</span>
                <span className="text-sm text-slate-400">
                  {lug.emoji} {lug.label}
                  {lug.size !== 'none' && <span className="text-slate-600 text-xs ml-1">({lug.volumeL} L)</span>}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-3 pt-3 border-t border-slate-700/60">
          <span>Portabagagli</span>
          <span>{usedL} / 225 L ({pct}%) · {usedKg} kg</span>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="card-inner mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Costi</p>
        <div className="space-y-2.5">
          <CostRow
            label="Carburante"
            sub={`${costs.fuelLitersNeeded.toFixed(1)} L × ${trip.fuelPricePerLiter.toFixed(2)} €`}
            value={formatEuro(costs.fuelCostTotal)} />
          <CostRow
            label="Usura veicolo"
            sub={`${trip.distanceKm} km × ${PANDA_SPECS.wearCostPerKm} €`}
            value={formatEuro(costs.wearCostTotal)} />
          <div className="border-t border-slate-700/60 pt-2.5">
            <CostRow label="Totale viaggio" value={formatEuro(costs.totalCost)} bold />
          </div>
        </div>

        {/* Per-passenger highlight */}
        <div className="mt-4 bg-red-950/40 border border-red-900/60 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Quota per passeggero</p>
              <p className="text-xs text-slate-500 mt-0.5">
                totale ÷ {passengers.length} {passengers.length === 1 ? 'passeggero' : 'passeggeri'}
              </p>
            </div>
            <p className="text-3xl font-black text-red-400 tabular-nums">{formatEuro(costs.costPerPassenger)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">← Modifica</button>
        <button
          onClick={() => onConfirm({ id: '', trip, passengers, createdAt: '', userId: '', userName: '' })}
          className="btn-primary flex-1"
        >
          ✓ Conferma
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-600 text-xs mb-0.5">{label}</p>
      <p className="text-white text-sm font-semibold">{value}</p>
    </div>
  );
}

function CostRow({ label, sub, value, bold }: { label: string; sub?: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={bold ? 'text-sm font-semibold text-white' : 'text-sm text-slate-300'}>{label}</p>
        {sub && <p className="text-xs text-slate-600">{sub}</p>}
      </div>
      <p className={bold ? 'text-sm font-semibold text-white tabular-nums' : 'text-sm text-slate-200 tabular-nums shrink-0'}>{value}</p>
    </div>
  );
}
