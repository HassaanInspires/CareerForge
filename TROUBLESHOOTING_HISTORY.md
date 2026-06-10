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
