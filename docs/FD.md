# Functional Design (FD) — UK Leads Scraper for Polystar

**Project:** leads-scraper-polystar
**Client:** Polystar
**Contact:** Jacqui Horne (Business Development Manager)
**Version:** 1.0
**Date:** 2026-04-02
**Status:** Draft — Awaiting Approval

---

## 1. Overview

This document details the technical implementation plan for the UK Leads Scraper. It defines the database schema, API endpoints, UI components, and development phases required to build the system.

**Goal:** Build a web dashboard that scrapes UK manufacturers (food & drink, pharma, chemicals) in North England and delivers leads to Polystar.

---

## 2. Database Schema

### 2.1 Companies Table

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  location_city TEXT,
  location_county TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  physical_address TEXT,
  products TEXT, -- tins/bottles/jars
  industry TEXT, -- 'food & drink' | 'pharma' | 'chemicals' | 'other'
  business_type TEXT, -- Food Production, Beverage, Manufacturing, etc.
  company_size TEXT, -- 'micro' | 'small' | 'medium' | 'large'
  notes TEXT, -- e.g., "has canning line", "contract bottler"
  is_contract_packer BOOLEAN DEFAULT FALSE,
  is_contract_manufacturer BOOLEAN DEFAULT FALSE,
  is_growing BOOLEAN DEFAULT FALSE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_location_city ON companies(location_city);
CREATE INDEX idx_companies_location_county ON companies(location_county);
CREATE INDEX idx_companies_business_type ON companies(business_type);
CREATE INDEX idx_companies_company_size ON companies(company_size);
CREATE INDEX idx_companies_scraped_at ON companies(scraped_at);
CREATE INDEX idx_companies_is_contract_packer ON companies(is_contract_packer);
CREATE INDEX idx_companies_is_growing ON companies(is_growing);
CREATE INDEX idx_companies_name_trgm ON companies USING gin (name gin_trgm_ops); -- For search
```

### 2.2 Scrapes Table

```sql
CREATE TABLE scrapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date DATE NOT NULL UNIQUE,
  companies_found INTEGER DEFAULT 0,
  companies_added INTEGER DEFAULT 0,
  companies_updated INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME Z WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_scrapes_run_date ON scrapes(run_date);
```

### 2.3 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrapes ENABLE ROW LEVEL SECURITY;

-- Read-only access for authenticated users
CREATE POLICY "companies_read" ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "scrapes_read" ON scrapes
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can write (server-side only)
CREATE POLICY "companies_write" ON companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "scrapes_write" ON scrapes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## 3. API Endpoints

### 3.1 Companies API

#### `GET /api/companies`

**Purpose:** List companies with pagination, search, and filters

**Query Parameters:**
- `page` (number, optional): Page number, default: 1
- `limit` (number, optional): Items per page, default: 10, max: 100
- `search` (string, optional): Search by company name or email
- `location` (string, optional): Filter by city or county
- `industry` (string, optional): Filter by industry ('food & drink', 'pharma', 'chemicals')
- `business_type` (string, optional): Filter by business type
- `company_size` (string, optional): Filter by size
- `is_contract_packer` (boolean, optional): Filter by contract packer flag
- `is_growing` (boolean, optional): Filter by growing companies

**Response:**
```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "Example Brewery",
      "website_url": "https://example.com",
      "location_city": "York",
      "location_county": "North Yorkshire",
      "contact_email": "info@example.com",
      "contact_phone": "01904 123456",
      "physical_address": "123 Industrial Estate, York, YO1 1AA",
      "products": "bottles",
      "industry": "food & drink",
      "business_type": "Food Production",
      "company_size": "small",
      "notes": null,
      "is_contract_packer": false,
      "is_contract_manufacturer": false,
      "is_growing": false,
      "scraped_at": "2026-04-02T12:00:00Z",
      "created_at": "2026-04-02T12:00:00Z",
      "updated_at": "2026-04-02T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 150,
    "totalPages": 15
  }
}
```

#### `GET /api/companies/[id]`

**Purpose:** Get single company details

**Path Parameters:**
- `id` (uuid): Company ID

**Response:** Single company object (same structure as above)

---

### 3.2 Export API

#### `GET /api/export/csv`

**Purpose:** Export companies to CSV with filters applied

**Query Parameters:** Same as `/api/companies`

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="companies-export-2026-04-02.csv"`

**CSV Format:**
```csv
Name,Location,Email,Phone,Website,Industry,Business Type,Size,Products,Contract Packer,Growing,Date Scraped
Example Brewery,York,info@example.com,01904 123456,https://example.com,food & drink,Food Production,small,bottles,false,false,2026-04-02
```

