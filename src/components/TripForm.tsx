import { useState } from 'react';
import type { PlaceResult, Trip } from '../types';
import { generateId, getRouteDistanceKm } from '../utils';
import PlaceAutocomplete from './PlaceAutocomplete';

interface Props {
  onSubmit: (trip: Trip) => void;
}

export default function TripForm({ onSubmit }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [fromPlace, setFromPlace] = useState<PlaceResult | null>(null);
  const [toPlace, setToPlace] = useState<PlaceResult | null>(null);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('09:00');
  const [distanceKm, setDistanceKm] = useState('');
  const [fuelPrice, setFuelPrice] = useState('1.89');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handlePlaceSelect(field: 'from' | 'to', place: PlaceResult) {
    const other = field === 'from' ? toPlace : fromPlace;
    if (field === 'from') setFromPlace(place);
    else setToPlace(place);

    if (other) {
      const from = field === 'from' ? place : fromPlace!;
      const to = field === 'to' ? place : toPlace!;
      setRouteLoading(true);
      setRouteError('');
      setDistanceKm('');
      try {
        const km = await getRouteDistanceKm(from, to);
        setDistanceKm(String(km));
      } catch {
        setRouteError('Impossibile calcolare il percorso — inserisci i km manualmente');
      } finally {
        setRouteLoading(false);
      }
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!fromPlace) e.from = 'Seleziona la partenza dalla lista';
    if (!toPlace) e.to = 'Seleziona la destinazione dalla lista';
    if (!date) e.date = 'Inserisci la data';
    const dist = parseFloat(distanceKm);
    if (isNaN(dist) || dist <= 0) e.distanceKm = 'Distanza non disponibile — inseriscila manualmente';
    const fuel = parseFloat(fuelPrice);
    if (isNaN(fuel) || fuel <= 0) e.fuelPrice = 'Prezzo non valido';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({
      id: generateId(),
      from: fromPlace!.displayName.split(',').slice(0, 2).join(',').trim(),
      to: toPlace!.displayName.split(',').slice(0, 2).join(',').trim(),
      date,
      time,
      distanceKm: parseFloat(distanceKm),
      fuelPricePerLiter: parseFloat(fuelPrice),
    });
  }

  return (
    <div className="step-card max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Dettagli del viaggio</h2>
      <p className="text-slate-400 mb-6 text-sm">Configura il tuo viaggio sulla Panda Cross 2023</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PlaceAutocomplete
          label="Da"
          placeholder="Es. Milano, Piazza Duomo"
          onSelect={(p) => handlePlaceSelect('from', p)}
          error={errors.from}
        />
        <PlaceAutocomplete
          label="A"
          placeholder="Es. Roma, Colosseo"
          onSelect={(p) => handlePlaceSelect('to', p)}
          error={errors.to}
        />

        {/* Distanza calcolata automaticamente */}
        <div className="bg-slate-800/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-300">Distanza stradale (km)</label>
            {routeLoading && (
              <span className="text-xs text-slate-400 animate-pulse">⏳ Calcolo percorso...</span>
            )}
            {!routeLoading && distanceKm && (
              <span className="text-xs text-green-400">✓ Calcolata via OpenStreetMap</span>
            )}
          </div>
          <input
            type="number"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            placeholder="Seleziona partenza e destinazione..."
            min="1"
            className="input-field"
          />
          {routeError && <p className="text-yellow-400 text-xs mt-1">{routeError}</p>}
          {errors.distanceKm && <p className="text-red-400 text-xs mt-1">{errors.distanceKm}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Data</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
            {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Orario</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Prezzo benzina (€/L)
          </label>
          <input
            type="number"
            value={fuelPrice}
            onChange={(e) => setFuelPrice(e.target.value)}
            min="0.5"
            step="0.01"
            className="input-field"
          />
          <p className="text-xs text-slate-500 mt-1">Media Italia attuale — aggiorna se conosci il prezzo esatto</p>
          {errors.fuelPrice && <p className="text-red-400 text-xs mt-1">{errors.fuelPrice}</p>}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 text-sm text-slate-400">
          <span className="text-slate-300 font-medium">Panda Cross 2023 — </span>
          5.5 L/100km · usura 0.12 €/km
        </div>

        <button
          type="submit"
          disabled={routeLoading}
          className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          Continua → Selezione posti
        </button>
      </form>
    </div>
  );
}
