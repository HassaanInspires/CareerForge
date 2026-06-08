# CAREERFORGE - DESIGN SYSTEM

**Version:** 1.0  
**Purpose:** Single source of truth for design tokens, colors, typography, and component patterns

---

## 🎨 COLOR PALETTE

### **Primary Colors (Dark Mode - Default)**

```css
/* Dark Base */
--color-bg-primary: #0f1419;      /* Charcoal - warmest black */
--color-bg-secondary: #1a1f2e;    /* Slightly lighter for depth */
--color-bg-tertiary: #252d3d;     /* For contrast sections */

/* Text */
--color-text-primary: #e0e0e0;    /* Light gray for main text */
--color-text-secondary: #9ca3af;  /* Muted for secondary text */
--color-text-disabled: #6b7280;   /* Disabled state */

/* Borders */
--color-border-light: #2d3748;    /* Subtle borders */
--color-border-medium: #4a5568;   /* More prominent borders */
```

### **Accent Colors (GenZ Vibe)**

```css
/* Primary Accent */
--color-accent-blue: #00d4ff;     /* Cyan/Electric Blue */
--color-accent-blue-dark: #0099cc;

/* Secondary Accent */
--color-accent-orange: #ff6b35;   /* Vibrant Orange */
--color-accent-orange-dark: #e55a2b;

/* Tertiary Accent */
--color-accent-purple: #8f00ff;   /* Cyber Purple */
--color-accent-purple-dark: #7400cc;

/* Bonus Accent */
--color-accent-green: #00ff41;    /* Neon Green */
--color-accent-green-dark: #00cc33;

/* Status Colors */
--color-success: #10b981;         /* Emerald */
--color-warning: #f59e0b;         /* Amber */
--color-error: #ef4444;           /* Rose */
--color-info: #3b82f6;            /* Blue */
```

### **Semantic Colors**

```css
/* Match Score Indicators */
--color-score-high: #10b981;      /* 80-100: Green */
--color-score-medium: #f59e0b;    /* 50-79: Amber */
--color-score-low: #ef4444;       /* 0-49: Red */

/* Interactive States */
--color-hover: rgba(0, 212, 255, 0.1);   /* Hover overlay */
--color-active: rgba(0, 212, 255, 0.2);  /* Active state */
--color-focus: #00d4ff;                  /* Focus ring */
```

---

## 🔤 TYPOGRAPHY

### **Font Stack**

```css
/* Headings - Bold, Weird, GenZ */
--font-heading: 'Space Mono', 'IBM Plex Mono', monospace;
--font-heading-weight: 700;  /* Bold */

/* Alternative heading (for variety) */
--font-heading-alt: 'Courier Prime', 'JetBrains Mono', monospace;

/* Body - Clean, Readable */
--font-body: 'Sora', 'Inter', 'Segoe UI', system-ui, sans-serif;
--font-body-weight: 400;

/* Code/Technical */
--font-mono: 'IBM Plex Mono', 'Consolas', monospace;
```

### **Font Sizes (Tailwind Scale)**

```css
/* Headings */
--text-6xl: 3.75rem;    /* 60px - Page title */
--text-5xl: 3rem;       /* 48px - Section heading */
--text-4xl: 2.25rem;    /* 36px - Subsection */
--text-3xl: 1.875rem;   /* 30px - Card heading */
--text-2xl: 1.5rem;     /* 24px - Step title */
--text-xl: 1.25rem;     /* 20px - Label */
--text-lg: 1.125rem;    /* 18px - Body large */
--text-base: 1rem;      /* 16px - Body standard */
--text-sm: 0.875rem;    /* 14px - Body small */
--text-xs: 0.75rem;     /* 12px - Caption */
```

### **Font Weights**

```css
--font-thin: 100;
--font-extralight: 200;
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;      /* Default for headings */
--font-extrabold: 800;
--font-black: 900;
```

### **Line Heights**

```css
--line-height-tight: 1.2;      /* Headings */
--line-height-normal: 1.5;     /* Body text */
--line-height-relaxed: 1.75;   /* Accessible reading */
```

---

## 🎯 COMPONENT PATTERNS

### **1. Glass Cards**

```css
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 212, 255, 0.08);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, transparent 100%);
  pointer-events: none;
}
```

### **2. Gradient Buttons**

