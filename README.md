# CertChain: Online Blockchain-based Certificate Generation and Validation System

A dual-layer security platform designed to modernize the issuance and verification of academic and professional certificates. This project integrates an AI-driven pre-issuance check with a decentralized Web3 blockchain ledger to provide 100% mathematical proof of certificate authenticity.

---

## 🎯 The Problem
1. **Rampant Forgery:** High-quality editing tools make faking academic degrees and professional certificates incredibly easy.
2. **Slow Verification:** Employers spend weeks manually contacting universities to verify candidates.
3. **Vulnerable Databases:** Traditional, centralized databases can be hacked or altered by corrupt insiders.

## 💡 The Solution
This system employs a **Trustless, Two-Step Security System**:
* **Layer 1 (AI Pre-Issuance):** An AI microservice scans uploaded documents to catch photoshopped images and fake text *before* they are accepted into the system.
* **Layer 2 (Blockchain Post-Issuance):** Approved certificates are hashed and permanently stamped into an immutable public ledger on the Ethereum blockchain.

## 🏗️ Architecture & Tech Stack

This project is organized as a monorepo consisting of three main components:

1. **`certchain/` (Frontend & Web Backend)**
   - **Framework:** Next.js (React), TypeScript
   - **Styling:** Tailwind CSS
   - **Database/Auth:** Supabase (PostgreSQL, Supabase Auth, Storage)
   - **Email:** Resend API

2. **`ai-service/` (Fraud Detection Microservice)**
   - **Framework:** Python, Flask
   - **Image Forensics (ELA):** OpenCV (`cv2`)
   - **Text Extraction:** Tesseract OCR (`pytesseract`)
   - **Semantic NLP:** spaCy

3. **`blockchain/` (The Immutability Layer)**
   - **Smart Contracts:** Ethereum Solidity (`CertificateRegistry.sol`)
   - **Testing/Deployment:** Hardhat
   - **Web3 Integration:** Ethers.js

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v22+)
- Python (3.10+)
- Tesseract-OCR installed on your system
- A Supabase project with the schema initialized

### Step 1: Start the Local Blockchain
```bash
cd blockchain
npm install
npx hardhat node
```
*Leave this terminal running. It simulates the Ethereum network on your machine.*

### Step 2: Start the AI Service
Open a new terminal window:
```bash
cd ai-service
pip install -r requirements.txt
python app.py
```
*Leave this running. It serves the AI image-checking endpoints on port 5000.*

### Step 3: Start the Next.js Web App
Open a third terminal window:
```bash
cd certchain
npm install
# Make sure your .env.local is configured with Supabase and Blockchain keys
npm run dev
```
*Your application will now be live at `http://localhost:3000`.*

---

## 👥 Team
- **Shri Ram A U** (20231CSE0602)
- **Srihari H** (20231CSE0653)
- **Sharun Karthik** (20231CSE0734)
