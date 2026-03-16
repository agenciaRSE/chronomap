
import React, { useState, useEffect, useCallback } from 'react';
import { NewsTicker } from './components/NewsTicker';
import { AnimatedLogo } from './components/AnimatedLogo';
import { MapChart } from './components/MapChart';
import { DiscordGenerator } from './components/DiscordGenerator';
import { AboutModal } from './components/AboutModal';
import { TimeScrubber } from './components/TimeScrubber';
import { LocationSearch } from './components/LocationSearch';
import { MAJOR_CITIES } from './constants';
import { MapClickEvent, TimeState, SavedLocation, City } from './types';
import { addHours, subHours, differenceInMinutes, addMinutes, addDays, addWeeks, addMonths } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import tzlookup from 'tz-lookup';
import { enUS } from 'date-fns/locale';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Share2, Calendar, Check, X, MapPin, Clock, History, Zap, Info, Pin, ChevronUp, ChevronDown, List, Map as MapIcon, Trash2 } from 'lucide-react';

// Configuration for time steps
const TIME_STEPS = [
  { label: '1 MINUTE', fn: addMinutes, amount: 1 },
  { label: '15 MINS', fn: addMinutes, amount: 15 },
  { label: '1 HOUR', fn: addHours, amount: 1 },
  { label: '1 DAY', fn: addDays, amount: 1 },
  { label: '1 WEEK', fn: addWeeks, amount: 1 },
  { label: '1 MONTH', fn: addMonths, amount: 1 },
];

