// Tiny UI-string i18n for the app chrome. The page's <html lang> decides the
// language (/es pages set lang="es"). t() takes the English string as the key
// and returns its Spanish translation on ES pages, falling back to the English
// key when there's no entry — so untranslated strings simply stay English.

export const isES = typeof document !== 'undefined' && document.documentElement.lang === 'es';

const ES: Record<string, string> = {
  // Nav / menu
  'World clock map': 'Mapa reloj mundial',
  'All cities': 'Todas las ciudades',
  'Time zone map': 'Mapa de husos horarios',
  'Meeting planner': 'Planificador de reuniones',
  'Discord timestamps': 'Timestamps de Discord',
  'Windows app': 'App de Windows',
  'Embed a clock': 'Insertar un reloj',
  'Explore': 'Explorar',
  'Explore pages': 'Explorar páginas',
  'ChronoMap pages': 'Páginas de ChronoMap',
  // Header
  'Temporal Geovisualization': 'Geovisualización temporal',
  'Local Time': 'Hora local',
  'Share Timestamp': 'Compartir timestamp',
  'About & Changelog': 'Acerca de y novedades',
  'About ChronoMap': 'Acerca de ChronoMap',
  'LIVE': 'EN VIVO',
  'Future': 'Futuro',
  'Past': 'Pasado',
  'Map': 'Mapa',
  'List': 'Lista',
  // Sidebar
  'Locations': 'Ubicaciones',
  'No Locations': 'Sin ubicaciones',
  'Search for a city or click on the map to compare times.': 'Busca una ciudad o haz clic en el mapa para comparar horas.',
  'Clear unpinned': 'Limpiar no fijadas',
  'Pin Location': 'Fijar ubicación',
  'Unpin Location': 'Desfijar ubicación',
  'Remove Location': 'Eliminar ubicación',
  'Search for a city or country...': 'Busca una ciudad o país...',
  'Clear search': 'Borrar búsqueda',
  // Time controls
  '1 MINUTE': '1 MINUTO',
  '15 MINS': '15 MIN',
  '1 HOUR': '1 HORA',
  '1 DAY': '1 DÍA',
  '1 WEEK': '1 SEMANA',
  '1 MONTH': '1 MES',
  'Step Back in Time': 'Retroceder en el tiempo',
  'Step Forward in Time': 'Avanzar en el tiempo',
  'Increase time step': 'Aumentar el paso de tiempo',
  'Decrease time step': 'Reducir el paso de tiempo',
  'Pause': 'Pausar',
  'Resume': 'Reanudar',
  'Set Date and Time': 'Fijar fecha y hora',
  'Back to Present': 'Volver al presente',
  'Live': 'En vivo',
  // Map
  '3D Globe View': 'Vista de globo 3D',
  'Multi-Point View': 'Vista multipunto',
  'Scroll to zoom • Drag to rotate': 'Rueda para zoom • Arrastra para rotar',
  'Scroll to zoom • Drag to pan': 'Rueda para zoom • Arrastra para mover',
  'Zoom In': 'Acercar',
  'Zoom Out': 'Alejar',
  'Reset View': 'Restablecer vista',
};

export const t = (s: string): string => (isES ? ES[s] ?? s : s);
