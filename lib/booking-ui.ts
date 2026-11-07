import { MAX_PHOTOS, photoError } from './booking-options';

type PhotoChoice = { name: string; size: number; type: string; lastModified: number };

export function photoKey(file: PhotoChoice) {
  return JSON.stringify([file.name, file.size, file.type, file.lastModified]);
}

// A rejected selection must never discard files the customer already chose.
export function mergePhotoSelection<T extends PhotoChoice>(current: T[], incoming: T[]) {
  if (!incoming.length) return { photos: current, message: '' };
  const invalid = photoError(incoming) || (incoming.some(file => file.size === 0) ? 'An empty photo cannot be attached. Choose another photo.' : '');
  if (invalid) return { photos: current, message: `${invalid} No new photos were added.` };
  const seen = new Set(current.map(photoKey));
  const additions = incoming.filter(file => {
    const key = photoKey(file);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (current.length + additions.length > MAX_PHOTOS) {
    return { photos: current, message: `You can attach up to ${MAX_PHOTOS} photos. Remove a photo before adding more. No new photos were added.` };
  }
  return { photos: [...current, ...additions], message: '' };
}

export function contactFieldError(field: string, value: string) {
  const text = value.trim();
  const required: Record<string, string> = { name: 'your name', address: 'the service address', city: 'the city' };
  if (required[field] && !text) return `Please enter ${required[field]}.`;
  if (field === 'state' && !/^[a-z]{2}$/i.test(text)) return 'Please enter the two-letter state abbreviation, such as MO.';
  if (field === 'phone') {
    // Keep country prefixes, punctuation and extensions; require a usable base number.
    const parts = text.match(/^\+?([\d\s().-]+)(?:\s*(?:ext\.?|x|#)\s*(\d+))?$/i);
    if (!parts || parts[1].replace(/\D/g, '').length < 7) return 'Please enter a phone number with at least 7 digits. An extension is optional.';
  }
  return '';
}
