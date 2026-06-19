# Quick Start Guide — Kinko Policy Analyser

Get the Policy Analyser running in 3 minutes.

---

## ⚡ 60-Second Setup

### Option 1: Using Python (Already Installed)
```bash
cd /Users/maruthi/Desktop/Kinko_Design/PolicyAnalyser
python -m http.server 8000
# Open: http://localhost:8000/screens/stage-1-landing.html
```

### Option 2: Using Node.js
```bash
cd /Users/maruthi/Desktop/Kinko_Design/PolicyAnalyser
npm install
npm start
# Opens automatically at http://localhost:8000
```

### Option 3: Using PHP
```bash
cd /Users/maruthi/Desktop/Kinko_Design/PolicyAnalyser
php -S localhost:8000
# Open: http://localhost:8000/screens/stage-1-landing.html
```

---

## 📂 Repository Structure

```
PolicyAnalyser/
├── 📄 README.md                ← Start here
├── 📄 QUICKSTART.md            ← This file
├── 📄 package.json             ← NPM scripts
├── 📄 .gitignore               ← Git ignore rules
│
├── 📁 tokens/                  ← Design tokens (DO NOT EDIT)
│   ├── colors.css
│   ├── semantic.css            ← USE THESE TOKENS
│   ├── spacing.css
│   ├── typography.css
│   └── index.css               ← Import this
│
├── 📁 css/                     ← Component stylesheets
│   ├── index.css               ← Main import file
│   ├── layout.css              ← Layout utilities
│   ├── button.css              ← Existing components
│   ├── input.css
│   ├── card.css
│   ├── alert.css
│   ├── score-display.css       ← NEW: Score circle
│   ├── upload-zone.css         ← NEW: File upload
│   ├── gap-card.css            ← NEW: Gap cards
│   ├── feature-table.css       ← NEW: Feature table
│   └── recommendation-card.css ← NEW: Recommendations
│
├── 📁 screens/                 ← All 7 funnel screens
│   ├── stage-1-landing.html    ← Landing page
│   ├── stage-2-upload.html     ← Upload PDF
│   ├── stage-3-confirm.html    ← Confirm details
│   ├── stage-4-preview.html    ← Free preview (HOOK)
│   ├── stage-5-lead-capture.html ← Lead form
│   ├── stage-6-full-report.html ← Full report
│   └── stage-7-ctas.html       ← Three CTAs
│
└── 📁 docs/
    └── DEVELOPER_GUIDE.md      ← Full implementation guide
```

---

## 🎨 Design System Quick Reference

### Colors (Use These!)
```css
/* Surfaces */
var(--surface-default)    /* White background */
var(--surface-secondary)  /* Light grey */

/* Text */
var(--text-primary)       /* Dark text */
var(--text-secondary)     /* Grey text */

/* Actions */
var(--action-primary)     /* Green buttons */
var(--action-secondary)   /* Navy buttons */
var(--action-destructive) /* Red/delete */
```

### Spacing
```css
var(--spacing-8)   /* Small gap */
var(--spacing-16)  /* Standard padding */
var(--spacing-24)  /* Section spacing */
var(--spacing-32)  /* Large spacing */
```

### Typography
```html
<h1 class="text-title-xl">Page Title</h1>
<h2 class="text-title-lg">Section Title</h2>
<p class="text-body-md">Body text</p>
<span class="text-caption-md">Caption</span>
```

---

## 🧩 Component Quick Reference

### Buttons
```html
<button class="btn btn--primary-lg">Primary</button>
<button class="btn btn--secondary-md">Secondary</button>
<button class="btn btn--ghost-sm">Ghost</button>
```

### Inputs
```html
<div class="input input--md">
  <input type="text" placeholder="Enter text">
</div>
```

### Cards
```html
<div class="card">
  <div style="padding: var(--spacing-16);">
    Card content here
  </div>
</div>
```

### Score Display
```html
<div class="score-display score-display--average">
  <div class="score-circle">
    <div class="score-value">62</div>
    <div class="score-divider">/</div>
    <div class="score-max">100</div>
  </div>
  <div class="score-category">Average</div>
</div>
```

### Gap Cards
```html
<div class="gap-card gap-card--high">
  <div class="gap-card__header">
    <div class="gap-card__icon">...</div>
    <div class="gap-card__content">
      <span class="gap-card__badge">High Priority</span>
      <div class="gap-card__title">Title</div>
      <div class="gap-card__description">...</div>
    </div>
  </div>
</div>
```

---

## 📱 The 7 Screens (Funnel Flow)

```
1. Landing Page → Upload CTA → Trust signals
       ↓
2. Upload → Drag-drop PDF → Validation
       ↓
3. Confirm → Policy details → User context form
       ↓
4. Free Preview → Score + Top 2 gaps → Lead CTA (HOOOK!)
       ↓
5. Lead Capture → Phone/email → Trust line
       ↓
6. Full Report → All gaps + Features + Recommendations
       ↓
7. Three CTAs → Advisor / Plans / Download
```

**Key Metric:** 8% lead capture rate (landing → phone submit)

---

## ⚙️ Configuration

### File Upload Limits
```javascript
// Stage 2 (upload zone)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf'];
```

### Score Categories
```javascript
// Stage 4 (preview) & Stage 6 (full report)
const SCORE_CATEGORIES = {
  excellent: { min: 85, max: 100, color: 'green' },
  good: { min: 70, max: 84, color: 'teal' },
  average: { min: 50, max: 69, color: 'yellow' },
  poor: { min: 0, max: 49, color: 'coral' }
};
```

### Form Validation
```javascript
// Stage 3 & Stage 5
const VALIDATION = {
  phone: { length: 10, pattern: /^\d{10}$/ },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  age: { min: 18, max: 100 },
  familySize: { min: 1, max: 15 }
};
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All 7 screens load without errors
- [ ] File upload works (drag-drop + click)
- [ ] Score animation plays
- [ ] Forms validate correctly
- [ ] All buttons/links work
- [ ] Responsive on all breakpoints
- [ ] Cross-browser tested

### Deployment
- [ ] Minify CSS (optional)
- [ ] Add analytics tracking
- [ ] Configure API endpoints
- [ ] Test on production URL
- [ ] Set up error monitoring

---

## 🐛 Common Issues

**Problem:** Styles not applying
- **Solution:** Check that `css/index.css` is imported

**Problem:** File upload not working
- **Solution:** Verify PDF is under 10MB

**Problem:** Score not animating
- **Solution:** Check browser console for errors

**Problem:** Responsive layout broken
- **Solution:** Test at different viewport widths

---

## 📞 Support

### Documentation
- **Full Guide:** `docs/DEVELOPER_GUIDE.md`
- **README:** `README.md`
- **Product Spec:** `/Specs/Policy_Analyser_Product_Spec_v2_0.md`

### Team Contacts
- **Product:** [Product Owner]
- **Design:** [Design Lead]
- **Engineering:** [Tech Lead]

---

## 🎯 Next Steps

1. **Read** `README.md` for architecture overview
2. **Review** `docs/DEVELOPER_GUIDE.md` for implementation
3. **Explore** screens to understand the flow
4. **Customize** components as needed
5. **Integrate** backend APIs
6. **Test** thoroughly before deployment

---

**Happy Coding! 🚀**

Built with ❤️ using Kinko Design System v2.0
