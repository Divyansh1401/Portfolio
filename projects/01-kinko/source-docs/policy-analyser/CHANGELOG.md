# Changelog — Kinko Policy Analyser

All notable changes to the Policy Analyser implementation.

## [2.0.0] - 2026-05-11

### Added
- Initial release of Policy Analyser v2.0
- Complete 7-screen funnel implementation
- 5 new components: Score Display, Upload Zone, Gap Card, Feature Table, Recommendation Card
- Full design system integration with Kinko tokens
- Responsive mobile-first design
- Developer documentation and README

### Components
- `score-display.css` - Circular score with category labels
- `upload-zone.css` - Drag-and-drop file upload
- `gap-card.css` - Policy gap cards with severity levels
- `feature-table.css` - 18-feature breakdown table
- `recommendation-card.css` - Priority-coded recommendations

### Screens
- `stage-1-landing.html` - Landing page with upload CTA
- `stage-2-upload.html` - File upload interface
- `stage-3-confirm.html` - Policy confirmation and user context
- `stage-4-preview.html` - Free preview with score and top 2 gaps
- `stage-5-lead-capture.html` - Lead capture form
- `stage-6-full-report.html` - Full analysis report
- `stage-7-ctas.html` - Three conversion paths

### Documentation
- README.md with quick start guide
- DEVELOPER_GUIDE.md with implementation details
- Component documentation in CSS files
- Token architecture documentation

---

## [Unreleased]

### Planned
- Backend API integration
- PDF generation service
- Calendar booking integration
- Marketplace filtering
- Analytics tracking
- A/B testing framework

---

## Version History

### v2.0.0 (2026-05-11)
- Complete redesign as lead acquisition tool
- Removed post-purchase education features
- Added gated preview model
- Fixed scoring math (weights now add to 100%)
- Added document storage carve-out policy

### v1.0.0 (2026-03-01)
- Initial release as education feature
- Basic policy analysis
- Simple report generation

---

**For more details, see the product specification:**
`/Specs/Policy_Analyser_Product_Spec_v2_0.md`
