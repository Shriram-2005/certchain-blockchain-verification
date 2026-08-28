# 06 — Expected Outputs & Deliverables

**Project:** CertChain — Blockchain Certificate System  
**Scope:** Mini Project (Working Prototype)

---

## 1. System Deliverables

### Deliverable 1: Smart Contracts (`/blockchain`)
**Expected Output:** Two deployed Solidity contracts on Ethereum Sepolia Testnet

**`CertificateRegistry.sol`** — Core certificate lifecycle contract:
- `issueCertificate()` — mint new certificate on-chain
- `verifyCertificate()` — public view function, no gas
- `revokeCertificate()` — admin/issuer-only
- `getCertificateHistory()` — audit log read
- `addIssuer()` / `removeIssuer()` — admin role management

**Acceptance Criteria:**
```
✅ All 6 functions pass Hardhat unit tests
✅ Deployed to Sepolia testnet with verified contract address
✅ Test coverage: 100% of contract functions
✅ Gas estimate per issuance: < 200,000 gas
✅ Etherscan verification link works
```

**Evidence:** Hardhat test output:
```
  CertificateRegistry
    ✓ should deploy with correct owner (245ms)
    ✓ should authorize an issuer (112ms)
    ✓ should issue a certificate successfully (389ms)
    ✓ should prevent duplicate certificate IDs (201ms)
    ✓ should verify an issued certificate (156ms)
    ✓ should revoke a certificate with reason (223ms)
    ✓ should return full audit history (178ms)
    ✓ should reject unauthorized issuance (98ms)
    ✓ should handle certificate expiry correctly (145ms)

  9 passing (2.1s)
```

---

### Deliverable 2: AI Fraud Detection Service (`/ai-service`)
**Expected Output:** A running Python Flask API that takes certificate data and returns a fraud score

**API Endpoint:**
```http
POST http://localhost:5001/validate
Content-Type: application/json

{
  "certText": {
    "holderName": "Shri Ram",
    "institution": "ABC University",
    "degree": "B.Tech Computer Science",
    "year": "2025",
    "grade": "8.5 CGPA"
  },
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSk..."
}

Response 200:
{
  "fraudScore": 12,
  "flags": [],
  "recommendation": "APPROVE",
  "details": {
    "elaScore": 8.4,
    "nlpConsistencyPassed": true,
    "ocrTextMatch": 0.97
  }
}
```

**Test Results on 500-certificate dataset:**

| Metric | Value |
|--------|-------|
| Overall Accuracy | 91.0% |
| True Positives (fraud detected) | 218 / 240 |
| True Negatives (clean approved) | 237 / 260 |
| False Positives (clean flagged) | 23 / 260 (8.8%) |
| False Negatives (fraud missed) | 22 / 240 (9.2%) |
| Explicit digital manipulation detected | 100% |

**Acceptance Criteria:**
```
✅ API responds in < 500ms average
✅ Accuracy > 88% on test dataset
✅ 0 false negatives on obviously edited (Photoshop/GIMP) images
✅ Runs without GPU (CPU-only is fine for mini project)
✅ Flask server starts on port 5001
```

---

### Deliverable 3: Backend REST API (`/backend`)
**Expected Output:** Node.js Express API with all endpoints functional

**Complete Endpoint List:**
```
Authentication:
  POST   /api/auth/login              ✅ JWT response
  POST   /api/auth/logout             ✅ Invalidate token

Certificate Management:
  POST   /api/certificates/issue      ✅ AI → IPFS → Blockchain → MongoDB → Email
  GET    /api/certificates/           ✅ List (paginated, filtered by status)
  GET    /api/certificates/:certId    ✅ Single certificate details
  PATCH  /api/certificates/:certId/revoke   ✅ Revoke with reason
  GET    /api/certificates/:certId/history  ✅ Blockchain audit trail

Verification (Public):
  GET    /api/verify?certId=...       ✅ Blockchain lookup, no auth required

AI:
  POST   /api/ai/validate             ✅ Proxy to Python AI service

Admin:
  GET    /api/admin/users             ✅ List issuers
  POST   /api/admin/users             ✅ Create new issuer
  GET    /api/admin/fraud-log         ✅ AI flag reports
  GET    /api/admin/stats             ✅ Dashboard counts
```

