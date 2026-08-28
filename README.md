# CertChain 🔐

**Blockchain-based Government Certificate Generation and Validation System**

> Issue tamper-proof certificates on Ethereum. Verify any certificate in < 3 seconds by scanning a QR code. AI-validated before issuance. Built with Next.js + Supabase + Ethereum Sepolia.

[![SDG 9](https://img.shields.io/badge/SDG-9-orange)](https://sdgs.un.org/goals/goal9)
[![SDG 16](https://img.shields.io/badge/SDG-16-blue)](https://sdgs.un.org/goals/goal16)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🗂️ Project Structure

```
certchain/          ← Next.js app (frontend + API)
blockchain/         ← Hardhat smart contracts
ai-service/         ← Python Flask fraud detection (HuggingFace)
docs/               ← All project documentation
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js v20+
- Python 3.11+ (for AI service)
- Git

### 2. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/certchain.git
cd certchain/certchain
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
# Edit .env.local and fill in all values (see .env.example for instructions)
```

**Required accounts (all free, no credit card):**
| Service | URL | What you get |
|---------|-----|-------------|
| Supabase | [supabase.com](https://supabase.com) | DB + Auth + Storage |
| Alchemy | [alchemy.com](https://alchemy.com) | Ethereum RPC + faucet |
| Resend | [resend.com](https://resend.com) | Email service |
| HuggingFace | [huggingface.co](https://huggingface.co) | AI service hosting |

### 4. Set up Supabase database

1. Create a new Supabase project
2. Go to SQL Editor → New Query
3. Paste and run the contents of `certchain/supabase/schema.sql`
4. Go to Storage → Create bucket named `certificates` (public)

### 5. Deploy the smart contract

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat test        # All 10 tests should pass
npx hardhat run scripts/deploy.ts --network sepolia
# Copy the deployed contract address → paste into .env.local as CONTRACT_ADDRESS
```

Get free Sepolia ETH: [sepoliafaucet.com](https://sepoliafaucet.com)

### 6. Run locally

```bash
cd certchain
npm run dev
# Open http://localhost:3000
```

### 7. Deploy AI service (HuggingFace Spaces)

```bash
# Create a new Space at huggingface.co
# Upload the ai-service/ folder
# Set Space SDK to "Docker" or "Gradio"
# Note your Space URL → paste into .env.local as AI_SERVICE_URL
cd ai-service
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py   # Test locally on http://localhost:7860
```

### 8. Deploy to Vercel

```bash
# Push to GitHub, then import repo in vercel.com
# Add all .env.local variables to Vercel project settings
# Auto-deploys on every git push
```

---

## 🏛️ Three Portals

| Portal | URL | Who uses it |
|--------|-----|------------|
| **Landing** | `/` | Everyone |
| **Issuer Portal** | `/issuer` | Government officers (login required) |
| **Issue Certificate** | `/issuer/issue` | Officers (3-step: form → AI → blockchain) |
| **Admin Panel** | `/admin` | Admin role only |
| **Verifier** | `/verify` | Anyone — no login needed |

---

## 🔑 Creating Users

Users cannot self-register (government system). Create users via Supabase Dashboard:

1. Go to Supabase → Authentication → Users → Invite user
2. After creation, set their role in the SQL editor:

```sql
-- For admin:
update auth.users
set raw_user_meta_data = '{"role": "admin"}'
where email = 'admin@certchain.gov';

-- For issuer:
update auth.users
set raw_user_meta_data = '{"role": "issuer"}'
where email = 'officer@certchain.gov';
```

---

## 🧪 Running Tests

```bash
# Smart contract tests
cd blockchain
npx hardhat test

# Frontend (if you add tests)
cd certchain
npm test
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `certchain/app/page.tsx` | Landing page |
| `certchain/app/verify/page.tsx` | Public verifier portal |
| `certchain/app/issuer/page.tsx` | Issuer dashboard |
| `certchain/app/issuer/issue/page.tsx` | Certificate issuance form |
| `certchain/app/admin/page.tsx` | Admin panel with revoke |
| `certchain/app/api/certificates/route.ts` | Issue + list certificates API |
| `certchain/app/api/verify/route.ts` | Public verification API |
| `certchain/lib/blockchain.ts` | Ethers.js smart contract calls |
| `certchain/supabase/schema.sql` | Complete database schema |
| `blockchain/contracts/CertificateRegistry.sol` | Smart contract |
| `ai-service/app.py` | AI fraud detection service |

---

## 📚 Documentation

All project documents are in the `/docs` folder:
- [Project Concept](docs/01_project_concept.md)
- [Tech Stack](docs/02_tech_stack.md)
- [Architecture Design](docs/05_architecture_design.md)
- [Research Paper](docs/08_research_paper_draft.md)

---

## 🌍 SDG Alignment

| Goal | How CertChain contributes |
|------|--------------------------|
| **SDG 9** — Industry, Innovation & Infrastructure | Replaces expensive manual verification with free, instant blockchain verification |
| **SDG 16** — Peace, Justice & Strong Institutions | Immutable audit trail eliminates corruption in credential-based government services |

---

## 🏗️ Tech Stack (100% Free)

- **Frontend + API:** Next.js 14 on Vercel
- **Database + Auth + Storage:** Supabase
- **Blockchain:** Ethereum Sepolia Testnet via Alchemy
- **Smart Contracts:** Solidity + Hardhat + OpenZeppelin
- **AI Service:** Python Flask on HuggingFace Spaces
- **Email:** Resend
- **Total Cost: ₹0**
