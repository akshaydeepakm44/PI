# HI IN Property Intelligence Platform (Phase 2 & 3)

> **Map-First, Evidence-Backed Real Estate Due-Diligence & Context Intelligence**

A production-ready full-stack real estate application designed to cleanly distinguish between **seller-provided facts** (pricing, physical specs, deed documents) and **platform-verified spatial context** (OpenStreetMap live POI discovery, air quality telemetry, OSRM road curvature commute analysis, and Qwen AI due-diligence synthesis).

---

## 🚀 Running the Platform (Local & Network)

### Option 1: One-Click Windows Double-Click (Easiest)
In File Explorer, double-click:
- **`start-local.bat`** (or **`start-live.bat`**)

### Option 2: Single Terminal Command
From the project root (`d:\Ref-Prop`), run:
```bash
npm run dev
```

When started, the script automatically:
1. Verifies and boots the FastAPI backend on port `8000`.
2. Verifies and boots the React/Vite web application on port `5173`.
3. Displays your local URL (`http://localhost:5173`) and network IP for testing across devices on the same Wi-Fi.
4. Gracefully terminates all background services when you press `Ctrl + C`.

---

## 👥 Demo Personas & Testing Accounts

All accounts use the same password: **`demopass123`**

| Role | Email | Key Workflows & Features to Test |
| :--- | :--- | :--- |
| **Seller / Builder** | `seller@hi-in.demo` | **Intake & Listing Management**: Add properties, upload deed PDFs & photos, inspect consistency flags, review buyer inquiries in inbox. |
| **Buyer** | `buyer@hi-in.demo` | **Map-First Discovery & Commute**: Interactive Leaflet map, live OpenStreetMap POIs (hospitals, schools, transit), air quality metrics, commute anchors, property comparison matrix, submit inquiries. |
| **Admin** | `admin@hi-in.demo` | **Oversight & Due-Diligence**: Approve/reject listings, review data quality warnings, monitor automated research jobs, audit logs. |

---

## 💻 Local Endpoints

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **System Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet.js, TanStack React Query, Lucide icons.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, Pydantic v2, JWT authentication (HS256).
- **Database**: SQLite (`hi_in.db`) with relational integrity and migrations; PostGIS-ready schema.
- **Spatial & Intelligence Engines**:
  - Live OpenStreetMap Overpass & Nominatim API integration.
  - Open-Meteo Air Quality telemetry.
  - OSRM driving route & road distance engine.
  - Qwen 2.5 / 3.5 AI Due-Diligence Analysis engine.
