# Techpack Solutions

A premium AI chatbot website for Techpack Solutions — an industrial packing machine company. Features a futuristic SaaS-style landing page with a floating AI assistant widget, lead capture, and WhatsApp contact button.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/techpack run dev` — run the frontend (port 22420)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Optional env: `GROQ_API_KEY` — for Groq LLM (llama3-8b-8192); falls back to rule-based responses
- Optional env: `OPENROUTER_API_KEY` — alternate LLM provider fallback

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (leads table)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- **Frontend**: `artifacts/techpack/src/` — single-page app with all sections + chatbot
- **API routes**: `artifacts/api-server/src/routes/chat.ts` (AI chat), `routes/leads.ts` (lead capture)
- **DB schema**: `lib/db/src/schema/leads.ts` — leads table
- **OpenAPI spec**: `lib/api-spec/openapi.yaml` — source of truth for API contracts
- **Generated hooks**: `lib/api-client-react/src/generated/api.ts`
- **Zod schemas**: `lib/api-zod/src/generated/api.ts`

## Architecture decisions

- Chat endpoint uses Groq (llama3-8b-8192) if `GROQ_API_KEY` is set, falls back to OpenRouter, then to a keyword-based rule engine — so the chatbot always works even without API keys
- Lead capture is stored in PostgreSQL via the `/api/leads` endpoint; the chatbot triggers an inline form in the UI after detecting contact-info requests in the AI response
- Single-page app with smooth anchor scroll navigation — no client-side routing needed
- All API shapes defined in OpenAPI first, then codegen generates React Query hooks and Zod validators

## Product

- Hero, About, Services, Products, Contact sections on a single scrollable page
- Floating AI chatbot widget (bottom-right): typing animation, auto-scroll, minimize/maximize, timestamps
- Floating WhatsApp button (bottom-left): links to wa.me
- Lead capture: chatbot asks for name, phone, location and POSTs to `/api/leads`
- Dark navy + electric cyan theme with Framer Motion scroll animations

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Add `GROQ_API_KEY` secret to enable real AI responses — without it, the chatbot uses keyword-based rule responses
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes before touching frontend code
- Always run `pnpm --filter @workspace/db run push` after schema changes in `lib/db/src/schema/`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
