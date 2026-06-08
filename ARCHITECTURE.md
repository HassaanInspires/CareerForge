# CAREERFORGE - TECHNICAL ARCHITECTURE

**Version:** 1.0  
**Purpose:** Document system design, folder structure, API routes, data flow

---

## 🏗️ SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │ Page.tsx         │      │ Components/      │                │
│  │ (Main)           │  ←→  │ - StepOne        │                │
│  └──────────────────┘      │ - StepTwo        │                │
│                             │ - StepThree      │                │
│  ┌──────────────────┐      │ - StepFour       │                │
│  │ Store/           │  ←→  │ - StepFive       │                │
│  │ FormContext.ts   │      │ - Settings       │                │
│  │ (State Mgmt)     │      │ - ResultsPanel   │                │
│  └──────────────────┘      └──────────────────┘                │
│           ↓                                                      │
│  ┌──────────────────┐                                           │
│  │ axios/api.ts     │                                           │
│  │ (API Client)     │                                           │
│  └──────────────────┘                                           │
└──────────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────────────────────────────────────────────────┐
│                        NEXT.JS SERVER                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │ /api/optimize    │      │ /api/models      │                │
│  │ (Main agent)     │      │ (Provider models)│                │
│  └──────────────────┘      └──────────────────┘                │
│           ↓                          ↓                           │
│  ┌──────────────────────────────────────────┐                   │
│  │ lib/llm-providers.ts                     │                   │
│  │ (Unified LLM interface)                  │                   │
│  └──────────────────────────────────────────┘                   │
│           ↓                          ↓                           │
│  ┌──────────────────────────────────────────┐                   │
│  │ lib/pdfParser.ts                         │                   │
│  │ (PDF text extraction)                    │                   │
│  └──────────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────────────────────────────────────────────────┐
│                      EXTERNAL APIS                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Anthropic  │  │  OpenAI    │  │  Google    │                │
│  │  Claude    │  │   GPT-4o   │  │  Gemini    │                │
│  └────────────┘  └────────────┘  └────────────┘                │
│                                                                 │
│  ┌────────────┐  ┌────────────┐                                │
│  │   Groq     │  │  Mistral   │                                │
│  └────────────┘  └────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 PROJECT FOLDER STRUCTURE

```
resume-agent/
│
├── app/
│   ├── layout.tsx              # Root layout with globals.css
│   ├── page.tsx                # Main page (all steps, state mgmt)
│   │
│   └── api/
│       ├── optimize/
│       │   └── route.ts        # POST /api/optimize (main agent)
│       │
│       └── models/
│           └── route.ts        # POST /api/models (get provider models)
│
├── components/
│   ├── StepOne.tsx             # Resume upload
│   ├── StepTwo.tsx             # Job description
│   ├── StepThree.tsx           # Smart questions
│   ├── StepFour.tsx            # Preferences (what to generate)
│   ├── StepFive.tsx            # Results display
│   ├── Settings.tsx            # API key management
│   ├── ResultsPanel.tsx        # Display optimized content
│   └── LoadingSpinner.tsx      # Animated loader
│
├── lib/
│   ├── llm-providers.ts        # Unified interface for all providers
│   ├── pdfParser.ts            # PDF text extraction
│   ├── prompts.ts              # LLM prompt templates
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Helper functions
│
├── store/
│   └── FormContext.tsx         # State management (React Context)
│
├── public/
│   ├── bg-pattern.svg          # Background pattern (subtle)
│   ├── doodles.svg             # Tech doodles for background
│   └── bg-image.jpg            # Optional background image
│
├── styles/
│   ├── globals.css             # Global styles + animations
│   ├── animations.css          # Keyframe animations
│   └── glass-effects.css       # Glassmorphism utilities
│
├── .env.local                  # API keys (dev only)
├── .env.example                # Example env file
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind config with custom colors
├── next.config.ts              # Next.js config
├── package.json                # Dependencies
│
├── SPEC.md                     # Project specification
├── AGENT.md                    # Agent workflow
├── ARCHITECTURE.md             # This file
├── SKILL.md                    # Skill documentation
├── README.md                   # User guide
└── DESIGN_SYSTEM.md            # Design tokens & components
```

---

## 🔄 DATA FLOW

### **Step 1-2: Form Input Collection**

```
User Input (Resume PDF + Job Description)
    ↓
[FormContext] stores both as base64/text
    ↓
Step 2 validates PDF is readable
    ↓
Proceed to Step 3
```

---

### **Step 3: Smart Questions**

```
User answers optional questions
    ↓
[FormContext] stores answers (empty if skipped)
    ↓
Used later as context for LLM prompts
```

---

### **Step 4: Preferences Selection**

```
User checks what they want generated:
☐ Optimized Resume
☐ Cover Letter
☐ Missing Skills
☐ Interview Tips
☐ Salary Talking Points
☐ LinkedIn Summary
    ↓
[FormContext] stores preferences as boolean flags
```

---

### **Step 5: Agent Processing & Results**

```
User clicks "Generate"
    ↓
Frontend calls: POST /api/optimize
    ↓
[Request Payload]
{
  resumeBase64: "string",
  jobDescription: "string",
  smartQuestions: { ... },
  preferences: { ... },
  selectedProvider: "anthropic",
  selectedModel: "claude-3.5-sonnet"
}
    ↓
[Server Processing]
1. Decode resume base64 → extract PDF text (pdfjs)
2. Combine all inputs into single prompt
3. Call LLM provider API
4. Parse response → structured JSON
5. Return response to client
    ↓
[Frontend]
1. Receive response
2. Render results based on preferences
3. Show match score, missing skills, generated content
4. Enable copy/export buttons
```

