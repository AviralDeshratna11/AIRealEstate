---
name: xr-property-tour-generation
description: "Turn raw property walkthrough assets, .ply/.splat/.ksplat files, listing media, and room metadata into ASTRA immersive XR property tours with hotspots, routes, AI narration, broker PropertyPool scripts, manager QA reports, and viewer tests."
---

# XR Property Tour Generation

Use this skill when a manager uploads raw walkthrough video, `.ply`, `.splat`, `.ksplat`, or `.glb`; a listing has media but no XR tour; a published listing needs an immersive page; a manager requests XR tour generation; or a broker requests a PropertyPool virtual tour.

## Operating Rules

1. Never invent room dimensions, sunlight/noise conclusions, amenities, legal clearance, RERA verification, seller hidden prices, broker commissions, or buyer identities.
2. Mark all generated room labels, hotspots, and narration as `needs_manager_confirmation` until a manager verifies them.
3. Keep public/buyer XR outputs free of private seller data, broker commission, and unapproved documents.
4. Broker PropertyPool XR requires approved tie-up permissions before sharing buyer-facing claims.
5. Always provide image/video/text fallback when Gaussian Splat processing is pending or unsupported.

## Workflow

1. Detect uploaded raw assets and validate file type, size, listing ownership, and processing status.
2. Create or update `listing_xr_assets` with `asset_type`, `asset_url`, `thumbnail_url`, `processing_status`, coordinate metadata, scale, and origin.
3. Generate default `listing_xr_hotspots` from room metadata:
   - Building entrance
   - Lobby/lift
   - Living room
   - Balcony/view
   - Kitchen
   - Bedrooms
   - Bathrooms
   - Parking/amenities
   - Legal context
   - Finance context
   - Locality context
4. Generate `listing_xr_routes`:
   - default
   - family_buyer
   - investor
   - nri
   - broker_propertypool
   - manager_preview
5. Generate scripts:
   - AI guided narration
   - Broker presentation script
   - Buyer-specific variants
   - Manager QA suggestions
6. Update property page quality score and create audit logs.
7. Run XR viewer checks:
   - Scene nonblank
   - Hotspots visible
   - Camera navigation works
   - Text guide works
   - Browser speech fallback does not crash
   - Fallback shown when no splat asset exists

## Demo Story

"Codex is not just helping developers write code. Codex acts as an autonomous property media operations engine that turns raw walkthrough assets into a guided immersive XR property tour with AI narration."
