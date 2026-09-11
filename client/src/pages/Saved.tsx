import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Search, Sparkles } from 'lucide-react';
import { savedApi, aiApi, errMessage } from '../api';
import type { PropertyDoc } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { Button, EmptyState, CardGridSkeleton, Modal, toast } from '../components/ui';
import { formatPrice, label } from '../lib/ui';

export function SavedPage() {
  const queryClient = useQueryClient();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['saved'],
    queryFn: () => savedApi.list(),
  });
  const items: PropertyDoc[] = data?.items ?? [];

  useEffect(() => {
    if (data?.items) {
      setSavedIds(new Set(data.items.map(p => p._id)));
    }
  }, [data]);

  async function toggleSave(id: string): Promise<void> {
    const next = new Set(savedIds);
    if (next.has(id)) {
      next.delete(id);
      setSavedIds(next);
      try {
        await savedApi.unsave(id);
        toast('Property removed from saved collection');
      } catch (err) {
        toast('Could not update saved list', 'err');
      }
    } else {
      next.add(id);
      setSavedIds(next);
      try {
        await savedApi.save(id);
        toast('Property saved to collection');
      } catch (err) {
        toast('Could not save property', 'err');
      }
    }
    queryClient.invalidateQueries({ queryKey: ['saved'] });
    queryClient.invalidateQueries({ queryKey: ['saved-ids'] });
  }

  function toggleCompare(id: string): void {
    setCompareIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 4 ? prev : [...prev, id]));
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-brass-600">Collections</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
            <Heart size={20} className="text-brass-600" /> Saved properties
          </h1>
          <p className="mt-1 text-xs text-ink-muted">Select two or more to compare them side by side.</p>
        </div>
        {items.length > 0 ? (
          <Button variant="outline" size="sm" onClick={() => setCompareOpen(true)} disabled={compareIds.length < 2}>
            Compare ({compareIds.length})
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          body="Tap the bookmark or heart icon on any property to keep it here for quick comparison, AI insights, and site visits."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/browse">
                <Button size="sm" variant="primary">
                  <Search size={14} /> Browse properties
                </Button>
              </Link>
              <Link to="/assistant">
                <Button size="sm" variant="outline">
                  <Sparkles size={14} /> Ask AI Assistant
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p, i) => (
            <PropertyCard
              key={p._id}
              property={p}
              saved={savedIds.has(p._id)}
              onToggleSave={toggleSave}
              selectable
              selected={compareIds.includes(p._id)}
              onSelect={toggleCompare}
              index={i}
            />
          ))}
        </div>
      )}

      <CompareModal open={compareOpen} onClose={() => setCompareOpen(false)} ids={compareIds} />
    </div>
  );
}

function CompareModal({ open, onClose, ids }: { open: boolean; onClose: () => void; ids: string[] }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ['compare-saved', ids],
    queryFn: () => savedApi.list().then(r => r.items.filter(p => ids.includes(p._id))),
    enabled: open && ids.length >= 2,
  });

  async function runSummary(): Promise<void> {
    setBusy(true);
    try {
      const res = await aiApi.compare(ids);
      setSummary(res.summary);
    } catch (err) {
      toast(errMessage(err), 'err');
    } finally {
      setBusy(false);
    }
  }

  const rows: { key: string; render: (p: PropertyDoc) => string }[] = [
    { key: 'Price', render: p => formatPrice(p.price, p.listingType) },
    { key: 'Type', render: p => p.propertyType },
    { key: 'Location', render: p => `${p.locality}, ${p.city}` },
    { key: 'Area', render: p => `${p.carpetArea.toLocaleString('en-IN')} sq.ft` },
    { key: 'Beds/Baths', render: p => `${p.bedrooms} / ${p.bathrooms}` },
    { key: 'Parking', render: p => (p.parking ? 'Yes' : 'No') },
    { key: 'Furnishing', render: p => label(p.furnishing) },
    { key: 'Possession', render: p => p.possessionDate ?? '—' },
    { key: 'Amenities', render: p => p.amenities.slice(0, 4).join(', ') || '—' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Compare saved properties" wide>
      {!data ? (
        <CardGridSkeleton count={2} />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead>
                <tr className="border-b border-edge-light">
                  <th className="pb-2 pr-4 font-mono text-2xs uppercase tracking-wider text-ink-faint">Field</th>
                  {data.map(p => (
                    <th key={p._id} className="pb-2 pr-4 font-display text-xs font-semibold text-ink">{p.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="nums">
                {rows.map(row => (
                  <tr key={row.key} className="border-b border-edge-light/60 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-2xs uppercase tracking-wider text-ink-muted">{row.key}</td>
                    {data.map(p => (
                      <td key={p._id} className="py-2.5 pr-4 text-ink-soft">{row.render(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl bg-canvas p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-2xs uppercase tracking-wider text-ink-muted">AI summary</p>
              {!summary ? (
                <Button size="sm" variant="outline" onClick={runSummary} disabled={busy}>
                  {busy ? 'Thinking…' : 'Generate'}
                </Button>
              ) : null}
            </div>
            {summary ? <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">{summary}</p> : null}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default SavedPage;