const App: React.FC = () => {
  console.log("APP RENDERING...");
  // Real-world wall clock time
  const [realTime, setRealTime] = useState(new Date());
  
  // Application simulated time
  const [timeState, setTimeState] = useState<TimeState>({
    current: new Date(),
    mode: 'live',
    formattedTime: '',
    formattedDate: ''
  });

  // Time Step Selection State (Default to 1 HOUR which is index 2)
  const [timeStepIndex, setTimeStepIndex] = useState(2);

  // Initialize locations from localStorage if available
  const [locations, setLocations] = useState<SavedLocation[]>(() => {
    try {
      const saved = localStorage.getItem('chronomap-pinned-locations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load saved locations", e);
      return [];
    }
  });

  const [showDiscordGen, setShowDiscordGen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [centerTarget, setCenterTarget] = useState<[number, number] | null>(null);
  
  // Mobile View State: Default to map view on mobile, list view on desktop
  const [isMobileListOpen, setIsMobileListOpen] = useState(window.innerWidth < 768 ? false : true);

  // Persist pinned locations to localStorage whenever locations change
  useEffect(() => {
    const pinnedLocations = locations.filter(loc => loc.isPinned);
    localStorage.setItem('chronomap-pinned-locations', JSON.stringify(pinnedLocations));
  }, [locations]);

  // Check for PWA Shortcuts actions on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'discord') {
      setShowDiscordGen(true);
      // Optional: Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Real-time clock ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulated time ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (timeState.mode === 'live' && !isPaused && !isScrubbing) {
        // In live mode, we sync directly with real time
        setTimeState(prev => ({ ...prev, current: new Date() }));
      } else if (timeState.mode === 'custom' && !isPaused && !isScrubbing) {
        // In custom mode (playing), we advance the offset
        setTimeState(prev => ({
          ...prev,
          current: new Date(prev.current.getTime() + 1000),
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeState.mode, isPaused, isScrubbing]);

  // Update formatted strings for UI
  useEffect(() => {
    setTimeState(prev => ({
      ...prev,
      formattedTime: format(prev.current, 'HH:mm:ss'),
      formattedDate: format(prev.current, 'EEE, MMM d, yyyy', { locale: enUS })
    }));
  }, [timeState.current]);

  const handleMapClick = useCallback((data: MapClickEvent) => {
    let name = data.country || `Lat: ${data.lat.toFixed(1)}, Lng: ${data.lng.toFixed(1)}`;
    let timezone = undefined;
    
    try {
      timezone = tzlookup(data.lat, data.lng);
    } catch (e) {
      console.warn('Could not find timezone for coordinates', e);
    }

    if (data.city) {
      name = `${data.city.name}, ${data.city.country}`;
      timezone = data.city.timezone || timezone;
    }

    // Deduplication check
    const isDuplicate = locations.some(loc => 
      loc.name === name || 
      (Math.abs(loc.lat - data.lat) < 0.01 && Math.abs(loc.lng - data.lng) < 0.01)
    );

    if (isDuplicate) {
      const existing = locations.find(loc => 
        loc.name === name || 
        (Math.abs(loc.lat - data.lat) < 0.01 && Math.abs(loc.lng - data.lng) < 0.01)
      );
      if (existing) {
        setCenterTarget([existing.lng, existing.lat]);
      }
      return;
    }

    const newLocation: SavedLocation = {
      id: crypto.randomUUID(),
      lat: data.lat,
      lng: data.lng,
      name,
      timezone,
      country: data.country,
      lngOffset: data.lng / 15,
      isPinned: false
    };

    setLocations(prev => [...prev, newLocation]);
    setCenterTarget([newLocation.lng, newLocation.lat]);
  }, []);

  const handleCitySelect = (city: City) => {
    let timezone = city.timezone;
    if (!timezone) {
      try {
        timezone = tzlookup(city.lat, city.lng);
      } catch (e) {
        console.warn('Could not find timezone for city', e);
      }
    }

    const name = `${city.name}, ${city.country}`;
    
    // Deduplication check
    const existing = locations.find(loc => loc.name === name);
    if (existing) {
      setCenterTarget([existing.lng, existing.lat]);
      return;
    }

    const newLocation: SavedLocation = {
      id: crypto.randomUUID(),
      lat: city.lat,
      lng: city.lng,
      name,
      timezone,
      country: city.country,
      lngOffset: city.lng / 15,
      isPinned: false
    };
    setLocations(prev => [...prev, newLocation]);
    setCenterTarget([newLocation.lng, newLocation.lat]);
  };

  const removeLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const clearUnpinnedLocations = () => {
    setLocations(prev => prev.filter(l => l.isPinned));
  };

  const togglePin = (id: string) => {
    setLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, isPinned: !loc.isPinned } : loc
    ));
  };

  const handleTimeShift = (direction: 1 | -1) => {
    setIsPaused(true); // Auto-pause when manually shifting
    const step = TIME_STEPS[timeStepIndex];
    
    setTimeState(prev => ({
      ...prev,
      mode: 'custom',
      current: step.fn(prev.current, step.amount * direction)
    }));
  };

  const changeStep = (direction: 1 | -1) => {
    const newIndex = timeStepIndex + direction;
    if (newIndex >= 0 && newIndex < TIME_STEPS.length) {
      setTimeStepIndex(newIndex);
    }
  };

  const handleScrubberChange = (newTime: Date) => {
    setIsPaused(true); // Auto-pause when scrubbing
    setTimeState(prev => ({
      ...prev,
      mode: 'custom',
      current: newTime
    }));
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPaused(true); // Auto-pause when picking a date
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setTimeState(prev => ({
        ...prev,
        mode: 'custom',
        current: newDate
      }));
    }
  };

  const resetToLive = () => {
    setTimeState(prev => ({
      ...prev,
      mode: 'live',
      current: new Date()
    }));
    setIsPaused(false);
  };

  const getLocationTime = (loc: SavedLocation, baseTime: Date) => {
    if (loc.timezone) {
      return toZonedTime(baseTime, loc.timezone);
    }
    const utcTime = baseTime.getTime();
    const offsetMs = loc.lngOffset * 3600 * 1000;
    return new Date(utcTime + offsetMs);
  };

  const formatLocationTime = (loc: SavedLocation, baseTime: Date, fmt: string) => {
    const time = getLocationTime(loc, baseTime);
    if (loc.timezone) {
      return format(time, fmt, { locale: enUS });
    }
    // Arbitrary offset display hack using UTC
    const shifted = new Date(baseTime.getTime() + (loc.lngOffset * 3600 * 1000));
    return format(shifted, fmt, { timeZone: 'UTC', locale: enUS });
  };

  // Calculate offset for display in header
  const getOffsetDisplay = () => {
    const diffMins = differenceInMinutes(timeState.current, realTime);
    const absMins = Math.abs(diffMins);
    const hours = Math.floor(absMins / 60);
    const mins = absMins % 60;
    
    if (absMins < 1) return { text: 'LIVE', color: 'text-green-500', bg: 'bg-green-500/10' };
    
    const isFuture = diffMins > 0;
    const sign = isFuture ? '+' : '-';
    const text = `${sign}${hours}h ${mins > 0 ? `${mins}m` : ''} (${isFuture ? 'Future' : 'Past'})`;
    
    if (isFuture) return { text, color: 'text-blue-400', bg: 'bg-blue-500/10' };
    return { text, color: 'text-amber-500', bg: 'bg-amber-500/10' };
  };

  const offsetInfo = getOffsetDisplay();

  return (
    <div className="flex flex-col h-[100dvh] text-foreground font-sans overflow-hidden selection:bg-primary/30 relative bg-black pt-10">
      <NewsTicker />
      
      {/* Header */}
      <header className="flex-none h-28 border-b border-zinc-800 flex items-center justify-between px-6 bg-black/80 backdrop-blur-md z-20">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
          <AnimatedLogo className="w-10 h-10 md:w-12 md:h-12" />
          
          {/* Mobile Left Actions Row */}
          <div className="flex md:hidden items-center gap-3">
             <button 
                onClick={() => setShowAbout(true)}
                className="flex items-center justify-center p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-md transition-all"
                title="About & Changelog"
                aria-label="About ChronoMap"
              >
                <Info className="w-3 h-3" />
              </button>

              <button
                onClick={() => setIsMobileListOpen(!isMobileListOpen)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${isMobileListOpen ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
              >
                {isMobileListOpen ? <MapIcon className="w-3 h-3" /> : <List className="w-3 h-3" />}
                <span>{isMobileListOpen ? 'Map' : 'List'}</span>
              </button>
          </div>

          <div className="hidden md:block">
            <h1 className="font-bold text-xl tracking-tight leading-none flex items-center gap-2">
              ChronoMap <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 font-mono">v2.9.9</span>
            </h1>
            <span className="text-xs text-muted-foreground">Temporal Geovisualization</span>
          </div>
        </div>
        
        {/* Central Time Display */}
        <div className="flex flex-col items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
           
           <div className={`mb-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${offsetInfo.bg} ${offsetInfo.color} border border-white/5`}>
              {timeState.mode === 'live' ? <Zap className="w-3 h-3 fill-current" /> : <History className="w-3 h-3" />}
              {offsetInfo.text}
           </div>

           <div className="flex items-baseline gap-3">
              <div className={`text-4xl md:text-5xl font-mono font-bold tabular-nums tracking-tighter leading-none ${timeState.mode === 'live' ? 'text-white' : offsetInfo.color} drop-shadow-2xl`}>
                {timeState.formattedTime}
              </div>
           </div>
           
           <div className="text-xs text-zinc-500 font-medium tracking-wide mt-1 uppercase">
              {timeState.formattedDate}
           </div>
        </div>
        
        {/* Right Actions */}
        <div className="flex flex-col items-end gap-1">
           <div className="flex items-center gap-2 mb-1 text-zinc-500">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wider font-bold">Local Time</span>
           </div>
           <div className="text-sm font-mono text-zinc-400 tabular-nums">
             {format(realTime, 'HH:mm:ss')}
           </div>
           
           <div className="flex items-center gap-2 mt-1">
             <button 
               onClick={() => setShowAbout(true)}
               className="hidden md:flex items-center justify-center p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-md transition-all"
               title="About & Changelog"
               aria-label="About ChronoMap"
             >
               <Info className="w-3 h-3" />
             </button>
             <button 
                onClick={() => setShowDiscordGen(true)}
                className="flex items-center justify-center gap-2 px-2 md:px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 rounded-md transition-all group h-auto w-20 md:w-auto shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              >
                <Share2 className="w-3 h-3 transition-colors shrink-0 hidden md:block" />
                <span className="text-center leading-tight">Share Timestamp</span>
              </button>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        
        {/* Mobile-only Search Header */}
        <div className="md:hidden p-4 border-b border-zinc-800/50 bg-black/80 backdrop-blur-md z-20">
          <LocationSearch onSelectCity={handleCitySelect} />
        </div>
        
        {/* Main content wrapper */}
        <div className="flex-1 relative flex overflow-hidden">
          {/* Sidebar */}
          <div className={`absolute md:relative z-10 h-full w-full md:w-80 flex flex-col pointer-events-none md:pointer-events-auto md:border-r border-zinc-800/50 md:bg-black/20 md:backdrop-blur-lg transition-transform duration-300 ease-in-out ${isMobileListOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            
            {/* Desktop-only Search Header */}
            <div className="hidden md:block relative z-50 p-4 border-b border-zinc-800/50 bg-black/80 backdrop-blur-md pointer-events-auto">
              <LocationSearch onSelectCity={handleCitySelect} />
              
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                  {locations.length} Locations
                </span>
                {locations.some(l => !l.isPinned) && (
                  <button 
                    onClick={clearUnpinnedLocations} 
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-red-400/10"
                  >
                    <Trash2 size={10} /> Clear unpinned
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar pb-20 md:pb-4 bg-black/50 md:bg-transparent backdrop-blur-md md:backdrop-blur-none pointer-events-auto">
              {locations.length === 0 && (
                <div className="mt-10 p-6 border border-dashed border-zinc-800 rounded-xl text-center bg-zinc-900/60 backdrop-blur-md pointer-events-auto">
                    <MapPin className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-zinc-500 font-medium text-sm">No Locations</h3>
                    <p className="text-zinc-600 text-xs mt-1 max-w-[200px] mx-auto">Search for a city or click on the map to compare times.</p>
                </div>
              )}

              {locations.map(loc => (
                <div key={loc.id} className={`pointer-events-auto group bg-zinc-900/80 backdrop-blur-md border ${loc.isPinned ? 'border-blue-500/30' : 'border-zinc-800/50'} hover:border-zinc-700 p-4 rounded-xl transition-all duration-200 relative shadow-lg`}>
                    <div className={`absolute top-2 right-2 flex items-center gap-1 transition-all bg-black/20 backdrop-blur-sm rounded-lg p-0.5 ${loc.isPinned ? 'opacity-100' : 'opacity-100 md:opacity-0 group-hover:opacity-100'}`}>
                      <button 
                        onClick={() => togglePin(loc.id)}
                        className={`p-1.5 rounded-md transition-all ${loc.isPinned ? 'text-blue-500 hover:text-blue-400 bg-blue-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'}`}
                        title={loc.isPinned ? "Unpin Location" : "Pin Location"}
                        aria-label={loc.isPinned ? "Unpin Location" : "Pin Location"}
                      >
                        <Pin className={`w-3.5 h-3.5 ${loc.isPinned ? 'fill-current' : ''}`} />
                      </button>
                      <div className="w-[1px] h-4 bg-zinc-700/50 mx-0.5"></div>
                      <button 
                        onClick={() => removeLocation(loc.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all"
                        title="Remove Location"
                        aria-label="Remove Location"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-1 pr-16">
                      <span className="text-[9px] font-bold text-primary/80 uppercase tracking-wider truncate max-w-[70%] bg-primary/5 px-1.5 py-0.5 rounded">
                        {loc.timezone ? loc.timezone.split('/')[1].replace(/_/g, ' ') : `GMT${loc.lngOffset >= 0 ? '+' : ''}${Math.round(loc.lngOffset)}`}
                      </span>
                    </div>
                    
                    <h2 className="font-medium text-zinc-300 truncate pr-4 text-sm" title={loc.name}>{loc.name}</h2>
                    
                    <div className="flex items-end gap-2 mt-2">
                      <div className="text-2xl font-mono font-bold text-white tabular-nums leading-none">
                        {formatLocationTime(loc, timeState.current, 'HH:mm')}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium pb-0.5">
                        {formatLocationTime(loc, timeState.current, 'a')}
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1 font-medium uppercase tracking-wide">
                      {formatLocationTime(loc, timeState.current, 'MMM d, yyyy')}
                    </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute inset-0 md:relative flex-1 bg-[#050505] z-0">
            <MapChart 
              currentTime={timeState.current} 
              onMapClick={handleMapClick}
              locations={locations}
              centerTarget={centerTarget}
              onCenterComplete={() => setCenterTarget(null)}
            />
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="flex-none bg-black border-t border-zinc-800 z-30">
        
        <TimeScrubber 
          time={timeState.current}
          onChange={handleScrubberChange}
          onInteractionStart={() => setIsScrubbing(true)}
          onInteractionEnd={() => setIsScrubbing(false)}
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-4">
          
          {/* Left: Time Stepping */}
          <div className="flex items-center justify-center md:justify-start gap-3">
            <button 
              onClick={() => handleTimeShift(-1)} 
              className="p-2.5 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all border border-zinc-800 hover:border-zinc-700 shadow-sm"
              title="Step Back in Time"
              aria-label="Step Back in Time"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center gap-0.5">
                <button 
                  onClick={() => changeStep(1)}
                  disabled={timeStepIndex >= TIME_STEPS.length - 1}
                  className="text-zinc-600 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase time step"
                >
                  <ChevronUp size={14} />
                </button>
                
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider w-20 text-center select-none">
                  {TIME_STEPS[timeStepIndex].label}
                </span>
                
                <button 
                  onClick={() => changeStep(-1)}
                  disabled={timeStepIndex <= 0}
                  className="text-zinc-600 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Decrease time step"
                >
                  <ChevronDown size={14} />
                </button>
            </div>

            <button 
              onClick={() => handleTimeShift(1)} 
              className="p-2.5 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all border border-zinc-800 hover:border-zinc-700 shadow-sm"
              title="Step Forward in Time"
              aria-label="Step Forward in Time"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Play/Pause, Calendar & Back to Present */}
          <div className="flex items-center justify-center gap-3 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800/50 shadow-lg w-fit mx-auto md:col-span-1">
             <button 
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2.5 rounded-lg transition-all flex items-center gap-2 ${isPaused ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'}`}
             >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                <span className="text-xs font-medium pr-1">{isPaused ? "Resume" : "Pause"}</span>
             </button>

             <div className="h-6 w-[1px] bg-zinc-800"></div>

             <div className="flex items-center gap-1">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Calendar className="h-3 w-3 text-zinc-500" />
                    </div>
                    <input 
                      type="datetime-local"
                      value={format(timeState.current, "yyyy-MM-dd'T'HH:mm")}
                      onChange={handleCustomDateChange}
                      className="bg-transparent border-none text-xs text-zinc-300 focus:ring-0 pl-8 py-1 w-[220px] font-mono cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                    />
                </div>
                <button 
                  className="p-1.5 rounded-md hover:bg-green-500/20 hover:text-green-500 text-zinc-600 transition-colors"
                  title="Set Date and Time"
                  aria-label="Set Date and Time"
                  onClick={() => setIsPaused(true)}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
             </div>

             <div className="h-6 w-[1px] bg-zinc-800"></div>

             <button 
                onClick={resetToLive}
                className={`p-2.5 rounded-lg transition-all flex items-center gap-2 ${
                  timeState.mode === 'live' 
                    ? 'text-zinc-600 cursor-default' 
                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                }`}
                disabled={timeState.mode === 'live'}
                title="Back to Present"
             >
                <RotateCcw className={`w-4 h-4 ${timeState.mode !== 'live' ? 'animate-spin-slow' : ''}`} />
                <span className="text-xs font-medium">Live</span>
             </button>
          </div>

          {/* Right: Empty spacer for grid balance */}
          <div className="hidden md:block"></div>
        </div>
      </footer>

      {showDiscordGen && (
        <DiscordGenerator 
          targetDate={timeState.current}
          timezone={'UTC'} 
          onClose={() => setShowDiscordGen(false)}
        />
      )}
      
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
};

export default App;
