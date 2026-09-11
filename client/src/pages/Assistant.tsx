import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, SendHorizonal, Loader2, Bookmark, History, Plus, MessageSquareText,
  Mic, MicOff, Volume2,
} from 'lucide-react';
import { aiApi, savedApi, errMessage } from '../api';
import type { ChatReply, SearchResultDoc } from '../types';
import { Button, Input, Card, Badge, toast } from '../components/ui';
import { formatPrice, timeAgo, label, cn } from '../lib/ui';

interface ChatLine {
  role: 'user' | 'ai';
  text: string;
  results?: SearchResultDoc[];
  leadCaptured?: boolean;
}

const STARTERS = [
  'I need a 3BHK in Bangalore under 1.2 crore near Whitefield with parking',
  'Show me 2BHK options for rent in Pune under 40 lakh',
  'Villa in Hyderabad above 2 crore with clubhouse',
  'What can I get in Dehradun around 90 lakh?',
];

export function AssistantPage() {
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [activeId, setActiveId] = useState<string | undefined>();
  const [loadingConv, setLoadingConv] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const convQuery = useQuery({ queryKey: ['conversations'], queryFn: () => aiApi.conversations() });
  const conversations = convQuery.data?.items ?? [];
  const savedQuery = useQuery({ queryKey: ['saved-ids'], queryFn: () => savedApi.list() });

  useEffect(() => {
    if (savedQuery.data) setSavedIds(new Set(savedQuery.data.items.map(p => p._id)));
  }, [savedQuery.data]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines, busy]);

  // Speech Recognition initialization with safe try-catch
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
      console.warn('SpeechRecognition not supported in this browser:', e);
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
    if (!recognitionRef.current) {
      toast('Voice recognition is not supported in this browser', 'err');
      return;
    }
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
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast('Text-to-speech is not supported in this browser', 'err');
      return;
    }
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

  const lastAiLine = lines.slice().reverse().find(l => l.role === 'ai');

  async function openConversation(id: string): Promise<void> {
    if (id === activeId || loadingConv) return;
    setLoadingConv(true);
    try {
      const r = await aiApi.conversation(id);
      const msgs = r.conversation.messages ?? [];
      setConversationId(id);
      setActiveId(id);
      setLines(
        msgs.map(m => ({
          role: m.senderType === 'CUSTOMER' ? ('user' as const) : ('ai' as const),
          text: m.content,
        })),
      );
      setHistoryOpen(false);
    } catch (err) {
      toast(errMessage(err), 'err');
    } finally {
      setLoadingConv(false);
    }
  }

  function newChat(): void {
    setConversationId(undefined);
    setActiveId(undefined);
    setLines([]);
    setHistoryOpen(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }

  async function send(text: string): Promise<void> {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    setLines(prev => [...prev, { role: 'user', text: message }]);
    setBusy(true);
    try {
      const reply: ChatReply = await aiApi.chat(message, conversationId);
      setConversationId(reply.conversationId);
      setActiveId(reply.conversationId);
      setLines(prev => [
        ...prev,
        { role: 'ai', text: reply.reply, results: reply.results, leadCaptured: reply.leadCaptured },
      ]);
      if (reply.leadCaptured) toast('Your requirements were saved as a lead — the sales team will follow up');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    } catch (err) {
      setLines(prev => [...prev, { role: 'ai', text: 'Sorry — the assistant is unavailable right now. Please try again shortly.' }]);
      toast(errMessage(err), 'err');
    } finally {
      setBusy(false);
    }
  }

  async function toggleSave(id: string): Promise<void> {
    const next = new Set(savedIds);
    if (next.has(id)) {
      next.delete(id);
      await savedApi.unsave(id).catch(() => toast('Could not update saved list', 'err'));
    } else {
      next.add(id);
      await savedApi.save(id).catch(() => toast('Could not save property', 'err'));
    }
    setSavedIds(next);
    queryClient.invalidateQueries({ queryKey: ['saved-ids'] });
    queryClient.invalidateQueries({ queryKey: ['saved'] });
  }

  const historyList = (
    <>
      {convQuery.isLoading ? (
        <div className="space-y-2 p-2">
          {[0, 1, 2].map(i => <div key={i} className="h-14 animate-shimmer rounded-xl bg-canvas" />)}
        </div>
      ) : conversations.length === 0 ? (
        <p className="px-3 py-6 text-center text-2xs leading-relaxed text-ink-faint">
          No conversations yet. Your chats are saved here automatically.
        </p>
      ) : (
        <div className="space-y-1.5 p-2">
          {conversations.map(c => (
            <button key={c._id} onClick={() => void openConversation(c._id)} className="block w-full text-left">
              <div
                className={cn(
                  'rounded-xl border px-3 py-2.5 transition-all',
                  c._id === activeId
                    ? 'border-brass-400 bg-brass-50 ring-1 ring-brass-400/30'
                    : 'border-edge-light hover:border-ink-faint hover:bg-canvas',
                )}
              >
                <p className="truncate text-xs font-medium text-ink">{c.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  {c.detectedIntent ? <Badge tone="brass">{label(c.detectedIntent)}</Badge> : null}
                  <span className="font-mono text-[9px] text-ink-faint">{timeAgo(c.updatedAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );

  const newChatButton = (
    <Button size="sm" variant="outline" className="w-full" onClick={newChat}>
      <Plus size={13} /> New chat
    </Button>
  );

  return (
    <div className="mx-auto grid min-h-[500px] h-[calc(100dvh-8.5rem)] max-w-[1100px] gap-5 lg:h-[calc(100dvh-9.5rem)] lg:grid-cols-[250px_1fr]">
      {/* History rail (desktop) */}
      <Card className="hidden min-h-0 flex-col overflow-hidden p-0 lg:flex">
        <div className="border-b border-edge-light p-3">
          {newChatButton}
        </div>
        <div className="flex items-center gap-1.5 px-3.5 pb-1 pt-2.5 font-mono text-2xs uppercase tracking-wider text-ink-faint">
          <History size={11} /> Chat history
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{historyList}</div>
      </Card>

      {/* Chat column */}
      <Card className="flex min-h-0 flex-col overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge-light px-4 py-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-ink">
              <Sparkles size={16} className="shrink-0 text-brass-600" />
              <span className="truncate">
                {activeId ? (conversations.find(c => c._id === activeId)?.title ?? 'Conversation') : 'PropIntel AI Assistant'}
              </span>
            </h1>
            <p className="mt-0.5 hidden text-2xs text-ink-faint sm:block">
              Voice your requirements — I remember them across the conversation
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastAiLine && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => speakText(lastAiLine.text)}
                aria-label={speaking ? 'Stop reading' : 'Listen to the latest reply'}
                title={speaking ? 'Stop reading' : 'Listen to the latest reply'}
                className={cn('rounded-full transition-colors', speaking ? 'text-brick-500' : 'text-ink-muted hover:text-ink')}
              >
                {speaking ? <MicOff size={14} className="animate-pulse" /> : <Volume2 size={14} />}
                <span className="hidden text-2xs sm:inline">{speaking ? 'Stop' : 'Listen'}</span>
              </Button>
            )}
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-edge-light px-3 py-1.5 text-2xs text-ink-soft transition-colors hover:border-ink-faint lg:hidden"
            >
              <History size={12} /> History
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {loadingConv ? (
            <div className="flex h-full items-center justify-center gap-2 text-2xs text-ink-faint">
              <Loader2 size={14} className="animate-spin" /> Loading conversation…
            </div>
          ) : lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brass-100 text-brass-700">
                <Sparkles size={22} />
              </div>
              <h2 className="mt-4 font-display text-base font-semibold text-ink">Tell me what you're looking for</h2>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-muted">
                Describe your requirements in plain language — city, budget, configuration. I'll extract them, find matches and keep track as you refine.
              </p>
              <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {STARTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-xl border border-edge-light px-3.5 py-3 text-left text-2xs leading-snug text-ink-soft transition-all hover:border-brass-400 hover:bg-brass-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            lines.map((line, i) => (
              <div key={i} className={cn('flex', line.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] space-y-3', line.role === 'user' ? 'items-end' : '')}>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed animate-fade-up',
                      line.role === 'user' ? 'bg-ink text-ink-inverse' : 'bg-canvas text-ink-soft',
                    )}
                  >
                    {line.text}
                  </div>
                  {line.results && line.results.length > 0 ? (
                    <div className="grid gap-2">
                      {line.results.slice(0, 3).map(r => (
                        <div key={r.property._id} className="flex items-center gap-3 rounded-xl border border-edge-light bg-surface p-2.5">
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-paper2">
                            {r.property.images[0] ? (
                              <img src={r.property.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link to={`/property/${r.property._id}`} className="block truncate text-xs font-medium text-ink underline-offset-4 hover:underline">
                              {r.property.title}
                            </Link>
                            <p className="text-2xs text-ink-muted">{r.property.locality}, {r.property.city}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-display text-xs font-semibold text-ink">{formatPrice(r.property.price, r.property.listingType)}</p>
                            <p className="font-mono text-[9px] text-brass-600 nums">{r.matchScore}% match</p>
                          </div>
                          <button
                            onClick={() => void toggleSave(r.property._id)}
                            className={cn('shrink-0 rounded-full p-1.5 transition-colors', savedIds.has(r.property._id) ? 'text-brass-600' : 'text-ink-faint hover:text-ink')}
                            aria-label="Save property"
                          >
                            <Bookmark size={13} fill={savedIds.has(r.property._id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {line.leadCaptured ? (
                    <p className="flex items-center gap-1.5 text-2xs text-sage-700">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-500" /> Captured as a lead
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}
          {busy ? (
            <div className="flex items-center gap-2 text-2xs text-ink-faint">
              <Loader2 size={13} className="animate-spin" /> Assistant is thinking…
            </div>
          ) : null}
        </div>

        {/* Composer */}
        <form
          onSubmit={e => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2.5 border-t border-edge-light bg-surface p-3.5"
        >
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. 2BHK in Whitefield under 80 lakh with parking — or tap the mic"
            disabled={busy || loadingConv}
            className="flex-1"
          />
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleListening}
              disabled={busy || loadingConv}
              aria-label={listening ? 'Stop listening' : 'Start voice input'}
              title={listening ? 'Stop voice input' : 'Speak your message'}
              className={cn(
                'rounded-full',
                listening ? 'border-brick-400 bg-brick-50 text-brick-600' : 'border-edge-light text-ink-soft',
              )}
            >
              {listening ? <MicOff size={13} /> : <Mic size={13} />}
            </Button>
            <Button type="submit" disabled={busy || loadingConv || input.trim().length === 0} aria-label="Send">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <SendHorizonal size={15} />}
            </Button>
          </div>
        </form>
      </Card>

      {/* Mobile history drawer */}
      {historyOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-paper/60 backdrop-blur-sm" onClick={() => setHistoryOpen(false)} />
          <Card className="absolute inset-y-0 left-0 flex w-[280px] flex-col overflow-hidden rounded-none p-0 animate-fade-up">
            <div className="flex items-center justify-between border-b border-edge-light p-3">
              <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
                <MessageSquareText size={14} className="text-brass-600" /> Chat history
              </p>
              <button onClick={() => setHistoryOpen(false)} className="rounded-full p-1.5 text-ink-faint hover:bg-ink/5" aria-label="Close history">
                ✕
              </button>
            </div>
            <div className="border-b border-edge-light p-3">{newChatButton}</div>
            <div className="min-h-0 flex-1 overflow-y-auto">{historyList}</div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default AssistantPage;