---

### 3.3 Scraping Control API

#### `POST /api/scrape/run`

**Purpose:** Trigger manual scrape

**Request Body:**
```json
{
  "industry": "all" | "food & drink" | "pharma" | "chemicals",
  "location": "all" | "north england"
}
```

**Response:**
```json
{
  "scrape_id": "uuid",
  "status": "running",
  "started_at": "2026-04-02T12:00:00Z"
}
```

#### `GET /api/scrape/status`

**Purpose:** Get current scrape status

**Response:**
```json
{
  "latest_scrape": {
    "id": "uuid",
    "run_date": "2026-04-02",
    "status": "running",
    "companies_found": 45,
    "companies_added": 12,
    "companies_updated": 33,
    "started_at": "2026-04-02T12:00:00Z",
    "completed_at": null,
    "error_message": null
  }
}
```

#### `GET /api/scrapes`

**Purpose:** List all scrape runs

**Query Parameters:**
- `limit` (number, optional): Number of recent scrapes, default: 10

**Response:**
```json
{
  "scrapes": [
    {
      "id": "uuid",
      "run_date": "2026-04-02",
      "status": "completed",
      "companies_found": 150,
      "companies_added": 12,
      "companies_updated": 138,
      "started_at": "2026-04-02T12:00:00Z",
      "completed_at": "2026-04-02T12:30:00Z",
      "error_message": null
    }
  ]
}
```

---

## 4. UI/UX Design

### 4.1 Page Structure

#### Home Page (`/`)
- Hero section with project title
- "View Leads" button → `/companies`
- Quick stats: Total companies, Last scrape date, Status

#### Companies Dashboard (`/companies`)

**Layout:**
- Top bar: Title + Quick stats
- Filter bar: Search input, Industry dropdown, Location input, Business type dropdown, Company size dropdown, Contract packer toggle, Growing toggle, Reset button
- Results table: 12 columns (Name, Location, Email, Phone, Website, Industry, Business Type, Size, Products, Contract Packer, Growing, Date Scraped)
- Pagination: Page size selector, Prev/Next buttons, "X of Y companies"
- Export button: Top-right, exports current filtered results

**Filter Bar:**
- Search: Text input (300ms debounce)
- Industry: Dropdown (All, Food & Drink, Pharma, Chemicals)
- Location: Text input (city or county)
- Business Type: Dropdown (All, Food Production, Beverage, Manufacturing, etc.)
- Company Size: Dropdown (All, Micro, Small, Medium, Large)
- Contract Packer: Toggle switch (Yes/No/All)
- Growing: Toggle switch (Yes/No/All)
- Reset button: Clears all filters

**Results Table:**
- Responsive: Horizontal scroll on mobile
- Sortable columns (future enhancement)
- Click row → Company detail modal (future enhancement)
- Empty state: "No companies match your filters"

**Pagination:**
- Page size selector: 5, 10, 25, 50
- Prev/Next buttons: Disabled at boundaries
- Page info: "Page 1 of 15 (150 companies)"

---

### 4.2 Color Scheme

