import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, BedDouble, Bath, Maximize, CarFront, CalendarClock,
  Bookmark, CalendarPlus, Check, Compass,
} from 'lucide-react';
import { propertyApi, savedApi, visitApi, aiApi, errMessage } from '../api';
import type { PropertyDoc, SearchResultDoc } from '../types';
import { Button, Badge, Card, Modal, Field, Input, Textarea, Select, Skeleton, EmptyState, toast } from '../components/ui';
import { formatPrice, formatArea, label, cn } from '../lib/ui';

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyApi.get(id!),
    enabled: Boolean(id),
  });

  const savedQuery = useQuery({ queryKey: ['saved-ids'], queryFn: () => savedApi.list() });
  const isSaved = savedQuery.data?.items.some(p => p._id === id) ?? false;

  const [activeImg, setActiveImg] = useState(0);
  const [visitOpen, setVisitOpen] = useState(false);

  const property = data?.property;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[340px] w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <EmptyState
        title="Property not found"
        body="It may have been unpublished or removed."
        action={<Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      {/* Breadcrumb / back */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft size={14} /> Back to results
        </button>
      </div>

      {/* Gallery */}
      <Card className="overflow-hidden p-0">
        <div className="relative h-[300px] bg-paper2 sm:h-[380px]">
          {property.images[activeImg] ? (
            <img src={property.images[activeImg]} alt={property.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-4xl text-brass-400/40">{property.propertyType}</div>
          )}
          <div className="absolute left-4 top-4 flex gap-1.5">
            <Badge tone="brass">{property.propertyType}</Badge>
            <Badge tone="neutral">{label(property.status)}</Badge>
            {property.listingType === 'RENT' ? <Badge tone="neutral">Rent</Badge> : null}
          </div>
        </div>
        {property.images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto p-3">
            {property.images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                onClick={() => setActiveImg(i)}
                className={cn(
                  'h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                  activeImg === i ? 'border-brass-500' : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: facts */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{property.title}</h1>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
                  <MapPin size={14} /> {property.locality}, {property.city}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-semibold tracking-tight text-ink">{formatPrice(property.price, property.listingType)}</p>
                {property.carpetArea > 0 ? (
                  <p className="font-mono text-2xs text-ink-faint nums">
                    ₹{Math.round(property.price / property.carpetArea).toLocaleString('en-IN')}/sq.ft
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: BedDouble, v: property.bedrooms > 0 ? `${property.bedrooms}` : '—', l: 'Bedrooms' },
                { icon: Bath, v: property.bathrooms > 0 ? `${property.bathrooms}` : '—', l: 'Bathrooms' },
                { icon: Maximize, v: formatArea(property.carpetArea), l: 'Carpet area' },
                { icon: CarFront, v: property.parking ? 'Yes' : 'No', l: 'Parking' },
              ].map(f => (
                <Card key={f.l} className="flex items-center gap-3 p-3.5">
                  <f.icon size={17} className="shrink-0 text-brass-600" />
                  <div>
                    <p className="font-display text-sm font-semibold text-ink nums">{f.v}</p>
                    <p className="text-2xs text-ink-muted">{f.l}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-6">
            <h2 className="font-display text-sm font-semibold text-ink">About this property</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{property.description || 'No description provided.'}</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-edge-light pt-4 text-xs sm:grid-cols-3">
              {[
                ['Furnishing', label(property.furnishing)],
                ['Developer', property.developer ?? '—'],
                ['Possession', property.possessionDate ?? '—'],
                ['Built-up area', property.builtUpArea ? formatArea(property.builtUpArea) : '—'],
                ['Listing', property.listingType === 'RENT' ? 'For rent' : 'For sale'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-2xs uppercase tracking-wider text-ink-faint">{k}</dt>
                  <dd className="mt-0.5 font-medium text-ink-soft">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {property.amenities.length > 0 ? (
            <Card className="p-6">
              <h2 className="font-display text-sm font-semibold text-ink">Amenities</h2>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {property.amenities.map(a => (
                  <span key={a} className="flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-2xs text-ink-soft">
                    <Check size={11} className="text-sage-500" /> {a}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        {/* Right: actions + AI */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-ink">Interested?</h2>
              <Compass size={15} className="text-brass-600" />
            </div>
            <div className="mt-4 space-y-2.5">
              <Button className="w-full" onClick={() => setVisitOpen(true)}>
                <CalendarPlus size={15} /> Request site visit
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  if (isSaved) await savedApi.unsave(property._id);
                  else await savedApi.save(property._id);
                  queryClient.invalidateQueries({ queryKey: ['saved-ids'] });
                  queryClient.invalidateQueries({ queryKey: ['saved'] });
                  toast(isSaved ? 'Removed from saved' : 'Saved to your list');
                }}
              >
                <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} className={isSaved ? 'text-brass-600' : ''} />
                {isSaved ? 'Saved' : 'Save property'}
              </Button>
            </div>
            {property.assignedAgent && typeof property.assignedAgent === 'object' ? (
              <p className="mt-4 border-t border-edge-light pt-3.5 text-2xs text-ink-muted">
                Listed by <span className="font-medium text-ink-soft">{property.assignedAgent.name}</span>
              </p>
            ) : null}
          </Card>

          <MatchPanel property={property} />
        </div>
      </div>

      <VisitModal open={visitOpen} onClose={() => setVisitOpen(false)} property={property} />
    </div>
  );
}

/** Uses the logged-in customer's latest conversation requirements to show a match score. */
function MatchPanel({ property }: { property: PropertyDoc }) {
  const [score, setScore] = useState<number | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function run(): Promise<void> {
    setBusy(true);
    try {
      const convs = await aiApi.conversations();
      if (convs.items.length > 0) {
        const r = await aiApi.recommend(convs.items[0]._id);
        const hit: SearchResultDoc | undefined = r.results.find(x => x.property._id === property._id);
        setScore(hit?.matchScore ?? null);
        setReasons(hit?.reasons ?? []);
      }
    } catch {
      /* non-blocking */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-brass-200/70 p-5">
      <p className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider text-brass-700">
        <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brass-500" /> AI match
      </p>
      {score !== null ? (
        <>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink nums">{score}%</p>
          <ul className="mt-3 space-y-1.5">
            {reasons.map(r => (
              <li key={r} className="flex items-start gap-1.5 text-2xs leading-relaxed text-ink-soft">
                <Check size={11} className="mt-0.5 shrink-0 text-sage-500" /> {r}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-2xs leading-relaxed text-ink-muted">
          {busy ? 'Computing your match…' : 'Chat with the assistant about your requirements, then check your match score here.'}
        </p>
      )}
      {score === null ? (
        <Button size="sm" variant="outline" className="mt-3.5" onClick={run} disabled={busy}>
          {busy ? 'Checking…' : 'Check my match'}
        </Button>
      ) : null}
    </Card>
  );
}

function VisitModal({ open, onClose, property }: { open: boolean; onClose: () => void; property: PropertyDoc }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const slots = ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM'];

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    try {
      await visitApi.request({ propertyId: property._id, date, time, notes: notes || undefined });
      toast('Site visit requested — the agent will confirm');
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      onClose();
    } catch (err) {
      toast(errMessage(err), 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Visit — ${property.title}`}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Date">
          <Input type="date" required min={new Date().toISOString().slice(0, 10)} value={date} onChange={e => setDate(e.target.value)} />
        </Field>
        <Field label="Preferred slot">
          <Select value={time} onChange={e => setTime(e.target.value)}>
            {slots.map(s => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Notes (optional)">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything the agent should know" />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          <CalendarClock size={15} /> {busy ? 'Sending…' : 'Request visit'}
        </Button>
      </form>
    </Modal>
  );
}
