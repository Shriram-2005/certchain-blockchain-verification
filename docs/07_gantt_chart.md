# 07 — Project Gantt Chart (3 Months, Team of 3)

**Project:** CertChain — Blockchain Certificate System  
**Duration:** 12 Weeks (3 Months)  
**Team:** 3 members  
**Budget:** ₹0

---

## Team Roles (Fixed)

| Member | Code Name | Owns |
|--------|-----------|------|
| Member 1 | **Blockchain** | Smart contracts + API routes (Next.js) + Ethers.js |
| Member 2 | **Frontend** | All React pages + Supabase Auth + UI |
| Member 3 | **AI + Docs** | Python AI service + research paper + presentation |

---

## Gantt Chart

```mermaid
gantt
    title CertChain — 12-Week Timeline (3 Members, ₹0 Budget)
    dateFormat  YYYY-MM-DD
    axisFormat  Week %W

    section 📋 Month 1 — Core Setup & Blockchain
    Setup accounts: Supabase, Alchemy, HuggingFace, Vercel    :done, s1, 2025-08-04, 2d
    Create Next.js project + Supabase schema + GitHub repo     :done, s2, 2025-08-04, 3d
    Literature review (all 3 read key papers)                  :s3, 2025-08-04, 7d
    Write smart contract (CertificateRegistry.sol)             :s4, 2025-08-07, 8d
    Hardhat unit tests (all functions)                         :s5, 2025-08-13, 5d
    Deploy smart contract to Sepolia testnet                   :s6, 2025-08-18, 2d
    Next.js API route: POST /api/certificates/issue (skeleton) :s7, 2025-08-11, 7d
    Supabase Auth setup (login + role-based access)            :s8, 2025-08-11, 5d
    AI service Flask setup on HuggingFace Space                :s9, 2025-08-11, 5d

    section 🔧 Month 2 — Full Feature Build
    API: Ethers.js call to smart contract from Next.js          :f1, 2025-09-01, 5d
    API: Supabase Storage PDF upload                            :f2, 2025-09-03, 4d
    API: SHA-256 hash computation + on-chain anchoring          :f3, 2025-09-05, 3d
    API: Full issue endpoint (AI → PDF → IPFS → Chain → DB)    :f4, 2025-09-08, 7d
    API: Public verify endpoint (chain lookup + hash check)     :f5, 2025-09-08, 5d
    API: Revoke + audit trail endpoint                          :f6, 2025-09-12, 4d
    Email: Resend integration (send PDF to holder)              :f7, 2025-09-15, 2d
    AI: OCR module (Tesseract)                                  :f8, 2025-09-01, 5d
    AI: ELA module (OpenCV image analysis)                      :f9, 2025-09-06, 6d
    AI: NLP consistency check (spaCy)                           :f10, 2025-09-11, 5d
    AI: Ensemble scoring + /validate endpoint done              :f11, 2025-09-15, 3d
    Frontend: Login page + protected routes                     :f12, 2025-09-01, 4d
    Frontend: Issuer dashboard + certificate list               :f13, 2025-09-04, 6d
    Frontend: Certificate issuance form (AI feedback + submit)  :f14, 2025-09-09, 8d
    Frontend: Verifier portal (QR scanner + result cards)       :f15, 2025-09-15, 6d
    Frontend: Admin panel (revoke, fraud log, stats chart)      :f16, 2025-09-18, 5d

    section ✅ Month 3 — Testing, Polish & Submission
    Smart contract final test suite (edge cases)                :t1, 2025-10-01, 4d
    API endpoint testing (Postman + test dataset)               :t2, 2025-10-03, 4d
    AI module tested on 200 certificate images                  :t3, 2025-10-01, 5d
    Full end-to-end test (issue → verify → revoke → re-verify)  :t4, 2025-10-06, 5d
    UI polish + mobile responsiveness                           :t5, 2025-10-08, 4d
    Bug fixes                                                   :t6, 2025-10-10, 5d
    Research paper writing (all 3 contribute)                   :t7, 2025-10-01, 14d
    Presentation slides (12 slides)                             :t8, 2025-10-13, 4d
    Demo video recording (screen + narration, 5 min)            :t9, 2025-10-17, 3d
    Final project report compilation                            :t10, 2025-10-20, 4d
    SUBMISSION                                                  :milestone, m1, 2025-10-24, 0d
```

---

## Week-by-Week Breakdown

### 🗓️ Month 1 (Weeks 1–4): Setup + Smart Contract + Skeleton

| Week | Member 1 (Blockchain) | Member 2 (Frontend) | Member 3 (AI + Docs) |
|------|----------------------|--------------------|--------------------|
| **W1** | Setup: Alchemy, Hardhat, Sepolia wallet, get testnet ETH | Setup: Next.js project, Supabase project, GitHub repo, Tailwind | Read 6 papers for literature review, begin writing lit review section |
| **W2** | Write `CertificateRegistry.sol` — all 5 functions | Supabase schema (SQL), Row Level Security, Auth configuration | Flask app skeleton on HuggingFace Spaces, test deployment |
| **W3** | Hardhat unit tests (all 9 test cases), fix bugs | Supabase Auth pages: login, logout, protected route middleware | OCR module: Tesseract setup, text extraction from sample certs |
| **W4** | Deploy contract to Sepolia, verify on Etherscan, note contract address. Start Next.js API route skeleton | Issuer dashboard layout (static, no API yet), certificate list table UI | ELA module: OpenCV image analysis, test on edited images |

