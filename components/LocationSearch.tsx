
import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { MAJOR_CITIES } from '../constants';
import { City } from '../types';

interface LocationSearchProps {
  onSelectCity: (city: City) => void;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onSelectCity }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = MAJOR_CITIES.filter(
      city => 
        city.name.toLowerCase().includes(lowerQuery) || 
        city.country.toLowerCase().includes(lowerQuery)
    );
    setResults(filtered);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: City) => {
    onSelectCity(city);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zinc-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-xl leading-5 bg-zinc-900/50 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:bg-zinc-900 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all"
          placeholder="Search for a city or country..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button 
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl max-h-60 overflow-auto py-1 text-base sm:text-sm">
          {results.map((city) => (
            <button
              key={`${city.name}-${city.country}`}
              onClick={() => handleSelect(city)}
              className="w-full text-left px-4 py-3 hover:bg-zinc-800 flex items-center gap-3 transition-colors border-b border-zinc-800/50 last:border-0"
            >
              <div className="p-1.5 bg-zinc-800 rounded-full text-zinc-400">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-zinc-200">{city.name}</span>
                <span className="text-xs text-zinc-500">{city.country} • {city.timezone?.split('/').pop()?.replace('_', ' ')}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-4 text-center text-sm text-zinc-500">
          No locations found
        </div>
      )}
    </div>
  );
};
