<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="frontend/public/crtx-logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="frontend/public/crtx-logo-light.png">
  <img alt="CRTX" src="frontend/public/crtx-logo-dark.png" width="280" />
</picture>

<br />

**A production-grade RAG platform — ingest any document, query it with AI, and measure answer quality.**

[![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-00B5AD?logoColor=white)](https://pinecone.io)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai&logoColor=white)](https://openai.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB_%26_Storage-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

<br />

<!-- VIDEO PLACEHOLDER — remove this comment and paste your Loom embed below when ready -->
<!-- [![Watch the demo](https://cdn.loom.com/sessions/thumbnails/YOUR_ID-with-play.gif)](https://www.loom.com/share/YOUR_ID) -->

</div>

---

## What is CRTX?

CRTX is a **multi-user Retrieval-Augmented Generation (RAG) platform** built for teams that need to query their own documents with AI — and actually trust the answers.

Most AI chat tools are black boxes. CRTX is different: every response comes with **cited sources**, and every interaction is scored for **faithfulness** (did the answer match the retrieved context?) and **context relevance** (were the right documents retrieved?). You can watch quality trends over time on a built-in evaluation dashboard.

**In plain English:** upload your PDFs or paste URLs, ask questions in natural language, get answers backed by your own content — and see exactly where each answer came from, including figures and tables.

---

## Features

### For end users
- **Chat with your documents** — ask anything about PDFs or web pages you've uploaded
- **Multimodal PDFs** — embedded images are described by GPT-4o vision and become searchable; tables are extracted as structured markdown
- **Source transparency** — every answer cites the exact chunks it drew from, with inline image rendering for figure sources
- **Streaming responses** — answers stream token-by-token via SSE; sources appear before the first token
- **Persistent sessions** — conversation history is saved per collection
- **Team sharing** — share a collection with a link; control whether recipients can only read (query) or also upload (ingest)

### For technical teams
- **Evaluation pipeline** — automatic faithfulness and context-relevance scoring via LLM-as-judge on every query
- **Evaluation dashboard** — daily trends, average scores, and a "worst queries" view to identify retrieval failures
- **Configurable retrieval** — swap between Similarity, MMR (Maximal Marginal Relevance), and Threshold strategies per collection; tune Top-K and chunk size
- **Async ingestion** — PDF and URL ingestion runs in background workers (Redis/Arq) with batched upserts, retry logic, and partial-success tracking
- **Observability** — structured JSON logs for every query and ingest event, persisted to `query_logs` and `ingest_logs` Supabase tables; includes `time_to_first_token_ms`
- **Signed document URLs** — document access is time-limited and authenticated
- **Idempotent ingestion** — deterministic SHA-256 vector IDs prevent duplicate vectors on re-runs

### Security & access control
- JWT auth via Supabase (email/password; tokens validated against Supabase JWKS)
- Next.js middleware enforces auth at the edge — unauthenticated requests redirect to `/login`
- All API routes require a Bearer token
- Per-collection ownership; `query` vs `ingest` share permissions
- Input validation throughout: file type/size limits, URL scheme enforcement, UUID validation, field length caps

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
│              Next.js 16 · React 19 · Tailwind CSS v4            │
│   Auth middleware (proxy.ts) redirects unauthenticated users    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS (Bearer JWT)
                               │ SSE for streaming responses
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Railway)                      │
│                                                                 │
│   /collections   /ingest   /query   /chat   /evals             │
│                                                                 │
│   ┌─────────────────┐    ┌──────────────────────────────────┐  │
│   │  Auth Middleware │    │          Services                │  │
│   │  PyJWT + JWKS   │    │  rag_service · langchain_service │  │
│   └─────────────────┘    │  eval_service · observability    │  │
│                           └──────────────────────────────────┘  │
│                                    │                            │
│   ┌─────────────────────┐          │  Background Jobs           │
│   │  Arq Job Queue      │◄─────────┘  (ingest_job.py)          │
│   │  (Redis)            │             Batched upserts           │
│   └─────────────────────┘             Tenacity retries          │
└──────┬──────────────┬───────────────────┬───────────────────────┘
       │              │                   │
       ▼              ▼                   ▼
  Supabase        Pinecone            OpenAI
  Auth + PG +   Vector Index        GPT-4o (LLM + Vision)
  Storage       (per-collection      text-embedding
  (images +     namespacing;         -3-small
  documents)    chunk_type +
                image_url metadata)
```

### Data flow for a query

```
User question
     │
     ▼
Embed question ──► Pinecone similarity/MMR/threshold search ──► Top-K chunks
                                                                      │
                                              (image chunks labeled   │
                                               [Figure/Image]: in     │
                                               context string)        │
                                                                      ▼
                                                            LLM (GPT-4o)
                                                           with retrieved context
                                                                      │
                                         ┌────────────────────────────┘
                                         │
                               SSE stream: metadata → tokens → done
                                         │
                                         ├──► Stored in Supabase (chat session)
                                         ├──► query_logs table (latency, tokens)
                                         └──► Scored async (faithfulness + relevance)
                                                       │
                                                       └──► Eval dashboard
```

### Data flow for PDF ingestion

```
PDF upload / URL
     │
     ▼
Arq background job
     │
     ├── Native PDF?
     │       ├── Extract tables → GFM markdown chunks
     │       ├── Extract body text (excluding table regions)
     │       └── Extract images → GPT-4o vision description
     │                               └── Upload to Supabase Storage (images bucket)
     │
     └── Scanned PDF (< 50 chars/page avg)?
             └── Render each page at 150 DPI → GPT-4o vision description
     │
     ▼
Chunk text (RecursiveCharacterTextSplitter)
     │
     ▼
Embed in batches of 100 (text-embedding-3-small, 1024-dim)
     │
     ▼
Upsert to Pinecone (deterministic SHA-256 vector IDs; chunk_type + image_url metadata)
     │
     ▼
Persist chunk→vector mapping to document_chunks table
     │
     ▼
Log to ingest_logs table
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS v4 |
| Backend | FastAPI, Python 3.13, Uvicorn |
| Auth | Supabase (JWT, JWKS validation); Next.js middleware for edge auth |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage (images bucket for extracted PDF figures) |
| Vector store | Pinecone (chunk_type + image_url metadata on every vector) |
| LLM | OpenAI GPT-4o |
| Vision | OpenAI GPT-4o (image description, scanned-PDF OCR) |
| Embeddings | OpenAI text-embedding-3-small (1024-dim) |
| RAG framework | LangChain |
| Document parsing | PyMuPDF (PDF text + tables + images), BeautifulSoup4 (web) |
| Background jobs | Arq + Redis (batched upserts, tenacity retries) |
| Observability | Structured JSON logging → query_logs / ingest_logs Supabase tables |
| Deployment | Railway (backend), Vercel (frontend) |

---

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 20+ and [Bun](https://bun.sh)
- A running Redis instance
- Accounts with: [Supabase](https://supabase.com), [Pinecone](https://pinecone.io), [OpenAI](https://platform.openai.com)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/crtx.git
cd crtx
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SECRET_KEY=<service role key>
SUPABASE_JWKS_URL=https://<your-project>.supabase.co/auth/v1/.well-known/jwks.json

# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone
PINECONE_API_KEY=...
PINECONE_INDEX=crtx-documents

# Retrieval defaults (optional — these are the defaults)
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1024
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5

# Vision / multimodal
VISION_MODEL=gpt-4o
MIN_IMAGE_BYTES=5000

# Redis
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

Start the API server and background worker:

```bash
# Terminal 1 — API
uvicorn app.main:app --reload --port 8000

# Terminal 2 — background worker
arq app.worker.WorkerSettings
```

### 3. Frontend setup

```bash
cd frontend
bun install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Supabase Storage

Create a public bucket named `images` in your Supabase project. The ingestion pipeline uploads extracted PDF figures there and stores public URLs in Pinecone metadata.

---

## API Reference

All endpoints require `Authorization: Bearer <token>` unless noted.

<details>
<summary><strong>Collections</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/collections/` | Create a new collection |
| `GET` | `/collections/` | List owned + shared collections |
| `DELETE` | `/collections/{id}` | Delete a collection (owner only) |
| `GET` | `/collections/{id}/config` | Get retrieval pipeline config |
| `PUT` | `/collections/{id}/config` | Update retrieval strategy / chunk size |
| `GET` | `/collections/{id}/documents` | List documents with signed URLs |
| `DELETE` | `/collections/{id}/documents/{doc_id}` | Delete a document |
| `POST` | `/collections/{id}/shares` | Generate a share token |
| `GET` | `/collections/{id}/shares` | List shares and current members |
| `DELETE` | `/collections/{id}/shares/{share_id}` | Revoke a share link |
| `DELETE` | `/collections/{id}/members/{member_id}` | Remove a member |
| `POST` | `/collections/join/{token}` | Accept a share invitation |

</details>

<details>
<summary><strong>Ingestion</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ingest/` | Upload a PDF (multipart, max 50 MB) |
| `POST` | `/ingest/url` | Ingest from a public HTTP/HTTPS URL |
| `GET` | `/ingest/jobs/{job_id}` | Poll background job status (`queued` / `processing` / `succeeded` / `partial` / `failed`) |

</details>

<details>
<summary><strong>Query & Chat</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/query/` | RAG query — returns answer + source chunks (with `chunk_type` and `image_url`) |
| `POST` | `/chat/{collection_id}/sessions` | Start a new chat session |
| `GET` | `/chat/{collection_id}/sessions` | List sessions |
| `GET` | `/chat/{collection_id}/sessions/{session_id}` | Get session message history |
| `PATCH` | `/chat/{collection_id}/sessions/{session_id}` | Rename a session |
| `DELETE` | `/chat/{collection_id}/sessions/{session_id}` | Delete a session |
| `POST` | `/chat/{collection_id}/sessions/{session_id}/share` | Share session with a member |
| `GET` | `/chat/{collection_id}/members` | List members (for session sharing) |

Chat responses stream via SSE with four event types:
- `event: metadata` — sources + retrieval latency, sent before the first token
- `event: token` — one chunk per LLM output token
- `event: done` — generation latency + time-to-first-token
- `event: error` — emitted if generation fails mid-stream

</details>

<details>
<summary><strong>Evaluations</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/evals/{collection_id}/stats` | Daily trends, averages, worst queries |
| `GET` | `/evals/{collection_id}` | Paginated eval records |

</details>

---

## Key Design Decisions

**Why multimodal PDF extraction?**
PDFs in the wild contain charts, diagrams, and tables that carry most of the signal but are invisible to text-only extractors. The pipeline runs three passes: table extraction (serialized to GFM markdown so structure is preserved), body text (excluding table regions to avoid duplication), and image description via GPT-4o vision. Scanned PDFs — detected by a chars-per-page heuristic — fall back to page-level vision rendering at 150 DPI.

**Why deterministic vector IDs?**
Vector IDs are SHA-256 hashes of `(collection_id, source, chunk_index)`. Re-running an ingestion job on the same document upserts identical IDs, so Pinecone deduplicates naturally with no manual cleanup step.

**Why LLM-as-judge for evals?**
Automated evaluation without ground-truth labels. Every query produces a faithfulness score (is the answer supported by the retrieved context?) and a relevance score (did we retrieve the right chunks?). This surfaces retrieval failures fast without needing human annotation.

**Why MMR for retrieval?**
Maximal Marginal Relevance trades off similarity for diversity — it avoids returning five nearly-identical chunks when a document has repeated boilerplate. This matters for legal and technical docs.

**Why Arq/Redis for ingestion jobs?**
PDF parsing, vision inference, and batch embedding can take tens of seconds on large files. Running it asynchronously keeps the API responsive and lets users see real-time progress (`chunks_processed` / `chunks_total`) via polling. Tenacity retries handle transient OpenAI rate limits and Pinecone 5xx errors without failing the whole job.

**Why SSE for streaming?**
SSE is unidirectional and works natively over HTTP without websocket upgrade overhead. The `metadata` event fires before the first token so the frontend can render source citations immediately while the answer streams in.

**Why Supabase service key on the backend?**
Row Level Security is bypassed so the backend can enforce its own access logic (`_assert_owner` / `_has_access`). This keeps access control in one place rather than split between Postgres policies and application code.

---

## Project Structure

```
crtx/
├── backend/
│   ├── app/
│   │   ├── main.py              # App entry point, CORS, router wiring
│   │   ├── auth.py              # JWT validation (PyJWT + JWKS)
│   │   ├── config.py            # Environment config (incl. VISION_MODEL, MIN_IMAGE_BYTES)
│   │   ├── worker.py            # Arq worker settings
│   │   ├── observability.py     # Structured JSON logging → query_logs / ingest_logs
│   │   ├── routers/
│   │   │   ├── chat.py          # SSE streaming + session management
│   │   │   ├── collections.py
│   │   │   ├── evals.py
│   │   │   ├── ingest.py
│   │   │   └── query.py
│   │   ├── services/
│   │   │   ├── langchain_service.py  # LangChain RAG chain; MMR; SSE streaming
│   │   │   ├── rag_service.py        # Multimodal PDF extraction (text/tables/images/scanned)
│   │   │   └── eval_service.py       # Faithfulness + relevance scoring
│   │   ├── jobs/
│   │   │   └── ingest_job.py         # Batched embed+upsert; tenacity retries; document_chunks
│   │   └── db/
│   │       └── vector_store.py       # Pinecone client
│   ├── requirements.txt
│   ├── runtime.txt              # python-3.13
│   └── Procfile                 # Railway / Heroku process definition
│
└── frontend/
    └── app/
        ├── page.tsx                  # Root (auth gate → landing or app)
        ├── layout.tsx
        ├── api.ts                    # Typed API client (SSE + REST)
        ├── proxy.ts                  # Next.js middleware — edge auth redirect
        ├── lib/
        │   └── supabase.ts           # Supabase browser client
        ├── context/
        │   ├── auth.tsx              # AuthContext (signIn/signUp/signOut/getToken)
        │   ├── collections.tsx       # CollectionsContext
        │   └── tab.tsx              # Tab state context
        ├── components/
        │   ├── ChatInterface.tsx     # SSE streaming chat UI
        │   ├── SourceCard.tsx        # Expandable source with IMG badge + inline image
        │   ├── UploadZone.tsx
        │   ├── DocumentList.tsx
        │   ├── EvalDashboard.tsx
        │   ├── PipelineConfig.tsx
        │   ├── NavBar.tsx
        │   ├── ConfirmModal.tsx
        │   └── ShareChatModal.tsx
        ├── landing/                  # Public landing page (Hero/Features/HowItWorks/CTA)
        ├── collections/              # /collections page
        ├── login/                    # /login page
        └── join/[token]/             # Share link acceptance
```

---

## Roadmap

- [ ] Loom walkthrough video
- [ ] Docker Compose for one-command local setup
- [x] Streaming responses (SSE)
- [x] Multi-modal support (images and tables in PDFs)
- [ ] Re-ranking layer (Cohere / cross-encoder)
- [ ] SAML / SSO for enterprise teams
- [ ] Webhook notifications on ingestion completion

---

## License

MIT
