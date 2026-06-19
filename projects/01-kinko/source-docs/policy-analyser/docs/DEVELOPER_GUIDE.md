# Developer Guide — Kinko Policy Analyser

Complete implementation guide for developers working on the Policy Analyser.

---

## 🏗️ Architecture Overview

### Technology Stack

- **Frontend:** Pure HTML5 + CSS3 + Vanilla JavaScript
- **Design Tokens:** CSS Custom Properties
- **Components:** Atomic design pattern
- **Responsive:** Mobile-first (390px → 768px → 1024px → 1920px)
- **Build:** None required

### File Dependencies

```
screen.html
    ↓ imports
css/index.css
    ↓ imports
tokens/*.css + component CSS files
```

**Import Rule:** Every screen must import `css/index.css` and nothing else.

```html
<link rel="stylesheet" href="../css/index.css">
```

---

## 🎨 Working with Design Tokens

### Golden Rule: Never Hardcode Values

**❌ WRONG:**
```css
.button {
  background-color: #009b1a;
  padding: 16px;
  border-radius: 8px;
}
```

**✅ CORRECT:**
```css
.button {
  background-color: var(--action-primary);
  padding: var(--spacing-16);
  border-radius: var(--radius-8);
}
```

### Token Hierarchy

Always prefer semantic tokens over primitives:

**✅ CORRECT:**
```css
.card {
  background: var(--surface-default);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
```

**⚠️ ACCEPTABLE (when no semantic exists):**
```css
.custom-element {
  background: var(--color-primary-green-50);
}
```

### Available Tokens

#### Colors
```css
/* Surfaces */
--surface-default          /* White */
--surface-secondary        /* Light grey */
--surface-tertiary         /* Medium grey */
--surface-brand            /* Light green */

/* Text */
--text-primary             /* Dark navy */
--text-secondary           /* Medium grey */
--text-tertiary            /* Light grey */

/* Actions */
--action-primary           /* Green */
--action-secondary         /* Navy */
--action-destructive       /* Red */

/* Feedback */
--feedback-success         /* Success backgrounds */
--feedback-error           /* Error backgrounds */
```

#### Spacing
```css
--spacing-2   /* 2px */
--spacing-4   /* 4px */
--spacing-6   /* 6px */
--spacing-8   /* 8px */
--spacing-12  /* 12px */
--spacing-16  /* 16px */
--spacing-20  /* 20px */
--spacing-24  /* 24px */
--spacing-32  /* 32px */
--spacing-48  /* 48px */
--spacing-64  /* 64px */
```

#### Radius
```css
--radius-2    /* 2px */
--radius-4    /* 4px */
--radius-6    /* 6px */
--radius-8    /* 8px */
--radius-12   /* 12px */
--radius-16   /* 16px */
--radius-pill /* 9999px */
```

---

## 🧩 Component Development

### Creating a New Component

#### 1. Create the CSS File

Create `css/my-component.css`:

```css
/* =============================================================================
   MY COMPONENT — Component tokens
   ============================================================================= */

:root {
  /* Component tokens - ALWAYS alias semantic tokens */
  --my-component-bg: var(--surface-default);
  --my-component-text: var(--text-primary);
  --my-component-border: var(--border-default);
  --my-component-padding: var(--spacing-16);
}

/* =============================================================================
   Component styles
   ============================================================================= */

.my-component {
  background-color: var(--my-component-bg);
  color: var(--my-component-text);
  border: 1px solid var(--my-component-border);
  padding: var(--my-component-padding);
  border-radius: var(--radius-12);
}

.my-element {
  /* Always use tokens */
  margin-bottom: var(--spacing-12);
}

/* States */
.my-component:hover {
  border-color: var(--border-focus);
}

.my-component:active {
  transform: scale(0.98);
}

.my-component--disabled {
  opacity: var(--opacity-disabled);
  pointer-events: none;
}
```

#### 2. Import in index.css

Add to `css/index.css`:

```css
@import url('my-component.css');
```

