# 🔐 CertChain — Mini Project Documentation

**Project Title:** Online Blockchain-based Certificate Generation and Validation System for Government Organizations  
**SDG Alignment:** SDG 9 (Industry, Innovation & Infrastructure) | SDG 16 (Peace, Justice & Strong Institutions)  
**Technology:** Blockchain (Ethereum) · AI/ML (Python) · Next.js · Supabase · Vercel  
**Team:** 3 members | **Budget:** ₹0 | **Timeline:** 3 months

---

## 📁 Document Index

| # | File | Description |
|---|------|-------------|
| 1 | [01_project_concept.md](./01_project_concept.md) | Problem statement, solution overview, user journeys, scope |
| 2 | [02_tech_stack.md](./02_tech_stack.md) | 100% free tier stack — Supabase, Vercel, Alchemy, HuggingFace |
| 3 | [03_abstract_presentation.md](./03_abstract_presentation.md) | IEEE abstract + 12-slide presentation guide + demo script |
| 4 | [04_literature_review.md](./04_literature_review.md) | 18 peer-reviewed papers reviewed, gap analysis |
| 5 | [05_architecture_design.md](./05_architecture_design.md) | System architecture, flows, smart contract, DB schema |
| 6 | [06_expected_outputs.md](./06_expected_outputs.md) | Deliverables, acceptance criteria, demo script, folder structure |
| 7 | [07_gantt_chart.md](./07_gantt_chart.md) | 12-week Gantt chart, week-by-week tasks per member |
| 8 | [08_research_paper_draft.md](./08_research_paper_draft.md) | Full IEEE-format research paper draft |

---

## 🚀 What CertChain Does

> A web application where government officials issue digital certificates anchored on the Ethereum blockchain. Anyone can verify them in under 3 seconds by scanning a QR code. An AI module flags fraudulent certificates before they are issued.

### Three Portals
| Portal | Who Uses It | URL |
|--------|------------|-----|
| **Issuer Portal** | Government officer | `/issuer` (login-protected) |
| **Verifier Portal** | Employer / anyone | `/verify` (public, no login) |
| **Admin Panel** | Admin | `/admin` (admin-only) |

---

## 💻 Tech Stack (100% Free, ₹0)

| Layer | Tool | Free Tier |
|-------|------|-----------|
| Frontend + API | **Next.js** on **Vercel** | Free forever |
| Database + Auth | **Supabase** | 500MB DB, 1GB storage, unlimited auth |
| Blockchain | **Ethereum Sepolia** via **Alchemy** | Free testnet |
| Smart Contracts | **Hardhat** + **Solidity** | Free |
| AI Service | **Python Flask** on **HuggingFace Spaces** | Free, no sleep |
| Email | **Resend** | 3,000/month free |
| IPFS (optional) | **web3.storage** | 5GB free |

**Total monthly cost: ₹0**

---

## 📅 3-Month Timeline (12 Weeks)

| Month | Focus | Key Output |
|-------|-------|-----------|
| **Month 1** | Setup + Smart Contract | Contract on Sepolia, Supabase auth, project skeleton live |
| **Month 2** | Build Everything | Full issuance, verification, AI, all three portals working |
| **Month 3** | Test + Polish + Submit | Tests, research paper, slides, demo video, submission |

---

## 👥 Team Split (3 Members)

| Member | Role | Main Work |
|--------|------|-----------|
| 1 | **Blockchain + API** | Solidity, Hardhat, Ethers.js, Next.js API routes |
| 2 | **Frontend + UI** | React pages, Supabase Auth, Tailwind UI |
| 3 | **AI + Research** | Python, Flask, OCR, ELA, research paper, slides |

---

## 🗂️ Accounts to Create (All Free, No Card)

- [ ] [supabase.com](https://supabase.com) — database + auth + storage
- [ ] [vercel.com](https://vercel.com) — frontend + API hosting
- [ ] [alchemy.com](https://alchemy.com) — Ethereum RPC + faucet
- [ ] [huggingface.co](https://huggingface.co) — AI service hosting
- [ ] [resend.com](https://resend.com) — email service
- [ ] [web3.storage](https://web3.storage) — IPFS (optional)

---

## 📌 SDG Alignment

- **SDG 9** — Builds digital infrastructure, replaces expensive manual verification
- **SDG 16** — Eliminates corruption in credential-based government services via blockchain transparency
