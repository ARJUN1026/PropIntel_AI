import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquareText, Sparkles } from 'lucide-react';
import { aiApi } from '../api';
import type { ConversationDoc, MessageDoc } from '../types';
import { Card, EmptyState, ListSkeleton, Badge } from '../components/ui';
import { timeAgo, label, cn } from '../lib/ui';

export function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQuery = useQuery({ queryKey: ['conversations'], queryFn: () => aiApi.conversations() });
  const conversations: ConversationDoc[] = listQuery.data?.items ?? [];
  const activeId = selectedId ?? conversations[0]?._id ?? null;

  const detailQuery = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => aiApi.conversation(activeId!),
    enabled: Boolean(activeId),
  });

  const active: ConversationDoc | undefined = detailQuery.data?.conversation;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <p className="font-mono text-2xs uppercase tracking-[0.2em] text-brass-600">CRM</p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
          <MessageSquareText size={20} className="text-brass-600" /> Conversations
        </h1>
        <p className="mt-1 text-xs text-ink-muted">Customer chats with the AI assistant — requirements, intent and sentiment included.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* List */}
        <div className="space-y-2.5">
          {listQuery.isLoading ? (
            <ListSkeleton rows={6} />
          ) : conversations.length === 0 ? (
            <EmptyState title="No conversations" body="Chats appear here once customers start using the assistant." />
          ) : (
            conversations.map(c => {
              const customer = typeof c.customerId === 'object' ? c.customerId : null;
              const isActive = c._id === activeId;
              return (
                <button key={c._id} onClick={() => setSelectedId(c._id)} className="block w-full text-left">
                  <Card
                    className={cn(
                      'p-4 transition-all',
                      isActive ? 'border-brass-400 ring-2 ring-brass-400/30' : 'hover:-translate-y-0.5 hover:shadow-lift',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-ink">{customer?.name ?? 'Customer'}</p>
                      <span className="shrink-0 font-mono text-2xs text-ink-faint">{timeAgo(c.updatedAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-2xs text-ink-muted">{c.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {c.detectedIntent ? <Badge tone="brass">{label(c.detectedIntent)}</Badge> : null}
                      <Badge tone={c.sentiment === 'NEGATIVE' ? 'brick' : c.sentiment === 'POSITIVE' ? 'sage' : 'neutral'}>
                        {label(c.sentiment)}
                      </Badge>
                    </div>
                  </Card>
                </button>
              );
            })
          )}
        </div>

        {/* Detail */}
        <div>
          {!active ? (
            <EmptyState title="Select a conversation" body="Pick a conversation on the left to see the full history." />
          ) : (
            <div className="space-y-5">
              {/* AI summary */}
              <Card className="border-brass-200/70 p-5">
                <p className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider text-brass-700">
                  <Sparkles size={12} /> Customer summary
                </p>
                {active.summary ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
                    {[
                      ['Requirement', active.summary.requirement ?? '—'],
                      ['Budget', active.summary.budget ?? '—'],
                      ['Location', active.summary.location ?? '—'],
                      ['Timeline', active.summary.timeline ?? '—'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-mono text-2xs uppercase tracking-wider text-ink-faint">{k}</dt>
                        <dd className="mt-0.5 font-medium text-ink-soft">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : active.extractedRequirements ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
                    {[
                      ['Type', active.extractedRequirements.propertyType ?? 'Any'],
                      ['Max budget', active.extractedRequirements.budgetMax ? `₹${(active.extractedRequirements.budgetMax / 100000).toFixed(0)}L` : '—'],
                      ['Locations', active.extractedRequirements.locations.length > 0 ? active.extractedRequirements.locations.join(', ') : '—'],
                      ['Preferences', active.extractedRequirements.amenities.length > 0 ? active.extractedRequirements.amenities.join(', ') : '—'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-mono text-2xs uppercase tracking-wider text-ink-faint">{k}</dt>
                        <dd className="mt-0.5 font-medium text-ink-soft">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-2 text-xs text-ink-muted">No summary yet — it generates as the conversation grows.</p>
                )}
                {active.summary?.nextAction ? (
                  <p className="mt-3 border-t border-edge-light pt-3 text-2xs text-ink-soft">
                    Next action: <span className="font-medium text-ink">{active.summary.nextAction}</span>
                  </p>
                ) : null}
              </Card>

              {/* Messages */}
              <Card className="p-5">
                <div className="space-y-3.5">
                  {(active.messages ?? []).map((m, i) => (
                    <MessageRow key={m._id ?? i} message={m} />
                  ))}
                  {(active.messages ?? []).length === 0 ? (
                    <p className="py-6 text-center text-2xs text-ink-faint">No messages stored for this conversation.</p>
                  ) : null}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageRow({ message: m }: { message: MessageDoc }) {
  const isCustomer = m.senderType === 'CUSTOMER';
  const isAi = m.senderType === 'AI';
  return (
    <div className={cn('flex', isCustomer ? 'justify-start' : 'justify-end')}>
      <div className={cn('max-w-[80%]', isCustomer ? 'items-start' : 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-xs leading-relaxed',
            isCustomer ? 'bg-canvas text-ink-soft' : isAi ? 'bg-brass-50 text-ink-soft' : 'bg-ink text-ink-inverse',
          )}
        >
          {m.content}
        </div>
        <p className="mt-1 px-1 font-mono text-[9px] uppercase tracking-wider text-ink-faint">
          {isCustomer ? 'Customer' : isAi ? 'AI Assistant' : 'Agent'} · {timeAgo(m.timestamp)}
        </p>
      </div>
    </div>
  );
}
