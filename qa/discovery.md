# QA Flow Discovery Report

## 1. Route Discovery

Based on static inspection of `frontend/src/App.tsx`, router definitions, and layout components:

| Route Path | Associated Page Component | Access Guard | Purpose & Capabilities |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage.tsx` | None (`PublicLayout`) | Public landing portal displaying featured listings, city overview, and search. |
| `/directory`, `/projects` | `DirectoryPage.tsx` | None (`PublicLayout`) | Public catalog with filters (price, area, property type, status) and listing cards. |
| `/properties/:id` | `PropertyDetailPage.tsx` | None (`PublicLayout`) | Detail page with 9 sections, specs, gallery, and on-demand "AI analysis" buttons. |
| `/builder`, `/builder/create`, `/seller/create` | `BuilderPage.tsx` | None (`PublicLayout`) | Comprehensive 2-column builder dashboard offering multi-phase, blocks, pricing, and specs forms. **Note:** Save button currently only triggers a UI toast and lacks backend API persistence. |
| `/login` | `Navigate to="/"` | None | Route redirects directly to home `/`. Standalone `LoginPage.tsx` exists with role-switching logic but is unmapped. |
| `/register` | `Navigate to="/"` | None | Route redirects directly to home `/`. |
| `/seller` | `SellerDashboard.tsx` | `RoleGuard` (seller/admin) | Seller workspace overview listing seller properties, enquiry metrics, and action shortcuts. |
| `/seller/new-listing` | `NewListingPage.tsx` | `RoleGuard` (seller/admin) | 5-step listing intake form connected to live backend API `POST /api/v1/properties/`. Supports draft and published status. |
| `/seller/edit-listing/:id` | `EditListingPage.tsx` | `RoleGuard` (seller/admin) | Allows updating existing property details via `PUT /api/v1/properties/{id}`. |
| `/seller/listings` | `SellerListingsPage.tsx` | `RoleGuard` (seller/admin) | Displays tabular list of seller's listings with quick view/edit actions. |
| `/admin` | `AdminOverviewPage.tsx` | `RoleGuard` (admin) | Administrative metrics, system status, live research job counts. |
| `/admin/listings` | `AdminListingsPage.tsx` | `RoleGuard` (admin) | Moderation console with status dropdown (`published`, `draft`, `suspended`) and reason audit modal. |

---

## 2. Builder Intake Form Comparison

We evaluated the builder intake capabilities across both available builder pages against the specification list:

### Comprehensive Field Matrix

| Field Required by Spec | Offered in BuilderPage (`/builder`) | Offered in NewListingPage (`/seller/new-listing`) | Status / Notes |
| :--- | :--- | :--- | :--- |
| **Project name** | Yes (`projectName`) | Yes (`name`) | Found |
| **RERA number** | Yes (`reraNo`) | No | Missing in NewListingPage |
| **Project type** | Yes (`projectType`) | Yes (`property_type`) | Found |
| **USP** | Yes (`projectUSP`) | No | Missing in NewListingPage |
| **Overview** | Yes (`projectOverview`) | Yes (`description`) | Found |
| **Acreage** | Yes (`projectSizeAcres`) | Partial (`area`) | Only generic area in NewListingPage |
| **Number of units** | Yes (`noOfUnits`) | Yes (`unit_count`) | Found |
| **Road access** | Yes (`approachRoadWidth`) | Yes (`road_access_m`) | Found |
| **Project status** | No (Phase status only) | Yes (`construction_status`) | Split between forms |
| **Ownership information (private)** | No | No | Feature Gap (BN-001): Private note field missing from both forms |
| **Phase name, RERA, dates, status, notes** | Yes (Dynamic Phase array) | No | Missing in NewListingPage |
| **Block / Tower name, floors, units/floor, total units, lifts, refuge, visitor parking** | Yes (Dynamic Blocks array) | Partial (`floors`, `towers`) | Missing granular tower breakdown in NewListingPage |
| **Area (sq ft/sq m)** | Yes | Yes (`area`, `area_unit`) | Found |
| **Pricing basis** | Yes (`pricingBasis`) | No | Missing in NewListingPage |
| **Floor-rise / facing / view premiums** | Yes (`floorRisePremium`, etc.) | Partial (text in `additional_charges`) | Missing discrete fields in NewListingPage |
| **Parking, corpus, FSI, maintenance deposit** | Yes | Partial (`additional_charges`, `maintenance_charges`) | Missing discrete fields in NewListingPage |
| **Comments / additional notes** | Partial | Yes (`additional_charges`, `description`) | Found |
| **Offers with end date and image** | Yes (`specialOfferText`, `specialOfferEndDate`) | No | Missing in NewListingPage |
| **Site photographs and uploaded images** | Yes (UI buttons) | Yes (`photos` file uploader) | Connected to upload API in NewListingPage |
| **Walkability & nearest commute info** | Yes (Metro, bus, parks arrays) | No | Missing in NewListingPage |
| **Uploaded plan metadata (measurements, description, etc.)** | Partial | Partial (`documents` uploader) | Missing structured metadata fields |
| **Indoor amenities** | Yes (`indoorAmenities` object) | Combined string in `amenities` | Discrete in BuilderPage, flat string in NewListingPage |
| **Master-plan areas** | Yes (`landscapedGreenArea`, `totalBuiltUpArea`) | No | Missing in NewListingPage |
| **Sustainability & smart infrastructure** | Yes (`sustainability` object) | Combined string in `utilities` | Discrete in BuilderPage, flat string in NewListingPage |
| **Outdoor amenities** | Partial | Combined string in `amenities` | Found |
| **Contact name, mobile, email** | Placeholder in tab | Yes (`seller_name`, `seller_contact`) | Found in NewListingPage |

---

## 3. Workflow & Approval Architecture

* **Publish vs Draft:** Listings can be saved as `'draft'` or submitted directly as `'published'` via the New Listing workflow.
* **Approval / Moderation:** In `AdminListingsPage.tsx`, platform administrators can review any listing and transition status between `published`, `draft`, and `suspended`.
* **Public Visibility:** Properties with status `'published'` appear in public search (`/directory`) and are viewable by buyers at `/properties/:id`. Draft or suspended listings are restricted to the owner or platform admin.
