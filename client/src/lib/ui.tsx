import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/* ---------- format helpers ---------- */

export function cn(...parts: Parameters<typeof clsx>): string {
  return clsx(...parts);
}

/** ₹ whole rupees → "₹1.2 Cr" / "₹85 L" (prices are stored in rupees). */
export function formatPrice(rupees?: number, listingType?: string): string {
  if (rupees == null) return 'Price on request';
  if (listingType === 'RENT') return `₹${Math.round(rupees).toLocaleString('en-IN')}/mo`;
  if (rupees >= 10_000_000) return `₹${(rupees / 10_000_000).toFixed(rupees % 10_000_000 === 0 ? 0 : 2).replace(/\.00$/, '')} Cr`;
  if (rupees >= 100_000) return `₹${(rupees / 100_000).toFixed(rupees % 100_000 === 0 ? 0 : 2).replace(/\.00$/, '')} L`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export function formatArea(sqft?: number): string {
  if (!sqft) return '—';
  return `${sqft.toLocaleString('en-IN')} sq.ft`;
}

export function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ---------- score / status tokens ---------- */

export type Tone = 'brass' | 'sage' | 'brick' | 'neutral' | 'info';

export function temperatureTone(t: string): Tone {
  if (t === 'HOT') return 'brick';
  if (t === 'WARM') return 'brass';
  if (t === 'NURTURE') return 'info';
  return 'neutral';
}

export function statusTone(s: string): Tone {
  switch (s) {
    case 'CONVERTED':
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'AVAILABLE':
      return 'sage';
    case 'LOST':
    case 'CANCELLED':
    case 'NO_SHOW':
      return 'brick';
    case 'NEGOTIATION':
    case 'SITE_VISIT':
      return 'brass';
    default:
      return 'neutral';
  }
}

export const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  FOLLOW_UP: 'Follow-up',
  SITE_VISIT: 'Site visit',
  NEGOTIATION: 'Negotiation',
  CONVERTED: 'Converted',
  LOST: 'Lost',
  NURTURE: 'Nurture',
  REQUESTED: 'Requested',
  RESCHEDULED: 'Rescheduled',
  DRAFT: 'Draft',
  RESERVED: 'Reserved',
  SOLD: 'Sold',
  RENTED: 'Rented',
  UNAVAILABLE: 'Unavailable',
  ARCHIVED: 'Archived',
  WEBSITE: 'Website',
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  INSTAGRAM: 'Instagram',
  WHATSAPP: 'WhatsApp',
  PHONE: 'Phone',
  REFERRAL: 'Referral',
  PROPERTY_PORTAL: 'Portal',
  OTHER: 'Other',
  CALL_CUSTOMER: 'Call the customer',
  SEND_PROPERTY_OPTIONS: 'Send property options',
  SCHEDULE_SITE_VISIT: 'Schedule a site visit',
  REQUEST_BUDGET: 'Ask for budget',
  REQUEST_LOCATION: 'Ask for location',
  MOVE_TO_NURTURE: 'Move to nurture',
  HOT: 'Hot',
  WARM: 'Warm',
  COLD: 'Cold',
};

export function label(key?: string): string {
  if (!key) return '—';
  return STAGE_LABELS[key] ?? key;
}

/* ---------- misc ---------- */

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function typeGlyph(t: PropertyGlyph): string {
  return GLYPHS[t] ?? '▚';
}

export type PropertyGlyph = string;
const GLYPHS: Record<string, string> = {
  '1BHK': '01',
  '2BHK': '02',
  '3BHK': '03',
  '4BHK': '04',
  VILLA: 'VL',
  PLOT: 'PL',
  OFFICE: 'OF',
};

export function SectionHeading({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {hint ? <p className="mt-0.5 text-2xs text-ink-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}
