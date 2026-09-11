import { Bookmark, MapPin, BedDouble, Bath, Maximize, CarFront, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { PropertyDoc } from '../types';
import { formatPrice, formatArea, cn } from '../lib/ui';

export function PropertyCard({
  property,
  matchScore,
  reasons,
  saved,
  onToggleSave,
  selectable,
  selected,
  onSelect,
  index = 0,
}: {
  property: PropertyDoc;
  matchScore?: number;
  reasons?: string[];
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  index?: number;
}) {
  const [imgOk, setImgOk] = useState(true);
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${property.title} — ${property.location} — ${formatPrice(property.price, property.listingType)}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-card transition-all duration-200 animate-fade-up',
        selected ? 'border-brass-500 ring-2 ring-brass-400/40' : 'border-edge-light hover:-translate-y-0.5 hover:shadow-lift',
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      {/* Media */}
      <div className="relative h-44 overflow-hidden bg-paper2">
        {property.images[0] && imgOk ? (
          <img
            src={property.images[0]}
            alt={property.title}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-paper2 font-mono text-3xl text-brass-400/40">{property.propertyType}</div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper/55 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-full bg-paper/80 px-2.5 py-1 font-mono text-2xs font-medium uppercase tracking-wider text-brass-200 backdrop-blur-sm">
            {property.propertyType}
          </span>
          {property.listingType === 'RENT' ? (
            <span className="rounded-full bg-paper/80 px-2.5 py-1 font-mono text-2xs uppercase tracking-wider text-ink-inverse backdrop-blur-sm">Rent</span>
          ) : null}
        </div>
        {matchScore !== undefined ? (
          <div className="absolute right-3 top-3 rounded-full bg-brass-400 px-2.5 py-1 font-mono text-2xs font-semibold text-paper">
            {matchScore}% match
          </div>
        ) : null}
        {selectable ? (
          <button
            onClick={e => {
              e.preventDefault();
              onSelect?.(property._id);
            }}
            className={cn(
              'absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all',
              selected ? 'bg-brass-400 text-paper' : 'bg-paper/70 text-ink-inverse hover:bg-paper',
            )}
            aria-label={selected ? 'Remove from compare' : 'Add to compare'}
          >
            {selected ? <Check size={15} /> : <Copy size={14} />}
          </button>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold tracking-tight text-ink">{formatPrice(property.price, property.listingType)}</p>
            <h3 className="mt-0.5 truncate text-sm font-medium text-ink-soft">{property.title}</h3>
          </div>
          {onToggleSave ? (
            <button
              onClick={e => {
                e.preventDefault();
                onToggleSave(property._id);
              }}
              className={cn('shrink-0 rounded-full p-2 transition-colors', saved ? 'text-brass-600' : 'text-ink-faint hover:bg-ink/5 hover:text-ink')}
              aria-label={saved ? 'Remove from saved' : 'Save property'}
            >
              <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
            </button>
          ) : null}
        </div>

        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{property.locality}, {property.city}</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-2xs text-ink-muted">
          {property.bedrooms > 0 ? (
            <span className="flex items-center gap-1"><BedDouble size={12} /> {property.bedrooms} bed</span>
          ) : null}
          {property.bathrooms > 0 ? (
            <span className="flex items-center gap-1"><Bath size={12} /> {property.bathrooms} bath</span>
          ) : null}
          <span className="flex items-center gap-1"><Maximize size={12} /> {formatArea(property.carpetArea)}</span>
          {property.parking ? <span className="flex items-center gap-1"><CarFront size={12} /> Parking</span> : null}
        </div>

        {reasons && reasons.length > 0 ? (
          <ul className="mt-3.5 space-y-1 border-t border-edge-light pt-3">
            {reasons.slice(0, 2).map(r => (
              <li key={r} className="flex items-start gap-1.5 text-2xs leading-relaxed text-sage-700">
                <Check size={11} className="mt-0.5 shrink-0" /> {r}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex items-center justify-between border-t border-edge-light pt-3.5">
          <Link to={`/property/${property._id}`} className="text-xs font-medium text-ink underline-offset-4 hover:underline">
            View details
          </Link>
          <button onClick={handleCopy} className="text-ink-faint transition-colors hover:text-ink" aria-label="Copy summary">
            {copied ? <Check size={13} className="text-sage-700" /> : <Copy size={13} />}
          </button>
        </div>
      </div>
    </article>
  );
}
