import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CalendarClock, MapPin, Loader2 } from 'lucide-react';
import { visitApi, errMessage } from '../api';
import type { SiteVisitDoc } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, EmptyState, ListSkeleton, Select, Textarea, Field, Modal, StatusBadge, toast } from '../components/ui';
import { label, cn } from '../lib/ui';

const STATUS_ACTIONS: Record<string, { value: string; label: string }[]> = {
  REQUESTED: [
    { value: 'CONFIRMED', label: 'Confirm' },
    { value: 'CANCELLED', label: 'Cancel' },
  ],
  CONFIRMED: [
    { value: 'COMPLETED', label: 'Mark completed' },
    { value: 'RESCHEDULED', label: 'Reschedule' },
    { value: 'NO_SHOW', label: 'No show' },
  ],
  RESCHEDULED: [
    { value: 'CONFIRMED', label: 'Re-confirm' },
    { value: 'CANCELLED', label: 'Cancel' },
  ],
};

export function VisitsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['visits'], queryFn: () => visitApi.list() });
  const items: SiteVisitDoc[] = (data?.items ?? []).filter(v => !statusFilter || v.status === statusFilter);

  const isStaff = user?.role === 'ADMIN';

  async function setStatus(visit: SiteVisitDoc, status: string): Promise<void> {
    try {
      await visitApi.update(visit._id, { status });
      toast(`Visit ${label(status).toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    } catch (err) {
      toast(errMessage(err), 'err');
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-brass-600">{isStaff ? 'CRM' : 'My bookings'}</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
            <CalendarDays size={20} className="text-brass-600" /> {isStaff ? 'Site visits' : 'My site visits'}
          </h1>
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          {['REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => (
            <option key={s} value={s}>{label(s)}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No site visits"
          body={
            isStaff
              ? 'Visits requested by customers will appear here for confirmation.'
              : 'Open any property and tap "Request site visit" to book one.'
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map(v => {
            const p = typeof v.propertyId === 'object' ? v.propertyId : null;
            const customer = typeof v.customerId === 'object' ? v.customerId : null;
            const date = new Date(v.date);
            const isUpcoming = ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'].includes(v.status);
            return (
              <Card key={v._id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Date block */}
                  <div className={cn(
                    'flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-center',
                    isUpcoming ? 'bg-brass-50' : 'bg-canvas',
                  )}>
                    <span className="font-display text-lg font-bold text-ink nums">{date.getDate()}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                      {date.toLocaleString('en-IN', { month: 'short' })}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {p?._id ? (
                        <Link to={`/property/${p._id}`} className="truncate text-sm font-medium text-ink underline-offset-4 hover:underline">
                          {p.title}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-ink">Property visit</span>
                      )}
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-2xs text-ink-muted">
                      <span className="flex items-center gap-1"><CalendarClock size={11} /> {v.time}</span>
                      {p ? <span className="flex items-center gap-1"><MapPin size={11} /> {p.locality}{p.city ? `, ${p.city}` : ''}</span> : null}
                      {isStaff && customer ? <span>Customer: {customer.name}</span> : null}
                    </p>
                    {v.outcome ? <p className="mt-1.5 text-2xs text-ink-soft">Outcome: {v.outcome}</p> : null}
                  </div>

                  {/* Actions (staff) */}
                  {isStaff && STATUS_ACTIONS[v.status] ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {STATUS_ACTIONS[v.status].map(a => (
                        <Button key={a.value} size="sm" variant={a.value === 'CONFIRMED' ? 'primary' : 'outline'} onClick={() => void setStatus(v, a.value)}>
                          {a.label}
                        </Button>
                      ))}
                      {v.status === 'CONFIRMED' ? <CompleteButton visit={v} /> : null}
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompleteButton({ visit }: { visit: SiteVisitDoc }) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    try {
      await visitApi.update(visit._id, { status: 'COMPLETED', outcome: outcome || 'Completed' });
      toast('Visit completed — lead updated');
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      setOpen(false);
    } catch (err) {
      toast(errMessage(err), 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        {busy ? <Loader2 size={13} className="animate-spin" /> : null} Record outcome
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Record visit outcome">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Outcome / notes">
            <Textarea value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="e.g. Customer liked the layout, negotiating price next week" />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Saving…' : 'Save outcome'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
