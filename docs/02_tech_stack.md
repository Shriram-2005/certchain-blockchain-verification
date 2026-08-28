# 02 — Technology Stack (Free Tier Edition)

**Project:** CertChain — Blockchain Certificate System  
**Team:** 3 members | **Budget:** ₹0 | **Timeline:** 3 months  
**Constraint:** 100% free — no credit card, no paid plans

---

## ✅ The Golden Rule

> Every single tool in this stack has a **permanently free tier** that is enough to build, demo, and submit this mini project without ever entering card details.

---

## Architecture — Built Around What You Know

Since you're already comfortable with **Supabase** and **Vercel**, the entire architecture is designed around them. No context-switching to unfamiliar platforms.

```
┌────────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend + API)                     │
│                                                                  │
│   Next.js App                                                    │
│   ├── /pages         → Issuer Portal, Verifier, Admin          │
│   └── /pages/api     → Backend API routes (no separate server) │
└─────────────────────────────┬──────────────────────────────────┘
                              │
          ┌───────────────────┼────────────────────┐
          │                   │                    │
┌─────────▼──────┐  ┌────────▼────────┐  ┌────────▼──────────┐
│   SUPABASE     │  │  ETHEREUM       │  │  HUGGING FACE     │
│                │  │  SEPOLIA        │  │  SPACES           │
│  PostgreSQL DB │  │  (Free Testnet) │  │  (AI Service)     │
│  Auth (JWT)    │  │                 │  │                   │
│  File Storage  │  │  Smart Contract │  │  Python + Flask   │
│  (PDFs)        │  │  (Solidity)     │  │  OCR + ELA + NLP  │
│  Row Level Sec │  │  via Alchemy    │  │  Free GPU/CPU     │
└────────────────┘  └─────────────────┘  └───────────────────┘
```

**Why this is smart for your team:**
- You already know Supabase → no learning curve for DB + Auth
- You already know Vercel → no learning curve for deployment
- Next.js API routes = no separate backend server to manage
- Everything deploys in one `git push`

---

## Complete Free Tier Stack

### 🔷 1. Frontend + Backend — Next.js on Vercel

| What | Tool | Free Tier |
|------|------|-----------|
| Framework | **Next.js 14** (App Router) | Free (open source) |
| Hosting | **Vercel** | Free forever — 100GB bandwidth/month |
| API routes | Next.js `/app/api/` | Runs as Vercel serverless functions |
| Styling | **Tailwind CSS** | Free |
| UI Components | **shadcn/ui** | Free |
| QR Scanner | **html5-qrcode** | Free |
| QR Generator | **qrcode** (npm) | Free |
| Forms | **React Hook Form + Zod** | Free |
| HTTP Client | **fetch** (built-in) or **axios** | Free |

**Why Next.js instead of separate React + Node.js?**  
With a team of 3 and 3 months, combining frontend and backend into one Next.js project means:
- One repo, one deployment
- API routes handle all backend logic (blockchain calls, DB writes, AI calls)
- One `git push` to Vercel deploys everything
- No backend server to manage, pay for, or keep alive

---

### 🔷 2. Database + Auth + File Storage — Supabase

| What | Tool | Free Tier |
|------|------|-----------|
| **Database** | Supabase PostgreSQL | 500MB storage, unlimited rows |
| **Authentication** | Supabase Auth | Unlimited users, email/password + magic link |
| **File Storage** | Supabase Storage | 1GB free (certificate PDFs) |
| **Realtime** | Supabase Realtime | Included free |
| **Row Level Security** | Built-in | Included free |

**Supabase replaces:**
- ~~MongoDB Atlas~~ → Supabase PostgreSQL (you already know this!)
- ~~Custom JWT logic~~ → Supabase Auth (built-in, 5 lines of code)
- ~~Pinata / IPFS~~ → Supabase Storage for PDFs (free 1GB)
- ~~bcrypt + JWT middleware~~ → handled by Supabase automatically

**Tables you need in Supabase:**

```sql
-- Certificates metadata (blockchain data + UI data)
create table certificates (
  id uuid primary key default gen_random_uuid(),
  cert_id text unique not null,         -- e.g., CERT-2025-0001
  holder_name text not null,
  holder_email text not null,
  cert_type text not null,              -- DEGREE, LICENSE, etc.
  institution text not null,
  issued_by uuid references auth.users,
  tx_hash text,                          -- Ethereum transaction hash
  block_number bigint,
  ipfs_cid text,                         -- IPFS content ID (optional)
  storage_path text,                     -- Supabase Storage path for PDF
  cert_hash text not null,               -- SHA-256 of certificate content
  fraud_score integer default 0,
  status text default 'ACTIVE',          -- ACTIVE, REVOKED, EXPIRED
  issued_at timestamptz default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revocation_reason text,
  metadata jsonb                          -- degree, grade, year, etc.
);

-- AI fraud detection logs
create table fraud_logs (
  id uuid primary key default gen_random_uuid(),
  cert_id text,
  fraud_score integer,
  flags text[],
  recommendation text,
  reviewed_by uuid references auth.users,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Audit logs (mirrors on-chain data for fast queries)
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  cert_id text not null,
  action text not null,   -- ISSUED, REVOKED, SUSPENDED
  reason text,
  actor_id uuid references auth.users,
  tx_hash text,
  created_at timestamptz default now()
);
```

