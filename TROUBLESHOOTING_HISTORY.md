# CareerForge - Engineering Troubleshooting & Incident History

This document serves as a comprehensive history of the core problems, bugs, side-effects, and chain reactions encountered during the development and scaling of the CareerForge platform, and how they were resolved.

---

## 📋 Table of Incidents

| Bug/Incident | Root Cause | Chain Reactions | Resolution | Status |
|---|---|---|---|---|
| **1. The Infinite CV Upload Loop** | Client-only state and lack of database persistence prior to AI extraction. | AI extraction errors caused the entire upload to discard, forcing users to re-upload on every refresh. | Implemented database-persisted resume files (`saveUserResumeFile` server action) BEFORE AI calls. | ✅ Fixed |
| **2. Silent Extraction Failures** | Backend API errors (missing keys, model mismatches) were caught but silenced on the frontend. | Users clicked "Fetch Details" and nothing happened, leading to extreme frustration. | Added raw error stack banners and a green success notification panel. | ✅ Fixed |
| **3. PDF Worker Path Serverless Crash** | PDFJS worker filesystem absolute path resolution failed in Vercel's serverless runtime. | Bypassing path settings triggered canvas dependency crashes. | Migrated parser to `unpdf` (zero native dependencies) and updated next.config. | ✅ Fixed |
| **4. Strict Provider Lockout** | Hard requirement on Anthropic key, failing even if the user had Groq/Mistral keys configured. | Site-wide features locked out unless the user supplied an Anthropic key. | Built a centralized `resolveActiveLLM` fallback resolver. | ✅ Fixed |
| **5. DuckDuckGo Scraper Blocks** | DDG search engine blocked standard search agent GET requests as bots. | Search yielded empty results or timed out completely. | Converted crawler to HTTP POST form submission to bypass bot detection. | ✅ Fixed |
| **6. Irrelevant Search Listings** | DDG web queries returned guidebooks, directories, and blog posts instead of active jobs. | Candidate listings page flooded with useless non-jobs. | Inserted an AI Relevance Gatekeeper LLM step to audit and discard noise. | ✅ Fixed |
| **7. Adzuna Sign-up Friction** | Adzuna API required a long developer registration phase before keys were issued. | High barrier to entry; users couldn't test the agent's job matching capabilities immediately. | Integrated RemoteOK's keyless feed and made Adzuna API optional. | ✅ Fixed |
| **8. Stale/Out-of-Date Search Postings** | API feeds were merged sequentially without sorting, leaving new keyless postings cut off at the bottom. | Search results showed old/stale jobs rather than the latest postings. | Normalized dates across all engines and sorted all combined jobs chronologically. | ✅ Fixed |
| **9. Job List Size Cut-Down** | AI Relevance Gatekeeper filtered out non-matching jobs, reducing output below requested 6/12 limits. | Roster page returned very few jobs (e.g. 1 or 2 instead of 6/12). | Implemented an automated fuzzy-matched backfill safety fallback. | ✅ Fixed |
| **10. Irrelevant Crawl Bloat** | General API feeds (Arbeitnow) imported non-matching jobs, while quoted query formats caused search engines to return empty lists. | Roster was flooded with unrelated local positions (e.g., German-language SEO editors and electro-technical leads). | Switched to unquoted query formats, calculated a match density score, and strictly filtered out 0-match listings. | ✅ Fixed |
| **11. GitHub Connection Lacks Codebase Audits** | The GitHub integration only fetched generic metadata (stars, language) without inspecting repository source code or markdown files. | Portfolios lacked deep technical descriptions, stack breakdowns, and architectural analysis. | Enabled README.md fetching/decoding and added parallel LLM technical audits for the top 5 repos. | ✅ Fixed |
| **12. Mobile Layout & Static Memory Graph** | Header navigation links were hidden on mobile screens, and memory graph skills and metrics were static. | Mobile users couldn't navigate the platform or manually edit/sync their skills. | Built a toggleable Hamburger button and responsive overlay, created inline builders with remove buttons, and synced GitHub repos. | ✅ Fixed |

---

## 🔍 Incident Details & Post-Mortems

