# CAREERFORGE AGENT - WORKFLOW

**Version:** 1.0  
**Purpose:** Document how the AI agent processes user data and generates results

---

## 🧠 AGENT ARCHITECTURE

The CareerForge Agent is a **multi-step reasoning system** that analyzes resume + job description and generates tailored career content.

---

## 📋 INPUT DATA

Agent receives:
```json
{
  "resumeText": "string (extracted from PDF)",
  "jobDescription": "string (user pasted)",
  "smartQuestions": {
    "targetRole": "string (optional)",
    "industries": ["array", "of", "strings"],
    "achievements": "string (optional)",
    "skillsToEmphasize": ["array", "of", "skills"],
    "workStyle": "string (optional)"
  },
  "preferences": {
    "generateResume": boolean,
    "generateCoverLetter": boolean,
    "analyzeMissingSkills": boolean,
    "generateInterviewTips": boolean,
    "generateSalaryTalkingPoints": boolean,
    "generateLinkedInSummary": boolean
  },
  "provider": "anthropic | openai | gemini | groq | mistral",
  "model": "selected model name"
}
```

---

## 🔄 AGENT PROCESSING FLOW

### **PHASE 1: EXTRACT & PARSE**

**Task:** Clean and structure the input data

1. Extract text from resume PDF (pdfjs-dist)
2. Clean formatting (remove extra whitespace, standardize bullets)
3. Parse job description for:
   - Key skills (extract keywords)
   - Required experience level
   - Role title & company
   - Job requirements (must-have vs nice-to-have)
   - Tone & culture signals

4. Combine smart questions into context string:
   ```
   "User is targeting: [targetRole]
    Interested in: [industries]
    Key achievements: [achievements]
    Skills to highlight: [skillsToEmphasize]
    Work style: [workStyle]"
   ```

**Output:** Structured data ready for analysis

---

### **PHASE 2: ANALYSIS & MATCHING**

**Task:** Analyze alignment between resume and job

1. **Keyword Matching:**
   - Extract keywords from job description
   - Find matching keywords in resume
   - Calculate match percentage
   - Identify missing critical skills

2. **Experience Fit:**
   - Compare user's experience level with job requirements
   - Check for role progression alignment
   - Flag experience gaps

3. **Skill Gap Analysis:**
   - List required skills not in resume
   - Categorize: must-have, nice-to-have, bonus
   - Suggest which skills are most valuable

4. **Tone & Culture Fit:**
   - Analyze job description language/tone
   - Suggest how to adjust resume tone to match
   - Identify cultural keywords to incorporate

5. **Calculate Match Score:**
   ```
   Score = (Keyword Match % × 0.4) 
         + (Experience Fit % × 0.3) 
         + (Skills Match % × 0.2)
         + (Tone Alignment % × 0.1)
   
   Range: 0-100
   ```

**Output:** Detailed analysis with scores and gaps

---

### **PHASE 3: CONTENT GENERATION**

**Task:** Generate requested outputs (user selected in Step 4)

#### **A. Optimized Resume**
Agent rewrites resume sections:
1. **Summary/Objective:** Tailor to job role + use smart question context
2. **Experience:** Reorder by relevance, emphasize matching skills
3. **Skills:** Front-load required keywords, reorganize by importance
4. **Education:** Highlight relevant coursework/achievements
5. **Additions:** Add keywords naturally without being obvious

**Instruction to LLM:**
```
Rewrite this resume to match the job description.
Target role: [role]
Key skills needed: [skills]
User context: [smartQuestions]
Tone should match: [jobDescription tone]

Return resume in same format but optimized for this role.
```

---

#### **B. Cover Letter**
Agent writes personalized cover letter:
1. **Opening:** Reference company/role specifically
2. **Body:** Connect achievements to job requirements
3. **Skills Highlight:** Match 3-5 key skills from job posting
4. **Closing:** Strong call to action

**Instruction to LLM:**
```
Write a compelling cover letter for this role:
Resume: [resumeText]
Job Description: [jobDescription]
Company: [extracted from job description]
Target Role: [smartQuestions.targetRole]
Key selling points: [achievements]

Keep it professional but with [tone from job description].
Max 250 words.
```

---

#### **C. Missing Skills Analysis**
Agent creates actionable skill gap list:
1. **Critical Missing Skills:** Must-have but not in resume
2. **High-Value Skills:** Nice-to-have, would increase match
3. **Learning Path:** Suggested order to acquire skills
4. **Realistic Timeline:** How long each skill takes

**Instruction to LLM:**
```
Analyze these skill gaps:
- Required skills: [from job]
- User's skills: [from resume]
- Missing: [difference]

For each missing skill, provide:
1. Why it matters for this role
2. How to quickly demonstrate it
3. Resources to learn it
4. How to mention it in interview
```

---

