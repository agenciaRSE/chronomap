
import React, { useState, useEffect, useCallback } from 'react';
import { MapChart } from './components/MapChart';
import { DiscordGenerator } from './components/DiscordGenerator';
import { AboutModal } from './components/AboutModal';
import { TimeScrubber } from './components/TimeScrubber';
import { LocationSearch } from './components/LocationSearch';
import { MAJOR_CITIES } from './constants';
import { MapClickEvent, TimeState, SavedLocation, City } from './types';
import { addHours, subHours, differenceInMinutes } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Share2, Calendar, Check, X, MapPin, Clock, History, Zap, Info } from 'lucide-react';

const App: React.FC = () => {
  // Real-world wall clock time
  const [realTime, setRealTime] = useState(new Date());
  
  // Application simulated time
  const [timeState, setTimeState] = useState<TimeState>({
    current: new Date(),
    mode: 'live',
    formattedTime: '',
    formattedDate: ''
  });

  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [showDiscordGen, setShowDiscordGen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

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
      formattedDate: format(prev.current, 'EEE, MMM d, yyyy')
    }));
  }, [timeState.current]);

  const handleMapClick = useCallback((data: MapClickEvent) => {
    let name = `Lat: ${data.lat.toFixed(1)}, Lng: ${data.lng.toFixed(1)}`;
    let timezone = undefined;
    
    if (data.city) {
      name = `${data.city.name}, ${data.city.country}`;
      timezone = data.city.timezone;
    } else {
      const closest = MAJOR_CITIES.reduce((prev, curr) => {
        const dist = Math.sqrt(Math.pow(curr.lat - data.lat, 2) + Math.pow(curr.lng - data.lng, 2));
        return dist < 5 ? curr : prev;
      }, null as any);
      
      if (closest) {
        name = `${closest.name}, ${closest.country}`;
        timezone = closest.timezone;
      }
    }

    const newLocation: SavedLocation = {
      id: crypto.randomUUID(),
      lat: data.lat,
      lng: data.lng,
      name,
      timezone,
      lngOffset: data.lng / 15 
    };

    setLocations(prev => [...prev, newLocation]);
  }, []);

  const handleCitySelect = (city: City) => {
    const newLocation: SavedLocation = {
      id: crypto.randomUUID(),
      lat: city.lat,
      lng: city.lng,
      name: `${city.name}, ${city.country}`,
      timezone: city.timezone,
      lngOffset: city.lng / 15
    };
    setLocations(prev => [...prev, newLocation]);
  };

  const removeLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const handleTimeShift = (hours: number) => {
    setIsPaused(true); // Auto-pause when manually shifting
    setTimeState(prev => ({
      ...prev,
      mode: 'custom',
      current: hours > 0 ? addHours(prev.current, hours) : subHours(prev.current, Math.abs(hours))
    }));
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
      return format(time, fmt);
    }
    // Arbitrary offset display hack using UTC
    const shifted = new Date(baseTime.getTime() + (loc.lngOffset * 3600 * 1000));
    return format(shifted, fmt, { timeZone: 'UTC' });
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
    <div className="flex flex-col h-screen bg-black text-foreground font-sans overflow-hidden selection:bg-primary/30">
      
      {/* Header */}
      <header className="flex-none h-28 border-b border-zinc-800 flex items-center justify-between px-6 bg-black/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] group">
             {/* Custom Logo: Globe + Clock */}
             <svg 
               viewBox="0 0 24 24" 
               fill="none" 
               stroke="currentColor" 
               strokeWidth="2" 
               strokeLinecap="round" 
               strokeLinejoin="round" 
               className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300"
             >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
                <path d="M2 12h20" className="opacity-50" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" className="opacity-50" />
             </svg>
          </div>
          <div className="hidden md:block">
            <h1 className="font-bold text-xl tracking-tight leading-none flex items-center gap-2">
              ChronoMap <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 font-mono">v2.1.1</span>
            </h1>
            <span className="text-xs text-muted-foreground">Temporal Geovisualization</span>
          </div>
        </div>
        
        {/* Central Time Display */}
        <div className="flex flex-col items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
           
           {/* Status Badge */}
           <div className={`mb-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${offsetInfo.bg} ${offsetInfo.color} border border-white/5`}>
              {timeState.mode === 'live' ? <Zap className="w-3 h-3 fill-current" /> : <History className="w-3 h-3" />}
              {offsetInfo.text}
           </div>

           {/* Target Time */}
           <div className="flex items-baseline gap-3">
              <div className={`text-4xl md:text-5xl font-mono font-bold tabular-nums tracking-tighter leading-none ${timeState.mode === 'live' ? 'text-white' : offsetInfo.color} drop-shadow-2xl`}>
                {timeState.formattedTime}
              </div>
           </div>
           
           {/* Target Date */}
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
               className="flex items-center justify-center p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-md transition-all"
               title="About & Changelog"
             >
               <Info className="w-3 h-3" />
             </button>
             <button 
               onClick={() => setShowDiscordGen(true)}
               className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-md transition-all group"
             >
               <Share2 className="w-3 h-3 group-hover:text-primary transition-colors" />
               <span>Share</span>
             </button>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <div className="absolute md:relative z-10 h-full w-full md:w-80 flex flex-col pointer-events-none md:pointer-events-auto border-r border-zinc-800/50 bg-black/20 backdrop-blur-lg md:backdrop-blur-none">
           
           {/* Search Bar Area */}
           <div className="p-4 border-b border-zinc-800/50 bg-black/40">
             <LocationSearch onSelectCity={handleCitySelect} />
           </div>

           <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar pb-20 md:pb-4">
             {locations.length === 0 && (
               <div className="mt-10 p-6 border border-dashed border-zinc-800 rounded-xl text-center bg-zinc-900/20">
                  <MapPin className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <h3 className="text-zinc-500 font-medium text-sm">No Locations Tracked</h3>
                  <p className="text-zinc-600 text-xs mt-1 max-w-[200px] mx-auto">Search for a city or click on the map to compare times.</p>
               </div>
             )}

             {locations.map(loc => (
               <div key={loc.id} className="pointer-events-auto group bg-zinc-900/40 hover:bg-zinc-900/80 backdrop-blur-md border border-zinc-800 hover:border-zinc-600 p-4 rounded-xl transition-all duration-200 relative">
                  <button 
                    onClick={() => removeLocation(loc.id)}
                    className="absolute top-2 right-2 p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  
                  <div className="flex items-center justify-between mb-1 pr-6">
                    <span className="text-[9px] font-bold text-primary/80 uppercase tracking-wider truncate max-w-[70%] bg-primary/5 px-1.5 py-0.5 rounded">
                      {loc.timezone ? loc.timezone.split('/')[1].replace('_', ' ') : `GMT${loc.lngOffset >= 0 ? '+' : ''}${Math.round(loc.lngOffset)}`}
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

        {/* Map Area */}
        <div className="absolute inset-0 md:relative flex-1 bg-[#050505] z-0">
          <MapChart 
            currentTime={timeState.current} 
            onMapClick={handleMapClick}
            locations={locations}
          />
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="flex-none bg-black border-t border-zinc-800 z-30">
        
        {/* The Time Scrubber */}
        <TimeScrubber 
          time={timeState.current}
          onChange={handleScrubberChange}
          onInteractionStart={() => setIsScrubbing(true)}
          onInteractionEnd={() => setIsScrubbing(false)}
        />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 p-4">
          
          {/* Left: Quick Jump */}
          <div className="flex items-center gap-1">
            <button onClick={() => handleTimeShift(-1)} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-zinc-800">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider px-2">1 Hour</span>
            <button onClick={() => handleTimeShift(1)} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-zinc-800">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Playback & Date Picker */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800/50 shadow-lg">
               
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
                        className="bg-transparent border-none text-xs text-zinc-300 focus:ring-0 pl-8 py-1 w-[180px] font-mono cursor-pointer"
                        style={{ colorScheme: 'dark' }}
                      />
                  </div>
                  <button 
                    className="p-1.5 rounded-md hover:bg-green-500/20 hover:text-green-500 text-zinc-600 transition-colors"
                    title="Set Date & Time"
                    onClick={() => setIsPaused(true)}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
               </div>
            </div>
          </div>

          {/* Right: Reset */}
          <div>
             <button 
                onClick={resetToLive}
                disabled={timeState.mode === 'live'}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  timeState.mode === 'live' 
                    ? 'text-zinc-600 cursor-not-allowed opacity-50' 
                    : 'text-primary hover:bg-primary/10 border border-primary/20'
                }`}
             >
                <RotateCcw className="w-3 h-3" />
                <span>Return to Now</span>
             </button>
          </div>

        </div>
      </footer>

      {/* Discord Generator Modal */}
      {showDiscordGen && (
        <DiscordGenerator 
          targetDate={timeState.current}
          timezone={'UTC'} 
          onClose={() => setShowDiscordGen(false)}
        />
      )}
      
      {/* About & Changelog Modal */}
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
};

export default App;
