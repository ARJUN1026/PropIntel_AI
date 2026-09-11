# PropIntel AI — Implementation Plan

Derived from `spec.md` (v1.0). This plan sequences the spec into buildable milestones with dependencies, deliverables, and acceptance criteria. Spec section numbers (§) are referenced for traceability.

---

## 1. Strategy

- **Build order follows data flow, not feature order.** The core value chain is: Property data → AI understanding (intent/entities) → Matching → Lead capture → Lead intelligence → Agent workflow → Analytics. Each milestone feeds the next.
- **MVP first (§98), then AI depth (§99), then platform extras (§100).** No Phase 2/3 work starts before MVP acceptance.
- **AI behind a service abstraction.** All LLM calls go through one provider-agnostic module so Gemini/OpenAI are swappable without touching feature code (§56 leaves the choice open).
- **Deterministic where possible.** Lead scoring, match scoring, and analytics aggregations are implemented as plain code (not LLM calls) so they're testable and consistent; LLMs are used for extraction, explanation, and generation.

### Key decisions (defaults proposed — swappable)

| Decision | Default | Alternatives (per spec) | Rationale |
|---|---|---|---|
| LLM provider | Google Gemini (`gemini-2.0-flash` class) + `text-embedding-004` | OpenAI | One provider covers chat + structured extraction + embeddings; free tier friendly for dev |
| Vector DB | Qdrant (Docker, self-hosted) | Endee, Pinecone | Free, local dev via Docker, metadata filtering needed for per-property/per-role retrieval (§88) |
| File storage | Cloudinary (images + raw PDFs) | AWS S3 | Simplest setup; wrap behind a `storage` service so S3 can slot in later |
| Redis | Skip in MVP; in-memory rate limiting | Redis for cache/queue (§56) | Reduce MVP moving parts; add when background jobs (document processing) need a queue in Phase 2 |
| Package manager | pnpm workspaces (client/server/scripts) | npm | Faster installs, single lockfile monorepo |

---

## 2. Milestone Overview

| # | Milestone | Depends on | Scope |
|---|---|---|---|
| M0 | Repo scaffolding & contracts | — | Monorepo, env, configs, shared types |
| M1 | Auth & RBAC | M0 | Register/login/JWT/roles (§6, §87) |
| M2 | Property domain | M0 | Models, CRUD, filters, images (§37–39, §52) |
| M3 | AI core: search & recommendations | M2 | LLM service, intent, entities, NL search, matching (§8–11, §59) |
| M4 | AI assistant + lead capture | M3 | Chat, memory, inquiries → leads (§12–13, §20–21) |
| M5 | Lead CRM & intelligence | M4 | Pipeline, scoring, prioritization, assignment (§22–25) |
| M6 | Customer engagement features | M2 | Saved, compare, site visits (§18–19, §35–36) |
| M7 | Dashboards & analytics v1 | M5, M6 | Customer/agent/admin dashboards, funnel, sources (§48–50, §73–79) |
| M8 | MVP hardening & seed data | M1–M7 | Seeds, guardrails, tests, error handling, perf (§54, §87–94) |
| M9 | RAG knowledge system | M8 | Upload → chunk → embed → vector search → cited answers (§14–17, §58, §68–69) |
| M10 | AI agent productivity suite | M9 | Summaries, follow-ups, copilot, sentiment, dedupe, content gen (§30–34, §40, §81) |
| M11 | AI evaluation harness | M9–M10 | Eval datasets + metrics (§93) |
| M12 | Phase 3 / advanced (opt-in) | M10 | WhatsApp, voice, predictive, CV, market intel (§41–44, §82–86) |

---

## 3. Milestone Detail

### M0 — Repo Scaffolding & Contracts (~2 days)