#### **D. Interview Prep Tips**
Agent suggests interview talking points:
1. **Common questions for this role**
2. **How to address skill gaps in interview**
3. **STAR examples from resume to prepare**
4. **Questions to ask interviewer**
5. **Red flags to avoid**

**Instruction to LLM:**
```
Generate interview prep for this role:
Job: [jobDescription]
Resume: [resumeText]
Key skills tested: [extracted skills]

Provide:
- 5 likely interview questions
- How to answer them using STAR method
- How to turn weaknesses into positives
- Smart questions to ask back
```

---

#### **E. Salary Negotiation Talking Points**
Agent prepares negotiation strategy:
1. **Market rate research** (implied from job level)
2. **How to frame compensation discussion**
3. **Benefits to negotiate beyond salary**
4. **Red flags in offers**
5. **Walk-away number** (generic guidance)

**Instruction to LLM:**
```
Create salary negotiation guide for:
Role: [targetRole]
Experience level: [from resume]
Industry: [from job description]
Location: [if detectable]

Include:
- Market rate expectation (generic)
- How to discuss salary early
- Non-salary benefits to negotiate
- When to walk away
- Scripts for negotiation calls
```

---

#### **F. LinkedIn Summary Rewrite**
Agent optimizes LinkedIn headline + summary:
1. **Headline:** Keyword-optimized, role-focused
2. **Summary:** Professional but personable (GenZ-friendly tone)
3. **Call to action:** What you're looking for

**Instruction to LLM:**
```
Rewrite LinkedIn summary for this role:
Current resume: [resumeText]
Target role: [jobDescription]
User style: [workStyle]
Achievements: [achievements]

Provide:
- New headline (120 chars)
- New summary (500-800 chars)
- Updated call to action
- 3 keywords to add to profile
```

---

### **PHASE 4: COMPILE & RETURN**

**Task:** Format and return all generated content

Agent returns JSON:
```json
{
  "matchScore": 78,
  "matchBreakdown": {
    "keywordMatch": 80,
    "experienceFit": 75,
    "skillsMatch": 82,
    "toneAlignment": 70
  },
  "missingSkills": [
    {
      "skill": "Kubernetes",
      "priority": "high",
      "reason": "Required in 8 of 10 job postings for this role"
    }
  ],
  "optimizedResume": "string (full resume text)",
  "coverLetter": "string (full cover letter)",
  "interviewTips": {
    "likelyQuestions": ["array"],
    "starExamples": ["array"],
    "questionsToAsk": ["array"]
  },
  "salaryGuidance": {
    "marketRateRange": "string",
    "negotiationTips": ["array"]
  },
  "linkedInSummary": {
    "headline": "string",
    "summary": "string",
    "keywords": ["array"]
  }
}
```

Frontend then displays based on user's selected preferences.

---

## 🎯 PROMPT ENGINEERING STRATEGY

### **Provider-Specific Tuning**

**Anthropic Claude:**
- Best for nuanced, natural writing
- Use for cover letters, LinkedIn summaries
- Instruction: "Write naturally, like a real person, not generic"

**OpenAI GPT-4o:**
- Best for structured analysis
- Use for skill gaps, interview prep
- Instruction: "Provide bullet points and actionable advice"

**Google Gemini:**
- Fast, good at creative content
- Use for quick optimization, tips
- Instruction: "Be concise and impactful"

**Groq / Mistral:**
- Fast, good for analysis
- Use for match scoring, skill analysis
- Instruction: "Provide clear, ranked lists"

---

## ⚡ PERFORMANCE OPTIMIZATION

1. **Parallel Processing:**
   - Extract resume PDF while user pastes job description
   - Generate multiple outputs simultaneously (if multiple selected)

2. **Streaming:** 
   - If provider supports, stream results as they're generated
   - Shows user progress (avoids feeling stuck)

3. **Caching:**
   - Cache model lists per provider (expire every 1 hour)
   - Cache job description parsing (3 minutes)

4. **Timeouts:**
   - Max 30 seconds for full agent processing
   - Max 60 seconds for all outputs combined
   - Fail gracefully with partial results if timeout

---

## 🔐 ERROR HANDLING

| Error | Fallback |
|-------|----------|
| Invalid PDF | Show error, ask to re-upload |
| API key invalid | Try next available provider or use demo mode |
| API rate limit | Queue request, retry in 2 seconds |
| Model unavailable | Switch to next available model |
| Timeout | Return partial results (analysis only) |
| Network error | Show offline message, option to retry |

---

## 🧪 TESTING SCENARIOS

1. **Happy path:** All inputs valid, all outputs requested
2. **Partial inputs:** Skip smart questions, request only match score
3. **Edge case:** Very short resume, very long job description
4. **Error case:** Invalid API key, network timeout
5. **Performance:** Large PDF (100 pages), large job description (5000 chars)

---

**End of AGENT.md**
