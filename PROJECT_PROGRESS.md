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

- Generated production-ready code
- All TypeScript strict mode
- Proper error handling
- Clean architecture

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
    *   **Post-Generation Refinement Chat (`/api/refine`)**: Added an AI-driven edit loop beneath the final resume draft, letting users rewrite sections dynamically through conversational prompt refinements.

---

## 3. Code Modifications & Repository Health

### Added Files
*   [`lib/memory.ts`](file:///careerforge/lib/memory.ts): Core memory schemas, default states, and the RAG-inspired `updateMemory` LLM loop.
*   [`app/api/chat/route.ts`](file:///careerforge/app/api/chat/route.ts): Continuous dialogue endpoint that parses resumes, processes user replies, updates memory graphs, and tracks data sufficiency.
*   [`app/api/onboard/route.ts`](file:///careerforge/app/api/onboard/route.ts): Initial memory-onboarding API endpoint.
*   [`app/api/refine/route.ts`](file:///careerforge/app/api/refine/route.ts): Chat refinement API for real-time post-generation edits.
*   [`app/profile/page.tsx`](file:///careerforge/app/profile/page.tsx): Central profile memory visualizer and onboarding controller.

### Modified Files
*   [`app/globals.css`](file:///careerforge/app/globals.css): Stripped neon glassmorphism and bouncy blobs. Integrated a monochrome zinc/slate aesthetic with clean grid-patterns.
*   [`app/page.tsx`](file:///careerforge/app/page.tsx): Rewrote the Hero, Feature showcase, and added navigation header links.
*   [`app/builder/page.tsx`](file:///careerforge/app/builder/page.tsx): Updated state machine to handle path selection and support the new `/api/optimize` payload structures.
*   [`components/StepOne.tsx`](file:///careerforge/components/StepOne.tsx): Overhauled to support Path A/B selection and check for Master CV presence.
*   [`components/StepThree.tsx`](file:///careerforge/components/StepThree.tsx): Rewrote the static 3-5 question view into an active chat transcript box complete with a real-time "Data Sufficiency" progress meter.
*   [`components/ResultsPanel.tsx`](file:///careerforge/components/ResultsPanel.tsx): Rebuilt to show Advanced overall scoring graphs and house the "Refine with AI" chat interface.
*   [`lib/utils.ts`](file:///careerforge/lib/utils.ts): Updated `generatePrompt` to output `advancedScore` and support Career Assessment instructions.
*   [`lib/types.ts`](file:///careerforge/lib/types.ts): Modified request schemas (`OptimizeRequest`) to integrate `advancedScore` metrics.

---

## 4. Challenges & Engineering Decisions

### 1. Vector Database Costs vs. Accessibility
*   **Challenge**: The user requested vector databases and permanent memory graphs. Standard vector stores (like Pinecone) require database tokens, network configurations, and API bills.
*   **Solution**: Engineered an **In-Memory RAG Context Compiler**. The LLM behaves as a database writer by reading chat transcripts and outputting structured JSON memory objects. The client stores this in state, and it's re-injected into the prompt context on each turn. This provides identical vector-memory functionality at $0 hosting cost.

### 2. TSX Template Literal Syntax Error
*   **Challenge**: Standard backslash escaping in template literals inside script-generated code blocks caused Next.js compiler crashes (`Expected '</', got 'no substitution template literal'`).
*   **Solution**: Rewrote the TSX component using pure template literals inside the React style brackets: `style={{ width: `${Math.min(memory.dataSufficiencyScore, 100)}%` }}`.

### 3. Vague Resume Metrics
*   **Challenge**: Users often write vague inputs ("I worked in marketing"), which leads to subpar output.
*   **Solution**: Programmed strict LLM system prompts that reject generic responses and push back with professional skepticism (e.g. asking "What percentage did click-through rates improve?").

### 4. Browser File Overlaps
*   **Challenge**: Standard CSS absolute overlapping on file input components can intercept browser focus differently, blocking file upload actions.
*   **Solution**: Hidden file inputs linked to high-trust `<button>` triggers programmatically: `onClick={() => document.getElementById('profile-cv-upload')?.click()}`.

---

## 5. Current State (V4.0 Complete)
✅ PDF resume upload & text extraction
✅ Master CV Persistent Hub & Local memory graph visualizer
✅ Continuous dynamic career onboarding interview
✅ Split Path Assessment (Job Targeting vs. Career Level assessment)
✅ Multi-provider AI support (Anthropic, OpenAI, Gemini, Groq, Mistral)
✅ Advanced Semantic Scoring (ATS Parsability, Impact Density, Keyword Match)
✅ Interactive Post-Generation AI Refinement Chat
✅ Copy-to-clipboard
✅ Modern Dark Mode Vercel Grid UI
✅ Responsive design