- Primary: Blue (#3b82f6)
- Secondary: Slate gray (#64748b)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Danger: Red (#ef4444)
- Background: White (#ffffff)
- Surface: Gray (#f8fafc)

---

### 4.3 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 5. Implementation Phases

### Phase 1: Core Dashboard (Current — Partially Complete)

**Status:** Dashboard built with search/filters/pagination/CSV export (2026-04-01)

**Completed:**
- ✅ Next.js project setup
- ✅ Supabase database schema (companies + scrapes tables)
- ✅ Companies listing page (`/companies`)
- ✅ API routes (`/api/companies`, `/api/export/csv`)
- ✅ Search, location filter, business type filter
- ✅ Pagination
- ✅ CSV export

**Remaining:**
- ⬜ Industry filter (pharma/chemicals support)
- ⬜ Company size filter
- ⬜ Contract packer toggle
- ⬜ Growing toggle
- ⬜ Scrape control APIs (`/api/scrape/run`, `/api/scrape/status`, `/api/scrapes`)

---

### Phase 2: Data Scraping Integration

**Status:** ✅ COMPLETE (2026-04-02)

**Completed:**
- ✅ Companies House API integration (`lib/companies-house.ts`)
  - Search companies by keyword
  - Get company profiles
  - Rate limiting (600 req/min)
  - SIC code classification
  - Company size estimation
- ✅ Google Places API integration (`lib/google-places.ts`)
  - Search places by keyword
  - Get place details
  - Contact info extraction
  - Geographic filtering
  - Quota management
- ✅ Playwright web scraping (`lib/scraper.ts`)
  - 192.com and Yell.com scraping
  - Robots.txt compliance
  - Rate limiting (1 req/sec)
  - Retry with exponential backoff
- ✅ Data deduplication (`lib/deduplication.ts`)
  - Merge from multiple sources
  - Remove duplicates
  - Resolve conflicts
  - Industry classification
  - Contract packer detection
  - Data validation
  - Confidence scoring
- ✅ Scrape orchestration (`app/api/scrape/run/route.ts`)
  - 8-step workflow
  - Progress tracking
  - Error handling

**Remaining:**
- ⬜ Obtain COMPANIES_HOUSE_API_KEY
- ⬜ Obtain GOOGLE_PLACES_API_KEY
- ⬜ Integration testing with real data
- ⬜ Cron job configuration

---

### Phase 3: Automation & Weekly Digest

**Goal:** Automated weekly scraping and email digest

**Tasks:**
1. Weekly cron job
   - Schedule: Every Monday at 9:00 AM GMT
   - Trigger scrape for all industries
   - Monitor completion

2. Email digest generation
   - Generate summary of new/updated companies
   - CSV attachment with latest data
   - Send to Jacqui's email

3. Weekly snapshots
   - Archive weekly data for trend tracking
   - Compare week-over-week changes

**Deliverables:**
- Cron job configuration
- Email template
- Digest generation script
- Archive system

---

### Phase 4: QA & Testing

**Goal:** Full QA with agent-browser, performance testing, edge case handling

**Tasks:**
1. Functional testing
   - Test all filters individually and combined
   - Test pagination with large datasets
   - Test CSV export with filters
   - Test search edge cases (empty, special characters, long queries)

2. QA with agent-browser
   - Verify UI renders correctly
   - Test user flows (filter → export)
   - Verify data persistence
   - Check Supabase RLS

3. Performance testing
   - Dashboard load time < 3 seconds
   - API response time < 500ms
   - Scrape completion < 30 minutes

4. Error handling
   - Network failures
   - API rate limits
   - Invalid data
   - Timeout handling

**Deliverables:**
- QA test report with screenshots
- Performance metrics
- Bug fixes
- Regression tests

---

### Phase 5: Production Deployment

**Goal:** Deploy to Vercel with proper configuration

**Tasks:**
1. Vercel project setup (if not done)
   - Link to GitHub repo
   - Set production branch to `production`
   - Configure environment variables

2. Environment configuration
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `COMPANIES_HOUSE_API_KEY`
   - `GOOGLE_PLACES_API_KEY`

3. Build and deploy
   - Run validation: `npm run lint`, `tsc --noEmit`, `npm run build`
   - Push to main
   - Verify Vercel preview deployment
   - QA on preview URL

4. Production deployment
   - Merge main to production
   - Verify production URL
   - Smoke tests

5. Documentation
   - Update PRD to v1.0
   - Update CHANGELOG.md
   - Update CURRENT_WORK.md
   - Archive test data

**Deliverables:**
- Production URL
- Deployment notes
- Documentation updates

---

## 6. Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State:** React hooks (useState, useEffect, useMemo)
- **Validation:** Zod (optional, for form validation)

### Backend
- **API:** Next.js API routes (Serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (for future multi-user support)
- **Scraping:**
  - Companies House API
  - Google Places API
  - Playwright (web scraping)

### Infrastructure
- **Hosting:** Vercel
- **Database:** Supabase (managed PostgreSQL)
- **Cron Jobs:** Vercel Cron or external cron service
- **Email:** Supabase Auth email or SendGrid

### Development Tools
- **Version Control:** Git
- **Package Manager:** npm
- **Linting:** ESLint
- **Type Checking:** TypeScript
- **Testing:** Playwright (E2E), agent-browser (QA)

---

## 7. Architecture

### Data Flow

```
┌─────────────────┐
│  Weekly Cron    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Scraping       │
│  Service        │
└────────┬────────┘
         │
         ├──► Companies House API
         ├──► Google Places API
         └──► Playwright Scraping
                │
                v
         ┌─────────────────┐
         │  Supabase DB   │
         │  (companies)   │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
         v                 v
┌──────────────┐   ┌──────────────┐
│ Next.js API  │   │ Email Service│
│ Routes       │   └──────────────┘
└──────┬───────┘
       │
       v
┌──────────────┐
│ Next.js UI   │
│ Dashboard    │
└──────────────┘
```

### Component Architecture

```
/app
├── /companies
│   └── page.tsx          // Main dashboard
├── /api
│   ├── /companies
│   │   ├── route.ts     // List + filter + pagination
│   │   └── [id]
│   │       └── route.ts // Single company
│   ├── /export
│   │   └── csv
│   │       └── route.ts // CSV export
│   ├── /scrape
│   │   ├── run
│   │   │   └── route.ts // Trigger scrape
│   │   ├── status
│   │   │   └── route.ts // Current status
│   │   └── scrapes
│   │       └── route.ts // List scrapes
│   └── /weekly-digest
│       └── route.ts     // Email digest (cron trigger)
/lib
├── supabase.ts          // Supabase client
├── companies-house.ts   // Companies House API
├── google-places.ts     // Google Places API
├── scraper.ts           // Playwright scraping
└── deduplication.ts     // Data deduplication
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Coverage:** Critical business logic
- Data transformation functions
- Filter logic
- Pagination calculations
- CSV generation

**Tools:** Jest, Vitest

### 8.2 Integration Tests

**Coverage:** API endpoints
- `/api/companies` with all filters
- `/api/export/csv` with various filter combinations
- `/api/scrape/run` and `/api/scrape/status`

**Tools:** Supabase test database, Postman, curl

### 8.3 E2E Tests

**Coverage:** User flows
- Open dashboard → filter → export
- Search → view results → pagination
- Empty states and error handling

**Tools:** Playwright

### 8.4 QA with agent-browser

**Coverage:** Real-world testing
- UI rendering on different screen sizes
- User interaction flows
- Data persistence
- Supabase RLS verification

**Process:**
1. Open Vercel preview URL
2. Take snapshot
3. Test filters and search
4. Test CSV export
5. Verify database rows
6. Document with screenshots

---

## 9. Security Considerations

### 9.1 API Keys

- Store in environment variables (never in code)
- Vercel environment variables for production
- `.env.local` for development
- `.env.example` for documentation (no real keys)

### 9.2 Rate Limiting

- Companies House: 600 requests/minute
- Google Places: $200/month credit limit
- Playwright: Respect robots.txt, 1 request/second

### 9.3 Data Privacy

- No PII stored (only business contact info)
- RLS restricts access to authenticated users
- Service role key never exposed to client

### 9.4 Input Validation

- Sanitize all user inputs
- Validate query parameters
- SQL injection protection (Supabase query builder)

---

## 10. Monitoring & Logging

### 10.1 Error Tracking

- Vercel logs for API errors
- Supabase logs for database errors
- Custom error logging for scraping failures

### 10.2 Performance Monitoring

- Vercel Analytics for page load times
- API response time logging
- Scrape duration tracking

### 10.3 Health Checks

- Database connection check
- API key validation
- Scrape job status monitoring

---

## 11. Success Criteria

### Phase 1 (Core Dashboard)
- ✅ Dashboard loads < 3 seconds
- ✅ All filters work correctly
- ✅ CSV export with filters
- ✅ Responsive design verified

### Phase 2 (Data Scraping)
- ✅ Scrape 100+ companies
- ✅ 95%+ data accuracy
- ✅ Industry classification works
- ✅ Geographic filtering correct

### Phase 3 (Automation)
- ✅ Weekly cron runs reliably
- ✅ Email digest delivered
- ✅ Weekly snapshots archived

### Phase 4 (QA)
- ✅ All QA tests pass
- ✅ No critical bugs
- ✅ Performance metrics met

### Phase 5 (Production)
- ✅ Production URL accessible
- ✅ All environment variables set
- ✅ Smoke tests pass
- ✅ Documentation updated

---

## 12. Timeline

**Phase 1:** 1 day (Remaining tasks: industry filter, scrape control APIs)
**Phase 2:** 3-5 days (API integrations, data scraping)
**Phase 3:** 2 days (automation, email digest)
**Phase 4:** 2 days (QA with agent-browser, performance testing)
**Phase 5:** 1 day (production deployment)

**Total:** 9-11 days

---

## 13. Open Questions

1. **Weekly digest schedule:** Monday 9:00 AM GMT — is this suitable?
2. **Email template:** Do we want a specific format for the weekly digest?
3. **Archive retention:** How long should we keep weekly snapshots?
4. **Test data:** Should we keep the 12 test companies in production?

---

## 14. Next Steps

1. ✅ Review and approve this Functional Design
2. ⬜ Complete Phase 1 remaining tasks (industry filter, scrape control APIs)
3. ⬜ Begin Phase 2 (data scraping integration)
4. ⬜ Follow proper gates: plan → build → QA → documentation → ship approval

---

**Document Owner:** B (CTO, Brumalia Studio)
**Last Updated:** 2026-04-02
**Next Review:** After Phase 1 completion
