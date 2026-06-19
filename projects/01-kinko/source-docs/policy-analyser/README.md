# Kinko Policy Analyser

A complete design system and implementation for the Kinko Policy Analyser — a lead acquisition tool that analyses health insurance policies and provides actionable recommendations.

## 📋 Overview

The Policy Analyser is a marketing funnel tool that:
1. Accepts policy PDF uploads from non-Kinko users
2. Analyses the policy against industry benchmarks
3. Provides a free score preview
4. Captures lead information (phone/email)
5. Delivers a full report with recommendations
6. Offers three conversion paths

**Version:** 2.0
**Last Updated:** May 2026
**Status:** Production Ready

---

## 🗂️ Repository Structure

```
PolicyAnalyser/
├── tokens/              # Design tokens (colors, spacing, typography, etc.)
│   ├── colors.css
│   ├── semantic.css
│   ├── spacing.css
│   ├── radius.css
│   ├── typography.css
│   ├── borders.css
│   ├── opacity.css
│   ├── overlays.css
│   ├── shadows.css
│   ├── index.css
│   └── source/          # JSON source files (Figma sync)
│
├── css/                 # Component stylesheets
│   ├── index.css        # Main import file
│   ├── layout.css       # Layout utilities
│   ├── button.css       # Button component
│   ├── input.css        # Input field component
│   ├── card.css         # Card component
│   ├── alert.css        # Alert component
│   ├── label.css        # Label/badge component
│   ├── divider.css      # Divider component
│   ├── icon-button.css  # Icon button component
│   ├── score-display.css    # Score circle component (NEW)
│   ├── upload-zone.css      # File upload component (NEW)
│   ├── gap-card.css         # Policy gap card (NEW)
│   ├── feature-table.css    # 18-feature table (NEW)
│   └── recommendation-card.css # Priority recommendations (NEW)
│
├── screens/             # All 7 funnel screens
│   ├── stage-1-landing.html
│   ├── stage-2-upload.html
│   ├── stage-3-confirm.html
│   ├── stage-4-preview.html
│   ├── stage-5-lead-capture.html
│   ├── stage-6-full-report.html
│   └── stage-7-ctas.html
│
├── components/          # Component documentation (optional)
├── assets/              # Images, icons, fonts
├── docs/                # Additional documentation
└── README.md            # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for testing)
- No build tools required — pure HTML/CSS

### Running Locally

1. **Clone or copy the repository:**
   ```bash
   cd /path/to/Kinko_Design/PolicyAnalyser
   ```

2. **Start a local server:**
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js
   npx serve

   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser:**
   ```
   http://localhost:8000/screens/stage-1-landing.html
   ```

### No Build Process

This implementation uses **pure HTML and CSS** with no build tools required:
- No npm/yarn install
- No webpack/vite
- No postcss
- Just open the HTML files in a browser!

---

## 🎨 Design System

### Token Architecture

The design system uses a **3-layer token architecture**:

```
Primitive → Semantic → Component
```

1. **Primitives** (`colors.css`): Raw color values
2. **Semantic** (`semantic.css`): Purpose-driven aliases (USE THESE)
3. **Component**: Component-specific tokens

### Using Tokens

**✅ CORRECT:**
```css
.my-component {
  background-color: var(--surface-default);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  padding: var(--spacing-16);
  border-radius: var(--radius-12);
}
```

**❌ WRONG:**
```css
.my-component {
  background-color: #ffffff;  /* Hardcoded! */
  color: #212121;              /* Hardcoded! */
  padding: 16px;               /* Hardcoded! */
}
```

### Color Tokens

| Category | Example | Usage |
|----------|---------|-------|
| `--surface-*` | `--surface-default` | Backgrounds |
| `--text-*` | `--text-primary` | Text colors |
| `--action-*` | `--action-primary` | Buttons, links |
| `--border-*` | `--border-default` | Borders |
| `--feedback-*` | `--feedback-success` | Status messages |

### Typography

Always use text classes:
```html
<h1 class="text-title-xl">Page Title</h1>
<p class="text-body-md">Body text</p>
<span class="text-caption-md">Caption</span>
```

### Spacing

Use spacing tokens:
```css
margin-bottom: var(--spacing-16);
gap: var(--spacing-12);
padding: var(--spacing-20);
```

---

## 🧩 Components

### Existing Components (Copied from Kinko Design System)

- **Button** - Primary, Secondary, Ghost, Destructive × SM/MD/LG
- **Input** - Text fields, selects, textareas
- **Card** - Surface container with elevation
- **Alert** - Success, warning, error, info messages
- **Label** - Status badges and chips
- **Divider** - Horizontal and vertical dividers
- **Icon Button** - Icon-only buttons

### New Components (Policy Analyser Specific)

#### Score Display (`score-display.css`)
Circular score indicator with category label.

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

**Variants:**
- `score-display--excellent` (85-100)
- `score-display--good` (70-84)
- `score-display--average` (50-69)
- `score-display--poor` (<50)

#### Upload Zone (`upload-zone.css`)
File upload with drag-and-drop support.

```html
<div class="upload-zone">
  <input type="file" class="upload-zone__input" accept=".pdf">
  <div class="upload-zone__default">
    <svg class="upload-zone__icon">...</svg>
    <div class="upload-zone__title">Drop your PDF here</div>
  </div>
