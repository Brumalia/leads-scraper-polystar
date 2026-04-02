# CURRENT_WORK.md — UK Food & Drink Leads Scraper Status

**Project:** leads-scraper-polystar
**Client:** Polystar (via Corsus at corsus@agentmail.to)
**Last Updated:** 2026-04-02 13:55 GMT

---

## Project Status

**Overall Status:** 🟢 In Progress

**Phase:** Phase 2.5 Complete — Secure API Key Management

---

## Completed (2026-04-01)

### ✅ Project Setup
- ✅ Created project structure with setup-project.js
- ✅ Next.js 16 + TypeScript + Tailwind CSS
- ✅ Supabase integration added
- ✅ GitHub repository created: https://github.com/Brumalia/leads-scraper-polystar
- ✅ Git initialized with main and production branches
- ✅ Vercel project created
- ✅ PRD v0.3 documented with full requirements
- ✅ Directory structure created (PRD/, docs/, scripts/)
- ✅ PM Agent coordination started

### ✅ Phase 1 Complete (2026-04-02)
- ✅ Industry Filter Dropdown (Food & Drink, Pharma, Chemicals)
- ✅ Company Size Filter Dropdown (Micro, Small, Medium, Large)
- ✅ Contract Packer Toggle (All, Yes, No)
- ✅ Growing Toggle (All, Yes, No)
- ✅ Database migration (002_add_company_filters.sql)
- ✅ All filters working in UI + API
- ✅ Vercel deployment (leads-scraper-polystar-mvxs57uq8-matty575s-projects.vercel.app)
- ✅ QA passed with agent-browser
- ✅ CSV export with all 11 columns
- ✅ All environment variables configured

### ⚠️ Manual Configuration Required
- ⚠️ Vercel project linked to wrong repo (mission-control instead of leads-scraper-polystar)
- ✅ Manual deployments working via API
- ⚠️ Production branch not set in Vercel (needs manual configuration)

---

## In Progress

### ✅ Database Setup (2026-04-01)
- ✅ Supabase project created: leads-scraper-polystar (ref: aaygspkoogxpoubmutqp)
- ✅ Region: eu-west-2
- ✅ Database schema applied (migration: 001_companies_schema.sql)
- ✅ Tables created: companies, scrapes
- ✅ Indexes created: idx_companies_location, idx_companies_scraped_at, idx_scrapes_run_date
- ✅ Updated_at trigger created for companies table
- ✅ RLS policies enabled and configured for both tables
- ✅ Environment variables configured (.env.local)

### ✅ API Routes Created (2026-04-01)
- ✅ GET /api/companies — List companies with pagination
- ✅ GET /api/scrape/status — Get current scrape status
- ✅ POST /api/scrape/run — Trigger manual scrape (placeholder)
- ✅ Supabase client utility created (lib/supabase.ts)
- ✅ API routes tested and verified working

### 🔨 Companies House API Integration
- **Status:** Not started
- **Next:** Get API key, implement integration
- **Files:** lib/companies-house.ts, app/api/companies-house/

### 🔨 Basic Dashboard
- **Status:** Not started
- **Next:** Build lead listing page
- **Files:** app/companies/page.tsx, components/

---

## Next Steps (Priority Order)

### Phase 2: Data Scraping Integration
1. Companies House API Integration
   - Get API key
   - Implement API client (lib/companies-house.ts)
   - Test with sample queries
   - Create API route for fetching companies

2. Google Places Integration
   - Set up Google Places API key
   - Implement API client (lib/google-places.ts)
   - Test with sample queries
   - Integrate with companies data

3. Web Scraping with Playwright
   - Install Playwright
   - Implement scraping logic
   - Test with sample websites
   - Handle anti-scraping measures

### Phase 3: Automation & Weekly Digest
1. Weekly cron job
   - Schedule: Every Monday at 9:00 AM GMT
   - Trigger scrape for all industries
   - Monitor completion

2. Email digest generation
   - Generate summary of new/updated companies
   - CSV attachment with latest data
   - Send to Jacqui's email

### Phase 4: QA & Testing
1. Functional testing
   - Test all filters individually and combined
   - Test pagination with large datasets
   - Test CSV export with filters
   - Test search edge cases

2. QA with agent-browser
   - Verify UI renders correctly
   - Test user flows
   - Verify data persistence
   - Check Supabase RLS

### Phase 5: Production Deployment
1. Vercel production branch setup
2. Merge main to production
3. Deploy to Vercel production
4. Set up monitoring
5. Document deployment

---

## Technical Decisions

### Architecture
- Hybrid approach: Companies House + Google Places + Web Scraping
- Companies House: Structured registration data
- Google Places: Business locations and contact info
- Web Scraping: Additional company information

### Tech Stack
- Frontend: Next.js 16 + TypeScript + Tailwind CSS
- Backend: Node.js API routes (Next.js)
- Database: Supabase (PostgreSQL + RLS)
- Scraping: Playwright
- Hosting: Vercel
- Authentication: Supabase Auth

### Database Schema
- `companies` table: Main lead data (name, location, email, website, business_type, scraped_at)
- `scrapes` table: Tracking daily runs (run_date, companies_found, companies_added, status)

### Security
- API keys stored in environment variables
- RLS policies for data access control
- Server-side scraping only (no client access)

---

## Known Issues

- ⚠️ Vercel not linked to GitHub (manual configuration required)
- ⚠️ Production branch not set in Vercel (manual configuration required)

## Recent Work (2026-04-02)

