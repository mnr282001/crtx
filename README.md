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
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o_mini-412991?logo=openai&logoColor=white)](https://openai.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

<br />

<!-- VIDEO PLACEHOLDER — remove this comment and paste your Loom embed below when ready -->
<!-- [![Watch the demo](https://cdn.loom.com/sessions/thumbnails/YOUR_ID-with-play.gif)](https://www.loom.com/share/YOUR_ID) -->

</div>

---

## What is CRTX?

CRTX is a **multi-user Retrieval-Augmented Generation (RAG) platform** built for teams that need to query their own documents with AI — and actually trust the answers.

Most AI chat tools are black boxes. CRTX is different: every response comes with **cited sources**, and every interaction is scored for **faithfulness** (did the answer match the retrieved context?) and **context relevance** (were the right documents retrieved?). You can watch quality trends over time on a built-in evaluation dashboard.

**In plain English:** upload your PDFs or paste URLs, ask questions in natural language, get answers backed by your own content — and see exactly where each answer came from.

---

## Features

### For end users
- **Chat with your documents** — ask anything about PDFs or web pages you've uploaded
- **Source transparency** — every answer cites the exact chunks it drew from
- **Persistent sessions** — conversation history is saved per collection
- **Team sharing** — share a collection with a link; control whether recipients can only read (query) or also upload (ingest)

### For technical teams
- **Evaluation pipeline** — automatic faithfulness and context-relevance scoring via LLM-as-judge on every query
- **Evaluation dashboard** — daily trends, average scores, and a "worst queries" view to identify retrieval failures
- **Configurable retrieval** — swap between Similarity, MMR (Maximal Marginal Relevance), and Threshold strategies per collection; tune Top-K and chunk size
- **Async ingestion** — PDF and URL ingestion runs in background workers (Redis/Arq), so large documents don't block the UI
- **Signed document URLs** — document access is time-limited and authenticated

### Security & access control
- JWT auth via Supabase (email/password; tokens validated against Supabase JWKS)
- All API routes require a Bearer token
- Per-collection ownership; `query` vs `ingest` share permissions
- Input validation throughout: file type/size limits, URL scheme enforcement, UUID validation, field length caps

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
│              Next.js 16 · React 19 · Tailwind CSS v4            │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS (Bearer JWT)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend                          │
│                                                                 │
│   /collections   /ingest   /query   /chat   /evals             │
│                                                                 │
│   ┌─────────────────┐    ┌──────────────────────────────────┐  │
│   │  Auth Middleware │    │          Services                │  │
│   │  PyJWT + JWKS   │    │  rag_service · langchain_service │  │
│   └─────────────────┘    │  eval_service                    │  │
│                           └──────────────────────────────────┘  │
│                                    │                            │
│   ┌─────────────────────┐          │  Background Jobs           │
│   │  Arq Job Queue      │◄─────────┘  (ingest_job.py)          │
│   │  (Redis)            │                                       │
│   └─────────────────────┘                                       │
└──────┬──────────────┬───────────────────┬───────────────────────┘
       │              │                   │
       ▼              ▼                   ▼
  Supabase        Pinecone            OpenAI
  Auth + PG    Vector Index        GPT-4o-mini
  (RLS off;    (per-collection      text-embedding
  service key)  namespacing)        -3-small
```

### Data flow for a query

```
User question
     │
     ▼
Embed question ──► Pinecone similarity search ──► Top-K chunks
                                                        │
                                                        ▼
                                              LLM (GPT-4o-mini)
                                             with retrieved context
                                                        │
                              ┌─────────────────────────┘
                              │
                    Answer + source citations
                              │
                              ├──► Stored in Supabase (chat session)
                              └──► Scored async (faithfulness + relevance)
                                            │
                                            └──► Eval dashboard
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS v4 |
| Backend | FastAPI, Python 3.13, Uvicorn |
| Auth | Supabase (JWT, JWKS validation) |
| Database | Supabase PostgreSQL |
| Vector store | Pinecone |
| LLM | OpenAI GPT-4o-mini |
| Embeddings | OpenAI text-embedding-3-small (1024-dim) |
| RAG framework | LangChain |
| Document parsing | PyMuPDF (PDF), BeautifulSoup4 (web) |
| Background jobs | Arq + Redis |
| Monitoring | Sentry |
| Deployment | Heroku (backend), Vercel (frontend) |

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
SUPABASE_PUBLISHABLE_KEY=<anon key>
SUPABASE_SECRET_KEY=<service role key>
SUPABASE_JWKS_URL=https://<your-project>.supabase.co/auth/v1/.well-known/jwks.json

# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone
PINECONE_API_KEY=...
PINECONE_INDEX=crtx-documents

# Retrieval defaults (optional — these are the defaults)
EMBEDDING_DIMENSIONS=1024
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5

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
| `GET` | `/ingest/jobs/{job_id}` | Poll background job status |

</details>

<details>
<summary><strong>Query & Chat</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/query/` | RAG query — returns answer + source chunks |
| `POST` | `/chat/{collection_id}/sessions` | Start a new chat session |
| `GET` | `/chat/{collection_id}/sessions` | List sessions |
| `GET` | `/chat/{collection_id}/sessions/{session_id}` | Get session message history |
| `PATCH` | `/chat/{collection_id}/sessions/{session_id}` | Rename a session |
| `DELETE` | `/chat/{collection_id}/sessions/{session_id}` | Delete a session |
| `POST` | `/chat/{collection_id}/sessions/{session_id}/share` | Share session with a member |
| `GET` | `/chat/{collection_id}/members` | List members (for session sharing) |

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

**Why LLM-as-judge for evals?**
Automated evaluation without ground-truth labels. Every query produces a faithfulness score (is the answer supported by the retrieved context?) and a relevance score (did we retrieve the right chunks?). This surfaces retrieval failures fast without needing human annotation.

**Why MMR for retrieval?**
Maximal Marginal Relevance trades off similarity for diversity — it avoids returning five nearly-identical chunks when a document has repeated boilerplate. This matters for legal and technical docs.

**Why Arq/Redis for ingestion jobs?**
PDF parsing and chunking can take seconds on large files. Running it asynchronously keeps the API responsive and lets users see real-time job progress via polling.

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
│   │   ├── config.py            # Environment config
│   │   ├── worker.py            # Arq worker settings
│   │   ├── routers/
│   │   │   ├── chat.py
│   │   │   ├── collections.py
│   │   │   ├── evals.py
│   │   │   ├── ingest.py
│   │   │   └── query.py
│   │   ├── services/
│   │   │   ├── langchain_service.py  # LangChain RAG chain
│   │   │   ├── rag_service.py        # Embedding + chunking
│   │   │   └── eval_service.py       # Faithfulness + relevance scoring
│   │   ├── jobs/
│   │   │   └── ingest_job.py         # Background PDF/URL ingestion
│   │   └── db/
│   │       └── vector_store.py       # Pinecone client
│   ├── requirements.txt
│   └── Procfile
│
└── frontend/
    └── app/
        ├── page.tsx                  # Root (auth gate → landing or app)
        ├── layout.tsx
        ├── api.ts                    # Typed API client
        ├── components/
        │   ├── ChatInterface.tsx
        │   ├── UploadZone.tsx
        │   ├── DocumentList.tsx
        │   ├── EvalDashboard.tsx
        │   ├── PipelineConfig.tsx
        │   └── ShareChatModal.tsx
        ├── collections/              # /collections page
        ├── login/                    # /login page
        └── join/[token]/             # Share link acceptance
```

---

## Roadmap

- [ ] Loom walkthrough video
- [ ] Docker Compose for one-command local setup
- [x] Streaming responses (SSE)
- [ ] Re-ranking layer (Cohere / cross-encoder)
- [ ] Multi-modal support (images in PDFs)
- [ ] SAML / SSO for enterprise teams
- [ ] Webhook notifications on ingestion completion

---

## License

MIT