### 1. The Infinite CV Upload Loop
*   **The Symptom**: Users uploaded their resume, clicked around, refreshed or came back to the Profile Hub, and were prompted to upload their CV all over again. No metrics or skills were displayed.
*   **The Root Cause**: Resume files and AI-extracted details were stored in temporary state. If the AI extraction API failed, the database was never updated with the resume file metadata, discarding the upload completely.
*   **The Fix**:
    *   Created the `saveUserResumeFile` server action in [memory.ts](file:///home/hassaan/my_ai_project/careerforge/app/actions/memory.ts) to write base64 files and filenames to the PostgreSQL user profile immediately upon drop/select.
    *   Hooked it to run BEFORE `/api/onboard` is triggered, guaranteeing the file is saved even if AI parsing fails.

### 2. Silent Extraction Failures
*   **The Symptom**: Users clicked "Fetch Details" or "Extract Details" on empty skills metrics, but the system did nothing and gave no feedback.
*   **The Root Cause**: API errors (e.g., `Missing API Key`, `Model not supported`) returned a `500` status code but were caught in generic frontend catch-blocks without updating the UI state.
*   **The Fix**:
    *   Built state-driven message boxes (`errorMsg`, `successMsg`) in [page.tsx](file:///home/hassaan/my_ai_project/careerforge/app/profile/page.tsx).
    *   Renders a red alert banner displaying the exact error message returned by the server, and a dismissible green light banner on successful extraction.

### 3. Vercel Serverless PDF worker Crash
*   **The Symptom**: When running in production on Vercel, uploading a PDF or clicking "Fetch Details" returned a crash:
    `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
*   **The Root Cause**: Mozilla's `pdfjs-dist` worker configuration used a filesystem path resolution:
    `path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs')`
    In Vercel’s serverless functions, the `node_modules` directory is tree-shaken and packaged separately, causing a fatal file-not-found crash.
*   **The Fix**:
    *   Migrated the parser from `pdfjs-dist` to **`unpdf`** in [documentParser.ts](file:///home/hassaan/my_ai_project/careerforge/lib/documentParser.ts). `unpdf` is a pure-JavaScript ESM wrapper that provides native Node/serverless compatibility with zero external filesystem workers or native canvas dependencies.
    *   Added `serverExternalPackages: ['pdfjs-dist']` to `next.config.ts`.

### 4. Strict Provider Lockout
*   **The Symptom**: The application defaulted to Anthropic as the active provider. If the user only configured a Groq or Mistral key, clicking onboard or chat immediately crashed with a `Missing API Key for anthropic` error.
*   **The Root Cause**: Backend routes (`/api/onboard`, `/api/chat`, etc.) loaded settings and strictly validated the active provider without checking if keys were available on other configured providers.
*   **The Fix**:
    *   Designed a centralized resolver utility `resolveActiveLLM` in [llm-providers.ts](file:///home/hassaan/my_ai_project/careerforge/lib/llm-providers.ts).
    *   **Fallback Logic**: If the active provider is missing a key, it checks the other providers in priority order (`groq`, `mistral`, `openai`, `gemini`, `anthropic`). If a fallback key exists, it returns those credentials and its default model.
    *   Synchronized this resolver across both the frontend page initializer and all backend API endpoints.

### 5. DuckDuckGo Scraper Blocks
*   **The Symptom**: Search queries to DuckDuckGo returned 0 jobs or timed out.
*   **The Root Cause**: DuckDuckGo detected standard programmatic HTTP `GET` requests to its search query URL and served anti-bot redirection challenges.
*   **The Fix**:
    *   Refactored the crawler to send URL-encoded form data using HTTP `POST` requests directly to `https://html.duckduckgo.com/html/` with modern browser user-agents. This bypasses the scraper wall cleanly.

### 6. Irrelevant Search Listings (Search Noise)
*   **The Symptom**: Searching for web developer roles returned developer guides, GitHub repos, blogs, or setup templates instead of live career postings.
*   **The Root Cause**: General search engines index any page containing query terms.
*   **The Fix**:
    *   Introduced the **AI Relevance Gatekeeper** step in `/api/jobs/search/route.ts`. Before calculating scores, a lightweight LLM validation loop inspects snippets, company names, and locations, filtering out non-job postings and retaining 100% relevant opportunities.

### 7. Adzuna API Developer Sign-up Barrier
*   **The Symptom**: Search results required user-provided Adzuna App IDs and Keys, requiring users to register on Adzuna's developer site.
*   **The Root Cause**: API endpoints returned search warnings or empty blocks if keys were absent.
*   **The Fix**:
    *   Integrated **RemoteOK's** public JSON feed (`https://remoteok.com/api?tag=...`) which does not require authentication keys, ensuring immediate out-of-the-box search capacity. Marked Adzuna credentials as optional in the settings page.

### 8. Stale/Out-of-Date Search Postings
*   **The Symptom**: Job listings returned older opportunities rather than fresh ones.
*   **The Root Cause**: Multi-source crawls merged lists sequentially, meaning newer results from sources appended later (like RemoteOK/Remotive) were pushed out of the evaluated list when sliced.
*   **The Fix**:
    *   Normalized date fields from all engines into a unified `postedTimestamp` property.
    *   Sorted the full consolidated `dedupedJobs` list descending (newest first) before sending it to the evaluation filters.
    *   Appended `&df=m` to DuckDuckGo search queries to limit crawls to listings from the past month.

### 9. Job List Size Cut-Down
*   **The Symptom**: Users selected "deep" search (12 items) or "quick" search (6 items) but the returned results had fewer listings (often only 1-3 jobs).
*   **The Root Cause**: The AI Relevance Gatekeeper filtered out non-jobs and spam links, reducing the remaining list size.
*   **The Fix**:
    *   Implemented a backfill safeguard in `/api/jobs/search/route.ts`. If the AI Relevance Gatekeeper filters reduce the list size below the requested quota (6 or 12), the backend backfills the remaining slots using fuzzy keyword matched jobs from the original crawled pool.

### 10. Irrelevant Crawl Bloat & Quoted Search Fallbacks
*   **The Symptom**: Search queries returned completely irrelevant local jobs (like Electro-Leittechnik or SEO Editor) even when searching for specific developer roles.
*   **The Root Cause**: Double quotes forced search engines to lookup the exact long search query. When no exact match was found, search engines defaulted to generic listings. Simultaneously, unfiltered general API feeds (like Arbeitnow) were injected directly without matching the search term.
*   **The Fix**:
    *   Replaced double quotes with unquoted keyword lists to give search engines flexible search capabilities.
    *   Implemented a local `calculateRelevanceScore` keyword density scorer.
    *   Strictly discarded any job listing with a relevance score of 0 (no matching keywords).
    *   Sorted listings primarily by match relevance score (descending) and secondarily by date freshness (newest first).

### 11. GitHub Connection Lacks Codebase Audits
*   **The Symptom**: Connecting a GitHub account imported repositories with only basic title and stars metrics, failing to extract the candidate's actual skills or tech stack usage.
*   **The Root Cause**: The integration did not fetch README.md files or run codebase-level semantic parsing.
*   **The Fix**:
    *   Added README.md retrieval and decoded base64 contents inside `app/api/github/route.ts`.
    *   Integrated parallel LLM technical audits to extract structured metrics (`aiSummary`, `aiSkills`, `aiArchitecture`, and `aiComplexity`).
    *   Redesigned the portfolio UI cards to visually render tech badges, architecture details, and project complexity ratings.

### 12. Mobile Layout & Static Memory Graph
*   **The Symptom**: Users on mobile devices had no way to navigate between pages (Profile Hub, Builder, Job Hunt Agent, etc.) because the nav links were hidden. Additionally, the Profile Hub's skills and verifiable metrics were read-only and didn't automatically ingest connected GitHub repos.
*   **The Root Cause**: The CSS class `hidden md:flex` hid the nav links on mobile, but no Hamburger or mobile drawer was provided. Similarly, the Profile Hub loaded CandidateMemory fields directly from the database without offering interactive inputs or syncing proof-of-work skills.
*   **The Fix**:
    *   Created a responsive Hamburger button and a slide-down glassmorphic menu in `components/SiteLayout.tsx`.
    *   Added custom tag builders and list input fields under the "Long-Term Memory Graph" card in `app/profile/page.tsx`, directly wired to update and trigger server-side database saves.
    *   Updated `saveUserMemory` server action to automatically read connected `ProofOfWork` items, extract skills (`aiSkills`), format project milestones, and merge them cleanly into the user's permanent memory profile.

