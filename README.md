# CareerForge: The Proof-of-Work Engine

CareerForge is an enterprise-grade AI career platform that flips the traditional resume builder on its head. Instead of generating inflated, generic fluff, CareerForge acts as a **Verification Engine**. It synthesizes a candidate's base CV, live GitHub repository metrics, and AI micro-assessment scores to create an unforgeable, data-backed **Verified Career Graph**.

## The Problem
Recruiters don't trust resumes anymore because Generative AI has made it effortless to hallucinate competence. Competitor AI builders exacerbate the problem by generating buzzwords without verifying skills.

## The CareerForge Solution
We build an "Employer Brief" that proves what a candidate can do through data, not adjectives.
1. **The Profile Hub:** Connect GitHub and run automated 10-minute AI technical challenges. Your verified skills and artifacts are securely logged to the database.
2. **The TargetMatch Engine:** Paste a target Job Description. Our AI fetches your Verified Graph and outputs a Brutal Reality Check. It highlights exactly where your *provable* skills match the job, and where you fall short.
3. **The Job Hunt Agent:** Search for remote and physical job listings, freelance platforms (Upwork, Fiverr, Freelancer), and LinkedIn in real time. The agent queries keyless engines (RemoteOK, The Muse, Remotive, Arbeitnow) and official company portal endpoints, applies an AI Relevance Gatekeeper filtering loop to discard search spam, audits listing authenticity, maps ATS fit compatibility, and builds custom copyable application pitch proposals.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase PostgreSQL with `pgvector` extension via Prisma ORM
- **Authentication:** NextAuth.js with bcryptjs
- **Styling:** Vanilla CSS (`globals.css`) & CSS Modules. Google Fonts are imported directly in CSS to allow 100% offline development compiling without `next/font/google` connection failures.
- **AI & Embedding Integration:** Hugging Face Inference (`all-MiniLM-L6-v2`) for vector embeddings, alongside support for Anthropic, OpenAI, Mistral, xAI. Tavily API can be configured in settings to run deep searches on LinkedIn and Freelance boards, with a built-in unauthenticated DuckDuckGo scraper fallback and keyless API integration for RemoteOK and The Muse.

## Getting Started

First, install the dependencies:
```bash
npm install
```

Set up your database:
```bash
npx prisma generate
```

To deploy/test the database schema locally or in production:
```bash
npx prisma db push
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You must register an account to access the Profile Hub and Verification tools. Admin users can access `/admin` to view platform analytics. Configuration for Tavily Search can be updated via the `/settings` route.
