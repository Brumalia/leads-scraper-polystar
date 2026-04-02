# PRD v0.5 — UK Leads Scraper for Polystar

**Client:** Polystar
**Contact:** Jacqui Horne (Business Development Manager)
**Brokered by:** Corsus (corsus@agentmail.to)
**Last Updated:** 2026-04-02
**Status:** Requirements Approved — Awaiting Functional Design

---

## 1. Executive Summary

A web dashboard that scrapes UK manufacturers across multiple industries (food & drink, pharma, chemicals) in North England and delivers leads to Polystar.

**Primary Use Case:**
- Polystar needs leads of manufacturers in North England who produce/pack products in tins, bottles, or jars
- Product being sold: LDPE collation shrink film (polythene packaging) for multi-pack shrink wrapping
- Industries: Food & drink production, pharmaceutical manufacturing, chemical production (filterable in-app)
- Manual research is time-consuming and inefficient
- Automated scraping reduces research time and improves lead quality
- Weekly digest + on-demand lead generation from dashboard

**Contact:** Jacqui Horne (Business Development Manager at Polystar Plastics)
**Brokered by:** Corsus (corsus@agentmail.to)

---

## 2. Target Audience

**Primary:** Polystar sales team (Jacqui Horne)
- Needs weekly leads of manufacturers in North England
- Geographic boundary: Leicester as southern limit (North England only)
- Target companies: Those that produce/pack products in tins, bottles, or jars
- Industries: Food & drink, pharma, chemicals (filterable in-app)
- Wants accurate, up-to-date company information
- Requires web-based dashboard for easy access
- Weekly digest sent to Jacqui for review
- On-demand export from dashboard with custom filters

**Secondary:** Brumalia Studio (development team)
- Maintains and improves the scraper
- Monitors scraping performance and data quality
- Archive weekly snapshots for trend tracking

**Secondary:** Brumalia Studio (development team)
- Maintains and improves the scraper
- Monitors scraping performance and data quality

---

## 3. Core Features

### 3.1 Data Sources
- Business directories: 192.com, Yell.com (food manufacturers sections)
- Industry associations: Food & Drink Federation member lists
- Regional networks: Deliciously Yorkshire, North York Moors food producers, Yorkshire Dales National Park listings
- Company websites: For validation and detailed contact info
- **Companies House API:** Company registration data (UK) - structured data but lacks contact details
- **Google Places API:** Business locations and contact details - may miss small businesses
- **Web Scraping (Playwright):** Fills gaps in company information
- **Weekly Updates:** Automatic weekly data refresh (new independent producers frequently launch)

