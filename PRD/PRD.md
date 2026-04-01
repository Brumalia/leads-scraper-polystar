# PRD v0.3 — UK Food & Drink Leads Scraper for Polystar

**Client:** Polystar
**Contact:** Corsus (corsus@agentmail.to)
**Last Updated:** 2026-04-01
**Status:** Requirements Approved

---

## 1. Executive Summary

A web dashboard that scrapes UK food & drink producers and delivers daily leads to Polystar.

**Primary Use Case:** 
- Polystar needs daily leads of UK food & drink producers
- Manual research is time-consuming and inefficient
- Automated scraping reduces research time and improves lead quality

---

## 2. Target Audience

**Primary:** Polystar sales team
- Needs daily leads of UK food & drink producers
- Wants accurate, up-to-date company information
- Requires web-based dashboard for easy access

**Secondary:** Brumalia Studio (development team)
- Maintains and improves the scraper
- Monitors scraping performance and data quality

---

## 3. Core Features

### 3.1 Data Collection
- **Companies House API:** Company registration data (UK)
- **Google Places API:** Business locations and contact details
- **Web Scraping:** Additional company information from company websites
- **Daily Updates:** Automatic daily data refresh

### 3.2 Data Fields
- Company name
- Location (area/region)
- Contact email (if available)
- Website URL
- Business type/industry
- Date scraped

### 3.3 Dashboard Features
- Web-based dashboard for lead viewing
- Filter by location/region
- Search by company name
- Export to CSV
- Daily leads count

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Dashboard load time: < 3 seconds
- Daily scrape completion: < 30 minutes
- Concurrent users: 5-10

### 4.2 Reliability
- Scrape success rate: > 95%
- Daily uptime: > 99%
- Data accuracy: > 90%

### 4.3 Scalability
- Support up to 1000 leads per day
- Horizontal scaling for future growth
- Database optimization for large datasets

---

## 5. Technical Architecture

### 5.1 Architecture: Companies House + Google Places + Scraping Hybrid

**Why Hybrid:**
- Companies House provides structured registration data but lacks contact details
- Google Places provides location and contact info but may miss small businesses
- Web scraping fills gaps in company information

**Data Flow:**
1. Companies House API → Company registration data
2. Google Places API → Business locations and contact details
3. Web scraping (Playwright) → Additional company information
4. Deduplication → Remove duplicate records
5. Storage → Supabase database
6. Dashboard → Next.js frontend

### 5.2 Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS

**Backend:**
- Node.js API routes (Next.js)
- Supabase (database + auth + RLS)
- Playwright (web scraping)

**Infrastructure:**
- Vercel (hosting)
- Supabase (managed PostgreSQL)

---

## 6. Database Schema

### 6.1 Tables

```sql
-- Companies (main lead data)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  email TEXT,
  website TEXT,
  business_type TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrapes (tracking daily runs)
CREATE TABLE scrapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date DATE NOT NULL UNIQUE,
  companies_found INTEGER DEFAULT 0,
  companies_added INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_companies_location ON companies(location);
CREATE INDEX idx_companies_scraped_at ON companies(scraped_at);
CREATE INDEX idx_scrapes_run_date ON scrapes(run_date);
```

---

## 7. API Endpoints

### 7.1 Company Data
- `GET /api/companies` — List all companies (with pagination)
- `GET /api/companies/[id]` — Get single company
- `POST /api/companies/search` — Search companies by name/location

### 7.2 Scraping Control
- `POST /api/scrape/run` — Trigger manual scrape
- `GET /api/scrape/status` — Get current scrape status
- `GET /api/scrapes` — List all scrape runs

### 7.3 Data Export
- `GET /api/export/csv` — Export companies to CSV

---

## 8. Security

### 8.1 API Keys
- Companies House API key (environment variable)
- Google Places API key (environment variable)
- Supabase service role key (server-side only)

### 8.2 RLS Policies
- `companies` table: Read-only for authenticated users
- `scrapes` table: Read-only for authenticated users
- No write access from client-side (scraping is server-side only)

---

## 9. Pricing Model (Future v1.0)

**SaaS Tiers:**
- **Starter (£49/mo):** 500 leads/month, basic dashboard
- **Professional (£199/mo):** 2000 leads/month, advanced filters, API access
- **Enterprise (£499/mo):** Unlimited leads, custom integrations, priority support

---

## 10. Development Phases

### Phase 1 (POC - Current)
- MVP with Companies House API + basic dashboard
- Manual daily scraping (no automation)
- Basic filters and search
- Export to CSV

### Phase 2 (Enhancement)
- Google Places integration
- Web scraping with Playwright
- Automated daily scraping
- Improved UI/UX

### Phase 3 (v1.0)
- SaaS pricing tiers
- User accounts and authentication
- API for third-party integrations
- Advanced analytics

---

## 11. Success Metrics

### 11.1 POC Success
- Dashboard loads in < 3 seconds ✅
- At least 100 companies scraped ✅
- Export to CSV works ✅
- Search/filter functionality works ✅

### 11.2 Future v1.0 Success
- 10+ paying customers
- 95%+ scrape success rate
- 90%+ data accuracy
- Customer satisfaction rating > 4.5/5

---

## 12. Risks and Mitigations

### 12.1 API Rate Limits
- **Risk:** Companies House API has rate limits
- **Mitigation:** Implement rate limiting and queuing
- **Backup:** Cache API responses

### 12.2 Data Accuracy
- **Risk:** Scraped data may be outdated or incorrect
- **Mitigation:** Implement data validation and manual review
- **Backup:** Allow manual data correction

### 12.3 Anti-Scraping Measures
- **Risk:** Websites may block scraping
- **Mitigation:** Use Playwright with realistic headers, rotate IPs
- **Backup:** Fallback to API-only approach

---

## 13. Dependencies

### 13.1 External APIs
- Companies House API (free, registration required)
- Google Places API (paid, $200/month credit)

### 13.2 Development Tools
- Node.js 22+
- Supabase CLI
- Playwright
- Next.js 16

---

## 14. Timeline

### POC Phase (Target: 1-2 weeks)
- Week 1: Database setup, Companies House integration, basic dashboard
- Week 2: Google Places integration, scraping automation, testing

### Enhancement Phase (Target: 2-3 weeks)
- Web scraping with Playwright
- Automated daily scraping
- Improved UI/UX
- QA and deployment

### v1.0 Release (Target: 4-6 weeks)
- User authentication
- SaaS pricing tiers
- API for third-party integrations
- Marketing and launch

---

## 15. Next Steps

1. ✅ Project structure created (2026-04-01)
2. ⬜ Set up Supabase database and RLS policies
3. ⬜ Implement Companies House API integration
4. ⬜ Build basic Next.js dashboard
5. ⬜ Implement Google Places integration
6. ⬜ Add web scraping with Playwright
7. ⬜ Implement daily scraping automation
8. ⬜ QA and testing
9. ⬜ Deploy to production

---

**CTO Decisions (2026-03-31):**
- Architecture: Hybrid approach (Companies House + Google Places + Scraping) ✅
- Tech stack: Supabase, Node.js, Playwright, Next.js ✅
- Database schema: companies + scrapes tables ✅
- RLS: Read-only for authenticated users ✅
- Pricing: SaaS tiers (£49-499/mo) for v1.0 ✅

---

**PM Agent Note:** This PRD is the source of truth for the leads-scraper-polystar project. All development work should align with these requirements and technical decisions.