Deliverables:
- Monorepo per spec §96: `client/`, `server/`, `ai/` (prompts, evaluation, datasets), `scripts/`, `docs/`.
- `server/`: Express + TypeScript, strict tsconfig, ESLint/Prettier, centralized error middleware, structured error format `{ success, message, code }` (§90), request logging.
- `client/`: Vite + React + TS, Tailwind, React Router, TanStack Query, Recharts, axios instance with auth interceptor.
- `.env.example` covering §97 vars; secrets only via env (§55).
- Shared conventions doc: response envelope, pagination, error codes, date/price formats (store price in paise/number, not strings).
- CI-lite: `pnpm lint && pnpm typecheck` on both packages.

Acceptance: both apps boot; health endpoint; one protected dummy route demonstrating JWT + role guard.

### M1 — Auth & RBAC (~2–3 days)

Deliverables:
- `User` model per §63 (bcrypt hash, role enum `CUSTOMER|AGENT|ADMIN`, isActive).
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (§61) with Zod validation.
- JWT access tokens; middleware: `requireAuth`, `requireRole(...)`.
- Frontend: login/register pages, auth context, protected route wrappers per role, token persistence, logout.
- Audit log of auth events (§91).

Acceptance: a user can register as each role and only reaches routes permitted by §6.3; passwords hashed; no token/secret in client code.

### M2 — Property Domain (~4–5 days)

Deliverables:
- `Property` model per §64 with status enum (§39) and listing type; geopoint coordinates.
- Admin/agent CRUD APIs (§61 Properties) + publish/unpublish; image upload via storage service (Cloudinary).
- Public/customer endpoints: list with **filters** for §52 (location, price range, bedrooms, type, area, amenities, parking, furnishing, status), sorting, pagination.
- Property details page + property card component (§74).
- Admin property form (create/edit), including AI description generator stub (fully wired in M10; admin can paste content meanwhile, §40).

Acceptance: admin creates/publishes a property with images; customer can filter and view; agents see assigned properties. Seed a handful of manual properties to unblock M3.

### M3 — AI Core: Search & Recommendations (~5–6 days) — *the heart of the product*

Deliverables:
- `services/ai/llm.ts`: provider abstraction (chat, JSON-mode structured output, embeddings), retry/timeout, token/cost logging, mock provider for tests.
- **Intent detection** (§9): classify into the 10 intents; enforceable via JSON schema output.
- **Entity extraction** (§10, §8.1): city/locality, propertyType/BHK, budget (normalize "90 lakh" → number), area, amenities, furnishing, parking, intent; returns structured criteria + confidence.
- `POST /api/ai/property-search`: NL query → extracted criteria (returned to UI for chip display, §75) → DB filter query → results. Fallback to plain filters when AI errors (§90 messaging).
- **Recommendation engine** (§11, §59): filter → deterministic weighted match score (budget 25 / location 25 / type 20 / amenities 15 / size 15 or similar; document the rubric in code) → top-N with **explanation** (template-based reasons + optional LLM polish) → "92% Match" UI (§76).
- Persistence: extracted requirements stored on customer profile for reuse (§10, §13 groundwork).

Acceptance: the spec's example queries ("3BHK in Bangalore under ₹1.2 crore near Whitefield with parking and a gym") produce correct chips and ranked results with reasons; unit tests for the scoring rubric with fixed fixtures; intent/extraction tests against a curated phrase set (`ai/datasets/`).

### M4 — AI Assistant & Lead Capture (~4–5 days)

Deliverables:
- `Conversation` + `Message` models (§66–67); `POST /api/ai/chat`, conversation list/detail endpoints (§61).
- Conversation memory (§13): rolling summary + structured requirement state per conversation; each turn updates entities.
- Assistant tools: search properties, answer about a specific property (from DB fields), schedule-visit intent → create site visit request, compare intent.
- **AI lead capture** (§21): when intent + (budget or timeline) confirmed → create/update Lead automatically; dedupe-safe creation hooks into M5 duplicate checks.
- Inquiries (§20) create or update leads; lead source recorded (§45 enum).
- Guardrails layer (§54, §88): system prompt rules, "not found in documents → say so" behavior, per-user scoping of retrievable data.

