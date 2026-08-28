# 05 — System Architecture Design

**Project:** CertChain — Blockchain Certificate System  
**Scope:** Mini Project (Single-Org Ethereum + AI + React.js)

---

## 1. Architectural Overview

CertChain follows a **3-tier microservices architecture**:

- **Tier 1 — Frontend:** React.js SPA with three distinct portals
- **Tier 2 — Backend:** Node.js REST API + Python AI service (two separate servers)
- **Tier 3 — Data & Blockchain:** Ethereum (Sepolia Testnet), IPFS (Pinata), MongoDB

All communication uses HTTPS REST APIs. The blockchain is queried via Ethers.js. The AI service is a separate Python Flask microservice called by the Node.js backend.

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Issuer Portal  │  │  Verifier Portal│  │ Admin Panel │ │
│  │  (login-gated)  │  │  (public)       │  │ (admin-only)│ │
│  │  React.js       │  │  React.js       │  │  React.js   │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
└───────────┼────────────────────┼──────────────────┼─────────┘
            │   HTTPS / REST API │                  │
┌───────────▼────────────────────▼──────────────────▼─────────┐
│                    NODE.JS BACKEND                           │
│             (Express.js · Ethers.js · Mongoose)              │
│                                                              │
│  Auth Routes  |  Certificate Routes  |  Verify Routes        │
│  /api/auth    |  /api/certificates   |  /api/verify          │
└──────┬───────────────┬──────────────────────┬───────────────┘
       │               │                      │
       ▼               ▼                      ▼
┌────────────┐  ┌─────────────┐       ┌─────────────┐
│  Ethereum  │  │  Python AI  │       │  MongoDB +  │
│  Sepolia   │  │  Service    │       │  IPFS       │
│  Testnet   │  │  (Flask)    │       │  (Pinata)   │
│            │  │  Port 5001  │       │  (Atlas)    │
│ Smart      │  │             │       │             │
│ Contract   │  │  OCR · ELA  │       │  Metadata   │
│ (Solidity) │  │  NLP · Score│       │  + PDF files│
└────────────┘  └─────────────┘       └─────────────┘
```

---

## 3. Certificate Issuance Flow

```
Government Officer (Issuer)
         │
         ▼
  [1] Issuer Portal: Fill Certificate Form
         │ (name, degree, institution, date, holder email, upload PDF)
         ▼
  [2] Backend: POST /api/certificates/issue
         │ Validate JWT (officer must be logged in)
         ▼
  [3] AI Service: POST http://localhost:5001/validate
         │ Send certificate text + uploaded PDF image
         │
         ├── OCR extracts text from PDF
         ├── NLP checks consistency (institution name, dates, degree)
         ├── ELA detects image manipulation
         └── Returns: { fraudScore: 12, recommendation: "APPROVE" }
         │
         ▼
  [4] IF fraudScore > 70: Return error to issuer
      IF fraudScore ≤ 70: Continue
         │
         ▼
  [5] Generate Certificate PDF (PDFKit)
         │ Includes: All fields + QR code + CertChain branding
         ▼
  [6] Upload PDF to IPFS via Pinata SDK
         │ Returns: ipfsCID (e.g., "QmXf3r...")
         ▼
  [7] Compute SHA-256 hash of certificate data
         │
         ▼
  [8] Call Smart Contract: issueCertificate(certId, hash, ipfsCID, ...)
         │ Signs transaction with issuer's private key (via .env)
         │ Waits for transaction confirmation on Sepolia (~12 sec)
         └── Returns: txHash, blockNumber
         │
         ▼
  [9] Save metadata to MongoDB:
         │ { certId, holderEmail, txHash, fraudScore, issuedAt, ... }
         ▼
  [10] Send email to holder (Nodemailer)
         │ Attaches certificate PDF
         ▼
  [11] Return success to issuer portal
         │ Shows: certId, txHash, blockchain explorer link
```

---

## 4. Verification Flow (QR Code Scan)

```
Verifier (Employer / Institution)
         │
         ▼
  [1] Verifier Portal: Scan QR code OR enter Certificate ID
         │ QR encodes: https://certchain.app/verify?id=CERT-2025-001
         ▼
  [2] Backend: GET /api/verify?certId=CERT-2025-001
         │ No authentication required (public endpoint)
         ▼
  [3] Call Smart Contract: verifyCertificate(certId)
         │ Read-only call (no gas needed for reads)
         └── Returns: { hash, ipfsCID, status, issuerAddress, issuedAt, expiresAt }
         │
         ▼
  [4] Fetch PDF from IPFS via CID
         │ Recompute hash of fetched content
         └── Compare with on-chain hash
         │
         ▼
  IF hashes match AND status == "ACTIVE":
    → Response: { valid: true, status: "ACTIVE", issuer: "Ministry of Education", date: "..." }
  
  IF hashes DON'T match:
    → Response: { valid: false, reason: "CONTENT_TAMPERED" }
  
  IF status == "REVOKED":
    → Response: { valid: false, status: "REVOKED", revokedAt: "...", reason: "..." }
  
  IF status == "EXPIRED":
    → Response: { valid: false, status: "EXPIRED", expiredAt: "..." }
         │
         ▼
  [5] Display result to verifier:
       ✅ VALID   ❌ INVALID / REVOKED   ⚠️ EXPIRED
       With: issuer name, issued date, certificate type
