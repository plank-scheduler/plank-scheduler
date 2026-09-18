import { SERVICE_GROUPS } from './config';

export const PHONE = '573-368-3333';
export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const TIME_OPTIONS = ['No preference', '7 AM–12 PM', '12 PM–7 PM', 'Please call or text to arrange'];
export type ServiceCategory = {
  id: string; title: string; description: string; icon: string;
  field: 'service' | 'insulationService' | 'vaporBarrier' | 'holidayLighting';
  groups: { group: string; options: { value: string; label: string }[] }[];
};
const groups = (...names: string[]) => SERVICE_GROUPS.filter(g => names.includes(g.group));
export const CATEGORIES: ServiceCategory[] = [
  { id: 'inspection', title: 'Free inspections', description: 'Termite, moisture & insulation inspections.', icon: 'search', field: 'service', groups: [{ group: 'Free inspections', options: [
    { value: 'free-termite-inspection', label: 'Free Termite Inspection' },
    { value: 'free-moisture-inspection', label: 'Free Moisture Inspection' },
    { value: 'free-insulation-inspection', label: 'Free Insulation Inspection' },
  ] }] },
  { id: 'pest', title: 'Pest control', description: 'Household pests, bed bugs & Perimeter Guard.', icon: 'shield', field: 'service', groups: [
    { group: 'General services', options: [
      { value: 'general-pest-control', label: 'General Pest Control' },
      { value: 'perimeter-guard', label: 'Perimeter Guard Plan' },
      { value: 'commercial-pest-control', label: 'Commercial Pest Control' },
    ] }, ...groups('Ants', 'Bed Bugs', 'Cockroaches', 'Flies & Gnats', 'Occasional Invaders', 'Pantry Pests', 'Fabric Pests', 'Spiders', 'Stinging Pests', 'Other') ] },
  { id: 'termite', title: 'Termites & Wood Destroying Insects', description: 'Sentricon, station checks & WDI reports.', icon: 'home', field: 'service', groups: groups('Termites & WDI') },
  { id: 'wildlife', title: 'Rodents & wildlife', description: 'Mice, rats & nuisance wildlife concerns.', icon: 'leaf', field: 'service', groups: groups('Rodents', 'Wildlife') },
  { id: 'yard', title: 'Yard pest treatments', description: 'Mosquitoes, fleas, ticks, chiggers, bagworms & Japanese beetles.', icon: 'sun', field: 'service', groups: groups('Biting/External Parasites', 'Yard Treatments') },
  { id: 'insulation', title: 'Insulation', description: 'New insulation, top-offs & replacement.', icon: 'layers', field: 'insulationService', groups: groups('Insulation') },
  { id: 'vapor', title: 'Vapor barriers', description: 'Installation, repairs, moisture concerns & crawl-space debris cleanup.', icon: 'drop', field: 'vaporBarrier', groups: [{ group: 'Vapor barriers', options: [
    { value: 'vapor-barrier-installation', label: 'Vapor Barrier Installation' },
    { value: 'vapor-barrier-repair-replacement', label: 'Vapor Barrier Repair / Replacement' },
    { value: 'vapor-barrier-inspection-quote', label: 'Vapor Barrier Inspection / Quote' },
    { value: 'crawl-space-moisture-concerns', label: 'Crawl-Space Moisture Concerns (Dampness / Musty Odors)' },
    { value: 'crawl-space-debris-cleanup', label: 'Crawl-Space Debris Cleanup' },
  ] }] },
  { id: 'lighting', title: 'Holiday & permanent lighting', description: 'Christmas displays & Govee outdoor lights.', icon: 'spark', field: 'holidayLighting', groups: groups('Holiday / Seasonal Lighting') },
];

export function selectedServices(selections: Record<string, string[]>) {
  const fields = { service: '', insulationService: '', vaporBarrier: '', holidayLighting: '' };
  for (const category of CATEGORIES) {
    const labels = category.groups.flatMap(g => g.options).filter(o => selections[category.id]?.includes(o.value)).map(o => o.label);
    if (labels.length) fields[category.field] = [fields[category.field], ...labels].filter(Boolean).join('; ');
  }
  return fields;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function photoError(files: { size: number; type: string }[]) {
  if (files.length > MAX_PHOTOS) return 'Choose up to 3 photos.';
  if (files.some(f => !PHOTO_TYPES.includes(f.type))) return 'Please use JPG, PNG or WebP photos.';
  if (files.some(f => f.size > MAX_PHOTO_BYTES)) return 'Each photo must be 3 MB or smaller.';
  return '';
}