---

## 🔌 API ROUTES

### **1. POST /api/optimize**

**Purpose:** Main agent processing

**Request Body:**
```typescript
{
  resumeBase64: string,      // Resume PDF as base64
  jobDescription: string,     // Raw job description text
  smartQuestions: {
    targetRole?: string,
    industries?: string[],
    achievements?: string,
    skillsToEmphasize?: string[],
    workStyle?: string
  },
  preferences: {
    generateResume: boolean,
    generateCoverLetter: boolean,
    analyzeMissingSkills: boolean,
    generateInterviewTips: boolean,
    generateSalaryTalkingPoints: boolean,
    generateLinkedInSummary: boolean
  },
  selectedProvider: "anthropic" | "openai" | "gemini" | "groq" | "mistral",
  selectedModel: string,      // e.g., "claude-3.5-sonnet"
  userApiKey?: string         // Optional: override env var
}
```

**Response:**
```typescript
{
  success: boolean,
  data: {
    matchScore: number (0-100),
    matchBreakdown: {
      keywordMatch: number,
      experienceFit: number,
      skillsMatch: number,
      toneAlignment: number
    },
    missingSkills: Array<{
      skill: string,
      priority: "high" | "medium" | "low",
      reason: string
    }>,
    optimizedResume?: string,
    coverLetter?: string,
    interviewTips?: { ... },
    salaryGuidance?: { ... },
    linkedInSummary?: { ... }
  },
  error?: string
}
```

---

### **2. POST /api/models**

**Purpose:** Fetch available models for selected provider

**Request Body:**
```typescript
{
  provider: "anthropic" | "openai" | "gemini" | "groq" | "mistral",
  apiKey: string  // User's API key
}
```

**Response:**
```typescript
{
  success: boolean,
  models: Array<{
    id: string,        // e.g., "claude-3.5-sonnet"
    name: string,      // e.g., "Claude 3.5 Sonnet"
    contextWindow: number,
    capabilities: string[]
  }>,
  error?: string
}
```

---

## 🧠 STATE MANAGEMENT

**Using React Context (FormContext.tsx)**

```typescript
interface FormState {
  // Step 1
  resumeBase64: string;
  resumeFileName: string;
  
  // Step 2
  jobDescription: string;
  
  // Step 3
  smartQuestions: {
    targetRole: string;
    industries: string[];
    achievements: string;
    skillsToEmphasize: string[];
    workStyle: string;
  };
  
  // Step 4
  preferences: {
    generateResume: boolean;
    generateCoverLetter: boolean;
    analyzeMissingSkills: boolean;
    generateInterviewTips: boolean;
    generateSalaryTalkingPoints: boolean;
    generateLinkedInSummary: boolean;
  };
  
  // Settings
  selectedProvider: string;
  selectedModel: string;
  apiKeys: Record<string, string[]>;
  
  // Results
  results: OptimizeResponse | null;
  loading: boolean;
  error: string | null;
}
```

---

## 🔐 SECURITY & API KEYS

### **Storage Strategy:**

1. **Client-side (localStorage):**
   - User's API keys stored encrypted (optional)
   - Can be cleared anytime
   - User has full control

2. **Server-side (.env.local):**
   - Fallback API keys for demo/testing
   - Never exposed to frontend
   - Never committed to git

3. **Hybrid Approach:**
   - Frontend priority: Use user's provided key
   - Fallback: Use server env var (if available)
   - Error: Show user "Enter API key" message

---

## 🚀 DEPLOYMENT

### **Vercel Deployment**

```bash
# Environment variables needed:
ANTHROPIC_API_KEY=sk_live_...
OPENAI_API_KEY=sk_...
GOOGLE_GENAI_API_KEY=...
GROQ_API_KEY=...
MISTRAL_API_KEY=...
```

### **Build & Deploy:**
```bash
npm run build
vercel deploy
```

---

## ⚙️ KEY TECHNOLOGIES

| Layer | Tech | Why |
|-------|------|-----|
| **Frontend** | Next.js 16 App Router | Fast, modern, React 19 |
| **Styling** | Tailwind CSS 4 | Utility-first, composable |
| **Animations** | CSS Keyframes + Framer Motion (optional) | GPU accelerated, smooth |
| **PDF** | pdfjs-dist | Client-side, no backend PDF processing |
| **State** | React Context | Simple, no external dependencies |
| **HTTP** | Axios | Simple, promise-based |
| **LLM** | Multiple providers | User flexibility |
| **Hosting** | Vercel | Optimized for Next.js |

---

## 🎯 PERFORMANCE TARGETS

| Metric | Target |
|--------|--------|
| Page Load | < 2 seconds |
| PDF Parsing | < 3 seconds |
| LLM Response | < 30 seconds |
| Total Time | < 35 seconds |
| Lighthouse Score | > 85 |
| FCP (First Contentful Paint) | < 1.5s |
| LCP (Largest Contentful Paint) | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.1 |

---

## 🔗 INTEGRATION POINTS

### **External APIs:**
- Anthropic Claude API
- OpenAI API
- Google Generative AI API
- Groq API
- Mistral API

### **Libraries:**
- pdfjs-dist (PDF parsing)
- axios (HTTP requests)
- react (UI)
- next (fullstack)
- tailwindcss (styling)

---

**End of ARCHITECTURE.md**
