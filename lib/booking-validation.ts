import { z } from 'zod';
// Accept existing service strings as well as the redesigned service selections.
export const bookingSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1, 'Please enter your name.').max(150),
    phone: z.string().trim().min(7, 'Please enter a valid phone number.').max(30),
    email: z.email('Please enter a valid email address.').max(254),
    address: z.string().trim().min(1, 'Please enter your service address.').max(250),
    city: z.string().trim().max(100).default(''),
    state: z.string().trim().max(30).default(''),
    zip: z.string().trim().max(15).default(''),
  }),
  service: z.string().max(6000).default(''),
  insulationService: z.string().max(1000).default(''),
  vaporBarrier: z.string().max(1000).default(''),
  lawnCare: z.string().max(1000).default(''),
  holidayLighting: z.string().max(1000).default(''),
  date: z.string().refine(v => {
    if (!v) return true;
    const d = new Date(`${v}T12:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10) === v;
  }, 'Please enter a valid date.').default(''),
  time: z.string().max(100).default('No preference'),
  plan: z.string().max(100).default('Please recommend'),
  notes: z.string().trim().max(4000).default(''),
  photoUrls: z.array(z.url().refine(v => { const u = new URL(v); return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com'); }, 'Invalid photo link.')).max(3).default([]),
}).refine(d => [d.service,d.insulationService,d.vaporBarrier,d.lawnCare,d.holidayLighting].some(v => v.trim()), 'Please select at least one service.');
