# RESUME AGENT - PROJECT SPECIFICATION

**Version:** 1.0  
**Status:** In Development  
**Target Ship Date:** Today (Phase 1)

---

## 🎯 PROJECT OVERVIEW

**Name:** `CareerForge` (GenZ-inspired AI career assistant)

**One-liner:** AI-powered resume optimizer that tailors your application in real-time for your dream role.

**Target Audience:** Everyone (students → career changers → professionals)

---

## ✨ CORE FEATURES

### **Multi-Step Form Flow**

```
Step 1: Resume Upload
   ↓
Step 2: Job Description Paste
   ↓
Step 3: Optional Smart Questions
   ↓
Step 4: Customization Preferences (User selects what to generate)
   ↓
Step 5: Results Display & Export
```

### **Step 1: Resume Upload**
- File upload (PDF only, <5MB)
- Visual feedback during upload
- Preview extracted text (optional)

### **Step 2: Job Description**
- Text area for job description paste
- Character count indicator
- Auto-detect role/company (optional AI hint)

### **Step 3: Optional Smart Questions**
Agent asks user to provide context:
1. **"What's your target role & seniority level?"** (Entry / Mid / Senior)
2. **"Which industries excite you?"** (Tech / Finance / Healthcare / etc)
3. **"Key achievements to highlight?"** (Free text - 2-3 bullet points)
4. **"Skills you want to emphasize?"** (Multi-select from resume)
5. **"What's your work style?"** (Collaborative / Independent / Leadership / etc)

*All optional - can skip all or answer selectively.*

### **Step 4: Customization Preferences (NEW)**
User selects what the agent generates:
- ☐ Optimized Resume
- ☐ Cover Letter
- ☐ Missing Skills Analysis
- ☐ Interview Prep Tips
- ☐ Salary Negotiation Talking Points
- ☐ LinkedIn Summary Rewrite

*User can select multiple; agent tailors output accordingly.*

### **Step 5: Results Display**
- Match Score (0-100 with visual gauge)
- Missing Skills (as badges)
- Generated content (optimized resume, cover letter, etc.)
- Copy/export buttons
- Save to memory (Phase 2)

---

## 🤖 AI AGENT BEHAVIOR

**Multi-Provider Support (Phase 1):**
- Anthropic Claude 3.5 Sonnet
- OpenAI GPT-4o
- Google Gemini 2.0
- Groq Mixtral
- Mistral 8x7b

**User can:**
- Store multiple API keys per provider
- Switch providers on the fly
- See available models dynamically fetch

**Agent Logic:**
1. Extract text from resume PDF
2. Parse job description
3. Analyze skill gaps, keyword matches, tone alignment
4. Generate customized content based on user selections
5. Calculate match score (keyword overlap, experience fit, style match)
6. Return all selected outputs

---

## 💾 DATA & MEMORY (Phase 1)

**Phase 1:** Stateless (no memory)
- User uploads → Gets results → Done
- Clean, fast, no friction

**Phase 2:** Professional Memory
- localStorage: Save past optimizations
- User can view history, compare versions
- Like Claude/ChatGPT session management

---

## 🎨 DESIGN SYSTEM

### **Color Palette**
- **Primary Dark:** #0f1419 (Charcoal - not pure black, warmer)
- **Primary Dark Accent:** #1a1f2e (Slightly lighter for depth)
- **Accent Colors:**
  - Electric Blue: #00d4ff
  - Vibrant Orange: #ff6b35
  - Cyber Purple: #8f00ff
  - Neon Green: #00ff41

- **Neutral:**
  - Text Light: #e0e0e0
  - Text Muted: #9ca3af
  - Border: #2d3748