#### 3. Use in HTML

```html
<div class="my-component">
  <div class="my-element">Content</div>
</div>
```

### Component Naming Convention

**CSS Classes:**
- Component: `.component-name` (kebab-case)
- Element: `.component-name__element` (BEM optional)
- Modifier: `.component-name--modifier` (BEM optional)

**Example:**
```html
<div class="gap-card gap-card--high">
  <div class="gap-card__header">...</div>
  <div class="gap-card__content">...</div>
</div>
```

---

## 📱 Screen Development

### Screen Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Screen Title | Kinko Policy Analyser</title>
  <link rel="stylesheet" href="../css/index.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <div class="screen">
    <!-- Optional header -->
    <div class="top-nav">...</div>

    <!-- Main content -->
    <div class="screen__content">
      <!-- Sections -->
      <div class="section">...</div>
      <div class="section">...</div>
    </div>

    <!-- Optional footer -->
    <div class="footer-dock">...</div>
  </div>

  <script>
    // Screen-specific JavaScript
  </script>
</body>
</html>
```

### Responsive Breakpoints

```css
/* Mobile first (default) */
.element {
  padding: var(--spacing-16);
}

/* iPad (768px+) */
@media (min-width: 768px) {
  .element {
    padding: var(--spacing-24);
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .element {
    padding: var(--spacing-32);
  }
}

/* FHD (1920px+) */
@media (min-width: 1920px) {
  .screen__content {
    max-width: 1200px;
  }
}
```

---

## 🔌 JavaScript Integration

### File Upload Handler

```javascript
const fileInput = document.getElementById('fileInput');
const uploadZone = document.querySelector('.upload-zone');

// Handle file selection
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];

  // Validate file type
  if (file && file.type === 'application/pdf') {
    // Validate file size (10MB max)
    if (file.size <= 10 * 1024 * 1024) {
      uploadZone.classList.add('upload-zone--has-file');
      updatePreview(file);
      uploadFile(file);
    } else {
      showError('File too large. Max size is 10MB.');
    }
  } else {
    showError('Please upload a PDF file.');
  }
});

// Drag and drop
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('upload-zone--dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('upload-zone--dragover');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('upload-zone--dragover');

  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') {
    fileInput.files = e.dataTransfer.files;
    uploadZone.classList.add('upload-zone--has-file');
    uploadFile(file);
  }
});

// Upload simulation
function uploadFile(file) {
  uploadZone.classList.add('upload-zone--uploading');

  // Simulate upload progress
  let progress = 0;
  const progressBar = document.querySelector('.upload-zone__progress-bar');
  const interval = setInterval(() => {
    progress += 10;
    progressBar.style.width = `${progress}%`;

    if (progress >= 100) {
      clearInterval(interval);
      uploadZone.classList.remove('upload-zone--uploading');
      uploadZone.classList.add('upload-zone--success');
      // Proceed to next screen
      setTimeout(() => {
        window.location.href = 'stage-3-confirm.html';
      }, 1000);
    }
  }, 200);
}
```

### Form Validation

```javascript
const form = document.querySelector('form');
const phoneInput = document.getElementById('phone');

// Phone formatting
phoneInput.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
  if (value.length > 10) value = value.slice(0, 10);
  e.target.value = value;
});

// Form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Validate phone
  const phone = phoneInput.value;
  if (phone.length !== 10) {
    showError('Please enter a valid 10-digit phone number');
    return;
  }

  // Validate required fields
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add('input--error');
    }
  });

  if (!isValid) {
    showError('Please fill in all required fields');
    return;
  }

  // Submit to backend
  submitLead(formData);
});

