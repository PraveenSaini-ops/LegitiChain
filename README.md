# LegitiChain

**LegitiChain** is a verifiable digital evidence integrity platform using cryptographic hashing, blockchain anchoring, and AI-assisted forensic risk analysis.

---

## 🚀 Overview

LegitiChain provides end-to-end immutability and verification for sensitive digital evidence. By generating client-side SHA-256 cryptographic hashes, storing evidence metadata securely, anchoring records on the Polygon blockchain, and providing automated forensic risk signals, LegitiChain ensures verifiable chain-of-custody for legal, compliance, and law enforcement workflows.

---

## ✨ Core Features

- 🔒 **Evidence Upload & Cryptographic Hashing**: Client-side & server-side SHA-256 hashing to guarantee file integrity prior to storage.
- ⛓️ **Blockchain Anchoring**: Immutable on-chain registration of evidence metadata and cryptographic hashes on the Polygon Amoy testnet.
- 📋 **Chain-of-Custody Tracking**: Comprehensive, audit-ready activity logs tracking every interaction, verification, and status change.
- 🤖 **AI Forensic Risk Analysis**: Automated risk scoring and flag generation analyzing file characteristics, submission patterns, and metadata anomalies.
- 👥 **Role-Based Access Control (RBAC)**: Fine-grained permissions powered by Supabase RLS (Submitter, Investigator, Auditor, Admin).
- 📜 **Forensic Proof Certificate Export**: Generate and download verifiable PDF forensic certificates containing complete cryptographic proofs.

---

## 🛠️ Tech Stack

- **Frontend & App Framework**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React
- **Backend & Database**: Supabase (Authentication, PostgreSQL Database with RLS, Storage)
- **Smart Contracts & Blockchain**: Solidity, Hardhat, Ethers.js, Polygon Amoy Testnet
- **PDF Generation**: `@react-pdf/renderer`

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18.x or higher)
- npm, pnpm, or yarn
- Git

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/PraveenSaini-ops/LegitiChain.git
   cd LegitiChain
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and populate the required environment variables (do **not** commit this file):

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Blockchain Configuration (Polygon Amoy Testnet)
   RPC_URL=https://rpc-amoy.polygon.technology
   PRIVATE_KEY=your_wallet_private_key
   NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📜 Smart Contract Status

> **Note**: The Solidity smart contract (`EvidenceAnchoring.sol`) and Hardhat deployment scripts are fully implemented and configured in `/contracts` and `/scripts`. Deployment to the Polygon Amoy testnet is currently pending testnet MATIC faucet funding.

---

## 🛡️ Security & Privacy

This repository strictly excludes all sensitive environment credentials, private keys, and local development builds (`.env`, `.env.local`, `node_modules/`, `.next/`).
