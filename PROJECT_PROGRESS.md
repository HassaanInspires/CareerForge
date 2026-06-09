# CareerForge - Project Progress & Development Journey

## 1. Initial State Analysis (The Starting Point - June 8, 2026)
Started with:
- Empty folder
- 5 specification documents (SPEC.md, AGENT.md, ARCHITECTURE.md, SKILL.md, DESIGN_SYSTEM.md)
- Plan: Use Gemini CLI to generate code

### Challenges Faced:
- Gemini CLI generated incomplete/broken code
- npm naming restrictions (uppercase folder name)
- PDF parsing library compatibility
- Inconsistent code quality from CLI
*   **Rudimentary Layout**: A simple, rigid 4-step wizard that processed input synchronously.
*   **Superficial Design**: A neon-accented "GenZ" glassmorphic UI overlay with bright background blobs and bouncy entrance animations. While flashy, it lacked professional high-trust appeal.
*   **Static Prompts**: Standard system prompts that output generic AI buzzwords ("Spearheaded", "Leveraged", "Synergy") which are heavily flagged by modern corporate Applicant Tracking Systems (ATS).
*   **No Chat Memory**: A rigid questionnaire step that asked 3-5 pre-determined questions sequentially without adapting to or preserving user response history.

---

## 2. Solution: Switched to Antigravity and Iterative Development & Upgrades (Phases)

