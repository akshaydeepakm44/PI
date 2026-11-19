# HI IN Property Directory — Architecture & Design Decisions

## 1. Project Overview & Scope
HI IN Property Directory is an evidence-backed real estate intelligence platform designed to cleanly separate:
- **Seller-provided facts**: Identifiers, pricing, physical specifications, legal documentation, brochures.
- **Platform-gathered context**: Spatial coordinates, location context, environmental parameters, commute networks.
- **AI-driven evaluation**: Structured synthesis of evidence, trade-offs, confidence levels, and due-diligence checks.

Phase 1 focuses on the core functional baseline: authentication, role-based workflows (Seller, Buyer, Admin), property creation with multi-section inputs, map coordinate binding, directory discovery, wishlists, enquiries, admin oversight, and the typed AI Assistance interface placeholder.

---

## 2. Technology Stack & Environment Adaptations

### 2.1 Backend: Python FastAPI & SQLAlchemy
- **Framework**: FastAPI (Python 3.13) with Pydantic v2 for strict request/response data contracts and automated OpenAPI documentation (`/docs`).
- **ORM & Migrations**: SQLAlchemy 2.0 with Alembic for relational modeling and versioned database schema migrations.
- **Authentication**: JWT Bearer tokens with Argon2/Bcrypt password hashing and role-based access control (`buyer`, `seller`, `admin`).
- **Database Choice (Environment Adaptation)**:
  - *Standard Spec*: PostgreSQL with PostGIS extension.
  - *Host Environment Reality*: Neither Docker nor native PostgreSQL is installed on this Windows host.
  - *Decision*: Implemented standard SQLAlchemy relational models with an abstraction layer supporting SQLite for local zero-dependency development (`sqlite:///./hi_in.db`) while keeping coordinates stored as explicit float latitude/longitude pairs and geometry-ready columns. The codebase is configured so setting `DATABASE_URL=postgresql://user:pass@host:5432/hi_in` instantly connects to PostgreSQL/PostGIS without code refactoring.

### 2.2 Frontend: React, TypeScript, Vite & Tailwind CSS
- **Build Tool**: Vite with React 18+ and TypeScript for rapid compilation and strict type safety.
- **Routing**: React Router v6 for nested layout routing (Public, Seller Workspace, Buyer Workspace, Admin Console).
- **Styling**: Tailwind CSS tailored to the product specification:
  - Jet black sidebar (`#0f172a` / `#090d16`) with high contrast.
  - Pure white and neutral parchment content canvas (`#ffffff` / `#f8fafc`).
  - Subtle borders (`#e2e8f0` / `#cbd5e1`).
  - Strict absence of decorative emojis; all icons provided by `lucide-react`.
  - Consistent Inter font family typography.
- **State & Data Fetching**: TanStack Query (React Query) for server-state caching, optimistic updates, and loading/empty/error state management.
- **Spatial Map**: Leaflet.js with OpenStreetMap standard tiles displaying actual stored property coordinates.

### 2.3 Storage & File Handling
- Local directory storage in `backend/uploads/` with public serving route `/uploads/` for uploaded property photographs and due-diligence PDFs.
- Clean adapter interface ready for S3 / MinIO integration in subsequent phases.

---

## 3. Role-Based Access Control (RBAC)
Permissions are enforced strictly in the backend via FastAPI dependency injection:
- `require_role(["seller"])`: Property creation, draft editing, unpublishing, viewing received enquiries.
- `require_role(["buyer"])`: Adding to wishlist, submitting enquiries, viewing personalized commute anchors.
- `require_role(["admin"])`: Listing approval/suspension, inspecting research jobs, reviewing data quality flags, viewing system audit logs.
- Public endpoints: Browsing approved published listings, viewing property details, user registration/login.

---

## 4. Data Hygiene & Transparency
- All seller-entered properties are explicitly flagged with `verification_status="Seller provided / Unverified"` until independent verification is performed.
- Development seeded properties are tagged with `is_demo=true` and display prominent "Demo data" indicators in the UI.
- No hardcoded landmark dictionaries or simulated travel times; AI Assistance displays a clear Phase 2 connection placeholder.
