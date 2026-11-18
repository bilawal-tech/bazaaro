// Backend ka base URL. Deploy par VITE_BACKEND_URL se badla ja sakta hai.
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Image kisi bhi shakal mein ho sakti hai: string, {url}, ya {path}.
// Relative path (/uploads/...) ko backend URL ke saath jorta hai.
export function getImageUrl(img) {
  if (!img) return '/placeholder.png';

  const raw = typeof img === 'object' ? img.url || img.path || '' : img;
  if (!raw) return '/placeholder.png';
  if (/^https?:\/\//i.test(raw)) return raw;

  const clean = raw.replace(/\\/g, '/');
  return `${BACKEND_URL}${clean.startsWith('/') ? clean : `/${clean}`}`;
}
