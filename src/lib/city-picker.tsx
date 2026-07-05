import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import citiesData from '../cities.json';

// Shared city search-picker used by the flight and jet-lag tool islands.
type City = { slug: string; name: string; country: string; tz: string };
export const CITIES = citiesData as City[];
export type Endpoint = { name: string; tz: string };

export const cityByTz = (tz: string) => CITIES.find((c) => c.tz === tz);
export const cityLabel = (tz: string) => cityByTz(tz)?.name ?? tz.split('/').pop()!.replace(/_/g, ' ');

export const CityPicker: React.FC<{ value: Endpoint; onChange: (e: Endpoint) => void; label: string }> = ({ value, onChange, label }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const results = useMemo(
    () => (query.trim() ? CITIES.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6) : []),
    [query]
  );
  return (
    <div className="relative">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">{label}</span>
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={open ? query : value.name}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setQuery(''); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          aria-label={label}
          className="w-full bg-zinc-800/60 text-zinc-100 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
          {results.map((c) => (
            <button
              key={c.slug}
              onMouseDown={() => { onChange({ name: c.name, tz: c.tz }); setOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              {c.name}<span className="text-zinc-600"> · {c.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
