import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderKanban, Plus, Pencil, Sparkles } from 'lucide-react';
import { propertyApi, errMessage } from '../api';
import type { PropertyDoc, PropertyStatus } from '../types';
import {
  Button, Card, EmptyState, Field, Input, Select, Textarea, Modal, StatusBadge, CardGridSkeleton, toast,
} from '../components/ui';
import { formatPrice, label, cn } from '../lib/ui';

const CITIES = ['Bangalore', 'Dehradun', 'Delhi NCR', 'Noida', 'Gurgaon', 'Pune', 'Mumbai', 'Hyderabad', 'Chandigarh'];
const TYPES = ['1BHK', '2BHK', '3BHK', '4BHK', 'VILLA', 'PLOT', 'OFFICE'];
const STATUSES: PropertyStatus[] = ['DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'UNAVAILABLE', 'ARCHIVED'];
const AMENITIES = ['Gym', 'Swimming Pool', 'Parking', 'Lift', 'Security', 'Power Backup', 'Garden', 'Clubhouse', 'Balcony', 'Near Metro'];

const EMPTY_FORM = {
  title: '',
  description: '',
  propertyType: '2BHK',
  listingType: 'BUY',
  price: '',
  city: 'Bangalore',
  locality: '',
  bedrooms: '2',
  bathrooms: '2',
  carpetArea: '',
  builtUpArea: '',
  parking: 'true',
  furnishing: 'UNFURNISHED',
  developer: '',
  possessionDate: '',
  status: 'DRAFT',
  imageUrls: '',
};

export function AdminPropertiesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState('1');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyDoc | null>(null);

  const params: Record<string, string> = { page, limit: '12' };
  if (search) params.search = search;
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading } = useQuery({ queryKey: ['admin-properties', params], queryFn: () => propertyApi.list(params) });
  const items: PropertyDoc[] = data?.items ?? [];

  function openCreate(): void {
    setEditing(null);
    setEditOpen(true);
  }

  function openEdit(p: PropertyDoc): void {
    setEditing(p);
    setEditOpen(true);
  }

  async function togglePublish(p: PropertyDoc): Promise<void> {
    const next: PropertyStatus = p.status === 'AVAILABLE' ? 'DRAFT' : 'AVAILABLE';
    try {
      await propertyApi.update(p._id, { status: next });
      toast(next === 'AVAILABLE' ? 'Property published' : 'Property unpublished');
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    } catch (err) {
      toast(errMessage(err), 'err');
    }
  }

  return (
    <div className="mx-auto max-w-[1300px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-brass-600">Admin</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
            <FolderKanban size={20} className="text-brass-600" /> Property inventory
          </h1>
          <p className="mt-1 text-xs text-ink-muted">Create, edit, publish and archive listings.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} /> New property
        </Button>
      </div>

      {/* Filters */}
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage('1');
          }}
          placeholder="Search title or locality…"
          className="flex-1"
        />
        <Select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPage('1');
          }}
          className="sm:w-44"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
        </Select>
      </Card>

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No properties"
          body="Create your first listing to get started."
          action={<Button onClick={openCreate}><Plus size={14} /> New property</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(p => (
            <Card key={p._id} className="overflow-hidden p-0" >
              <div className="relative h-36 bg-paper2">
                {p.images[0] ? (
                  <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-2xl text-brass-400/40">{p.propertyType}</div>
                )}
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <span className="rounded-full bg-paper/80 px-2.5 py-1 font-mono text-2xs uppercase tracking-wider text-brass-200 backdrop-blur-sm">
                    {p.propertyType}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-ink">{formatPrice(p.price, p.listingType)}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">{p.title}</p>
                    <p className="text-2xs text-ink-faint">{p.locality}, {p.city}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-3.5 flex items-center gap-2 border-t border-edge-light pt-3.5">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil size={12} /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={p.status === 'AVAILABLE' ? 'ghost' : 'secondary'}
                    onClick={() => void togglePublish(p)}
                    className={cn(p.status === 'AVAILABLE' && 'text-ink-muted')}
                  >
                    {p.status === 'AVAILABLE' ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.pages ?? 1) > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={Number(page) <= 1} onClick={() => setPage(p => String(Number(p) - 1))}>
            Previous
          </Button>
          <span className="font-mono text-2xs text-ink-muted nums">Page {data?.page} of {data?.pages}</span>
          <Button variant="outline" size="sm" disabled={Number(page) >= (data?.pages ?? 1)} onClick={() => setPage(p => String(Number(p) + 1))}>
            Next
          </Button>
        </div>
      ) : null}

      <PropertyFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        existing={editing}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
          queryClient.invalidateQueries({ queryKey: ['properties'] });
        }}
      />
    </div>
  );
}