### 3.2 Data Fields Required (Per Lead)
- Company name
- Website URL
- Geographic location (city, county, verify it's north of Leicester)
- Primary products (tins/bottles/jars - verify fit)
- Contact details:
  - Email address (procurement/purchasing preferred)
  - Phone number
  - Physical address
- Company size indicators (if available):
  - Micro (<10 employees)
  - Small (10-50 employees)
  - Medium (50-250 employees)
- Notes (e.g., "has canning line", "contract bottler", etc.)
- Business type/industry
- Date scraped

### 3.3 Dashboard Features
- Web-based dashboard for lead viewing
- Filter by location/region
- Filter by industry (food & drink, pharma, chemicals, or all)
- Search by company name
- Export to CSV on-demand with custom filters applied
- Weekly leads count
- Weekly digest sent to Jacqui for review
- Archive weekly snapshots for trend tracking
- Prioritise companies that are actively growing/expanding (job postings, new product launches)
- Flag contract packers/bottlers separately (different customer segment)
- Include companies that offer contract manufacturing (higher volume needs)

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Dashboard load time: < 3 seconds
- Weekly scrape completion: < 30 minutes
- Concurrent users: 5-10

### 4.2 Reliability
- Scrape success rate: > 95%
- Weekly uptime: > 99%
- Data accuracy: > 90%
- Quality validation: Cross-reference multiple sources to verify active status

### 4.3 Technical Constraints
- Respect robots.txt and rate limits
- Focus on independent producers (not large conglomerates)
- Geographic filter: North England only (exclude Midlands and south, Leicester as southern limit)
- Industry filter: User-selectable (food & drink, pharma, chemicals, or all)
- Exclude retail/distribution unless they manufacture

### 4.4 Scalability
- Support up to 1000 leads per week
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
  website_url TEXT,
  location_city TEXT,
  location_county TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  physical_address TEXT,
  products TEXT, -- tins/bottles/jars
  business_type TEXT,
  company_size TEXT, -- micro/small/medium
  notes TEXT, -- e.g., "has canning line", "contract bottler"
  is_contract_packer BOOLEAN DEFAULT FALSE,
  is_contract_manufacturer BOOLEAN DEFAULT FALSE,
  is_growing BOOLEAN DEFAULT FALSE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrapes (tracking weekly runs)
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
CREATE INDEX idx_companies_location_city ON companies(location_city);
CREATE INDEX idx_companies_location_county ON companies(location_county);
CREATE INDEX idx_companies_products ON companies(products);
CREATE INDEX idx_companies_company_size ON companies(company_size);
CREATE INDEX idx_companies_scraped_at ON companies(scraped_at);
CREATE INDEX idx_companies_is_contract_packer ON companies(is_contract_packer);
CREATE INDEX idx_companies_is_growing ON companies(is_growing);
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
- Automated weekly scraping
- Improved UI/UX
- QA and deployment

### v1.0 Release (Target: 4-6 weeks)
- User authentication
- SaaS pricing tiers
- API for third-party integrations
- Marketing and launch

---

## 15. Decisions Made (2026-04-02)

### Decision 1: Industry Scope
**Question:** Only food & drink, or also pharma/chemicals?
**Answer:** Filterable in-app — user can select by industry (food & drink, pharma, chemicals, or all)
**Implementation:** Add industry filter to dashboard, include all relevant industries in scraping

### Decision 2: Email Drip Campaigns
**Question:** Automated or just leads delivered?
**Answer:** Both — weekly digest + on-demand export from dashboard with custom filters
**Implementation:** Weekly cron job sends digest; dashboard allows instant export with current search options

### Decision 3: Conversion Rate Expectation
**Question:** What's the target conversion rate?
**Answer:** Parked for now — not needed for POC
**Implementation:** Focus on lead quality and data accuracy first; conversion metrics added in v1.0

---

## 16. Categories Already Researched

### Craft Breweries (Examples)
- Hambleton Brewery (North Yorkshire)
- Brew York (York)
- Cloudwater Brew Co (Manchester)
- Full Circle Brew Co (Newcastle)

### Artisan Food Producers (Examples)
- Reet Yorkshire Food (jams, chutneys, sauces)
- Hawkshead Relish Company (preserves)

### Independent Distilleries (Examples)
- Wicstun Distillery (Market Weighton)
- Cooper King Distillery (Yorkshire Dales)
- Captain Cook Distillery (Stokesley)

---

## 17. Next Steps

1. ✅ Project structure created (2026-04-01)
2. ✅ Supabase database and RLS policies (2026-04-01)
3. ✅ Next.js dashboard with search/filters/pagination (2026-04-01)
4. ⬜ Implement industry filter (pharma/chemicals support)
5. ⬜ Implement Companies House API integration
6. ⬜ Implement Google Places integration
7. ⬜ Add web scraping with Playwright
8. ⬜ Implement weekly digest cron job
9. ⬜ QA and testing with agent-browser
10. ⬜ Deploy to production

**Process Note:** Dashboard was built outside of proper gates (2026-04-01). Must follow full process for remaining work: plan approval → build → QA → documentation → ship approval.

---

**CTO Decisions (2026-03-31):**
- Architecture: Hybrid approach (Companies House + Google Places + Scraping) ✅
- Tech stack: Supabase, Node.js, Playwright, Next.js ✅
- Database schema: companies + scrapes tables ✅
- RLS: Read-only for authenticated users ✅
- Pricing: SaaS tiers (£49-499/mo) for v1.0 ✅

**CTO Decisions (2026-04-02):**
- Industry filter: User-selectable in-app (food & drink, pharma, chemicals, or all) ✅
- Lead delivery: Both weekly digest + on-demand export from dashboard ✅
- Conversion metrics: Parked for now — not needed for POC ✅

---

**PM Agent Note:** This PRD is the source of truth for the leads-scraper-polystar project. All development work should align with these requirements and technical decisions.
