# CareerForge: The Proof-of-Work Engine

CareerForge is an enterprise-grade AI career platform that flips the traditional resume builder on its head. Instead of generating inflated, generic fluff, CareerForge acts as a **Verification Engine**. It synthesizes a candidate's base CV, live GitHub repository metrics, and AI micro-assessment scores to create an unforgeable, data-backed **Verified Career Graph**.

## The Problem
Recruiters don't trust resumes anymore because Generative AI has made it effortless to hallucinate competence. Competitor AI builders exacerbate the problem by generating buzzwords without verifying skills.

## The CareerForge Solution
We build an "Employer Brief" that proves what a candidate can do through data, not adjectives.
1. **The Profile Hub:** Connect GitHub and run automated 10-minute AI technical challenges. Your verified skills and artifacts are securely logged to the database.
2. **The TargetMatch Engine:** Paste a target Job Description. Our AI fetches your Verified Graph and outputs a Brutal Reality Check. It highlights exactly where your *provable* skills match the job, and where you fall short.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase PostgreSQL with `pgvector` extension via Prisma ORM
- **Authentication:** NextAuth.js with bcryptjs
- **Styling:** Vanilla CSS (`index.css`) & CSS Modules
- **AI & Embedding Integration:** Hugging Face Inference (`all-MiniLM-L6-v2`) for vector embeddings, alongside support for Anthropic, OpenAI, Mistral, xAI.

## Getting Started

First, install the dependencies:
```bash
npm install
```

Set up your database:
```bash
npx prisma generate
npx prisma db push
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You must register an account to access the Profile Hub and Verification tools. Admin users can access `/admin` to view platform analytics.