function PropertyFormModal({
  open,
  onClose,
  existing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  existing: PropertyDoc | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() => (existing ? toForm(existing) : { ...EMPTY_FORM }));
  const [busy, setBusy] = useState(false);

  // Re-seed the form whenever the modal opens for a different property
  const [seed, setSeed] = useState<string | null>(existing?._id ?? null);
  if (open && (existing?._id ?? null) !== seed) {
    setSeed(existing?._id ?? null);
    setForm(existing ? toForm(existing) : { ...EMPTY_FORM });
  }

  function set<K extends keyof typeof form>(key: K, value: string): void {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function generateDescription(): Promise<void> {
    // Template-based stub per spec §40 — full AI generation lands in Phase 2 (M10).
    const parts: string[] = [];
    const bhk = form.propertyType.match(/^(\d)BHK$/);
    if (bhk) parts.push(`A well-designed ${bhk[1]}-bedroom home`);
    else parts.push(`A premium ${label(form.propertyType).toLowerCase()}`);
    if (form.locality) parts.push(`in ${form.locality}`);
    if (form.city) parts.push(`, ${form.city}`);
    parts.push(`.`);
    if (form.carpetArea) parts.push(` Spread across ${Number(form.carpetArea).toLocaleString('en-IN')} sq.ft of carpet area.`);
    if (form.parking === 'true') parts.push(' Dedicated parking included.');
    const am = AMENITIES.filter(a => form.description.includes(a));
    if (am.length > 0) parts.push(` Amenities: ${am.join(', ')}.`);
    set('description', parts.join(''));
    toast('Draft description generated — review and edit before publishing');
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        propertyType: form.propertyType,
        listingType: form.listingType,
        price: Number(form.price),
        city: form.city,
        locality: form.locality,
        location: `${form.locality}, ${form.city}`,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        carpetArea: Number(form.carpetArea),
        builtUpArea: form.builtUpArea ? Number(form.builtUpArea) : undefined,
        parking: form.parking === 'true',
        furnishing: form.furnishing,
        developer: form.developer || undefined,
        possessionDate: form.possessionDate || undefined,
        status: form.status,
        images: form.imageUrls.split(/[\n,]/).map(s => s.trim()).filter(Boolean),
      };
      if (existing) {
        await propertyApi.update(existing._id, body);
        toast('Property updated');
      } else {
        await propertyApi.create(body);
        toast('Property created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast(errMessage(err), 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? `Edit — ${existing.title.slice(0, 30)}` : 'New property'} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Title">
              <Input required minLength={6} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Sunview Residency — 2BHK East facing" />
            </Field>
          </div>
          <Field label="Property type">
            <Select value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Listing type">
            <Select value={form.listingType} onChange={e => set('listingType', e.target.value)}>
              <option value="BUY">For sale</option>
              <option value="RENT">For rent</option>
            </Select>
          </Field>
          <Field label="Price (₹ whole rupees)">
            <Input required type="number" min={0} value={form.price} onChange={e => set('price', e.target.value)} placeholder="8500000" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
            </Select>
          </Field>
          <Field label="City">
            <Select value={form.city} onChange={e => set('city', e.target.value)}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Locality">
            <Input required value={form.locality} onChange={e => set('locality', e.target.value)} placeholder="Whitefield" />
          </Field>
          <Field label="Bedrooms">
            <Input type="number" min={0} max={10} value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} />
          </Field>
          <Field label="Bathrooms">
            <Input type="number" min={0} max={10} value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
          </Field>
          <Field label="Carpet area (sq.ft)">
            <Input type="number" min={0} value={form.carpetArea} onChange={e => set('carpetArea', e.target.value)} placeholder="1150" />
          </Field>
          <Field label="Built-up area (sq.ft)">
            <Input type="number" min={0} value={form.builtUpArea} onChange={e => set('builtUpArea', e.target.value)} placeholder="1400" />
          </Field>
          <Field label="Parking">
            <Select value={form.parking} onChange={e => set('parking', e.target.value)}>
              <option value="true">Available</option>
              <option value="false">Not available</option>
            </Select>
          </Field>
          <Field label="Furnishing">
            <Select value={form.furnishing} onChange={e => set('furnishing', e.target.value)}>
              {['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'].map(f => <option key={f} value={f}>{label(f)}</option>)}
            </Select>
          </Field>
          <Field label="Developer">
            <Input value={form.developer} onChange={e => set('developer', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Possession date">
            <Input type="date" value={form.possessionDate} onChange={e => set('possessionDate', e.target.value)} />
          </Field>
        </div>

        <Field label="Description">
          <div className="space-y-2">
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the property…" />
            <Button type="button" size="sm" variant="outline" onClick={() => void generateDescription()}>
              <Sparkles size={12} /> Draft with AI
            </Button>
          </div>
        </Field>

        <Field label="Image URLs (one per line)">
          <Textarea value={form.imageUrls} onChange={e => set('imageUrls', e.target.value)} placeholder={'https://images.example.com/flat-1.jpg\nhttps://images.example.com/flat-2.jpg'} className="min-h-[70px]" />
        </Field>

        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? 'Saving…' : existing ? 'Save changes' : 'Create property'}
        </Button>
      </form>
    </Modal>
  );
}

function toForm(p: PropertyDoc): typeof EMPTY_FORM {
  return {
    title: p.title,
    description: p.description ?? '',
    propertyType: p.propertyType,
    listingType: p.listingType,
    price: String(p.price),
    city: p.city,
    locality: p.locality,
    bedrooms: String(p.bedrooms),
    bathrooms: String(p.bathrooms),
    carpetArea: String(p.carpetArea ?? ''),
    builtUpArea: p.builtUpArea ? String(p.builtUpArea) : '',
    parking: p.parking ? 'true' : 'false',
    furnishing: p.furnishing,
    developer: p.developer ?? '',
    possessionDate: p.possessionDate ?? '',
    status: p.status,
    imageUrls: (p.images ?? []).join('\n'),
  };
}