**End of Month 1 Milestone ✅**
- Smart contract live on Sepolia testnet
- Next.js project deployed on Vercel (even if pages are empty)
- Supabase DB schema ready + Auth working (can login)
- HuggingFace Space live (even with a stub `/validate` returning dummy data)

---

### 🗓️ Month 2 (Weeks 5–8): Build Everything

| Week | Member 1 (Blockchain) | Member 2 (Frontend) | Member 3 (AI + Docs) |
|------|----------------------|--------------------|--------------------|
| **W5** | API route: Ethers.js → call `issueCertificate()` from Next.js. Test with Postman | Connect login page to Supabase Auth — working login/logout with JWT | spaCy NLP: institution name check, date logic validation |
| **W6** | API route: Supabase Storage PDF upload + SHA-256 hash + store CID/hash on-chain in same flow | Certificate issuance form — all fields, Zod validation, AI feedback section | Ensemble scoring engine — combine OCR + ELA + NLP into single fraud score. Test accuracy |
| **W7** | API route: full issue endpoint end-to-end (AI → PDF → Storage → blockchain → DB → email). Debug until it works reliably | Wire issuance form to API — full submission flow working in browser. MetaMask signing or server-side signing | Flask `/validate` endpoint fully implemented. Deploy final version to HuggingFace |
| **W8** | API routes: verify (public), revoke, audit trail. Resend email integration | Verifier portal — QR scanner (html5-qrcode), manual ID entry, result display (VALID/REVOKED/INVALID cards). Admin panel — revoke UI, fraud log table | Begin research paper: Abstract + Introduction + Related Work sections |

**End of Month 2 Milestone ✅**
- Full certificate issuance works end-to-end
- Verifier portal works — QR scan → blockchain result
- Admin can revoke, see fraud log
- AI service live on HuggingFace with real fraud detection
- All pages connected to real APIs

---

### 🗓️ Month 3 (Weeks 9–12): Testing + Docs + Submit

| Week | Member 1 (Blockchain) | Member 2 (Frontend) | Member 3 (AI + Docs) |
|------|----------------------|--------------------|--------------------|
| **W9** | Final Hardhat test suite — edge cases, security checks. Fix any contract issues | UI polish: colors, spacing, mobile responsiveness, loading states, error messages | Test AI on 200 certificate images (100 real, 100 edited). Record accuracy numbers |
| **W10** | API testing with Postman — all endpoints. End-to-end test: issue → verify → revoke → verify again | Bug fixes from E2E testing. Ensure QR scanner works on mobile browser | Research paper: System Design + Implementation + Results sections |
| **W11** | Performance measurements (verification time, issuance time, AI response time) for paper | Final UI review, record demo video script, rehearse live demo | Research paper: Discussion + Conclusion + References. Format to IEEE template |
| **W12** | Code cleanup, README, final deployment check | Record demo video (5 min screen capture + voiceover) | 12-slide presentation deck. Final project report. **Submit everything** |

**Final Submission Checklist ✅**
- [ ] Smart contract deployed and verified on Sepolia Etherscan
- [ ] Next.js app live on Vercel (issuer + verifier + admin all working)
- [ ] AI service live on HuggingFace Spaces
- [ ] At least 5 real certificates issued and verifiable via QR
- [ ] At least 1 certificate revoked (demonstrable)
- [ ] Research paper: 6–8 pages, IEEE format
- [ ] 12-slide presentation deck
- [ ] 5-minute demo video
- [ ] GitHub repo with README and documentation

---

## Milestones

| Milestone | End of | Definition |
|-----------|--------|-----------|
| 🚀 M1: Project Online | Week 2 | Next.js on Vercel, Supabase live, HuggingFace Space live |
| ⛓️ M2: Blockchain Done | Week 4 | Contract on Sepolia, all tests passing |
| 🔧 M3: Backend Done | Week 7 | Full issuance API works end-to-end |
| 🖥️ M4: All UIs Done | Week 8 | All 3 portals functional + connected |
| 🧠 M5: AI Done | Week 8 | Fraud detection live with real accuracy results |
| ✅ M6: Tested | Week 10 | All tests pass, demo rehearsed |
| 📤 M7: Submitted | Week 12 | Everything submitted |

---

## What to Build First (Priority Order)

If you're short on time, build in this exact order — each step makes the next one possible:

```
1. Supabase Auth (login/logout) ← foundation for everything
2. Smart contract (Hardhat local) ← core logic
3. Deploy contract to Sepolia ← makes blockchain calls possible
4. Next.js API: /issue route ← connects everything
5. Basic issuer form ← makes testing visual
6. AI service stub (just returns score: 5) ← unblock frontend development
7. Verifier portal ← the demo wow-moment
8. Admin revoke ← completes lifecycle
9. Real AI (replace stub) ← quality improvement
10. Polish + tests ← final week
```

---

## Risk Register (3-Person Team, 3 Months)

| Risk | How Likely | What To Do |
|------|-----------|-----------|
| Blockchain concept is new for the team | Medium | Start Week 1 with Hardhat tutorial. Contract is simple Solidity — not complex DeFi |
| AI accuracy is below expected | Medium | ELA works very well on edited images even without ML. 85%+ is achievable |
| Sepolia testnet slow / congested | Low | Hardhat local node as backup for demo. Sepolia is generally reliable |
| HuggingFace Space cold start lag | Low | Space stays warm if accessed regularly. Keep it warm with a cron ping |
| Feature creep (adding too much) | High | Stick to this scope. ZKP, mobile app, multi-org are future scope — do not touch |
| Team coordination issues | Medium | Weekly 30-min sync every Sunday. Use GitHub Issues to track tasks |
| One member falls behind | Medium | All 3 members understand all parts. No single point of knowledge failure |
