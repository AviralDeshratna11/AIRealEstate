---
name: property-page-intelligence
description: "Generate, validate, and operate ASTRA Property Intelligence Pages for listed Mumbai properties, including SEO metadata, AI summaries, room cards, legal/finance/market/tour checks, FAQs, vector content, quality reports, and endpoint tests."
---

# Property Page Intelligence

Use this skill when a new listing is published, media/documents change, a property page is missing AI content, room breakdowns are incomplete, quality score is low, or a manager requests page generation.

## Operating Rules

1. Never invent legal clearance, RERA verification, owner approval, room directions, exact room areas, sunlight/noise claims, commission terms, or private buyer feedback.
2. Use database facts first: `seller_listings`, `listing_media`, `listing_documents`, `market_comparables`, `property_area_breakdowns`, `property_faqs`, and `property_visit_feedback`.
3. Show unsupported claims as "Needs manager confirmation."
4. Public and buyer pages must not expose owner contacts, private buyer identities, hidden seller pricing, broker commissions, or manager audit internals.
5. Broker pages may show tie-up, marketing, attribution, commission, and PropertyPool actions only when broker access rules permit them.
6. Manager pages may show readiness, edit, publish, broker request, lead, and audit controls.

## Workflow

1. Load property detail data from `/api/properties/{id}/detail`.
2. Validate media coverage: hero image, room labels, floor plan, video/3D tour, captions, and quality scores.
3. Validate trust badges: only show positive badges when a verified field or uploaded document supports them.
4. Generate or refresh:
   - SEO title and description.
   - AI summary with strengths, concerns, buyer questions, broker talking points, manager suggestions, and confidence score.
   - Room-wise display cards from verified area rows; use estimated labels only when clearly marked.
   - FAQ suggestions with source and verification status.
   - AI tour route and visit checklist.
   - Vector-search content for title, locality, descriptions, legal summary, market signals, amenities, tour route, and FAQs.
5. Create a page quality report covering missing media, legal gaps, price confidence, map readiness, finance readiness, role-based data leakage, and CTA coverage.
6. Run tests or checks for property page endpoints and frontend build/lint where available.
7. Add audit log entries for generated summaries, quality reports, vector updates, and manager-visible actions.

## Trigger Checklist

- New listing published.
- Listing media uploaded.
- Listing documents extracted.
- Listing missing AI summary.
- Listing missing room breakdown.
- Listing page has low quality score.
- Manager requests property page generation.

## Demo Story

"Every property page is not manually written. Codex acts as the property publishing engine that turns raw documents, media, and listing data into a polished buyer-facing property intelligence page."