---

### 🔷 3. Blockchain — Ethereum Sepolia Testnet

| What | Tool | Free Tier |
|------|------|-----------|
| **Blockchain** | Ethereum **Sepolia Testnet** | Free — testnet ETH from faucets |
| **Dev Framework** | **Hardhat** | Free (open source) |
| **Contract Language** | **Solidity v0.8.x** | Free |
| **RPC Provider** | **Alchemy** (free tier) | 300M compute units/month — more than enough |
| **Web3 Library** | **Ethers.js v6** | Free |
| **Contract Library** | **OpenZeppelin** | Free |
| **Testnet ETH** | Alchemy Sepolia Faucet | Free (0.5 ETH/day per account) |
| **Block Explorer** | **Etherscan Sepolia** | Free |

**Getting Free Sepolia ETH:**
- Alchemy Faucet: https://sepoliafaucet.com — 0.5 ETH/day (enough for hundreds of transactions)
- Infura Faucet: https://www.infura.io/faucet/sepolia — backup option
- Each contract call costs ~0.0001 testnet ETH — 0.5 ETH lasts months

**Alchemy Free Tier:**
- 300M compute units/month
- Each RPC call = 1–25 units
- For this project: ~50,000 calls/month max needed → well within free tier
- Sign up at https://alchemy.com — no credit card required

---

### 🔷 4. AI Fraud Detection — Hugging Face Spaces

| What | Tool | Free Tier |
|------|------|-----------|
| **Hosting** | **Hugging Face Spaces** | Free forever — 2 vCPU, 16GB RAM |
| **Framework** | **Python + Flask** (or Gradio) | Free |
| **OCR** | **Tesseract 5** via pytesseract | Free |
| **Image Analysis** | **OpenCV** (ELA) | Free |
| **NLP** | **spaCy** (en_core_web_sm) | Free |
| **PDF Parsing** | **PyMuPDF (fitz)** | Free |

**Why Hugging Face Spaces?**
- Designed exactly for ML demos — Python apps hosted for free
- 2 vCPU + 16GB RAM on free tier (CPU spaces)
- No sleep/spin-down (unlike Render free tier which sleeps after 15 min)
- Docker support → deploy Flask app directly
- URL format: `https://YOUR-USERNAME-certchain-ai.hf.space`

**Deploying AI Service:**
```bash
# Space structure on Hugging Face
├── app.py          (Flask app)
├── requirements.txt
├── Dockerfile      (optional, for custom setup)
└── data/
    └── known_institutions.json
```

---

### 🔷 5. IPFS Storage — web3.storage (Free, No Limit)

| What | Tool | Free Tier |
|------|------|-----------|
| **IPFS Pinning** | **web3.storage** | Free — 5GB storage, no rate limit |
| **Alternative** | **nft.storage** | Free — unlimited (by Protocol Labs) |

**Note:** For your mini project, Supabase Storage (1GB free) is enough to store certificate PDFs. IPFS is an extra decentralization layer you can add. Both options below work:

**Option A (Simpler):** Store PDFs in Supabase Storage, store file hash on blockchain  
**Option B (More blockchain-aligned):** Upload to IPFS via web3.storage, store CID on blockchain  

Recommendation: **Start with Option A** (Supabase Storage). Add IPFS if time permits.

---

### 🔷 6. Email — Resend

| What | Tool | Free Tier |
|------|------|-----------|
| **Email Service** | **Resend** | 3,000 emails/month free, 100/day |
| **npm package** | `resend` | Free |

```bash
npm install resend
```
```javascript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'CertChain <certificates@yourdomain.com>',
  to: holderEmail,
  subject: 'Your Certificate is Ready',
  html: `<p>Download your certificate: <a href="${pdfUrl}">here</a></p>`
});
```

Sign up at https://resend.com — free, no credit card.  
*Alternative: Nodemailer + Gmail (also free, but requires app password setup)*

---

### 🔷 7. PDF Generation — Built into Next.js API

| What | Tool | Free Tier |
|------|------|-----------|
| **PDF Library** | **PDFKit** or **@react-pdf/renderer** | Free (npm) |
| **QR in PDF** | **qrcode** npm package | Free |

No external service needed — PDFs generated inside the Next.js API route.

---

## Complete Free Tier Cost Table

| Service | What For | Free Limit | Credit Card? |
|---------|---------|-----------|-------------|
| **Vercel** | Frontend + API | 100GB bandwidth, 100hrs serverless | No |
| **Supabase** | DB + Auth + Storage | 500MB DB, 1GB storage, 50K auth users | No |
| **Alchemy** | Ethereum RPC | 300M compute units/month | No |
| **Ethereum Sepolia** | Blockchain testnet | Unlimited testnet transactions | No |
| **Hugging Face Spaces** | AI service hosting | 2 vCPU, 16GB RAM, no sleep | No |
| **web3.storage** | IPFS pinning | 5GB free | No |
| **Resend** | Certificate emails | 3,000/month | No |
| **GitHub** | Code + CI/CD | Unlimited public repos | No |
| **Hardhat** | Smart contract dev | Free (local) | No |
| **shadcn/ui** | UI components | Free | No |
| | | | |
| **TOTAL COST** | | **₹0 / $0** | **Never** |