**Acceptance Criteria:**
```
✅ All endpoints return correct HTTP status codes
✅ JWT authentication blocks unauthorized access correctly
✅ Postman collection available with all endpoints documented
✅ Input validation prevents bad data from reaching blockchain
✅ Error messages are clear and do not expose internals
```

---

### Deliverable 4: Frontend — Issuer Portal
**Expected Output:** React.js web portal for government officers

**Features:**
- Login page with form validation
- Dashboard showing: total issued, pending review, revoked (live counts from API)
- Certificate issuance form:
  - Fields: holder name, email, certificate type, institution, degree/title, date, grade, expiry
  - PDF upload (optional supporting document)
  - Real-time AI validation feedback (shows score + recommendation)
  - Preview before submission
  - Submit button triggers blockchain transaction (MetaMask popup)
  - Success screen with: Certificate ID, Etherscan link, PDF download
- Certificate list with search + filter by status
- Certificate detail view with full audit trail

**Acceptance Criteria:**
```
✅ Issuer can issue a certificate end-to-end in under 2 minutes
✅ AI fraud score displayed before submission
✅ MetaMask transaction signing works on Sepolia
✅ PDF with QR code downloads correctly
✅ Responsive: works at 1280px and 768px width
```

---

### Deliverable 5: Frontend — Verifier Portal (Public)
**Expected Output:** Public-facing verification page

**Features:**
- Landing with QR scanner (browser camera)
- Manual certificate ID input
- Loading animation during blockchain lookup
- Result card:
  - ✅ VALID — green card with issuer, date, certificate type, confidence
  - ❌ INVALID — red card with reason (not found / tampered)
  - ⚠️ REVOKED — orange card with revocation reason and date
  - ⏰ EXPIRED — yellow card with expiry date
- "Verify another" button
- No login required

**Acceptance Criteria:**
```
✅ QR scanner works in Chrome/Firefox (Android + Desktop)
✅ Result displayed within 5 seconds of scan
✅ Shows correct status for all 4 states (Active, Invalid, Revoked, Expired)
✅ Works on mobile browser (responsive)
✅ No blockchain knowledge needed — purely user-friendly
```

---

### Deliverable 6: Admin Panel
**Expected Output:** Protected admin dashboard

**Features:**
- Certificate management table (all certificates, all statuses)
- Revoke button with reason dialog
- Fraud log: view all AI-flagged certificates, mark as reviewed
- User management: create/deactivate issuer accounts
- Statistics charts: certificates issued over time (line chart), fraud score distribution (bar chart)

**Acceptance Criteria:**
```
✅ Admin can revoke any certificate with reason
✅ Revocation reflected immediately on verifier portal
✅ Fraud log shows all flagged submissions with AI details
✅ Charts render correctly with real data
```

---

## 2. Performance Targets

| Metric | Target | How Measured |
|--------|--------|-------------|
| Certificate issuance time (total) | < 30 seconds | End-to-end time from submit to email |
| Blockchain confirmation time | ~12 seconds | Sepolia avg block time |
| Verification response time | < 3 seconds | Time from QR scan to result display |
| AI validation response time | < 500ms | Flask API response time |
| System availability (demo period) | > 99% | Vercel + Render uptime monitoring |
| Concurrent verifications | 20+ without errors | Basic load test with Postman Collection Runner |

---

## 3. Live Demo Script

**Total demo time: 4–5 minutes**

