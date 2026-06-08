# CareerForge Upgrades & Progress Chronicle

This document chronicles the design and architectural progression of CareerForge from its initial prototype state to the Enterprise V3.0 "Authenticity Engine."

---

markdown# CareerForge - Project Progress & Development Journey




## 1. Initial State Analysis (The Starting Point - June 8, 2026)
Started with:
- Empty folder
- 5 specification documents (SPEC.md, AGENT.md, ARCHITECTURE.md, SKILL.md, DESIGN_SYSTEM.md)
- Plan: Use Gemini CLI to generate code


When the project was first reviewed, CareerForge was a basic AI resume helper featuring:

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

---

## 3. Code Modifications & Repository Health

### Added Files
*   [`lib/memory.ts`](file:///careerforge/lib/memory.ts): Core memory schemas, default states, and the RAG-inspired `updateMemory` LLM loop.
*   [`app/api/chat/route.ts`](file:///careerforge/app/api/chat/route.ts): Continuous dialogue endpoint that parses resumes, processes user replies, updates memory graphs, and tracks data sufficiency.

### Modified Files
*   [`app/globals.css`](file:///careerforge/app/globals.css): Stripped neon glassmorphism and bouncy blobs. Integrated a monochrome zinc/slate aesthetic with clean grid-patterns.
*   [`app/page.tsx`](file:///careerforge/app/page.tsx): Rewrote the Hero and Feature showcase to align with the enterprise design.
*   [`app/builder/page.tsx`](file:///careerforge/app/builder/page.tsx): Updated state machines to swap `smartQuestions` payload arrays for the structured `CandidateMemory` object.
*   [`components/StepThree.tsx`](file:///careerforge/components/StepThree.tsx): Rewrote the static 3-5 question view into an active chat transcript box complete with a real-time "Data Sufficiency" progress meter.
*   [`lib/utils.ts`](file:///careerforge/lib/utils.ts): Updated `generatePrompt` to require `memory` structures and mandate Chain-of-Thought (`<thought>` block) output generation.
*   [`lib/types.ts`](file:///careerforge/lib/types.ts): Modified request schemas (`OptimizeRequest`) to integrate the custom `CandidateMemory` type.

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


## 5. Current State (MVP Complete)
✅ PDF resume upload & text extraction
✅ Job description input
✅ Multi-provider AI support (Anthropic, OpenAI, Gemini, Groq, Mistral)
✅ Resume optimization
✅ Match score (0-100)
✅ Missing skills analysis
✅ Cover letter generation
✅ Copy-to-clipboard
✅ Dark mode UI
✅ Responsive design