```css
.btn-primary {
  background: linear-gradient(135deg, #00d4ff 0%, #8f00ff 100%);
  color: white;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 212, 255, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 500ms;
}

.btn-primary:hover::before {
  left: 100%;
}
```

### **3. Input Fields**

```css
.input-field {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  color: #e0e0e0;
  font-size: 1rem;
  font-family: var(--font-body);
  transition: all 200ms ease;
}

.input-field:focus {
  outline: none;
  border-color: #00d4ff;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 24px rgba(0, 212, 255, 0.15);
}

.input-field::placeholder {
  color: #6b7280;
}
```

### **4. Skill Badges**

```css
.badge {
  background: rgba(0, 212, 255, 0.15);
  border: 1px solid #00d4ff;
  color: #00d4ff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
  transition: all 200ms ease;
}

.badge:hover {
  background: rgba(0, 212, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
  transform: translateY(-2px);
}

.badge.priority-high {
  background: rgba(255, 107, 53, 0.15);
  border-color: #ff6b35;
  color: #ff6b35;
}

.badge.priority-medium {
  background: rgba(245, 158, 11, 0.15);
  border-color: #f59e0b;
  color: #f59e0b;
}
```

### **5. Progress Gauge (Match Score)**

```css
.match-score-gauge {
  position: relative;
  width: 120px;
  height: 120px;
}

.match-score-gauge svg {
  transform: rotate(-90deg);
}

.match-score-gauge circle:first-child {
  stroke: #2d3748;
  fill: none;
  stroke-width: 8;
}

.match-score-gauge circle:last-child {
  stroke: #00d4ff;
  fill: none;
  stroke-width: 8;
  stroke-dasharray: 251.2;
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  stroke-linecap: round;
}

.match-score-gauge.high circle:last-child {
  stroke: #10b981;
}

.match-score-gauge.medium circle:last-child {
  stroke: #f59e0b;
}

.match-score-gauge.low circle:last-child {
  stroke: #ef4444;
}
```

---

## 🎬 ANIMATION KEYFRAMES

### **Entrance Animations**

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

### **Bouncy Animations (GenZ Vibe)**

```css
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(24px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes wiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-2deg);
  }
  75% {
    transform: rotate(2deg);
  }
}
```

### **Loading Animations**

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
```

### **Micro-interactions**

```css
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 24px rgba(0, 212, 255, 0.8);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}
```

---

## 🎨 BACKGROUND & TEXTURE

### **Dark Mesh Background**

```css
.bg-mesh {
  background-color: #0f1419;
  background-image: 
    radial-gradient(at 20% 50%, rgba(0, 212, 255, 0.1) 0px, transparent 50%),
    radial-gradient(at 80% 80%, rgba(143, 0, 255, 0.1) 0px, transparent 50%),
    radial-gradient(at 40% 0%, rgba(255, 107, 53, 0.08) 0px, transparent 50%);
  animation: meshShift 20s ease-in-out infinite;
}

@keyframes meshShift {
  0%, 100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
}
```

### **Tech Doodles Overlay (Subtle)**

```css
.doodles-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/doodles.svg');
  background-size: 400px 400px;
  opacity: 0.03;
  pointer-events: none;
  z-index: -1;
}
```

---

## 🖥️ RESPONSIVE BREAKPOINTS

```css
/* Mobile First */
@media (min-width: 640px) {
  /* sm: Tablets */
}

@media (min-width: 768px) {
  /* md: Small laptops */
}

@media (min-width: 1024px) {
  /* lg: Desktop */
}

@media (min-width: 1280px) {
  /* xl: Large desktop */
}

@media (prefers-reduced-motion: reduce) {
  /* Respect user's motion preferences */
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📏 SPACING SCALE

```css
/* Tailwind scale (4px base) */
--space-0: 0;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

---

## 🎯 ACCESSIBILITY

### **Color Contrast**
- Text on background: Minimum 4.5:1 ratio (WCAG AA)
- Interactive elements: 3:1 ratio minimum

### **Focus States**
- All interactive elements have visible focus ring
- Focus color: #00d4ff with 2px outline

### **Motion**
- Respect `prefers-reduced-motion` media query
- All animations < 300ms (avoids motion sickness)

### **Responsive Text**
- Minimum font size: 14px (mobile)
- Line height: 1.5+ for readability

---

**End of DESIGN_SYSTEM.md**