---

## Project Folder Structure (Monorepo)

```
certchain/
├── app/                        ← Next.js App Router (frontend)
│   ├── (issuer)/
│   │   ├── page.tsx            → Issuer dashboard
│   │   └── issue/page.tsx      → Issue certificate form
│   ├── (admin)/
│   │   └── page.tsx            → Admin panel
│   ├── verify/
│   │   └── page.tsx            → Public verifier (QR scanner)
│   └── api/                    ← Backend (Next.js API routes)
│       ├── auth/               → Handled by Supabase Auth
│       ├── certificates/
│       │   ├── route.ts        → GET list, POST issue
│       │   └── [certId]/
│       │       ├── route.ts    → GET details
│       │       └── revoke/route.ts → PATCH revoke
│       ├── verify/route.ts     → Public verification
│       └── ai/validate/route.ts → Proxy to HuggingFace AI
│
├── blockchain/                 ← Hardhat project (separate folder)
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   ├── scripts/deploy.js
│   ├── test/CertRegistry.test.js
│   └── hardhat.config.js
│
├── lib/                        ← Shared utilities
│   ├── supabase.ts             → Supabase client
│   ├── blockchain.ts           → Ethers.js contract calls
│   ├── pdf.ts                  → PDF generation
│   └── email.ts                → Resend email
│
├── ai-service/                 ← Python Flask (deployed to HuggingFace)
│   ├── app.py
│   ├── ocr.py
│   ├── ela.py
│   ├── nlp_check.py
│   ├── requirements.txt
│   └── known_institutions.json
│
├── docs/                       ← All documentation
│
├── .env.local                  ← All API keys (never commit)
└── package.json
```

---

## Environment Variables (`.env.local`)

```bash
# Supabase (get from supabase.com dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...    # Server-side only

# Ethereum / Alchemy (get from alchemy.com)
ALCHEMY_API_KEY=your_alchemy_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_key
ISSUER_PRIVATE_KEY=0x...                # Sepolia wallet private key
CONTRACT_ADDRESS=0x...                  # Deployed contract address

# Resend Email (get from resend.com)
RESEND_API_KEY=re_...

# Hugging Face AI Service
AI_SERVICE_URL=https://your-space.hf.space

# web3.storage (optional, for IPFS)
WEB3_STORAGE_TOKEN=your_token
```

---

## Setup Guide (Day 1 Checklist)

```bash
# 1. Create Next.js app
npx create-next-app@latest certchain --typescript --tailwind --app
cd certchain

# 2. Install all dependencies
npm install @supabase/supabase-js ethers qrcode html5-qrcode
npm install react-hook-form zod @hookform/resolvers
npm install resend pdfkit @types/pdfkit
npm install recharts

# 3. Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card form input table badge

# 4. Set up Hardhat (in /blockchain folder)
mkdir blockchain && cd blockchain
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
npx hardhat init   # choose TypeScript project

# 5. Set up Supabase
# → Go to supabase.com → New project (free)
# → Copy URL and anon key to .env.local
# → Run the SQL schema in Supabase SQL editor
# → Enable Row Level Security on all tables

# 6. Get free Sepolia ETH
# → alchemy.com → Sign up → Get API key
# → sepoliafaucet.com → Get 0.5 test ETH per day

# 7. Deploy AI service to Hugging Face
# → huggingface.co → New Space → Python SDK
# → Upload ai-service/ folder
```

---

## Team Responsibility Split (3 Members)

| Member | Role | Owns |
|--------|------|------|
| **Member 1** | Blockchain + Backend | Smart contracts (Hardhat), API routes in Next.js, Ethers.js integration |
| **Member 2** | Frontend + UI | All React pages, Supabase Auth integration, Tailwind UI |
| **Member 3** | AI + Documentation | Python AI service (HuggingFace), research paper, presentation slides |

*All 3 share: testing, bug fixes, demo preparation*

---

## Why This Stack Beats the Previous One for Your Situation

| Old Stack | New Stack | Why Better |
|-----------|-----------|-----------|
| Node.js backend (separate server) | Next.js API routes on Vercel | No extra server, you already know Vercel |
| MongoDB Atlas | **Supabase** | You already know it, better free tier, has auth built in |
| Render.com (sleeps after 15 min) | **HuggingFace Spaces** (no sleep) | AI always available for demo |
| Pinata IPFS (100 req/day limit) | **Supabase Storage + web3.storage** | More free storage |
| Custom JWT auth | **Supabase Auth** | Zero code for auth, you know it |
| Separate React + Express repos | **One Next.js monorepo** | One deploy, less complexity for 3-person team |