### Phase 2: Data Scraping Integration
- ✅ Created `lib/companies-house.ts` — Companies House API integration
  - Search companies by keyword with rate limiting
  - Get detailed company profiles
  - Auto-classify by SIC code
  - Estimate company size from creation date
- ✅ Created `lib/google-places.ts` — Google Places API integration
  - Search places by keyword and location
  - Get detailed place information
  - Extract contact information
  - Geographic filtering (north of Leicester)
  - Quota management ($200 credit/month)
- ✅ Created `lib/scraper.ts` — Playwright web scraping
  - Scrape 192.com and Yell.com
  - Robots.txt compliance
  - Rate limiting (1 request/second)
  - Retry logic with exponential backoff
- ✅ Created `lib/deduplication.ts` — Data processing
  - Merge data from multiple sources
  - Remove duplicates
  - Resolve conflicts (prefer more recent)
  - Industry classification from keywords
  - Contract packer detection
  - Growing company detection
  - Data validation and normalization
  - Confidence scoring
- ✅ Completed `app/api/scrape/run/route.ts` — Scrape orchestration
  - 8-step workflow: API calls → Merge → Filter → Normalize → Validate → Store
  - Progress tracking in scrapes table
  - Error handling with rollback
  - Detailed logging
- ✅ Installed Playwright and dependencies
- ✅ Lint and TypeScript validation passed

### Commits
- 091421a: feat: Implement Phase 2 - Data Scraping Integration

### Environment Variables Needed
- `COMPANIES_HOUSE_API_KEY` — Companies House API key
- `GOOGLE_PLACES_API_KEY` — Google Places API key

### Next Phase
Phase 3: Automation & Weekly Digest
- Weekly cron job configuration
- Email digest generation
- CSV attachment generation

### Project Documentation Updates
- ✅ Created PROJECT-TEMPLATE.md for all new projects
- ✅ Created Agent-to-Agent Coordination research document
- ✅ Reorganized workspace docs (moved project-specific docs to projects/)
- ✅ Updated PRD to v0.5 (industry scope, lead delivery, conversion metrics decisions)
- ✅ Created FD.md (Functional Design document)

### Leads Scraper Polystar Development
- ✅ Added industry filter (Food & Drink, Pharma, Chemicals)
- ✅ Added company size filter (Micro, Small, Medium, Large)
- ✅ Added contract packer toggle (All, Yes, No)
- ✅ Added growing toggle (All, Yes, No)
- ✅ Created /api/scrapes route (list all scrape runs)
- ✅ Updated /api/companies with all new filters
- ✅ Updated /api/export/csv with 11 columns
- ✅ Applied database migration 002_add_company_filters.sql
- ✅ Updated test data with industry, company_size values
- ✅ Configured Vercel environment variables
- ✅ Manual deployment via Vercel API
- ✅ QA with agent-browser (all features passing)

### Commits
- 6e73be3: feat: Add industry, company size, contract packer, growing filters
- cc2f83f: chore: Trigger rebuild to fix env vars

### URLs
- Preview: leads-scraper-polystar-mvxs57uq8-matty575s-projects.vercel.app/companies
- API: leads-scraper-polystar-mvxs57uq8-matty575s-projects.vercel.app/api/companies
- CSV Export: leads-scraper-polystar-mvxs57uq8-matty575s-projects.vercel.app/api/export/csv

---

## Credentials and Configuration

### Supabase
- Project Name: leads-scraper-polystar
- Project Ref: aaygspkoogxpoubmutqp
- URL: https://aaygspkoogxpoubmutqp.supabase.co
- Region: eu-west-2
- Management API PAT: /data/.openclaw/workspace/.credentials/supabase-pat-backend.txt
- DB Password: Configured in .env.local

### Vercel
- Token: /data/.openclaw/workspace/.credentials/vercel-token.txt
- Project Name: leads-scraper-polystar

### GitHub
- Repo: https://github.com/Brumalia/leads-scraper-polystar
- Branches: main, production

### API Keys (To be configured)
- Companies House API key: TBD
- Google Places API key: TBD

---

## Links

- **GitHub:** https://github.com/Brumalia/leads-scraper-polystar
- **Vercel Preview:** https://leads-scraper-polystar-matty575s-projects.vercel.app
- **PRD:** /data/.openclaw/workspace/projects/leads-scraper-polystar/PRD/PRD.md
- **Workspace:** /data/.openclaw/workspace/projects/leads-scraper-polystar/

---

## PM Workflow

**PM Agent:** Coordination via Mission Control
**Mission Control Task:** "UK Food & Drink Leads Scraper - Project Start"
**Task ID:** 4f15842c-a1b5-43b1-9b49-2db60ede4552
**Status:** In Progress

**Project Start Checklist:**
- ✅ Requirements gathered (PRD v0.3 exists)
- ✅ PRD approved by CTO (technical decisions documented)
- ✅ Tech stack selected (Supabase, Node.js, Playwright, Next.js)
- ✅ Database schema designed and implemented
- ✅ Repository created (GitHub + Vercel setup complete)
- ✅ Database setup complete (Supabase project created, schema applied)
- ✅ API routes created (companies, scrape status, scrape run)
- ⏳ Development environment set up (Vercel-GitHub linking needs manual config)

---

## Notes

- Project structure created with setup-project.js (validated approach)
- Manual project (leads-scraper-poc) was deleted to avoid configuration issues
- PM Agent is coordinating the project via Mission Control
- Documentation follows OPERATING.md standards

---

*Last updated: 2026-04-01 16:52 GMT*