function submitLead(data) {
  // API call to backend
  fetch('/api/lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.location.href = 'stage-6-full-report.html';
    } else {
      showError(data.message);
    }
  })
  .catch(error => {
    showError('Something went wrong. Please try again.');
  });
}
```

### Score Animation

```javascript
function animateScore(element, targetScore, duration = 1000) {
  const startTime = performance.now();
  const startScore = 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function for smooth animation
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentScore = Math.floor(startScore + (targetScore - startScore) * easeOut);

    element.textContent = currentScore;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// Usage
const scoreElement = document.querySelector('.score-value');
animateScore(scoreElement, 62, 1500);
```

---

## 🔧 Backend Integration

### API Endpoints

#### 1. Upload & Parse
```
POST /api/upload
Content-Type: multipart/form-data

Request:
- file: PDF file

Response:
{
  "success": true,
  "policy": {
    "insurer": "Star Health",
    "plan": "Family Health Optima",
    "sumInsured": 1000000,
    "policyNumber": "POL123456"
  }
}
```

#### 2. Analyse Policy
```
POST /api/analyse
Content-Type: application/json

Request:
{
  "insurer": "Star Health",
  "plan": "Family Health Optima",
  "sumInsured": 1000000,
  "city": "Bangalore",
  "familySize": 3,
  "age": 34
}

Response:
{
  "success": true,
  "score": 62,
  "category": "Average",
  "gaps": [...],
  "strengths": [...],
  "features": [...]
}
```

#### 3. Submit Lead
```
POST /api/lead
Content-Type: application/json

Request:
{
  "name": "Rajesh",
  "phone": "+91XXXXXXXXXX",
  "email": "rajesh@example.com",
  "policyData": {...},
  "score": 62
}

Response:
{
  "success": true,
  "leadId": "lead_123456"
}
```

#### 4. Generate PDF
```
GET /api/report/:leadId

Response:
- PDF file download
```

---

## 🐛 Debugging

### Common Issues

#### 1. Tokens Not Working
**Symptom:** Styles not applying, colors showing as default

**Solution:**
- Verify `css/index.css` is imported
- Check token name is correct
- Use browser DevTools to inspect computed values

#### 2. Components Not Responsive
**Symptom:** Layout breaks on different screen sizes

**Solution:**
- Check media queries are using `min-width`
- Verify breakpoint values (390, 768, 1024, 1920)
- Test with browser DevTools responsive mode

#### 3. JavaScript Not Running
**Symptom:** Interactions not working

**Solution:**
- Check script is after HTML content
- Verify no console errors
- Ensure elements exist before attaching event listeners

---

## 📊 Testing Checklist

### Before Deploying

- [ ] All screens open without errors
- [ ] All components render correctly
- [ ] Responsive design tested on all breakpoints
- [ ] Forms validate correctly
- [ ] File upload works
- [ ] Score animation plays
- [ ] All buttons/links work
- [ ] No hardcoded values in CSS
- [ ] All tokens resolve correctly
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Mobile tested (iOS Safari, Chrome Android)

---

## 🚀 Deployment

### Static Hosting

The Policy Analyser can be deployed to any static hosting service:

- **Netlify:** Drag & drop the folder
- **Vercel:** Connect Git repository
- **AWS S3:** Upload to S3 + CloudFront
- **GitHub Pages:** Push to gh-pages branch
- **Custom server:** Copy files to web root

### Environment Variables

If using build tools or server-side rendering:

```bash
# API endpoints
VITE_API_URL=https://api.kinko.in
VITE_ANALYZE_ENDPOINT=/api/analyse
VITE_LEAD_ENDPOINT=/api/lead

# Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

---

## 📚 Additional Resources

- **Product Spec:** `../Specs/Policy_Analyser_Product_Spec_v2_0.md`
- **Design System:** `../design-system.md`
- **Component Specs:** `../components/`
- **Figma Design:** [Figma Link]

---

## 🆘 Getting Help

### Design Questions
- Token usage: Check `tokens/semantic.css`
- Component patterns: Check `css/*.css`
- Layout examples: Check `screens/*.html`

### Technical Issues
- Browser compatibility: Check browser DevTools
- API integration: Check backend documentation
- Deployment: Contact DevOps team

---

**Last Updated:** May 2026
**Version:** 2.0