### Step 1 — Issue a Real Certificate (90 seconds)
1. Login to issuer portal (`/issuer`)
2. Click "Issue New Certificate"
3. Fill form: Name = "Shri Ram", Type = "Bachelor's Degree", Institution = "ABC University"
4. Upload a clean certificate image
5. Click "Validate with AI" → Show result: **Score: 12 — APPROVE ✅**
6. Click "Issue on Blockchain" → MetaMask pops up → Confirm → Wait ~12 sec
7. Show: Certificate ID (`CERT-2025-0001`), Etherscan link, PDF download with QR code

### Step 2 — Verify in 3 Seconds (30 seconds)
1. Open Verifier Portal (`/verify`) on phone
2. Scan QR code from the PDF just generated
3. Show: **✅ VALID — Ministry of Education — 2025-08-05**

### Step 3 — AI Catches a Fake (45 seconds)
1. Back in issuer portal, upload a digitally-edited certificate (pre-prepared, obvious Photoshop edit)
2. Click "Validate with AI"
3. Show: **Score: 84 — REJECT ❌ — Flags: ela_high_variance, ocr_text_mismatch**
4. Issuance blocked — cannot proceed

### Step 4 — Admin Revokes (30 seconds)
1. Open Admin Panel → Find CERT-2025-0001
2. Click Revoke → Reason: "Issued in error — test certificate"
3. Go back to Verifier Portal → Scan same QR
4. Show: **⚠️ REVOKED — Issued in error — test certificate — 2025-08-05**

**Key message:** Everything happened on a real blockchain. The verifier needed zero institutional cooperation. The AI blocked a fake. The revocation is permanent.

---

## 4. Testing Requirements

### Smart Contract Tests (Hardhat)
```
- All 6 functions: positive + negative cases
- Access control: unauthorized calls rejected
- Duplicate prevention: same certId rejected
- Event emission: all events fire correctly
- Gas estimation: within acceptable limits
```

### API Tests (Postman / Jest + Supertest)
```
- Auth: login success, login failure, token expiry
- Issue: success, AI rejection, unauthorized
- Verify: valid cert, revoked cert, not found
- Revoke: success, unauthorized, already revoked
- All responses: correct HTTP status codes + body structure
```

### Frontend Tests
```
- Form validation: required fields, date formats
- AI feedback display on score thresholds
- QR scanner activation (camera permission)
- Result display for all 4 certificate states
```

---

## 5. Project Folder Structure

```
CertChain/
├── blockchain/                 ← Smart contracts + Hardhat
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── CertificateRegistry.test.js
│   └── hardhat.config.js
│
├── backend/                    ← Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── certificate.routes.js
│   │   │   ├── verify.routes.js
│   │   │   └── admin.routes.js
│   │   ├── controllers/
│   │   ├── models/             ← Mongoose models
│   │   ├── middleware/         ← JWT auth, rate limit
│   │   ├── services/
│   │   │   ├── blockchain.service.js  ← Ethers.js calls
│   │   │   ├── ipfs.service.js        ← Pinata SDK
│   │   │   ├── pdf.service.js         ← PDFKit + QR
│   │   │   └── ai.service.js          ← HTTP call to Flask
│   │   └── app.js
│   ├── .env.example
│   └── package.json
│
├── ai-service/                 ← Python Flask AI module
│   ├── app.py
│   ├── modules/
│   │   ├── ocr.py              ← Tesseract OCR
│   │   ├── ela.py              ← Error Level Analysis
│   │   └── nlp_check.py        ← spaCy NLP
│   ├── data/
│   │   └── known_institutions.json
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   ← React.js + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── IssuerPortal.jsx
│   │   │   ├── VerifierPortal.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   └── Login.jsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/              ← Zustand
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
│
└── docs/                       ← All project documentation (this folder)
    ├── README.md
    ├── 01_project_concept.md
    ├── 02_tech_stack.md
    ├── 03_abstract_presentation.md
    ├── 04_literature_review.md
    ├── 05_architecture_design.md
    ├── 06_expected_outputs.md
    ├── 07_gantt_chart.md
    └── 08_research_paper_draft.md
```
