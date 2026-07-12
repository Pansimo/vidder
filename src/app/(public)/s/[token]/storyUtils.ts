export function transportEmoji(mode: string): string {
  const map: Record<string, string> = {
    car: '🚗',
    boat: '⛵',
    plane: '✈️',
    foot: '🚶',
  };
  return map[mode] || '🚗';
}

export function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    viewpoint: '🔭',
    food: '🍽️',
    nature: '🌿',
    parking: '🅿️',
    camp: '⛺',
    beach: '🏖️',
    photo: '📷',
    other: '📍',
    unset: '📍',
  };
  return map[category] || '📍';
}

export function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    viewpoint: 'Utsikt',
    food: 'Mat & dryck',
    nature: 'Natur',
    parking: 'Parkering',
    camp: 'Camping',
    beach: 'Badplats',
    photo: 'Fotospot',
    other: 'Övrigt',
    unset: 'Övrigt',
  };
  return map[category] || 'Övrigt';
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return formatDate(start);
  return `${s.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

export function weekdayName(weekday: number): string {
  const names = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];
  return names[(weekday - 1) % 7] || 'måndag';
}

export function mapboxStaticUrl(
  overlay: string,
  style: string,
  size: string,
  padding: number,
): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${overlay}/auto/${size}?access_token=${token}&padding=${padding}`;
}