Acceptance: the §21 dialogue produces a lead with correct intent/type/location/budget/timeline; conversation continuation retains context; unanswered property questions decline gracefully.

### M5 — Lead CRM & Intelligence (~4–5 days)

Deliverables:
- `Lead` model per §65 (status enum §22, temperature, score, source, nextFollowUpAt, sentiment placeholder).
- Lead CRUD + filters (§52 lead filters) + agent assignment (round-robin default; admin reassign).
- **Deterministic lead scoring engine** (§23): rubric exactly per spec (budget 20, location 15, type 15, timeline 20, site visit 20, engagement 10) → temperature bands HOT/WARM/NURTURE/COLD; score recomputed on relevant events (message, requirement update, visit request, agent contact).
- **Score explanation** (§24): reasons list from rubric hits + recommended next action from a rule map (§34 actions).
- Prioritized lead list for agents (§25): rank by score, bucket by priority.
- Engagement tracking: property views, saves, message counts feed the engagement component.

Acceptance: rubric unit tests (e.g., the §23 example → 100, §24 example → 91/HOT); leads visible in agent pipeline ordered by score; status transitions validated (NEW→…→CONVERTED/LOST).

### M6 — Customer Engagement (~3–4 days)

Deliverables:
- Saved properties (§19): save/remove/list/compare-saved; `saved_properties` collection.
- Comparison (§18): multi-select → side-by-side table of §18 fields + match scores + AI comparison summary endpoint.
- Site visits (§35–36): request (customer) → status workflow `REQUESTED→CONFIRMED→RESCHEDULED→COMPLETED/CANCELLED/NO_SHOW`; agent confirm + outcome recording; updates lead (site visit requested → +score, status → SITE_VISIT path).
- Inquiries UI (customer "My Inquiries").

Acceptance: full §36 workflow traceable in DB (activities log); lead score/status react to visit lifecycle; comparison renders all §18 fields including AI summary.

### M7 — Dashboards & Analytics v1 (~5–6 days)

Deliverables:
- **Customer dashboard** (§7.1): recommendations, saved, upcoming visits, recent conversations.
- **Agent dashboard** (§77): stat cards, today's priorities (from M5 scoring), pipeline (kanban by status), upcoming visits, recent conversations. (Copilot panel lands in M10.)
- **Admin dashboard** (§50): totals (properties, customers, agents, leads, hot leads, visits, conversions, revenue, conversion rate).
- Analytics APIs (§61 Analytics): overview, leads funnel (§48), lead sources (§45–46 tables: leads/qualified/visits/conversions per source), demand (§43: top locations/types/price bands/amenities), agent performance (§47), response times (§49: avg first response, uncontacted, overdue follow-ups).
- Aggregations implemented as MongoDB aggregation pipelines; results cached briefly in memory.
- Frontend charts with Recharts; "AI insight" narrative blocks are rule-based text in MVP (LLM versions in M10).

Acceptance: dashboards load <2s (§89) against seeded data; funnel numbers reconcile with lead collection counts.

### M8 — MVP Hardening, Seed Data & Testing (~4–5 days)

Deliverables:
- **Seed scripts** (§94–95): 100–300 properties across the 9 demo cities, 20–50 agents, 500–2,000 customers, 1,000–5,000 leads with realistic status/score distributions, thousands of messages, campaigns, synthetic analytics history. Clearly labeled synthetic.
- Security pass (§87): rate limiting (in-memory), helmet/CORS config, input validation on every route, file-type/size validation, audit logging, no secrets client-side.
- AI guardrail prompts finalized (§54): no invented facts, no investment/legal advice, decline when info unavailable.
- Error handling: consistent codes (`AI_SEARCH_ERROR`, etc.), user-friendly fallbacks (§90).
- Testing (§92): backend — auth, RBAC, validation, lead scoring, matching, filters; frontend — auth flow, search, filters, cards, dashboard smoke; AI — intent/extraction fixtures, mock-provider tests.
- Performance sanity (§89): indexes on hot query paths (city, locality, price, status, bedrooms, assignedAgent, leadScore), pagination everywhere.
- README with setup instructions; `docs/architecture` notes.

