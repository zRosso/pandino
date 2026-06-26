import { useEffect, useState } from 'react';
import type { PlaceResult, Trip } from '../types';
import { supabase } from '../supabase';
import { generateId, getRouteDistanceKm } from '../utils';
import PlaceAutocomplete from './PlaceAutocomplete';

const ADMIN_EMAIL = 'gio.giorossi@yahoo.com';

interface Props {
  onSubmit: (trip: Trip) => void;
  fuelPrice: number | null;
  fuelLoading: boolean;
  isAdmin: boolean;
  onFuelPriceChange: (price: number) => void;
  initialTrip?: Trip; // pre-popola campi in modalità modifica
}

export default function TripForm({ onSubmit, fuelPrice, fuelLoading, isAdmin, onFuelPriceChange, initialTrip }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const isEditing = !!initialTrip;

  // In modalità modifica, from/to sono testi editabili (no geocoding richiesto)
  const [fromText,   setFromText]   = useState(initialTrip?.from ?? '');
  const [toText,     setToText]     = useState(initialTrip?.to ?? '');

  // In modalità nuova, usiamo PlaceAutocomplete con oggetti PlaceResult
  const [fromPlace, setFromPlace] = useState<PlaceResult | null>(null);
  const [toPlace,   setToPlace]   = useState<PlaceResult | null>(null);

  const [date,      setDate]      = useState(initialTrip?.date ?? today);
  const [time,      setTime]      = useState(initialTrip?.time ?? '09:00');
  const [distanceKm, setDistanceKm] = useState(initialTrip ? String(initialTrip.distanceKm) : '');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError,   setRouteError]   = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [editingFuel, setEditingFuel] = useState(false);
  const [fuelInput,   setFuelInput]   = useState('');
  const [fuelSaving,  setFuelSaving]  = useState(false);
  const [fuelError,   setFuelError]   = useState('');

  const [adminVerified, setAdminVerified] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email === ADMIN_EMAIL) setAdminVerified(true);
    });
  }, []);

  const canEdit = isAdmin || adminVerified;

  async function saveFuelPrice() {
    const p = parseFloat(fuelInput.replace(',', '.'));
    if (isNaN(p) || p < 0.5 || p > 5) {
      setFuelError('Prezzo non valido (es. 1.850)');
      return;
    }
    setFuelSaving(true);
    setFuelError('');
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'fuel_price', value: p.toFixed(3), updated_at: new Date().toISOString() });
    if (error) {
      setFuelError(error.message);
    } else {
      onFuelPriceChange(p);
      setEditingFuel(false);
    }
    setFuelSaving(false);
  }

  async function handlePlaceSelect(field: 'from' | 'to', place: PlaceResult) {
    const other = field === 'from' ? toPlace : fromPlace;
    if (field === 'from') setFromPlace(place); else setToPlace(place);

    if (other) {
      const from = field === 'from' ? place : fromPlace!;
      const to   = field === 'to'   ? place : toPlace!;
      setRouteLoading(true); setRouteError(''); setDistanceKm('');
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
    if (isEditing) {
      if (!fromText.trim()) e.from = 'Inserisci la partenza';
      if (!toText.trim())   e.to   = 'Inserisci la destinazione';
    } else {
      if (!fromPlace) e.from = 'Seleziona la partenza dalla lista';
      if (!toPlace)   e.to   = 'Seleziona la destinazione dalla lista';
    }
    if (!date) e.date = 'Inserisci la data';
    const dist = parseFloat(distanceKm);
    if (isNaN(dist) || dist <= 0) e.distanceKm = 'Inserisci la distanza in km';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const from = isEditing
      ? fromText.trim()
      : fromPlace!.displayName.split(',').slice(0, 2).join(',').trim();
    const to = isEditing
      ? toText.trim()
      : toPlace!.displayName.split(',').slice(0, 2).join(',').trim();

    onSubmit({
      id: initialTrip?.id ?? generateId(),
      from, to, date, time,
      distanceKm: parseFloat(distanceKm),
      fuelPricePerLiter: fuelPrice ?? 1.89,
    });
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-white mb-1">
        {isEditing ? 'Modifica viaggio' : 'Nuovo viaggio'}
      </h2>
      <p className="text-slate-500 text-sm mb-6">Panda Cross 2023 · 5.5 L/100km · usura 0.12 €/km</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Partenza / Destinazione */}
        {isEditing ? (
          <div className="space-y-4">
            <div className="card-inner">
              <label className="block text-sm font-medium text-slate-300 mb-2">Partenza</label>
              <input type="text" value={fromText} onChange={e => setFromText(e.target.value)}
                placeholder="Es. Milano" className="input-field" />
              {errors.from && <p className="text-red-400 text-xs mt-1.5">{errors.from}</p>}
            </div>
            <div className="card-inner">
              <label className="block text-sm font-medium text-slate-300 mb-2">Destinazione</label>
              <input type="text" value={toText} onChange={e => setToText(e.target.value)}
                placeholder="Es. Roma" className="input-field" />
              {errors.to && <p className="text-red-400 text-xs mt-1.5">{errors.to}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <PlaceAutocomplete label="Partenza" placeholder="Es. Milano, Piazza Duomo"
              onSelect={p => handlePlaceSelect('from', p)} error={errors.from} />
            <PlaceAutocomplete label="Destinazione" placeholder="Es. Roma, Via del Corso"
              onSelect={p => handlePlaceSelect('to', p)} error={errors.to} />
          </div>
        )}

        {/* Distanza */}
        <div className="card-inner">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">Distanza stradale (km)</label>
            {routeLoading && <span className="text-xs text-slate-500 animate-pulse">Calcolo...</span>}
            {!routeLoading && distanceKm && !isEditing && <span className="text-xs text-emerald-400 font-medium">✓ Calcolata</span>}
          </div>
          <input type="number" value={distanceKm} onChange={e => setDistanceKm(e.target.value)}
            placeholder={isEditing ? '' : 'Auto-calcolata dopo aver scelto partenza e destinazione'}
            min="1" className="input-field" />
          {routeError        && <p className="text-amber-400 text-xs mt-1.5">{routeError}</p>}
          {errors.distanceKm && <p className="text-red-400 text-xs mt-1.5">{errors.distanceKm}</p>}
        </div>

        {/* Data */}
        <div className="card-inner">
          <label className="block text-sm font-medium text-slate-300 mb-2">Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="input-field" />
          {errors.date && <p className="text-red-400 text-xs mt-1.5">{errors.date}</p>}
        </div>

        {/* Orario */}
        <div className="card-inner">
          <label className="block text-sm font-medium text-slate-300 mb-2">Orario</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="input-field" />
        </div>

        {/* Prezzo benzina */}
        <div className="card-inner">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Prezzo benzina</span>
            {canEdit && !fuelLoading && !editingFuel && (
              <button
                type="button"
                onClick={() => { setFuelInput(fuelPrice?.toFixed(3) ?? '1.890'); setEditingFuel(true); }}
                className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-2.5 py-1 transition-colors"
              >
                ✏ Modifica
              </button>
            )}
          </div>

          {fuelLoading ? (
            <div className="h-14 bg-slate-800 rounded-xl animate-pulse" />
          ) : editingFuel ? (
            <div>
              <div className="flex gap-2">
                <input
                  type="number" step="0.001" min="0.5" max="5"
                  value={fuelInput}
                  onChange={e => setFuelInput(e.target.value)}
                  placeholder="Es. 1.847"
                  className="input-field flex-1"
                  autoFocus
                />
                <button type="button" onClick={saveFuelPrice} disabled={fuelSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-4 rounded-xl transition-colors disabled:opacity-50"
                  style={{ minHeight: 48 }}>
                  {fuelSaving ? '…' : '✓'}
                </button>
                <button type="button" onClick={() => { setEditingFuel(false); setFuelError(''); }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 rounded-xl transition-colors"
                  style={{ minHeight: 48 }}>
                  ✕
                </button>
              </div>
              {fuelError && <p className="text-red-400 text-xs mt-1.5">{fuelError}</p>}
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700/60">
              <p className="text-2xl font-black text-white tabular-nums">
                {fuelPrice?.toFixed(3)} <span className="text-base font-medium text-slate-400">€/L</span>
              </p>
              {!canEdit && <p className="text-xs text-slate-600 mt-0.5">Impostato dal guidatore</p>}
            </div>
          )}
        </div>

        <button type="submit" disabled={routeLoading || fuelLoading} className="btn-primary">
          {isEditing ? 'Avanti →' : 'Scegli i posti →'}
        </button>
      </form>
    </div>
  );
}
