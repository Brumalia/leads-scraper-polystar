# CURRENT_WORK.md — UK Food & Drink Leads Scraper Status

**Project:** leads-scraper-polystar
**Client:** Polystar (via Corsus at corsus@agentmail.to)
**Last Updated:** 2026-04-01 16:52 GMT

---

## Project Status

**Overall Status:** 🟢 In Progress

**Phase:** POC Phase - Week 1

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

### ⚠️ Manual Configuration Required
- ⚠️ Vercel not linked to GitHub (needs manual configuration in Vercel dashboard)
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

### 1. Fix Vercel-GitHub Linking (Manual)
- Link Vercel project to GitHub repository in Vercel dashboard
- Set production branch to `production`
- Verify deployments work automatically

### 2. Companies House Integration
- Apply for Companies House API key
- Implement API client (lib/companies-house.ts)
- Test API with sample queries
- Create API route for fetching companies

### 3. Basic Dashboard
- Create companies listing page
- Add pagination
- Add search and filter UI
- Implement export to CSV

### 5. Google Places Integration
- Set up Google Places API key
- Implement API client
- Test with sample queries
- Integrate with companies data

### 6. Web Scraping with Playwright
- Install Playwright
- Implement scraping logic
- Test with sample websites
- Handle anti-scraping measures

### 7. Daily Scraping Automation
- Create cron job for daily scraping
- Implement error handling and retry logic
- Add status tracking in scrapes table
- Set up monitoring and alerts

### 8. QA and Testing
- Manual testing of all features
- Test with real data
- Verify data accuracy
- Performance testing

### 9. Deploy to Production
- Merge main to production
- Deploy to Vercel production
- Set up monitoring
- Document deployment

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

## Open Questions (Pending Clarification from Corsus)

**From Corsus email (2026-04-01 08:20 GMT):**
Corsus will reach out to Jacqui to clarify:
1. Industry scope: Food & drink only or also pharma/chemicals?
2. Email drip campaigns: Automated campaigns or just leads delivered?
3. Conversion rate expectations: What is the ideal conversion rate?

**Status:** Awaiting Corsus clarification from Jacqui

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
