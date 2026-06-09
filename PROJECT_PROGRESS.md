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

---

## 3. Code Modifications & Repository Health

### Key Enterprise Architectural Shifts
*   [`prisma/schema.prisma`](file:///careerforge/prisma/schema.prisma): Database definitions for `User`, `CandidateMemory` (with chatLog), `ProofOfWork`, `SessionHistory`, and `CareerChunk`.
*   [`lib/vector.ts`](file:///careerforge/lib/vector.ts): Hugging Face embedding pipeline and Prisma raw query similarity search engine.
*   [`app/api/auth/[...nextauth]/route.ts`](file:///careerforge/app/api/auth/[...nextauth]/route.ts): NextAuth.js authentication configuration with credentials and `bcryptjs`.
*   [`app/actions/memory.ts`](file:///careerforge/actions/memory.ts): Next.js Server Actions connecting the UI components to the Prisma database safely (memory, history, and chat logs).
*   [`app/admin/page.tsx`](file:///careerforge/app/admin/page.tsx): Secure server-side rendered Admin dashboard to monitor platform usage.
*   [`app/builder/page.tsx`](file:///careerforge/app/builder/page.tsx): Redesigned into the TargetMatch Engine, saving results straight to Postgres history.
*   [`app/profile/page.tsx`](file:///careerforge/app/profile/page.tsx): Candidate profile dashboard reading/writing entirely from/to database actions.
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
✅ Copy-to-clipboard
✅ Modern Dark Mode Vercel Grid UI
✅ Responsive design