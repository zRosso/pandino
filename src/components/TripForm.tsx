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
    if (field === 'from') setFromPlace(place); else setToPlace(place);

    if (other) {
      const from = field === 'from' ? place : fromPlace!;
      const to   = field === 'to'   ? place : toPlace!;
      setRouteLoading(true);
      setRouteError('');
      setDistanceKm('');
      try {
        const km = await getRouteDistanceKm(from, to);
        setDistanceKm(String(km));
      } catch {
        setRouteError('Percorso non trovato — inserisci i km manualmente');
      } finally {
        setRouteLoading(false);
      }
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!fromPlace) e.from = 'Seleziona la partenza dalla lista';
    if (!toPlace)   e.to   = 'Seleziona la destinazione dalla lista';
    if (!date)      e.date = 'Inserisci la data';
    const dist = parseFloat(distanceKm);
    if (isNaN(dist) || dist <= 0) e.distanceKm = 'Inserisci la distanza manualmente';
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
      to:   toPlace!.displayName.split(',').slice(0, 2).join(',').trim(),
      date, time,
      distanceKm: parseFloat(distanceKm),
      fuelPricePerLiter: parseFloat(fuelPrice),
    });
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-white mb-1">Nuovo viaggio</h2>
      <p className="text-slate-500 text-sm mb-6">Panda Cross 2023 · 5.5 L/100km · usura 0.12 €/km</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Da / A */}
        <div className="space-y-4">
          <PlaceAutocomplete label="Partenza" placeholder="Es. Milano, Piazza Duomo"
            onSelect={p => handlePlaceSelect('from', p)} error={errors.from} />
          <PlaceAutocomplete label="Destinazione" placeholder="Es. Roma, Via del Corso"
            onSelect={p => handlePlaceSelect('to', p)} error={errors.to} />
        </div>

        {/* Distanza */}
        <div className="card-inner">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">Distanza stradale (km)</label>
            {routeLoading && <span className="text-xs text-slate-400 animate-pulse">Calcolo...</span>}
            {!routeLoading && distanceKm && <span className="text-xs text-emerald-400 font-medium">✓ Calcolata</span>}
          </div>
          <input type="number" value={distanceKm} onChange={e => setDistanceKm(e.target.value)}
            placeholder="Auto-calcolata al cambio di partenza/destinazione" min="1" className="input-field" />
          {routeError    && <p className="text-amber-400 text-xs mt-1.5">{routeError}</p>}
          {errors.distanceKm && <p className="text-red-400 text-xs mt-1.5">{errors.distanceKm}</p>}
        </div>

        {/* Data e Orario */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Data</label>
            <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)}
              className="input-field w-full" />
            {errors.date && <p className="text-red-400 text-xs mt-1.5">{errors.date}</p>}
          </div>
          <div className="sm:w-36 min-w-0">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Orario</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="input-field w-full" />
          </div>
        </div>

        {/* Prezzo benzina */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Prezzo benzina (€/L)</label>
          <input type="number" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)}
            min="0.5" step="0.01" className="input-field" />
          <p className="text-slate-600 text-xs mt-1.5">Media Italia — aggiorna al prezzo reale se vuoi</p>
          {errors.fuelPrice && <p className="text-red-400 text-xs mt-1">{errors.fuelPrice}</p>}
        </div>

        <button type="submit" disabled={routeLoading} className="btn-primary">
          Scegli i posti →
        </button>
      </form>
    </div>
  );
}
