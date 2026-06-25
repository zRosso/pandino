import { useState } from 'react';
import type { Trip } from '../types';
import { generateId } from '../utils';

interface Props {
  onSubmit: (trip: Trip) => void;
}

export default function TripForm({ onSubmit }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    from: '',
    to: '',
    date: today,
    time: '09:00',
    distanceKm: '',
    fuelPricePerLiter: '1.85',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.from.trim()) e.from = 'Inserisci la partenza';
    if (!form.to.trim()) e.to = 'Inserisci la destinazione';
    if (!form.date) e.date = 'Inserisci la data';
    const dist = parseFloat(form.distanceKm);
    if (isNaN(dist) || dist <= 0) e.distanceKm = 'Inserisci una distanza valida';
    const fuel = parseFloat(form.fuelPricePerLiter);
    if (isNaN(fuel) || fuel <= 0) e.fuelPricePerLiter = 'Inserisci un prezzo valido';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({
      id: generateId(),
      from: form.from.trim(),
      to: form.to.trim(),
      date: form.date,
      time: form.time,
      distanceKm: parseFloat(form.distanceKm),
      fuelPricePerLiter: parseFloat(form.fuelPricePerLiter),
    });
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const c = { ...e }; delete c[field]; return c; });
  }

  return (
    <div className="step-card max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Dettagli del viaggio</h2>
      <p className="text-slate-400 mb-6 text-sm">Configura il tuo viaggio sulla Panda Cross 2023</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Da" error={errors.from}>
            <input
              type="text"
              value={form.from}
              onChange={(e) => set('from', e.target.value)}
              placeholder="Es. Milano"
              className="input-field"
            />
          </Field>
          <Field label="A" error={errors.to}>
            <input
              type="text"
              value={form.to}
              onChange={(e) => set('to', e.target.value)}
              placeholder="Es. Roma"
              className="input-field"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Data" error={errors.date}>
            <input
              type="date"
              value={form.date}
              min={today}
              onChange={(e) => set('date', e.target.value)}
              className="input-field"
            />
          </Field>
          <Field label="Orario">
            <input
              type="time"
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
              className="input-field"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Distanza (km)" error={errors.distanceKm}>
            <input
              type="number"
              value={form.distanceKm}
              onChange={(e) => set('distanceKm', e.target.value)}
              placeholder="Es. 120"
              min="1"
              className="input-field"
            />
          </Field>
          <Field label="Prezzo benzina (€/L)" error={errors.fuelPricePerLiter}>
            <input
              type="number"
              value={form.fuelPricePerLiter}
              onChange={(e) => set('fuelPricePerLiter', e.target.value)}
              placeholder="Es. 1.85"
              min="0.5"
              step="0.01"
              className="input-field"
            />
          </Field>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 text-sm text-slate-400 mt-2">
          <span className="text-slate-300 font-medium">Panda Cross 2023 — </span>
          consumo medio 5.5 L/100km · usura veicolo 0.12 €/km
        </div>

        <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-colors mt-2">
          Continua → Selezione posti
        </button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
