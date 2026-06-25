import { useEffect, useRef, useState } from 'react';
import type { PlaceResult } from '../types';

interface Props {
  label: string;
  placeholder?: string;
  onSelect: (place: PlaceResult) => void;
  error?: string;
}

export default function PlaceAutocomplete({ label, placeholder, onSelect, error }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setSelected('');
    if (debounce.current) clearTimeout(debounce.current);
    if (value.length < 3) { setResults([]); setOpen(false); return; }

    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=6&accept-language=it`,
          { headers: { 'Accept-Language': 'it' } }
        );
        const data = await res.json();
        const places: PlaceResult[] = data.map((r: { display_name: string; lat: string; lon: string }) => ({
          displayName: r.display_name,
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
        }));
        setResults(places);
        setOpen(places.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 380);
  }

  function handleSelect(place: PlaceResult) {
    // Mostra solo il primo segmento (città/via) nella casella
    const shortName = place.displayName.split(',').slice(0, 2).join(',').trim();
    setQuery(shortName);
    setSelected(shortName);
    setOpen(false);
    setResults([]);
    onSelect(place);
  }

  return (
    <div ref={wrapperRef}>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && !selected && setOpen(true)}
          placeholder={placeholder ?? 'Cerca un luogo...'}
          className="input-field pr-8"
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs animate-spin">⏳</span>
        )}
        {selected && !loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-sm">✓</span>
        )}

        {open && (
          <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden">
            {results.map((r, i) => {
              const parts = r.displayName.split(',');
              const main = parts.slice(0, 2).join(',').trim();
              const sub = parts.slice(2, 4).join(',').trim();
              return (
                <li
                  key={i}
                  onMouseDown={() => handleSelect(r)}
                  className="px-4 py-2.5 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0"
                >
                  <p className="text-sm text-white leading-tight">{main}</p>
                  {sub && <p className="text-xs text-slate-400 mt-0.5 leading-tight">{sub}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