</div>
```

**States:**
- Default, dragover, error, success, uploading
- Max file size: 10MB
- Supported: PDF only

#### Gap Card (`gap-card.css`)
Displays policy gaps with severity levels.

```html
<div class="gap-card gap-card--high">
  <div class="gap-card__header">
    <div class="gap-card__icon">...</div>
    <div class="gap-card__content">
      <span class="gap-card__badge">High Priority</span>
      <div class="gap-card__title">Gap title</div>
      <div class="gap-card__description">Explanation</div>
    </div>
  </div>
</div>
```

**Variants:**
- `gap-card--high` (red)
- `gap-card--medium` (yellow)
- `gap-card--low` (green)
- `gap-card--strength` (for positives)

#### Feature Table (`feature-table.css`)
18-feature breakdown table.

```html
<div class="feature-table">
  <div class="feature-table__header">...</div>
  <div class="feature-table__row">...</div>
</div>
```

**Status:**
- `feature-table__status--success` (✓)
- `feature-table__status--warning` (⚠)
- `feature-table__status--error` (✗)

#### Recommendation Card (`recommendation-card.css`)
Priority-coded recommendations.

```html
<div class="recommendation-card recommendation-card--high">
  <span class="recommendation-card__priority">High Priority</span>
  <h3 class="recommendation-card__title">Title</h3>
  <p class="recommendation-card__description">...</p>
  <div class="recommendation-card__consider">...</div>
</div>
```

---

## 📱 The 7 Screens

### Stage 1: Landing Page
**File:** `stage-1-landing.html`
- Hero section with value prop
- Upload CTA
- Trust signals
- Sample report thumbnail

### Stage 2: Upload
**File:** `stage-2-upload.html`
- Drag-drop file upload zone
- File validation (PDF, <10MB)
- Upload progress
- Error handling
- Alternative manual flow link

### Stage 3: Confirm
**File:** `stage-3-confirm.html`
- Policy details (read-only)
- User context form (city, family size, age)
- Validation
- Analysis trigger

### Stage 4: Free Preview
**File:** `stage-4-preview.html`
- Score display (animated)
- Top 2 gaps revealed
- Teaser for full report
- Lead capture CTA

### Stage 5: Lead Capture
**File:** `stage-5-lead-capture.html`
- Name (required)
- Phone (required, 10-digit)
- Email (optional)
- Trust line
- Privacy note

### Stage 6: Full Report
**File:** `stage-6-full-report.html`
- Complete score breakdown
- At-a-glance stats
- What's good (3 items)
- What's not good (2 items)
- What's missing (3 items)
- 18-feature table (expandable)
- Recommendations
- Next steps CTA

### Stage 7: Three CTAs
**File:** `stage-7-ctas.html`
- Talk to an advisor (calendar booking)
- See Kinko plans (filtered marketplace)
- Download report (PDF generation)
- Disclaimer
- Footer links

---

## 🔧 Customization

### Changing Colors

1. Edit `tokens/semantic.css`
2. Update semantic token values
3. All components update automatically

### Changing Spacing

Edit `tokens/spacing.css` to adjust the spacing scale.

### Adding New Features

1. Create component CSS in `css/`
2. Import in `css/index.css`
3. Use in screens with proper token usage

---

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Features used:**
- CSS Custom Properties (variables)
- CSS Grid
- Flexbox
- ES6 JavaScript

---

## 📊 Engineering Dependencies

For production implementation:

| Capability | Dependency | Critical |
|------------|------------|----------|
| PDF parser | ML/rule-based parser | Yes |
| Policy catalog DB | Top 20 insurers data | Yes |
| Lead → CRM | Marketing tech stack | Yes |
| PDF generation | PDF service | Yes |
| Calendar booking | Calendly/etc | Yes |
| Marketplace filter | Product database | Yes |
| Auto-delete | Cron job (7 days) | Yes |

---

## 📈 Success Metrics

| Metric | Target |
|--------|--------|
| Landing → Upload | 25% |
| Upload → Confirm | 80% |
| Preview → Lead | 40% |
| Overall lead rate | 8% |
| Lead → CTA click | 50% |

---

## 🔒 Privacy & Data

- **PDF Storage:** 7 days, auto-deleted
- **Lead Data:** 90 days in CRM
- **No spam promise:** Explicit user commitment
- **Third parties:** None

---

## 📝 License

Proprietary - Kinko / A23 Coverly

---

## 👥 Support

For questions or issues:
- Product: [Product Team]
- Design: [Design Team]
- Engineering: [Engineering Team]

---

**Built with Kinko Design System v2.0**
