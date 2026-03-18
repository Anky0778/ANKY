#PROTOYPE
# ANKY — Autonomous Neural Knowledge Yard

> Reduce incident resolution time from hours to minutes using semantic search, RAG pipelines, and AI-assisted root cause analysis.

---

## What is ANKY?

ANKY is an incident intelligence platform that learns from your team's historical incidents and SOPs. When a new incident arrives, ANKY instantly retrieves the most similar past incidents and resolution notes, and generates AI-assisted suggestions so your team spends minutes resolving, not hours searching.

**The problem it solves:**
- L1/L2 support engineers waste hours searching through old tickets for similar incidents
- Knowledge is siloed when experienced engineers leave, resolution patterns go with them
- Enterprise tools like ServiceNow AI cost $5k–20k/year, out of reach for most teams

---

## Live Demo

🌐 [anky-p8od.vercel.app](https://anky-p8od.vercel.app)

---

## Key Features

- **Multi-workspace support** — create isolated intelligence environments per project or client
- **Document ingestion** — upload SOPs, runbooks, and knowledge base PDFs
- **Incident upload** — bulk upload historical incidents via CSV/Excel
- **Intelligence training** — builds a FAISS vector index from all ingested data using semantic embeddings
- **AI Chat** — describe a new incident, get instant similar incident matches + resolution suggestions
- **Analytics** — track incident trends, resolution patterns, and AI usage
- **Real-time training progress** — live SSE-based pipeline visualization during training

---

## Architecture

```
Frontend (Next.js 14)
        │
        ▼
Backend API (FastAPI)
        │
   ┌────┴─────┐
   │          │
Supabase   Intelligence Pipeline
(Postgres    │
 + Storage)  ├── Text Extraction (PDFs)
             ├── Chunking
             ├── Embeddings (HuggingFace)
             ├── FAISS Vector Index
             └── RAG Retrieval + Gemini 2.5 Flash
```

**Full stack:**
| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.14 |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Vector Index | FAISS (Facebook AI Similarity Search) |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` via Inference API |
| LLM | Google Gemini 2.5 Flash |
| Deployment | Render (backend) + Vercel (frontend) |

---

## How It Works

### 1. Ingest
Upload your historical incident CSV and SOP PDFs into a workspace. ANKY parses, cleans, and normalizes everything.

### 2. Train
Click "Start Training." ANKY:
- Extracts text from all documents
- Chunks content into semantic units
- Generates vector embeddings for every chunk
- Builds a FAISS index stored in Supabase Storage

### 3. Chat
Describe a new incident in natural language. ANKY:
- Embeds your query
- Runs FAISS similarity search across 600+ historical incidents + SOPs
- Feeds the top matches into Gemini as context
- Returns root cause analysis and resolution suggestions

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase account (free tier works)
- Google Gemini API key (free tier)
- HuggingFace API key (free tier)

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
HF_API_KEY=your_huggingface_api_key
SECRET_KEY=your_jwt_secret
```

```bash
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in `/frontend`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

### Supabase Setup

Create the following buckets in Supabase Storage:
- `documents` — for uploaded PDFs and incident parquet files
- `faiss-indexes` — for trained FAISS index files

Run the SQL schema (found in `/backend/schema.sql` if included) or let FastAPI auto-create tables on first run.

---

## Incident CSV Format

Your historical incident file must have these columns:

| Column | Description |
|---|---|
| `Number` | Incident ID (e.g. INC12091626) |
| `Description` | Short title of the incident |
| `Long Description` | Full incident details |
| `RootCause` | What caused the incident |
| `Resolution Notes` | How it was resolved |

Supported formats: `.csv`, (UTF-8 encoding recommended)

---

## Project Structure

```
incident-intelligence/
├── backend/
│   └── app/
│       ├── api/              # FastAPI route handlers
│       ├── core/             # DB, config, security
│       ├── intelligence/     # RAG pipeline (chunking, embeddings, FAISS, retriever)
│       ├── models/           # SQLAlchemy models
│       ├── schemas/          # Pydantic schemas
│       ├── services/         # Business logic
│       └── utils/            # Auth, file parsing helpers
├── frontend/
│   └── app/
│       ├── dashboard/        # Workspace management
│       ├── projects/
│       │   └── [projectId]/
│       │       ├── chat/     # AI chat interface
│       │       ├── documents/
│       │       ├── incidents/
│       │       ├── training/ # Live training pipeline UI
│       │       └── analytics/
│       └── services/         # API client functions
```

---

## Challenges & Learnings

Building this taught me a lot about real-world RAG pipelines:

- **Embedding model deprecations** — `text-embedding-004` was deprecated mid-development, had to migrate to HuggingFace inference API to stay within free tier memory limits on Render (512MB)
- **FAISS dimension mismatches** — switching embedding models breaks existing indexes; learned to always clear and rebuild
- **Render free tier filesystem** — ephemeral filesystem caused file not found errors; fixed by switching to in-memory `BytesIO` processing
- **SSE streaming** — implemented real-time training progress using Server Sent Events so users see live pipeline status instead of a spinner
- **Column normalization** — real world incident exports have inconsistent headers; built a robust normalizer that handles casing, spaces, and common aliases

---

## Roadmap

- ServiceNow / Jira integration for automatic incident sync
- Slack bot integration — ask ANKY directly from Slack
- Multi-language support (currently translates to English before embedding)
- Role-based access control (admin / analyst / viewer)
- Webhook support for real-time incident ingestion
- Self-hosted deployment guide (Docker Compose)

---

## Author

**Aniket Kumar Ojha** — built while working full-time and finishing college.

Connect on [[LinkedIn](#) ](https://www.linkedin.com/in/aniket-ojha-ab52222ab/)

---

## License

MIT License — free to use only.
```
