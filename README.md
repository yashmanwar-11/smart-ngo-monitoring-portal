<div align="center">

# 🏛️ INSPIRA: National NGO Real-Time Monitoring & Inspection Portal
### *Ministry of Social Justice & Empowerment • Government of India*
**Compliant with GIGW 3.0 Guidelines & NITI Aayog NGO-DARPAN System**

[![Live Deployment](https://img.shields.io/badge/Live_Portal-smart--ngo--monitoring--portal.vercel.app-138808?style=for-the-badge&logo=vercel)](https://smart-ngo-monitoring-portal.vercel.app)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![GIS Geofencing](https://img.shields.io/badge/GIS_Mapping-Leaflet-199900?style=for-the-badge&logo=leaflet)](https://leafletjs.com)
[![Surveillance](https://img.shields.io/badge/Live_CCTV-HLS_Streaming-FF0000?style=for-the-badge)](https://smart-ngo-monitoring-portal.vercel.app)

</div>

---

## 🌐 Live Production URL
* **Official Web Application**: [https://smart-ngo-monitoring-portal.vercel.app](https://smart-ngo-monitoring-portal.vercel.app)
* **Status**: 🟢 24/7 Global Cloud Operational on Vercel Edge Network

---

## 📌 Executive Overview
**INSPIRA** is a comprehensive, institutional-grade digital monitoring and physical vigilance platform designed to prevent fund misappropriation, ensure statutory compliance, and streamline ground-level inspections of Non-Governmental Organizations (NGOs) and funded shelter homes across India.

Engineered under the **Guidelines for Indian Government Websites (GIGW 3.0)**, the platform pairs real-time **satellite GPS geofencing**, **live CCTV surveillance grid telemetry**, and **deep vigilance AI reasoning** to enforce zero-tolerance accountability across all government-funded social welfare schemes.

---

## 🚀 Key Institutional Innovations & Features

### 1. 📍 150m Satellite GPS Geofence Verification
* Field vigilance inspectors cannot submit audit reports or checklists without a cryptographically verified physical presence inside the facility's designated 150-meter GPS radius.
* Anti-spoofing algorithms prevent device GPS spoofing and timestamp tampering.

### 2. 📹 24/7 Real-Time CCTV Surveillance & IP Camera Grid
* Central command monitoring with multi-feed RTSP / HLS video streaming covering facility entrance, classrooms, kitchens, and medicine dispensaries.
* Remote PTZ (Pan-Tilt-Zoom) camera controls with single-click timestamped evidence capture sealed with cryptographic hashes.

### 3. 🤖 Autonomous Vigilance AI Copilot & Anomaly Detection
* Intelligent institutional assistant capable of executing autonomous actions: filtering high-risk NGOs, auto-dispatching vigilance officers, tracking DARPAN registries, and detecting statistical anomalies.
* Cross-references beneficiary counts against real-time ration disbursements to flag ghost beneficiaries.

### 4. 🔀 Double-Blind Random Inspector Duty Allocation
* Eliminates jurisdictional familiarity, bribery, and officer-NGO collusion through cryptographic random duty allocation batches generated 24 hours prior to surprise audits.

### 5. 📞 Surprise Biometric Video-Conference (VC) Adjudication
* Instant, surprise unannounced video-call audits conducted directly from the Directorate to shelter in-charges, medical staff, and resident beneficiaries.

### 6. 📱 Android App Architecture & Biometric Attendance
* Optimized for handheld mobile field devices with native camera integration for watermarked evidence capture and face liveness biometric check-ins for field workers.

---

## 🔐 Multi-Tier Role-Based Access Hierarchy

| Role | Security Clearance | Authorized Responsibilities |
| :--- | :--- | :--- |
| **Director General & Admin** | `LEVEL_5_DIRECTORATE` | Full oversight, grant sanctions, show-cause notices, random duty allocation, and audit log analysis. |
| **Field Vigilance Officer** | `LEVEL_3_INSPECTOR` | Geofenced on-site audits, biometric verification, photo/video evidence capture, defect reporting. |
| **Authorized NGO Representative** | `LEVEL_2_NGO` | Compliance filings, annual audit reports, CCTV feed onboarding, notice rebuttals, staff management. |
| **Grassroots Field Staff** | `LEVEL_2_WORKER` | Daily biometric geo-attendance, activity logs, field beneficiary mobilization records. |
| **Citizen & Whistleblower** | `LEVEL_1_PUBLIC` | CPGRAMS grievance registration, public NGO DARPAN search, anonymous whistleblower tracking. |

---

## 🔑 Demo Access Credentials (1-Click Instant Login)

All demo accounts can be accessed directly from the **"Sign In / SSO Login"** modal on the live website:

| Role Title | Official Email | Clearance Level | Default Password |
| :--- | :--- | :--- | :--- |
| **Directorate General (IAS)** | `admin.monitoring@gov.in` | Level 5 Directorate | `GovSecure@2026` |
| **Senior Field Inspector** | `vikram.singh@inspection.gov.in` | Level 3 Inspector | `Password@123` |
| **NGO Executive Trustee** | `arvind.joshi@swasthya.org` | Level 2 NGO Rep | `Password@123` |
| **Community Health Worker** | `worker.sunita@swasthya.org` | Level 2 Worker | `Password@123` |
| **Citizen Whistleblower** | `citizen.observer@gmail.com` | Level 1 Public | `Password@123` |

---

## 🛠️ Technology Stack Architecture

### Frontend (User Interface & GIS)
* **Framework**: React 19 + TypeScript (Strict Type Safety)
* **Styling**: Tailwind CSS v4 with Indian Tricolor Institutional Theme & GIGW 3.0 High-Contrast Mode
* **Build System**: Vite 6 (Ultra-fast HMR and minified asset compilation)
* **GIS & Maps**: Leaflet 1.9 + OpenStreetMap GPS telemetry & Geofencing visualization
* **Video Player**: HLS.js for live CCTV surveillance streaming
* **Icons & Animation**: Lucide React + Motion (Framer Motion)

### Backend & Data Services
* **Server**: Node.js & Express.js microservices
* **Database**: High-performance SQLite engine with WAL (Write-Ahead Logging) mode
* **Authentication**: JSON Web Tokens (JWT) + Bcrypt with multi-tier clearance validation
* **AI Intelligence**: Autonomous Institutional Neural Copilot for vigilance and fraud detection

---

## 💻 Local Installation & Setup

Follow these steps to run the platform locally on your computer:

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/yashmanwar-11/smart-ngo-monitoring-portal.git
cd smart-ngo-monitoring-portal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

### 4. Build for Production
```bash
npm run build
```

---

## 📂 Project Directory Structure

```text
├── public/                 # Static government seals, logos & favicon
├── server/                 # Express backend routes, db schema & microservices
│   ├── routes/             # Authentication, NGOs, CCTV, Inspections & Grievances
│   ├── services/           # CCTV gateway & cryptographic audit logging
│   └── seed.ts             # Initial database seeder for DARPAN entities
├── src/                    # Frontend React 19 source code
│   ├── components/         # Institutional dashboard modules & modals
│   │   ├── cctv/           # CCTV surveillance player, PTZ & evidence capture
│   │   ├── institutes/     # Complete NGO directory, dossiers & facility views
│   │   ├── AdminDashboard.tsx
│   │   ├── OfficerDashboard.tsx
│   │   ├── NgoDashboard.tsx
│   │   └── VigilanceAiCopilot.tsx
│   ├── data/               # Master mock registries & initial government tasks
│   ├── services/           # Resilient API client & offline storage handlers
│   └── types.ts            # Enterprise TypeScript interfaces & schemas
├── vercel.json             # Vercel Edge deployment configuration
├── Dockerfile              # Docker container configuration
└── package.json            # Node.js project manifest & dependencies
```

---

## 📜 Compliance & Statutory Standards
* **GIGW 3.0**: Adheres to the Guidelines for Indian Government Websites (contrast ratios, screen reader accessibility, keyboard navigation, tricolor layout).
* **CERT-In Guidelines**: Built with secure headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`).
* **NITI Aayog NGO-DARPAN**: Compatible with standard Darpan identification formats (e.g., `MH/2026/039121`).

---

<div align="center">
  <sub>Developed for Smart Real-Time NGO Monitoring & Inspection • Government of India</sub>
</div>
