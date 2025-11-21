
export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  timezone?: string; // IANA timezone if available (e.g. "Europe/London")
  lngOffset: number; // Longitude based offset in hours (for arbitrary clicks)
}

export interface MapClickEvent {
  x: number;
  y: number;
  lat: number;
  lng: number;
  city?: City; // Optional: if a known city was clicked
}

export type TimeMode = 'live' | 'custom';

export interface TimeState {
  current: Date;
  mode: TimeMode;
  formattedTime: string;
  formattedDate: string;
}