```

---

## 5. Smart Contract Design

**File:** `contracts/CertificateRegistry.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {

    address public owner;
    mapping(address => bool) public authorizedIssuers;

    enum Status { ACTIVE, REVOKED, EXPIRED, SUSPENDED }

    struct Certificate {
        string  certId;
        string  holderName;
        string  certType;         // "DEGREE", "PROFESSIONAL_LICENSE", "BIRTH_CERT", etc.
        bytes32 certHash;         // SHA-256 of certificate data
        string  ipfsCID;          // IPFS content identifier for PDF
        address issuerAddress;
        uint256 issuedAt;         // Unix timestamp
        uint256 expiresAt;        // 0 = never expires
        Status  status;
    }

    struct AuditLog {
        uint256 timestamp;
        string  action;           // "ISSUED", "REVOKED", "SUSPENDED", "REINSTATED"
        string  reason;
        address actor;
    }

    mapping(string => Certificate)    public certificates;
    mapping(string => AuditLog[])     public auditLogs;

    event CertificateIssued(string certId, address issuer, uint256 timestamp);
    event CertificateRevoked(string certId, address revoker, string reason);

    modifier onlyOwner()   { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyIssuer()  { require(authorizedIssuers[msg.sender], "Not authorized issuer"); _; }

    constructor() { owner = msg.sender; authorizedIssuers[msg.sender] = true; }

    function addIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
    }

    function issueCertificate(
        string memory certId,
        string memory holderName,
        string memory certType,
        bytes32 certHash,
        string memory ipfsCID,
        uint256 expiresAt
    ) external onlyIssuer {
        require(bytes(certificates[certId].certId).length == 0, "Certificate already exists");

        certificates[certId] = Certificate({
            certId:        certId,
            holderName:    holderName,
            certType:      certType,
            certHash:      certHash,
            ipfsCID:       ipfsCID,
            issuerAddress: msg.sender,
            issuedAt:      block.timestamp,
            expiresAt:     expiresAt,
            status:        Status.ACTIVE
        });

        auditLogs[certId].push(AuditLog({
            timestamp: block.timestamp,
            action:    "ISSUED",
            reason:    "Initial issuance",
            actor:     msg.sender
        }));

        emit CertificateIssued(certId, msg.sender, block.timestamp);
    }

    function verifyCertificate(string memory certId)
        external view returns (Certificate memory) {
        require(bytes(certificates[certId].certId).length != 0, "Certificate not found");
        return certificates[certId];
    }

    function revokeCertificate(string memory certId, string memory reason)
        external onlyIssuer {
        require(certificates[certId].status == Status.ACTIVE, "Not active");
        certificates[certId].status = Status.REVOKED;
        auditLogs[certId].push(AuditLog({
            timestamp: block.timestamp,
            action:    "REVOKED",
            reason:    reason,
            actor:     msg.sender
        }));
        emit CertificateRevoked(certId, msg.sender, reason);
    }

    function getCertificateHistory(string memory certId)
        external view returns (AuditLog[] memory) {
        return auditLogs[certId];
    }
}
```

---

## 6. AI Service Architecture

**File:** `ai-service/app.py` (Python Flask, Port 5001)

```
Input: POST /validate
  Body: {
    "certText": "...",       (text fields from form)
    "imageBase64": "..."     (base64 of uploaded document image)
  }

Pipeline:
  ┌─────────────────────────────────────┐
  │  Step 1: OCR (Tesseract)            │
  │  - Extract text from imageBase64    │
  │  - Compare with certText fields     │
  └─────────────┬───────────────────────┘
                │
  ┌─────────────▼───────────────────────┐
  │  Step 2: NLP Check (spaCy)          │
  │  - Check institution in known DB    │
  │  - Validate date logic              │
  │  - Check degree-institution match   │
  │  - Flag: 0 (clean) or 1 (suspect)   │
  └─────────────┬───────────────────────┘
                │
  ┌─────────────▼───────────────────────┐
  │  Step 3: ELA (OpenCV)               │
  │  - Save image at quality=90         │
  │  - Compute pixel-level error map    │
  │  - High variance = manipulation     │
  │  - ELA Score: 0–100                 │
  └─────────────┬───────────────────────┘
                │
  ┌─────────────▼───────────────────────┐
  │  Step 4: Ensemble Score             │
  │  score = (nlpFlag * 30) +           │
  │          (elaScore * 0.70)          │
  └─────────────┬───────────────────────┘
                │
