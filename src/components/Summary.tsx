import type { Booking, Passenger, Trip } from '../types';
import { LUGGAGE_OPTIONS, PANDA_SPECS, SEAT_LABELS } from '../types';
import { calculateCosts, calcTrunkUsage, formatEuro, generateId, trunkPercentage } from '../utils';

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

  function handleConfirm() {
    const booking: Booking = {
      id: generateId(),
      trip,
      passengers,
      createdAt: new Date().toISOString(),
    };
    onConfirm(booking);
  }

  return (
    <div className="step-card max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Riepilogo prenotazione</h2>
      <p className="text-slate-400 mb-6 text-sm">Controlla tutti i dettagli prima di confermare</p>

      {/* Trip info */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-2xl">🚗</div>
          <div>
            <p className="font-bold text-white text-lg">
              {trip.from} <span className="text-red-400">→</span> {trip.to}
            </p>
            <p className="text-slate-400 text-sm">
              {new Date(trip.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ore {trip.time}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Distanza" value={`${trip.distanceKm} km`} />
          <Stat label="Benzina" value={`${trip.fuelPricePerLiter.toFixed(2)} €/L`} />
          <Stat label="Passeggeri" value={`${passengers.length}`} />
          <Stat label="Consumi Panda" value={`${PANDA_SPECS.fuelConsumptionL100km} L/100km`} />
        </div>
      </div>

      {/* Passengers & luggage */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Posti e bagagli</p>
        <div className="space-y-2">
          {passengers.map((p) => {
            const lug = LUGGAGE_OPTIONS.find((o) => o.size === p.luggage)!;
            return (
              <div key={p.seat} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">🪑 {SEAT_LABELS[p.seat]}</span>
                <span className="text-slate-400">
                  {lug.emoji} {lug.label}
                  {lug.size !== 'none' && <span className="text-slate-500 text-xs"> ({lug.volumeL} L)</span>}
                </span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-slate-700 mt-3 pt-3">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Portabagagli usato</span>
            <span className="text-slate-300">{usedL} / 225 L ({pct}%) · {usedKg} kg</span>
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Costi del viaggio</p>
        <div className="space-y-2 text-sm">
          <CostRow
            label={`Benzina (${costs.fuelLitersNeeded.toFixed(1)} L × ${trip.fuelPricePerLiter.toFixed(2)} €)`}
            value={formatEuro(costs.fuelCostTotal)}
            sub="carburante necessario per il viaggio"
          />
          <CostRow
            label={`Usura veicolo (${trip.distanceKm} km × 0.12 €)`}
            value={formatEuro(costs.wearCostTotal)}
            sub="ammortamento, gomme, olio, manutenzione"
          />
          <div className="border-t border-slate-700 pt-2 mt-2">
            <CostRow label="Totale viaggio" value={formatEuro(costs.totalCost)} bold />
          </div>
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Costo per passeggero</span>
              <span className="text-2xl font-black text-red-400">{formatEuro(costs.costPerPassenger)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Totale ÷ {passengers.length} passeggeri (escludi il guidatore)
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors">
          ← Modifica
        </button>
        <button onClick={handleConfirm} className="flex-2 flex-grow bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-colors">
          ✓ Conferma prenotazione
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
  );
}

function CostRow({ label, value, sub, bold }: { label: string; value: string; sub?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <span className={bold ? 'font-bold text-white' : 'text-slate-300'}>{label}</span>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
      <span className={bold ? 'font-bold text-white' : 'text-slate-200'}>{value}</span>
    </div>
  );
}