Acceptance: **MVP definition (§98) fully demonstrable end-to-end** with seeded demo accounts for all three roles.

---

### M9 — RAG Knowledge System (~6–7 days)

Deliverables:
- Document upload API (§61 Documents): PDF/brochure upload → storage → `property_documents` record with `processingStatus` (§68).
- Processing pipeline (§15): parse (pdf-parse) → clean → **chunking** (500–800 tokens, 50–100 overlap, configurable §16) → embeddings (`text-embedding-004` or provider equivalent) → upsert to Qdrant with metadata: `propertyId, documentId, pageNumber, chunkIndex` → `property_chunks` records (§69).
- Retrieval service: embed question → top-K semantic search filtered by `propertyId` + access rules (§88: userId/role/propertyId permissions) → assemble context.
- `POST /api/ai/property-question`: grounded answer with **source citation** (document name + page, §17 UI); explicit "not in documents" fallback (§54).
- Knowledge Base admin UI: upload, list, delete (with vector cleanup), reprocess, per-document status.
- Redis introduced here **if needed** for background processing queue; otherwise async in-process worker with status tracking is acceptable for MVP-2 scale.

Acceptance: "What is the possession date?" on a seeded brochure returns the correct date + "Project X Brochure — Page 8" citation; asking about absent info returns the §54 fallback; deletion removes vectors; role scoping verified by test.

### M10 — AI Agent Productivity Suite (~6–7 days)

Deliverables:
- **Conversation summarization** (§30): on-demand + automatic for long conversations; structured summary (requirement/budget/location/timeline/preferences/intent/next action) stored on conversation & surfaced to agents.
- **Sentiment analysis** (§31): POSITIVE/NEUTRAL/NEGATIVE per message window + conversation trend; negative → flag + agent/admin notification (§51).
- **Follow-up assistant** (§32): detect due/overdue follow-ups (`nextFollowUpAt`, last contact age); generate draft messages (edit/copy/send/dismiss — **never auto-send**, per spec).
- **AI Sales Copilot** (§33, §78): "What should I focus on today?" → agent-scoped analysis: hot leads, overdue follow-ups, uncontacted >24h, upcoming visits; combines deterministic CRM queries + LLM narrative.
- **Recommended next action** (§34): per-lead rule engine + explanation, shown on lead detail.
- **Duplicate lead detection** (§26): phone/email exact match + name similarity (normalized fuzzy) + property-interest overlap → similarity % → merge/keep-separate/dismiss workflow (merge preserves history).
- **AI content generation** (§40, §81): property description/short/SEO/social from structured inputs; email/WhatsApp follow-up drafts; all behind review-before-publish UI.
- Notifications module (§51): in-app notification center + events for new/hot lead, follow-up due, visit requested/confirmed, duplicate, negative sentiment. (Email/WhatsApp delivery is Phase 3.)

Acceptance: the spec's §30–34 example outputs reproducible from seeded conversations; copilot answers "How many hot leads do I have?" and "Which leads need follow-up today?" correctly from CRM data (§53 scope); duplicates in seed data are flagged with ≥90% similarity.

### M11 — AI Evaluation Harness (~3 days, parallelizable with M10 polish)

Deliverables:
- `ai/evaluation/`: golden datasets — intent (≥100 phrases), entity extraction (≥100), retrieval QA (≥50 doc questions with expected chunk/answer), recommendation scenarios, lead-scoring cases.
- Runner script computing §93 metrics: intent accuracy, extraction accuracy, retrieval precision, answer relevance, hallucination rate, recommendation accuracy, scoring consistency.
- CI job (manual trigger) producing a report; regression gate for prompt changes.