Output: {
  "fraudScore": 0-100,
  "flags": ["ela_high_variance", "institution_not_found"],
  "recommendation": "APPROVE" | "REVIEW" | "REJECT"
}
```

---

## 7. Database Schema (MongoDB)

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "passwordHash": "string",
  "role": "ISSUER | ADMIN",
  "department": "string",
  "createdAt": "Date",
  "active": "boolean"
}
```

### Collection: `certificates`
```json
{
  "_id": "ObjectId",
  "certId": "string (unique, e.g., CERT-2025-0001)",
  "holderName": "string",
  "holderEmail": "string",
  "certType": "string",
  "institution": "string",
  "issuedBy": "ObjectId (ref: users)",
  "txHash": "string (Ethereum tx hash)",
  "blockNumber": "number",
  "ipfsCID": "string",
  "fraudScore": "number",
  "status": "ACTIVE | REVOKED | EXPIRED",
  "issuedAt": "Date",
  "expiresAt": "Date | null",
  "revokedAt": "Date | null",
  "revocationReason": "string | null",
  "metadata": {
    "degree": "string",
    "grade": "string",
    "year": "number"
  }
}
```

### Collection: `fraudlogs`
```json
{
  "_id": "ObjectId",
  "certId": "string",
  "fraudScore": "number",
  "flags": ["array of strings"],
  "recommendation": "string",
  "reviewedBy": "ObjectId | null",
  "reviewedAt": "Date | null",
  "submittedAt": "Date"
}
```

---

## 8. Certificate State Machine

```
                    ┌─────────┐
                    │  DRAFT  │ ← Issuer fills form
                    └────┬────┘
                         │ AI validates (score ≤ 70)
                         ▼
                    ┌─────────┐
                    │ ACTIVE  │ ← On-chain, QR issued
                    └────┬────┘
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
         ┌─────────┐ ┌──────┐ ┌─────────┐
         │SUSPENDED│ │EXPIRE│ │ REVOKED │
         │(temp)   │ │D(auto│ │(permane │
         └────┬────┘ │timer)│ │nt)      │
              │      └──────┘ └─────────┘
              │ Reinstated
              ▼
           ACTIVE

Note: All transitions are written to auditLogs[] on-chain
      REVOKED and EXPIRED are terminal — cannot be undone
      SUSPENDED can be reinstated (for investigation hold)
```

---

## 9. Frontend Route Map

```
/                     → Landing page (public)
/verify               → Public verifier portal
/verify?id=CERT-...   → Auto-verify from QR code scan

/login                → Issuer / Admin login

/issuer               → (protected) Issuer dashboard
/issuer/issue         → (protected) Issue new certificate
/issuer/certificates  → (protected) View issued certificates

/admin                → (admin only) Admin dashboard
/admin/certificates   → (admin only) All certificates
/admin/revoke/:id     → (admin only) Revoke action
/admin/fraud-log      → (admin only) AI fraud flags
/admin/users          → (admin only) Manage issuers
```

---

## 10. Data Flow Diagram — Full System

```
[Issuer fills form]
        │
        ▼
[Node.js Backend]──────────────────────→ [Python AI Service]
        │                                       │
        │  ←─── fraudScore, recommendation ─────┘
        │
        ├──→ [Pinata IPFS] — Upload PDF → get CID
        │
        ├──→ [Ethereum Sepolia] — issueCertificate() → get txHash
        │
        ├──→ [MongoDB] — Save metadata
        │
        └──→ [Nodemailer] — Email PDF to holder
        
[Verifier scans QR]
        │
        ▼
[Node.js Backend]──→ [Ethereum Sepolia] — verifyCertificate() → Certificate data
        │
        ├──→ [Pinata IPFS] — Fetch PDF → recompute hash
        │
        └──→ Return: VALID / INVALID / REVOKED to verifier portal
```

---

## 11. Security Design

| Threat | Mitigation |
|--------|-----------|
| Unauthorized certificate issuance | JWT-protected routes + smart contract `onlyIssuer` modifier |
| Tampered IPFS file | On-chain hash compared to IPFS content hash on every verification |
| Forged certificates submitted | AI pre-validation before any blockchain call |
| Private key exposure | Issuer private key stored in `.env`, never sent to client |
| Brute force login | Rate limiting (express-rate-limit), bcrypt (10 rounds) |
| SQL/NoSQL injection | Mongoose schema validation + Joi request validation |
| CORS attacks | `cors` middleware with whitelist |
| Certificate ID guessing | UUIDs for cert IDs (not sequential) |
| Smart contract bugs | Hardhat unit tests (100% function coverage) |