### **Background & Imagery**
- **Base:** Dark charcoal (#0f1419) with subtle gradient
- **Background Elements:**
  - Animated gradient mesh (subtle motion, low CPU)
  - Tech-inspired doodles/shapes (geometric, minimal)
  - Blurred accent color circles (glassmorphism effect)
  - Optional: Tech pattern overlay (circuit board, code symbols - very subtle, ~5% opacity)

### **Typography**
- **Headings:** Space Mono Bold / IBM Plex Mono Bold (weird, bold, GenZ cool)
- **Body:** Sora Regular / Inter (clean, readable)
- **All from Google Fonts**

### **UI Components**
- **Glassmorphism:** Frosted glass cards (rgba + backdrop-blur)
- **Buttons:** Gradient fills (Blue → Purple), hover lift + glow
- **Inputs:** Transparent with border, focus glow effect
- **Badges:** Rounded pills with accent color
- **Animations:** Smooth, bouncy (no lag, <300ms)

---

## 🎬 ANIMATIONS & INTERACTIONS

### **Page Transitions**
- Fade in on page load (200ms ease-in-out)
- Slide in from bottom on step transitions (300ms)

### **Form Elements**
- Bouncy entrance (cubic-bezier(0.68, -0.55, 0.265, 1.55)) on focus
- Glow on hover (box-shadow with accent color)
- Smooth state changes (all 200ms)

### **Results Display**
- Match score gauge fills smoothly (1s animation)
- Results fade in + slide up (staggered timing)
- Skill badges pop in with bounce (100ms each, staggered)

### **Micro-interactions**
- Copy button: Brief success feedback (checkmark + color change)
- Loading state: Animated dots/spinner (minimal, elegant)
- Hover effects: Subtle lift (transform translateY)

### **Performance**
- Use CSS animations (GPU accelerated)
- Avoid JavaScript-driven animations where possible
- Keep animations <300ms for UI feedback
- Motion should feel "snappy" not "sluggish"

---

## 🔧 SETTINGS PANEL

**GenZ-Vibe Name:** "⚙️ Your Forge" or "🛠️ Config Hub" or "🔮 API Alchemy"

**Features:**
1. **API Key Management**
   - Buttons for each provider (with emoji icons)
   - Add/remove API keys per provider
   - Show active key status (dot indicator)
   - Fallback to env vars if no user key

2. **Model Selection**
   - Dropdown for provider
   - Auto-fetch available models for that provider
   - Display model size/capability hint

3. **Preferences**
   - Dark/Light mode toggle (dark default)
   - Animation speed (fast/normal/slow)
   - Result export format (PDF/TXT)

---

## 📊 TECH STACK

- **Frontend:** Next.js 16+ (App Router)
- **Styling:** Tailwind CSS 4 + Custom CSS for animations
- **PDF Processing:** pdfjs-dist (client-side parsing)
- **API Calls:** Axios
- **LLM Providers:** Anthropic, OpenAI, Google, Groq, Mistral
- **Deployment:** Vercel
- **Repository:** GitHub

---

## 🚀 WHAT IT DOES

✅ User uploads resume (PDF)  
✅ User pastes job description  
✅ User answers optional smart questions  
✅ User selects which outputs to generate  
✅ Agent analyzes and generates customized resume, cover letter, missing skills, etc.  
✅ User sees match score + results  
✅ User can copy or export results  

---

## ❌ WHAT IT DOESN'T DO (Phase 1)

❌ Save history / memory  
❌ Job search integration  
❌ LinkedIn auto-apply  
❌ Video interview coaching  
❌ Multi-language support  

---

## 📈 SUCCESS METRICS

- ✅ Loads in <3 seconds
- ✅ Zero console errors
- ✅ All providers work (with valid API keys)
- ✅ Results generated in <30 seconds
- ✅ Mobile responsive
- ✅ Animations smooth (60fps)
- ✅ GitHub repo with 50+ stars (stretch goal)

---

## 🎯 PHASE 1 DELIVERABLES

1. ✅ Multi-step form (5 steps)
2. ✅ 5 smart questions
3. ✅ Customization preferences
4. ✅ 5 provider support
5. ✅ Dark GenZ design with cool background
6. ✅ Glassmorphism UI
7. ✅ Bouncy animations
8. ✅ Results display with match score
9. ✅ Copy/export functionality
10. ✅ Deployed to Vercel
11. ✅ GitHub repo ready

---

## 🎬 PHASE 2 (FUTURE)

- Professional memory system
- Advanced analytics
- Multi-language support
- Export to LinkedIn
- Interview prep integration
- Salary negotiation coaching

---

**End of SPEC.md**
