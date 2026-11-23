# QA Build Notes & Defect Backlog

**Total Notes Logged:** 2
- **Blockers:** 1
- **Majors:** 1
- **Minors:** 0

## Logged Defect Entries

### [BN-002] A7: BUG (BLOCKER)
- **Expected:** Publish listing successfully
- **Actual:** Page.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator("input[placeholder*='Door no, Street']")

- **Evidence:** `qa/screenshots/07-submission-fail.png`
- **Suspected File:** `NewListingPage.tsx`
- **Suggested Fix:** Check API response
- **Dependent Steps Blocked:** None
- **Status:** `open`

### [BN-001] A4: BUG (MAJOR)
- **Expected:** Form sections fill completely
- **Actual:** Page.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator("input[placeholder*='Door no, Street']")

- **Evidence:** `qa/screenshots/04-form-filled-fail.png`
- **Suspected File:** `NewListingPage.tsx`
- **Suggested Fix:** Check input selectors
- **Dependent Steps Blocked:** None
- **Status:** `open`

## Fields Missing from the Builder Form

Comparing builder intake forms against the complete specification:

1. **Ownership Information (Private Note):** No field exists for private developer notes (`TEST PRIVATE NOTE 7741`) in either `NewListingPage.tsx` or `BuilderPage.tsx`.
2. **RERA Numbers (Project & Phase):** `NewListingPage.tsx` omits discrete RERA fields (currently placed in Survey Number input).
3. **Phase-Level Scheduling:** Discrete Phase breakdown (tentative start, possession, sales status) is present in `BuilderPage.tsx` UI but lacks backend database persistence.
4. **Granular Tower Specifications:** Lifts per tower, refuge floors, and units/floor by tower are grouped globally in `NewListingPage.tsx` rather than per block.
5. **Discrete Premium Fields:** Floor rise, facing, view, car parking, corpus fund, and maintenance deposits are currently concatenated into `additional_charges` text instead of discrete numeric inputs.
6. **Special Offers Engine:** Structured offer with expiry date and promotional graphic missing from `NewListingPage.tsx`.
7. **Nearest Commute Inputs:** Dynamic transit hubs and road distance/time entries missing from `NewListingPage.tsx`.
8. **Sustainability Feature Capacities:** Solar capacity (kWp), STP capacity (KLD), and EV charging bay count lack dedicated numeric inputs.

## Ideas Noticed During Testing

1. **Single Unified Builder Dashboard:** Merge `BuilderPage.tsx` (rich architectural specification UI) with `NewListingPage.tsx` (active backend database mutation) into a single unified intake experience.
2. **Automated Geocoding Assist:** Autofill road access width and nearby bus/metro hubs from OpenStreetMap whenever the user drops an exact map pin.
3. **Instant Analysis Preview on Builder Form:** Allow builders to run the AI intelligence analysis directly inside the builder dashboard prior to publishing.