Acceptance: report generated with pass rates per metric; a deliberately broken prompt shows measurable regression.

### M12 — Phase 3 / Advanced (opt-in, §100)

Sequenced by business value, each is its own mini-project:
1. **Market & demand intelligence** (§42–44): price/sqft aggregates per locality, budget distribution, demand-over-time — mostly aggregation + charting work; extends existing analytics.
2. **Predictive lead scoring** (§84): conversion probability from historical labeled leads (start with logistic regression on rubric features + engagement; iterate).
3. **WhatsApp integration** (§82): webhook → conversation pipeline reuse; requires Meta app setup + Redis queue.
4. **Voice AI** (§83): STT → assistant → TTS on the existing chat pipeline.
5. **Computer vision image tagging** (§41, §86): room classification via vision model, auto-tagging on upload.
6. **Investment intelligence** (§85): data-driven insights only, with explicit "not investment advice" guardrails.

---

## 4. Cross-Cutting Workstreams

- **Data model rollout:** models land in this order — `users` (M1) → `properties`, `activities` (M2) → `conversations`, `messages`, `saved_properties` (M4/M6) → `leads`, `notifications` (M5) → `site_visits`, `campaigns` (M6/M7) → `property_documents`, `property_chunks` (M9). `customers`/`agents` profiles can live as extensions of `users` (discriminator) to avoid premature collection splits — decide in M1.
- **Testing matrix (§92):** every milestone ships with unit tests for services/scoring and route tests for auth/validation. Frontend component tests for cards, filters, dashboards. Mock LLM provider keeps AI tests hermetic.
- **Observability (§91):** request logging, AI request logging (prompt tokens, latency, cost), document processing logs, admin action audit log — one logger, redacted secrets.
- **Docs:** `docs/api` auto-generated from route definitions; `docs/architecture` holds the §57–60 diagrams, updated as built.

## 5. Critical Path & Rough Effort

```
M0 → M1 → M2 → M3 → M4 → M5 → M7 → M8   (MVP: ~30–35 working days solo)
              ↘ M6 ──────────↗
M8 → M9 → M10 → M11                     (Phase 2: ~15–17 working days)
M12: separate tracks, 2–5 days each
```

- M6 (customer engagement) can proceed in parallel with M4/M5 by a second developer or interleaved.
- Highest-risk items to de-risk early: **M3 extraction quality** (budget/city parsing of Indian formats like "90 lakh", "1.2 crore") and **M9 retrieval accuracy** — both covered by eval datasets in M11; build a thin version of the eval harness during M3 rather than waiting.

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM extraction inconsistent across phrasings | JSON-schema constrained outputs; fixture eval set; fallback to filter UI on low confidence |
| Hallucinated property facts | RAG-only answering for doc questions; §54 refusal prompts; hallucination metric in eval |
| Cost/latency of AI calls | Flash-class model, response caching per (query-hash), streaming where UX allows, rate limits |
| Duplicate/merge data loss | Merge is soft-merge with activity trail; merge is reversible via archived record |
| Scope creep (Phase 3 features) | Hard MVP gate at M8 per §98; Phase 3 items tracked separately |
| Vector DB + embeddings migration cost | Provider-agnostic `embeddingService` + `vectorStore` interfaces from day one of M9 |

## 7. First Sprint Checklist (what I'd build immediately)

1. M0 scaffolding: server + client boot, lint/typecheck, env template, error envelope.
2. M1 auth end-to-end (register/login/me, RBAC middleware, login UI).
3. `Property` model + admin CRUD + list-with-filters endpoint + property card UI.
4. Seed 20 properties manually scripted → unblocks M3 development.
5. LLM abstraction with mock provider + first intent/extraction prompt + fixture tests.