### Phase 1: Settings Hub & Dynamic Configuration (V2.0)
*   **Objective**: Solve AI model deprecation issues (like Groq's `llama3-70b-8192` shutdown) and allow modular keys.
*   **Implementation**:
    *   Designed `/settings` to validate API keys in real-time.
    *   Queried available LLM endpoints dynamically per provider.
    *   Allowed local persistence of keys and custom Model IDs in `localStorage`.

### Phase 2: The V3.0 Pivot (Enterprise Architecture)
*   **Objective**: Solve low ATS placement rates, generic resume outputs, and frustrating user engagement flow.
*   **Implementation**:
    *   **Persistent memory system**: Created a client-state JSON profile memory (`lib/memory.ts`) that tracks candidate core skills, metrics, goals, and gaps.
    *   **Continuous Chat Engine**: Refactored Step Three to host an interactive conversation loop (`/api/chat`), acting like a professional executive coach to extract quantitative business impact.
    *   **Strict Security & Guardrails**: Enforced Chain-of-Thought reasoning. Added system instructions to reject non-career related queries, scrub AI fluff words, and block metrics hallucinations.

### Phase 3: The Career Command Center (V4.0)
*   **Objective**: Solve the inconvenience of repeating resume uploads, introduce career level path tracking, provide professional multi-dimensional grading, and enable post-generation interactive editing.
*   **Implementation**:
    *   **Persistent Profile Hub (`/profile`)**: Implemented a dashboard where users upload their CV once. It initializes their permanent memory and allows updating it via a direct onboarding chat.
    *   **Divergent Paths**: Split the builder flow into Path A (Specific Job target optimization) and Path B (Career level & market fit assessment).
    *   **Advanced Semantic Scoring**: Overhauled the simple 0-100 metric into multi-dimensional cards evaluating ATS parsability, impact density, and keyword alignment.

### Phase 4: The Enterprise Database & Sync Pivot (V5.0)
*   **Objective**: Solve "hallucinated fluff" by enforcing Provable Competence. Shift from an "AI Resume Builder" to a **Proof-of-Work (PoW) Verification Engine**.
*   **Implementation**:
    *   **Database Migration**: Removed `localStorage` and implemented **Prisma** with a **SQLite** database. All candidate data (memory, verified skills, PoW artifacts) is now securely stored.
    *   **Authentication**: Integrated **NextAuth.js** with secure Credentials login.
    *   **Admin Panel**: Built a protected `/admin` route to manage registered users and view system statistics.
    *   **TargetMatch Engine**: Rewrote the Builder flow into a job targeting engine. Users paste a job description, and the AI cross-references their verified data to generate an "Employer Brief" and "Brutal Reality Check".
    *   **Deep Sync**: Re-engineered the application's data flow to synchronize the Proof-of-Work data with the main TargetMatch AI prompts using Next.js Server Actions.

### Phase 5: Cloud Database & pgvector Semantic RAG Search (V6.0)
*   **Objective**: Lower LLM token consumption, scale context window handling, and replace all remaining client-side local storage hacks.
*   **Implementation**:
    *   **Supabase PostgreSQL Migration**: Replaced local SQLite with Supabase PostgreSQL cloud hosting.
    *   **pgvector & Hugging Face Embeddings**: Integrated Hugging Face Inference (`all-MiniLM-L6-v2`) to chunk and embed CV profiles into 384-dimensional vectors saved directly to Supabase.
    *   **Semantic RAG Chat & Match**: Connected route handlers to run cosine similarity queries, injecting matching chunks dynamically into the LLM prompt.
    *   **Full Database Session Sync**: Migrated all chat histories and builder match archives to database-backed persistent tables.

### Phase 6: Agentic Job Matcher & Authenticity Validator (V7.0)
*   **Objective**: Allow real-time search of actual job openings, automatically verify job trust ratings to filter fake companies, calculate match compatibility fit, and prevent upload failures from unconfigured API keys.
*   **Implementation**:
    *   **Onboarding Setup Guards**: Integrated proactive warning banners in `/profile` when LLM provider keys are missing in localStorage, preventing silent processing failures.
    *   **Crawlers & Search Engines**: Implemented `/api/jobs/search` querying real-time free job streams (Remotive & Arbeitnow) matching user keywords and locations.
    *   **AI Authenticity Trust Engine**: Built an evaluation agent checking the listing's specifications against fake/spam indicators and generating a Company Trust Score (%).
    *   **Fit Score Roster**: Displays ATS compatibility percentages showing matching and missing skills compared to the user's permanent Postgres graph memory.

### Phase 7: Freelancer & LinkedIn Deep Search & Application Strategy Builder (V8.0)
*   **Objective**: Search freelance platforms (Upwork, Fiverr, Freelancer) and LinkedIn, search official company portals directly, and build personalized pitches/proposals with salary negotiation tips.
*   **Implementation**:
    *   **Tavily Search API**: Added input support in `/settings` to store a free Tavily Search API Key.
    *   **Free DuckDuckGo HTML Scraper**: Engineered an unauthenticated scraping parser to scrape DuckDuckGo search results for free if no Tavily key is entered.
    *   **Freelance Site targeting**: Constructors generate specific `site:` search queries, finding matches across LinkedIn, Upwork, Fiverr, and Freelancer.
    *   **Pitch & Proposal strategy endpoint (`/api/jobs/apply`)**: A server handler that pulls candidate memory from Postgres, compares it to the job description, and generates customized pitches, salary negotiations, attachments lists, and checklist prep plans.
    *   **Proposal Modal Dashboard**: Designed a modal window on `/jobs` rendering custom cover letters, rate strategies, and attachments with copy buttons.

### Phase 8: Enterprise API Key Database Persistence (V9.0)
*   **Objective**: Centralize configuration variables and sensitive API keys inside the Supabase database, securing client credentials, and enabling multi-device configuration synchronization.
*   **Implementation**:
    *   **Prisma User Settings Migration**: Added `apiKeys`, `selectedModels`, `activeProvider`, `aiRealism`, and `tavilyKey` directly to the `User` schema.
    *   **Server Actions Integration**: Implemented server-side settings read/write operations mapping variables to the DB.
    *   **Route Handler Settings Fallbacks**: Updated `/api/models`, `/api/jobs/search`, `/api/jobs/apply`, `/api/chat`, `/api/optimize`, `/api/challenge/generate`, `/api/challenge/evaluate`, and `/api/refine` to fallback dynamically to the database-backed configuration settings if request payloads are omitted or incomplete.
    *   **CSS Variable Adjustments**: Cleaned up layout font overrides in `app/globals.css`.

---

## 3. Code Modifications & Repository Health

### Key Enterprise Architectural Shifts
*   [`prisma/schema.prisma`](file:///careerforge/prisma/schema.prisma): Database definitions for `User`, `CandidateMemory` (with chatLog), `ProofOfWork`, `SessionHistory`, and `CareerChunk`.
*   [`lib/vector.ts`](file:///careerforge/lib/vector.ts): Hugging Face embedding pipeline and Prisma raw query similarity search engine.
*   [`app/api/auth/[...nextauth]/route.ts`](file:///careerforge/app/api/auth/[...nextauth]/route.ts): NextAuth.js authentication configuration with credentials and `bcryptjs`.
*   [`app/actions/memory.ts`](file:///careerforge/actions/memory.ts): Next.js Server Actions connecting the UI components to the Prisma database safely (memory, history, and chat logs).
*   [`app/admin/page.tsx`](file:///careerforge/app/admin/page.tsx): Secure server-side rendered Admin dashboard to monitor platform usage.
*   [`app/builder/page.tsx`](file:///careerforge/app/builder/page.tsx): Redesigned into the TargetMatch Engine, saving results straight to Postgres history.
*   [`app/profile/page.tsx`](file:///careerforge/app/profile/page.tsx): Candidate profile dashboard reading/writing entirely from/to database actions, adding missing key warnings.
*   [`app/jobs/page.tsx`](file:///careerforge/app/jobs/page.tsx): Job Hunt Agent interface displaying real-time vacancies, trust/fit analyses, and custom proposal generation modals.
*   [`app/api/jobs/search/route.ts`](file:///careerforge/api/jobs/search/route.ts): Background agent crawler executing public matches, Tavily API calls, DuckDuckGo free scraper queries, and JSON validation.
*   [`app/api/jobs/apply/route.ts`](file:///careerforge/app/api/jobs/apply/route.ts): Strategic cover letter and proposal builder pulling credentials from Postgres memory.
*   [`app/api/chat/route.ts`](file:///careerforge/app/api/chat/route.ts): RAG-capable conversation loop that reads candidate context from pgvector chunks.

---

## 4. Challenges & Engineering Decisions

### 1. Vector Database Costs vs. Accessibility
*   **Solution**: Engineered an **In-Memory RAG Context Compiler**. The LLM behaves as a database writer by reading chat transcripts and outputting structured JSON memory objects.

### 2. Transition from Local Storage to Server DB
*   **Challenge**: The application heavily relied on synchronous `localStorage` hooks. Converting this to an asynchronous database model without breaking React state flow was tricky.
*   **Solution**: Introduced Next.js Server Actions and `useSession` hooks. The `useEffect` blocks were refactored to securely fetch profile data only when the user is `authenticated`.

### 3. Vague Resume Metrics & ATS Limitations
*   **Challenge**: Users write vague inputs, leading to generic outputs.
*   **Solution**: Programmed strict LLM system prompts that reject generic responses and introduced the "Brutal Reality Check" which evaluates claims directly against Proof of Work.

### 4. Prisma V5 Compatibility
*   **Challenge**: Encountered schema validation errors due to differences between Prisma versions and Next.js Turbopack compiler.
*   **Solution**: Standardized on Prisma v5 with proper database URL injection and ran targeted schema generation during build time.

### 5. Offline & Containerized Font Resolution Issues
*   **Challenge**: The Next.js build compilation failed inside restricted internet environment due to Google Font fetch failures inside `next/font/google`.
*   **Solution**: Bypassed compile-time Google Font fetching by migrating font imports directly into `app/globals.css` with native system fallback stacks, allowing Next.js to build offline successfully.

---

## 5. Current State (Enterprise Verification Engine Complete)
✅ Full Cloud Database Integration (Prisma / Supabase PostgreSQL)
✅ pgvector Semantic RAG Search (Hugging Face `all-MiniLM-L6-v2`)
✅ Decoupled all Local Storage dependencies (Chat logs and match history stored in cloud Postgres)
✅ User Authentication & Secure Routing (NextAuth)
✅ Admin Dashboard for Platform Metrics
✅ Master CV Persistent Hub connected to DB
✅ GitHub & Simulator Proof-of-Work Data Syncing
✅ TargetMatch Engine for Brutal Reality Checks
✅ Continuous dynamic career onboarding interview
✅ Multi-provider AI support (Anthropic, OpenAI, Gemini, Groq, Mistral)
✅ Advanced Semantic Scoring (ATS Parsability, Impact Density, Keyword Match)
✅ Interactive Post-Generation AI Refinement Chat
✅ Adjustable AI Coaching Realism setting (Brutal Realism vs Supportive Coaching)
✅ Agentic Job Matcher & Authenticity Validator dashboard (/jobs)
✅ Live Remotive & Arbeitnow crawlers without custom search API fees
✅ Tavily Deep Search Integration + unauthenticated DuckDuckGo scraper fallback
✅ Freelance (Upwork, Fiverr, Freelancer) and LinkedIn deep targeting
✅ AI Proposal & Tailored Application Pitch strategy builder (/api/jobs/apply)
✅ Google Font offline compilation compile-time bypass
✅ Copy-to-clipboard
✅ Modern Dark Mode Vercel Grid UI
✅ Responsive design