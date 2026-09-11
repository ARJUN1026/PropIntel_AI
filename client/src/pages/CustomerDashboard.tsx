import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MessageSquareText, Sparkles, ArrowRight, MapPin } from 'lucide-react';
import { aiApi, savedApi, visitApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { PropertyCard } from '../components/PropertyCard';
import { Card, StatCard, EmptyState, CardGridSkeleton, ListSkeleton } from '../components/ui';
import { formatPrice, timeAgo, label } from '../lib/ui';

export function CustomerDashboard() {
  const { user } = useAuth();

  const recQuery = useQuery({ queryKey: ['recommendations'], queryFn: () => aiApi.recommend() });
  const savedQuery = useQuery({ queryKey: ['saved'], queryFn: () => savedApi.list() });
  const visitsQuery = useQuery({ queryKey: ['visits'], queryFn: () => visitApi.list() });
  const convQuery = useQuery({ queryKey: ['conversations'], queryFn: () => aiApi.conversations() });

  const recommendations = recQuery.data?.results ?? [];
  const saved = savedQuery.data?.items ?? [];
  const upcomingVisits = (visitsQuery.data?.items ?? [])
    .filter(v => ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'].includes(v.status))
    .slice(0, 3);
  const recentConversations = (convQuery.data?.items ?? []).slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      {/* Welcome */}
      <div>
        <p className="font-mono text-2xs uppercase tracking-[0.2em] text-brass-600">{greeting}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">Welcome back, {user?.name.split(' ')[0]}</h1>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Recommended" value={recommendations.length} hint="Based on your chats" accent />
        <StatCard label="Saved" value={saved.length} hint="Properties you bookmarked" />
        <StatCard label="Upcoming visits" value={upcomingVisits.length} hint="Scheduled site visits" />
        <StatCard label="Conversations" value={convQuery.data?.items.length ?? 0} hint="With the AI assistant" />
      </div>

      {/* Recommendations */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink">
              <Sparkles size={16} className="text-brass-600" /> Recommended for you
            </h2>
            <p className="mt-0.5 text-2xs text-ink-muted">Matched against the requirements the AI extracted from your conversations</p>
          </div>
          <Link to="/browse" className="flex items-center gap-1 text-xs font-medium text-ink underline-offset-4 hover:underline">
            Browse all <ArrowRight size={13} />
          </Link>
        </div>
        {recQuery.isLoading ? (
          <CardGridSkeleton count={3} />
        ) : recommendations.length === 0 ? (
          <EmptyState
            title="No recommendations yet"
            body="Chat with the AI assistant about what you're looking for and matches will appear here."
            action={
              <Link to="/assistant">
                <button className="rounded-full bg-ink px-5 py-2.5 text-xs font-medium text-ink-inverse transition-colors hover:bg-black/85">
                  Start a chat
                </button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((r, i) => (
              <PropertyCard key={r.property._id} property={r.property} matchScore={r.matchScore} reasons={r.reasons} index={i} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming visits */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <CalendarDays size={15} className="text-brass-600" /> Upcoming site visits
            </h2>
            <Link to="/visits" className="text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline">All visits</Link>
          </div>
          {visitsQuery.isLoading ? (
            <ListSkeleton rows={2} />
          ) : upcomingVisits.length === 0 ? (
            <EmptyState title="Nothing scheduled" body="When you request a site visit it will show up here." />
          ) : (
            <div className="space-y-2.5">
              {upcomingVisits.map(v => {
                const p = typeof v.propertyId === 'object' ? v.propertyId : null;
                return (
                  <Card key={v._id} className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brass-50 text-center">
                      <span className="font-display text-sm font-bold text-brass-700 nums">{new Date(v.date).getDate()}</span>
                      <span className="font-mono text-[9px] uppercase text-brass-600">
                        {new Date(v.date).toLocaleString('en-IN', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{p?.title ?? 'Property visit'}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-2xs text-ink-muted">
                        <MapPin size={10} /> {p?.locality}{p?.city ? `, ${p.city}` : ''} · {v.time}
                      </p>
                    </div>
                    {p ? <span className="font-mono text-2xs text-ink-faint nums">{formatPrice(p.price)}</span> : null}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent conversations */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <MessageSquareText size={15} className="text-brass-600" /> Recent conversations
            </h2>
            <Link to="/assistant" className="text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline">Open assistant</Link>
          </div>
          {convQuery.isLoading ? (
            <ListSkeleton rows={2} />
          ) : recentConversations.length === 0 ? (
            <EmptyState title="No conversations yet" body="Your chats with the AI assistant will appear here." />
          ) : (
            <div className="space-y-2.5">
              {recentConversations.map(c => (
                <Link key={c._id} to="/assistant" className="block">
                  <Card className="flex items-center gap-3.5 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass-100 text-brass-700">
                      <Sparkles size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                      <p className="mt-0.5 text-2xs text-ink-muted">
                        {c.detectedIntent ? label(c.detectedIntent) : 'Chat'} · {timeAgo(c.updatedAt)}
                      </p>
                    </div>
                    <ArrowRight size={14} className="shrink-0 text-ink-faint" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Saved strip */}
      {saved.length > 0 ? (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Saved properties</h2>
            <Link to="/saved" className="text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline">View all</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {saved.slice(0, 6).map(p => (
              <Link key={p._id} to={`/property/${p._id}`} className="w-[220px] shrink-0">
                <Card className="h-full overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="h-28 bg-paper2">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-mono text-xl text-brass-400/40">{p.propertyType}</div>
                    )}
                  </div>
                  <div className="p-3.5">
                    <p className="font-display text-sm font-semibold text-ink">{formatPrice(p.price, p.listingType)}</p>
                    <p className="mt-0.5 truncate text-2xs text-ink-muted">{p.locality}, {p.city}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
