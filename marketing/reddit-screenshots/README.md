# Reddit Ad Campaign — Screenshots & Composites

Captured assets for the TenantTrack Reddit ad campaign. All screenshots were
taken against the live demo seed data (landlord `tenanttrackapp@gmail.com`,
2 properties, 11 work orders, 6 vendors) using a headless Chromium at retina
DPR. The Replit development banner and in-app help chatbot bubble were hidden
during capture.

## Layout

```
marketing/reddit-screenshots/
├── README.md
├── desktop/        # 2880 × 1800 @ 2× DPR (1440 × 900 logical)
├── mobile/         # 1170 × 2532 @ 3× DPR (390 × 844 logical, iPhone 14 Pro)
└── ad-ready/       # Brand-framed composites for paid placement
```

## Raw screenshots

### Desktop (`desktop/`)
| File | Page | Notes |
| --- | --- | --- |
| `01-landing.png` | `/` | Public landing page (logged out look) |
| `02-dashboard.png` | `/dashboard` | "Good evening, Demo" — 4 KPI tiles, top vendors, work orders list |
| `03-dispatch.png` | `/dispatch` | Dispatch board — kanban of New / Assigned / In Progress / Completed |
| `04-vendors.png` | `/vendors` | Vendor network grid with trust scores |
| `05-vendor-detail.png` | `/vendors/3` | Janet Park (Electrical) — trust score 58, history, stats |
| `06-schedule.png` | `/schedule` | Week view with scheduled jobs |

### Mobile (`mobile/`)
| File | Page | Notes |
| --- | --- | --- |
| `07-track-mobile.png` | `/track/A1A4213E` | Tenant tracking — Sunset Apartments, In Progress, EN/ES toggle |
| `08-track-search-mobile.png` | `/track` | Empty-state tracking-code lookup |
| `09-vendor-portal-mobile.png` | `/vendor-portal/<token>` | Magic-link vendor portal — Job Assignment, Marcus Lee, Plumbing |

## Ad-ready composites (`ad-ready/`)

Each of the top three screenshots was framed onto a branded dark-navy canvas
(`#060B14` → `#0A1428` gradient) with the TenantTrack wordmark, a headline,
sub-head, "Try Free" CTA, and `tenanttrack.xyz` domain. Two sizes per shot:

| Concept | 1200 × 628 (Reddit feed / link) | 1080 × 1080 (square) |
| --- | --- | --- |
| **Dashboard** — "Stop chasing maintenance tickets." | `01-dashboard-1200x628.png` | `01-dashboard-1080x1080.png` |
| **Auto-dispatch** — "Auto-dispatch the right vendor in seconds." | `02-dispatch-1200x628.png` | `02-dispatch-1080x1080.png` |
| **Mobile tracking** — "Their phone, not yours." | `03-mobile-track-1200x628.png` | `03-mobile-track-1080x1080.png` |

### Brand tokens used
- Background base: `#060B14` (HSL 224 50% 5%, app `--background`)
- Background top: `#0A1428` (gradient highlight)
- Primary orange: `#FF4D00` (HSL 18 100% 50%, app `--primary`)
- Body text: `#F4F6FA`
- Muted text: `#8A95B0`

### Headlines / sub-heads (suggested copy used in composites)
- **Dashboard 1200×628** — *Stop chasing maintenance tickets.* / One dashboard. Every property. Every vendor. Every dollar.
- **Dashboard 1080×1080** — *Stop chasing tickets.* / Run every property, vendor, and work order from one calm dashboard.
- **Dispatch 1200×628** — *Auto-dispatch the right vendor in seconds.* / Trust scores, response times, and pricing — surfaced before you assign.
- **Dispatch 1080×1080** — *Auto-dispatch in seconds.* / Trust scores, response times, pricing — surfaced before you assign.
- **Mobile 1200×628** — *Tenants get a status link. Not your phone number.* / QR-code maintenance with live tracking — EN + ES.
- **Mobile 1080×1080** — *Their phone, not yours.* / QR-code maintenance with live tracking. English + Spanish, built in.

> Copy is editable — replace by re-running the build script with new strings.

## Reproducing

The capture pipeline lives in `/tmp/screenshot-tools/` (outside the repo to
avoid bloating `package.json`). Two scripts:

1. `capture.mjs` — Playwright script that logs in via the dev login flow,
   visits each route, hides the Replit dev banner + in-app chatbot, and
   writes PNGs to `desktop/` and `mobile/`.
2. `build-ads.sh` — ImageMagick (v7) script that frames the chosen
   screenshots into the brand-styled composites in `ad-ready/`.

To regenerate everything:

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers node /tmp/screenshot-tools/capture.mjs
/tmp/screenshot-tools/build-ads.sh
```

> Note: the capture script uses the `*.replit.dev` preview URL (cookies are
> set with `secure: true` so `localhost` won't authenticate). If the preview
> URL changes, update the `BASE` constant at the top of `capture.mjs`.

## Notes for the marketing team

- All screenshots show real demo data, not lorem-ipsum, so live numbers
  (KPI counts, trust scores, dates) match what a prospect lands on if they
  click through.
- Mobile shots are at iPhone 14 Pro resolution (1170 × 2532) — they
  downsample cleanly to any phone-frame mockup if you want to drop them
  into a device frame later.
- The "Try Free →" CTA in the composites is decorative; the actual
  destination URL should be set in the ad placement, pointing to
  `https://tenanttrack.xyz/?utm_source=reddit&utm_campaign=<slot>`.
