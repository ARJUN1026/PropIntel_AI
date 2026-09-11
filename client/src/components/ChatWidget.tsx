import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, SendHorizonal, Loader2, Sparkles, Zap, Mic, MicOff, Volume2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { aiApi, savedApi, leadApi, analyticsApi, visitApi } from '../api';
import type { ChatReply, SearchResultDoc } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Button, Input } from './ui';
import { formatPrice, cn } from '../lib/ui';

interface ChatLine {
  role: 'user' | 'ai';
  text: string;
  results?: SearchResultDoc[];
  leadCaptured?: boolean;
  quickAnswer?: boolean;
}

const CUSTOMER_SUGGESTIONS = [
  '3BHK in Bangalore under 1.2 crore with parking',
  '2BHK for rent in Pune under 40 lakh',
  'Villa in Hyderabad above 2 crore with clubhouse',
];

const ADMIN_SUGGESTIONS = [
  'How many hot leads do I have?',
  'Which leads need follow-up?',
  'Upcoming site visits',
  'Total leads overview',
];

/**
 * Floating assistant popup, available on every page.
 * - Customers: full AI assistant (requirement extraction, lead capture, property matches).
 * - Admins: instant CRM answers (hot leads, follow-ups, visits, totals) + property search.
 */
export function ChatWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const isCustomer = user?.role === 'CUSTOMER';
  const suggestions = isCustomer ? CUSTOMER_SUGGESTIONS : ADMIN_SUGGESTIONS;

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Auto-scroll messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines, busy, open]);

  // Speech Recognition initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        if (event.results[last].isFinal) {
          setInput(transcript);
          window.setTimeout(() => {
            if (transcript.trim().length > 0) {
              void send(transcript.trim());
              setInput('');
            }
          }, 250);
          setListening(false);
        } else {
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
        }
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition initialization failed:', e);
    }

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function toggleListening(): void {
    if (!recognitionRef.current) return;
    if (listening) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      setListening(false);
      return;
    }
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function speakText(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    if (!text || text.trim().length === 0) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      synth.speak(utterance);
    } catch (err) {
      console.warn('TTS error:', err);
      setSpeaking(false);
    }
  }

  async function send(raw: string): Promise<void> {
    const message = raw.trim();
    if (!message || busy) return;
    setInput('');
    setLines(prev => [...prev, { role: 'user', text: message }]);
    setBusy(true);
    try {
      if (!isCustomer) {
        const quick = await adminQuickAnswer(message);
        if (quick) {
          setLines(prev => [...prev, { role: 'ai', text: quick, quickAnswer: true }]);
          return;
        }
        const search = await aiApi.search(message);
        const results = search.results ?? [];
        const text = results.length > 0
          ? `Found ${results.length} matches — top pick: ${results[0].property.title} (${results[0].matchScore}% match) in ${results[0].property.locality}.`
          : 'No matching properties found. Try a different city, budget or configuration.';
        setLines(prev => [...prev, { role: 'ai', text, results: results.slice(0, 3) }]);
        return;
      }

      const reply: ChatReply = await aiApi.chat(message, conversationId);
      setConversationId(reply.conversationId);
      setLines(prev => [
        ...prev,
        { role: 'ai', text: reply.reply, results: reply.results, leadCaptured: reply.leadCaptured },
      ]);
      if (reply.leadCaptured) {
        queryClient.invalidateQueries({ queryKey: ['recommendations'] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    } catch (err) {
      setLines(prev => [...prev, { role: 'ai', text: 'Sorry — I could not process that right now. Please try again shortly.' }]);
      console.error('Chat widget error:', err);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSave(id: string): Promise<void> {
    const next = new Set(savedIds);
    if (next.has(id)) {
      next.delete(id);
      await savedApi.unsave(id).catch(() => undefined);
    } else {
      next.add(id);
      await savedApi.save(id).catch(() => undefined);
    }
    setSavedIds(next);
    queryClient.invalidateQueries({ queryKey: ['saved-ids'] });
    queryClient.invalidateQueries({ queryKey: ['saved'] });
  }

  // ALL hooks are declared above. Safe conditional rendering below.
  if (!user) return null;
  if (isCustomer && location.pathname === '/assistant') return null;

  const lastAiLine = lines.slice().reverse().find(l => l.role === 'ai');

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Popup panel */}
      {open ? (
        <div
          className="flex h-[520px] max-h-[calc(100dvh-7rem)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-edge-light bg-surface shadow-lift animate-fade-up"
          role="dialog"
          aria-label="Assistant chat"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-edge-light bg-paper px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass-400 text-paper">
              <Sparkles size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold tracking-tight text-ink-inverse">PropIntel AI Assistant</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">
                {isCustomer ? 'Property search & requirements' : 'CRM quick answers & search'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-ink-faint transition-colors hover:bg-surface/10 hover:text-ink-inverse" aria-label="Close chat">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-canvas p-3.5">
            {lines.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass-100 text-brass-700">
                  <Sparkles size={18} />
                </div>
                <p className="mt-3 font-display text-sm font-semibold text-ink">
                  {isCustomer ? 'Hi! Looking for a property?' : 'Hi! Ask me about your CRM.'}
                </p>
                <p className="mt-1 text-2xs leading-relaxed text-ink-muted">
                  {isCustomer
                    ? 'Tell me your requirements — city, budget, configuration — and I will find matches and remember them.'
                    : 'Quick questions like hot leads, follow-ups or visits are answered instantly from live data.'}
                </p>
                <div className="mt-4 grid w-full gap-1.5">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-xl border border-edge-light bg-surface px-3 py-2 text-left text-2xs leading-snug text-ink-soft transition-all hover:border-brass-400 hover:bg-brass-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              lines.map((line, i) => (
                <div key={i} className={cn('flex', line.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className="max-w-[88%] space-y-2">
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed animate-fade-up',
                        line.role === 'user' ? 'bg-ink text-ink-inverse' : line.quickAnswer ? 'bg-sage-100 text-sage-700' : 'bg-surface text-ink-soft shadow-card',
                      )}
                    >
                      {line.quickAnswer ? (
                        <span className="mb-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-sage-500">
                          <Zap size={10} /> Live CRM data
                        </span>
                      ) : null}
                      {line.text}
                    </div>
                    {line.results && line.results.length > 0 ? (
                      <div className="space-y-1.5">
                        {line.results.map((r, idx) => (
                          <div key={`${r.property._id}-${idx}`} className="flex items-center gap-2.5 rounded-xl border border-edge-light bg-surface p-2">
                            <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-paper2">
                              {r.property.images[0] ? (
                                <img src={r.property.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/property/${r.property._id}`}
                                onClick={() => setOpen(false)}
                                className="block truncate text-2xs font-medium text-ink underline-offset-4 hover:underline"
                              >
                                {r.property.title}
                              </Link>
                              <p className="truncate text-[10px] text-ink-muted">{r.property.locality}, {r.property.city}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-display text-2xs font-semibold text-ink">{formatPrice(r.property.price, r.property.listingType)}</p>
                              <p className="font-mono text-[9px] text-brass-600 nums">{r.matchScore}%</p>
                            </div>
                            {isCustomer ? (
                              <button
                                onClick={() => void toggleSave(r.property._id)}
                                className={cn('shrink-0 rounded-full px-1.5 py-1 font-mono text-[9px] transition-colors', savedIds.has(r.property._id) ? 'bg-brass-100 text-brass-700' : 'text-ink-faint hover:bg-ink/5 hover:text-ink')}
                                aria-label="Save property"
                              >
                                {savedIds.has(r.property._id) ? '✓' : '+'}
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {line.leadCaptured ? (
                      <p className="flex items-center gap-1.5 text-[10px] text-sage-700">
                        <span className="inline-block h-1 w-1 rounded-full bg-sage-500" /> Saved as a lead — the sales team will follow up
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            {busy ? (
              <div className="flex items-center gap-2 text-2xs text-ink-faint">
                <Loader2 size={12} className="animate-spin" /> Thinking…
              </div>
            ) : null}
          </div>

          {/* Voice + send controls */}
          {lines.length > 0 && (
            <div className="flex items-center justify-between border-t border-edge-light bg-surface px-3 py-2">
              {lastAiLine && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => speakText(lastAiLine.text)}
                  aria-label={speaking ? 'Stop reading' : 'Listen to the latest reply'}
                  title="Read aloud"
                  className={cn('rounded-full text-xs', speaking ? 'text-brick-500' : 'text-ink-muted hover:text-ink')}
                >
                  {speaking ? <MicOff size={13} className="animate-pulse" /> : <Volume2 size={13} />}
                  <span className="text-[10px]">{speaking ? 'Stop' : 'Listen'}</span>
                </Button>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleListening}
                  disabled={busy}
                  aria-label={listening ? 'Stop listening' : 'Start voice input'}
                  title={listening ? 'Stop voice input' : 'Speak your message'}
                  className={cn(
                    'rounded-full',
                    listening ? 'border-brick-400 bg-brick-50 text-brick-600' : 'border-edge-light text-ink-soft',
                  )}
                >
                  {listening ? <MicOff size={12} /> : <Mic size={12} />}
                </Button>
              </div>
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={e => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-edge-light bg-surface p-2.5"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isCustomer ? 'e.g. 2BHK in Whitefield under 80 lakh — or tap the mic' : 'e.g. how many hot leads?'}
              disabled={busy}
              className="h-9 flex-1 text-xs"
            />
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleListening}
                disabled={busy}
                aria-label={listening ? 'Stop listening' : 'Start voice input'}
                title={listening ? 'Stop voice input' : 'Speak your message'}
                className={cn(
                  'rounded-full',
                  listening ? 'border-brick-400 bg-brick-50 text-brick-600' : 'border-edge-light text-ink-soft',
                )}
              >
                {listening ? <MicOff size={11} /> : <Mic size={11} />}
              </Button>
              <Button type="submit" size="sm" disabled={busy || input.trim().length === 0} aria-label="Send message">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <SendHorizonal size={13} />}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Floating action button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center justify-center rounded-full shadow-lift transition-all duration-200 hover:scale-105 active:scale-95',
          open ? 'bg-ink text-ink-inverse' : 'bg-brass-400 text-paper',
        )}
        style={{ height: 52, width: 52 }}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <X size={20} /> : <Sparkles size={21} />}
      </button>
    </div>
  );
}

/* ---------- Admin quick CRM answers (deterministic, from live data) ---------- */

async function adminQuickAnswer(raw: string): Promise<string | null> {
  const q = raw.toLowerCase();

  if (/hot lead/.test(q) || /how many hot/.test(q)) {
    const r = await leadApi.list({ temperature: 'HOT', limit: '5' });
    const names = r.items.map(l => `${l.name} (${l.leadScore})`).join(', ');
    return r.total === 0
      ? 'You currently have no hot leads (score 80+). Warm leads can be nurtured up.'
      : `You have ${r.total} hot lead${r.total === 1 ? '' : 's'} (score 80+). Top: ${names}.`;
  }

  if (/(follow.?up|today|due|overdue)/.test(q)) {
    const r = await leadApi.list({ limit: '100' });
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const due = r.items.filter(l => (l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= endOfToday) || l.status === 'FOLLOW_UP');
    if (due.length === 0) return 'No follow-ups are due today. The priority queue is clear.';
    const top = due.slice(0, 5).map(l => `${l.name} (${l.leadScore})`).join(', ');
    return `${due.length} lead${due.length === 1 ? '' : 's'} need${due.length === 1 ? 's' : ''} follow-up: ${top}${due.length > 5 ? '…' : ''}.`;
  }

  if (/visit/.test(q)) {
    const r = await visitApi.list();
    const upcoming = r.items.filter(v => ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'].includes(v.status));
    if (upcoming.length === 0) return 'There are no upcoming site visits right now.';
    const next = upcoming.slice(0, 3).map(v => {
      const p = typeof v.propertyId === 'object' ? v.propertyId : null;
      const c = typeof v.customerId === 'object' ? v.customerId : null;
      return `${p?.title ?? 'Visit'} — ${v.date} ${v.time}${c ? ` (${c.name})` : ''}`;
    });
    return `${upcoming.length} upcoming site visit${upcoming.length === 1 ? '' : 's'}. Next: ${next.join('; ')}.`;
  }

  if (/(total|overview|summary|how many lead|pipeline)/.test(q)) {
    const ov = await analyticsApi.overview();
    return (
      `Pipeline overview — ${ov.leads} total leads, ${ov.hotLeads} hot, ${ov.visits} site visits, ` +
      `${ov.conversions} conversions (${ov.conversionRate}% conversion rate).`
    );
  }

  return null;
}
