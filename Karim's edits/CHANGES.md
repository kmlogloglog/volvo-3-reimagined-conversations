# Karim's Edits

---

## 17/03/2026 — Clone VMLYR Repo, Dashboard Integration & Live Firestore Listener

### What changed
- Cloned `VMLYR/vmlmap-volvo-vaen-backend` and created branch `karim-test`
- Copied the full React/Vite dashboard (`src/`) from the duplicate repo into this codebase
- Removed the Nuxt.js "talking side" (`ui/` directory) — the conversation/video UI is intentionally excluded from this branch; the one in `main` is used
- Updated `app/main.py` to remove the Nuxt static file mount
- Switched Firebase from the `volvo-vaen-v2-db` named database to the `(default)` database (same project: `vml-map-xd-volvo`)
- Added a real-time Firestore `onSnapshot` listener that streams live agent session state into the dashboard

### How it works
1. The Python Freja agent writes user insights (`profiling`, `car_config`, `full_name`, `email`, `location`, etc.) to Firestore at `users/{userId}/user_state/volvo_vaen` during conversations
2. The dashboard's `liveStateStore` subscribes to that document via `onSnapshot` whenever a profile detail page is open
3. A pulsing **LIVE** badge appears in the top bar of the profile detail page when the listener is active
4. A green "Agent Live State" panel appears above the KPI strip, displaying:
   - Profiling insights as tag chips (updated in real-time as the agent saves them)
   - Car configuration (model, exterior, interior, wheels)
   - Personal details captured by the agent (name, email, location)
   - Test drive appointment data (if booked)

### Files added/modified
| File | Change |
|------|--------|
| `src/lib/firebase.ts` | Switched to `(default)` Firestore database |
| `src/services/liveStateService.ts` | New — `onSnapshot` listener for `user_state` |
| `src/store/liveStateStore.ts` | New — Zustand store for live agent state |
| `src/pages/ProfileDetailPage.tsx` | Added live listener lifecycle, LIVE badge, live state panel |
| `app/main.py` | Removed Nuxt UI static file mount |
| `Karim's edits/CHANGES.md` | This entry |

---

## 10/03/2026 — Group Segment Reachout + AI Email Review

### What changed
Segment tiles on the Actions page are now **clickable entry points for bulk outreach**. Clicking a segment tile opens a new "Group Reachout" section (Section 2.5) that lists all profiles in that segment, batch-generates AI emails sequentially via Gemini, and produces an AI campaign summary.

### How it works
1. Click a segment tile in Section 2 — it highlights with a segment-colored border, other tiles dim
2. Section 2.5 slides in below with all profiles for that segment (avatar, name, city, top action, likelihood)
3. Click "Generate for Segment" — emails generate one-by-one with a real-time progress bar (sequential to avoid Gemini rate limits)
4. Each email appears as a collapsible accordion card using the existing `IframeEmailPreview`
5. After all emails finish, one final Gemini call produces a 3-4 sentence campaign summary
6. Click the same tile again to collapse, or click a different tile to switch segments
7. Existing Section 3 (individual profile content) remains unchanged

### Files modified
| File | Change |
|------|--------|
| `src/pages/ActionsPage.tsx` | Added state (`activeSegment`, `segmentEmails`, `campaignSummary`, etc.), clickable tiles with visual feedback, Section 2.5 JSX (profile list, generate button + progress bar, email accordion, campaign summary card), batch generation handler `handleSegmentGenerate()`, avatar helpers |
| `src/lib/emailTemplates.ts` | Added `buildCampaignSummaryPrompt()` export — builds a prompt for Gemini to summarise the campaign (segment characteristics, action themes, send time, tactical insight) |
| `Karim's edits/CHANGES.md` | This entry |

---

## 10/03/2026 — Always persist uploaded profiles to Firestore

### What changed
Removed the guest-mode bypass that kept uploaded profiles in memory only. All JSON uploads now write to Firestore regardless of auth state, and the Profiles page always loads from Firestore on mount.

### Why
Previously, guest users' uploads were lost on page refresh. Now the flow is: JSON uploaded → saved to Firestore `volvo-vaen-v2-db` → shown on Profiles page (persisted).

### Files modified
| File | Change |
|------|--------|
| `src/components/features/JsonUploadModal.tsx` | Removed `isGuest` early return — `uploadProfile()` always called; removed `useAuthStore` dependency |
| `src/pages/ProfilesListPage.tsx` | `useEffect` always calls `loadProfiles()` (Firestore) — removed `isGuest` branch + `loadDemoProfiles` |
| `Karim's edits/CHANGES.md` | This entry |

---

## 10/03/2026 — AI-personalised email generation on Actions page (Gemini 3.1 Flash-Lite)

### What changed
Replaced hardcoded email copy in the Actions page with AI-generated personalised paragraphs powered by Gemini 3.1 Flash-Lite. Each next best action from the profile now gets its own email preview with 1-2 paragraphs written by AI using the full profile context. Email previews are now production-quality HTML rendered inside iframes.

### How it works
1. User selects a profile and clicks "Generate Content"
2. For each `nextBestAction` in the profile, a prompt is built containing the customer's demographics, psychographics, mobility needs, affinities, segment, propensity stage, engagement strategy, and the specific action + reasoning
3. All prompts are sent to Gemini 3.1 Flash-Lite in parallel via the Google AI REST API
4. Each response becomes the body of a branded Volvo HTML email template
5. Emails render inside sandboxed iframes with auto-height, staggered blur-reveal animation

### Email template
- Production-quality HTML email markup (MSO conditionals, Gmail/Apple Mail fixes, responsive `@media`)
- Volvo branding: `#141414` header with VOLVO wordmark, `#1B365D` navy hero banner, `#4A90A4` accent line
- Font stack: `'Volvo Novum', Arial, Helvetica, sans-serif`
- 600px max-width, mobile-responsive at 640px breakpoint
- Sections: header → hero/subject → body (AI paragraphs) → CTA button → footer with unsubscribe

### Files added / modified
| File | Change |
|------|--------|
| `src/lib/gemini.ts` | Created — thin Gemini API wrapper (`geminiGenerate`) |
| `src/lib/emailTemplates.ts` | Created — `buildVolvoEmailHtml` (full HTML template), shared helpers (`buildAIPrompt`, `ACTION_EMAIL_META`, `getTopModel`) |
| `src/pages/ActionsPage.tsx` | Replaced `buildEmailContent` + JSX `EmailPreview` with parallel Gemini calls + `IframeEmailPreview`; imports shared helpers from emailTemplates |
| `src/components/features/profile/NextBestActions.tsx` | Replaced hardcoded `generateEmailContent` + JSX `EmailPreview` with per-action Gemini AI call + `IframeEmailPreview`; emails cached per action so re-opening doesn't re-generate |
| `.env` | Added `VITE_GEMINI_API_KEY` (gitignored) |
| `.env.example` | Added `VITE_GEMINI_API_KEY` placeholder |
| `Karim's edits/CHANGES.md` | This entry |

---

## 10/03/2026 — Connect to Firestore database `volvo-vaen-v2-db`

### What changed
Connected the frontend and backend to the named Firestore database `volvo-vaen-v2-db` in project `vml-map-xd-volvo`.

### Code change
- `src/lib/firebase.ts`: `getFirestore(app)` → `getFirestore(app, 'volvo-vaen-v2-db')` — points the frontend SDK at the named database instead of the default `(default)` database

### Configuration changes (gitignored `.env` files)
- `.env`: replaced placeholder Firebase config with real values from web app "volvo poc" (`1:719852784419:web:032fd561ab3878b29b9a96`)
- `app/.env`: set `GOOGLE_CLOUD_PROJECT=vml-map-xd-volvo`, `GOOGLE_CLOUD_LOCATION=europe-west4`, added `FIRESTORE_DB=volvo-vaen-v2-db`

### Example file updates
- `.env.example`: updated project ID hint and storage bucket domain
- `app/.env-example`: added `FIRESTORE_DB=volvo-vaen-v2-db` line

### Prerequisite (manual, not in code)
- Firestore security rules for `volvo-vaen-v2-db` must be set to `allow read, write: if true` for development (done via Firebase Console)

### Files modified
| File | Change | Committed? |
|------|--------|------------|
| `src/lib/firebase.ts` | Point to named database | Yes |
| `.env` | Real Firebase config values | No (gitignored) |
| `.env.example` | Updated hints | Yes |
| `app/.env` | Real project/region + FIRESTORE_DB | No (gitignored) |
| `app/.env-example` | Add FIRESTORE_DB line | Yes |
| `Karim's edits/CHANGES.md` | This entry | Yes |

---

## 09/03/2026 — Login page: rich modern redesign

### What changed
Full visual redesign of `LoginPage.tsx` — richer card, branded logo mark, staggered animations, feature pills, and ambient glow.

#### Card
- Deep glass card: `rgba(6,6,6,0.78)` + `backdrop-blur-[24px]` + multi-layer box shadow
- Amber gradient top accent line (`via-amber-400/50`)
- Inset subtle highlight on the top edge

#### Brand section
- Spring-animated **"V" logo mark** in a rounded square with amber glow border and radial inner shadow
- `Vän` heading + `by Volvo` amber label in 10px wide-tracked uppercase
- Soft tagline: "Profiling & prediction for personalised connections"
- **3 feature pills** (AI-Powered · Real-Time · Personalised) — stagger-animated, micro-chip style

#### Buttons
- Google button: prominent glass surface, white text, `whileHover scale(1.01)` + `whileTap scale(0.98)`
- `or` divider with hairline rules
- Guest button: ghost style, very muted — clearly secondary
- Error state: rose-tinted panel, animated in

#### Animations
- Card entrance: `opacity 0→1`, `y 28→0`, `scale 0.97→1` via custom cubic-bezier
- Logo mark: spring bounce (`stiffness: 260, damping: 20`)
- Feature pills: stagger `delay + i * 0.07`

#### Other
- Removed `fallbackOnly` from `AnimatedBackground` — login now gets the full 3D aurora + particles background
- Removed unused `GlassPanel` import
- Amber ambient glow div beneath the card

### Files modified
| File | Action |
|------|--------|
| `src/pages/LoginPage.tsx` | Full redesign |
| `Karim's edits/CHANGES.md` | Updated |

---

## 09/03/2026 — Fix: Tab title and favicon

### What changed
- `index.html` favicon: `/vite.svg` (default Vite logo) → `/favicon.svg` (custom Vän brand mark)
- `index.html` title: `"Vän Dashboard — Volvo Profiling & Prediction"` → `"Vän · Volvo"`
- Created `public/favicon.svg` — dark rounded square with amber "V" lettermark matching the app's brand colour (`#F59E0B`)

### Files modified
| File | Action |
|------|--------|
| `index.html` | Updated `<link rel="icon">` href + `<title>` |
| `public/favicon.svg` | Created — Vän brand favicon |
| `Karim's edits/CHANGES.md` | Updated |

---

## 06/03/2026 — Fix: AffinitiesRadar light mode — white text on white background

### What changed
- `PolarAngleAxis` tick `fill` changed from hardcoded `#ffffff` to `var(--van-text-secondary)` — resolves invisible axis labels in light mode
- `PolarGrid` stroke changed from `rgba(255,255,255,0.05)` to `var(--van-border)` — grid lines now visible in both themes
- `low` strength badge background changed from `bg-white/5` to `bg-neutral-500/10` — subtle badge visible in light mode

---

## 06/03/2026 — Fix: Scroll blocking on card hover + reduce card hover magnify

### What changed
- Removed VanillaTilt 3D from GlassCard — its `perspective` + `transform3d` context was capturing wheel events and blocking scroll when the cursor was over any card
- Removed Lenis smooth scrolling from AppLayout — Lenis was intercepting native wheel events on the scroll container, causing scroll to feel stuck or unresponsive over child elements
- Replaced card hover with a minimal `whileHover={{ y: -1 }}` lift via motion/react — no scale, no 3D transform, no scroll interference
- Restored native `overflow-y-auto` + `scroll-smooth` on the content container — reliable, no event interception
- Kept the animated gradient border (CSS `::before`/`::after`) and shimmer effects — pure CSS, no scroll impact

### Files modified
| File | Changes |
|------|---------|
| `src/components/ui/GlassCard.tsx` | Removed VanillaTilt, replaced with subtle y-lift hover |
| `src/components/layout/AppLayout.tsx` | Removed Lenis smooth scroll, restored native scroll-smooth |
| `Karim's edits/CHANGES.md` | This entry |

---

## 06/03/2026 — Frontend Revamp: Maximum Wow Factor (3D, animations, modern effects)

### What changed
Major visual overhaul adding 3D effects, animated numbers, smooth scrolling, stagger animations, toast notifications, and CSS micro-interactions across the entire dashboard.

### New dependencies
| Library | Purpose |
|---------|---------|
| `@react-three/fiber` + `@react-three/drei` + `three` + `@types/three` | 3D aurora background, floating particles, glowing orbs |
| `@number-flow/react` | Animated digit morphing for all KPIs/scores |
| `vanilla-tilt` | 3D parallax card tilt with glare |
| `sonner` | Modern toast notifications |
| `lenis` | Smooth momentum scrolling |

### Changes by category

#### 1. 3D Aurora + Particle Background (`src/components/ui/AnimatedBackground.tsx`)
- New R3F Canvas layer between CSS orb fallback and Unicorn Studio iframe
- Custom GLSL aurora shader with sinusoidal vertex displacement (amber/blue/purple dark, amber/gold light)
- 120 floating particles drifting slowly via `<Points>` buffer geometry
- 3 glowing orb meshes that float and pulse
- Theme-aware: dark = screen blend mode, light = multiply blend mode
- DPR capped at 1.5 for performance

#### 2. 3D Tilt + Animated Gradient Borders (`src/components/ui/GlassCard.tsx`, `src/styles/globals.css`)
- VanillaTilt.js with max: 6, glare: 0.15, perspective: 1000, scale: 1.03
- Disabled on touch devices
- CSS `@property --angle` rotating conic-gradient border on hover
- Subtle shimmer sweep overlay animation (15s cycle)
- Removed old `whileHover={{ y: -2, scale: 1.003 }}` (VanillaTilt handles it)

#### 3. Animated Numbers Everywhere
- `KpiStrip.tsx`: SVG circle draw-in animation (motion.circle strokeDashoffset) + NumberFlow on values
- `PropensityGauge.tsx`: NumberFlow on score + pulsing glow ring
- `SegmentDonut.tsx`: NumberFlow on center label + legend values
- `SegmentRanking.tsx`: NumberFlow on percentages + animated bar fills with stagger
- `ProfileCard.tsx`: NumberFlow on propensity score + completeness
- `ProfileDetailPage.tsx`: NumberFlow on hero score, segment %, likelihood %
- `OverviewPage.tsx`: NumberFlow on profile count, avg score, segment counts
- `ActionsPage.tsx`: NumberFlow on segment counts, percentages

#### 4. Dramatic Page & Card Stagger Animations
- `ProfilesListPage.tsx`: Each ProfileCard in motion.div with stagger (opacity + y + scale, delay index * 0.07)
- `ProfileDetailPage.tsx`: StaggerCard wrapper for Quick/Advanced view cards; AnimatePresence crossfade with blur(4px) exit
- `OverviewPage.tsx`: Stat tiles and roster rows staggered
- `ActionsPage.tsx`: Segmentation tiles staggered, email preview blur-materializing effect (blur 8px -> 0px)

#### 5. SVG Draw-In + Pulsing Glows
- `KpiStrip.tsx`: motion.circle animates strokeDashoffset from full circumference to target (1.2s)
- `PropensityGauge.tsx`: animate-pulse-glow on score circle + thicker spinning border
- `AffinitiesRadar.tsx`: Scale-in + fade wrapper + subtle rotating glow behind chart
- `ProgressBar.tsx`: motion.div width from 0% -> target + shimmer sweep overlay

#### 6. Sidebar Sliding Indicator (`src/components/layout/Sidebar.tsx`)
- motion.div layoutId="sidebar-active" slides between nav items with spring physics
- Active icon gets amber glow drop-shadow
- Replaced inline onMouseEnter/onMouseLeave with CSS hover classes

#### 7. Header Animations (`src/components/layout/Header.tsx`)
- Page title wrapped in AnimatePresence with slide-in/out animation
- Notification bell: whileHover rotate wobble [0, 15, -15, 8, 0]
- Theme toggle: whileHover scale 1.1 + whileTap scale 0.9, rotate 180

#### 8. Smooth Scrolling (`src/components/layout/AppLayout.tsx`)
- Lenis smooth scroll initialized on content container via useRef
- Config: smoothWheel: true, lerp: 0.08
- RAF loop for lenis.raf(time), cleanup on unmount
- Removed scroll-smooth CSS class

#### 9. Toast Notifications
- `App.tsx`: Sonner `<Toaster>` with glass-morphism styling via CSS vars
- `JsonUploadModal.tsx`: Toast on successful upload
- `ActionsPage.tsx`: Toast on content generation
- `OverviewPage.tsx`: Toast on template copy

#### 10. ProfileCard Depth Enhancements (`src/components/features/ProfileCard.tsx`)
- translateZ(20px) on avatar + score circle for parallax depth inside tilt
- Animated segment bar fills with motion.div and stagger delay
- van-ripple class on action buttons

#### 11. CSS Micro-interactions (`src/styles/globals.css`)
- `.van-ripple::after`: radial-gradient scale animation on :active
- `.van-skeleton`: gradient shimmer sweep (replaces animate-pulse)
- `:focus-visible`: amber glow pulse ring
- `[data-radix-popper-content-wrapper]`: tooltip scale + fade entrance
- `.animate-svg-draw`: SVG stroke draw-in keyframe
- `.animate-pulse-glow`: pulsing amber box-shadow

#### 12. View Mode Toggle Animation (`src/pages/ProfileDetailPage.tsx`)
- Quick/Advanced toggle with motion.div layoutId="view-pill" sliding indicator

#### 13. Email Blur Reveal (`src/pages/ActionsPage.tsx`)
- Email preview materializes with filter: blur(8px) -> blur(0px) transition

### Files modified
| File | Changes |
|------|---------|
| `package.json` | Added 7 new dependencies |
| `src/components/ui/AnimatedBackground.tsx` | Full rewrite: 3D aurora + particles layer |
| `src/components/ui/GlassCard.tsx` | VanillaTilt 3D, removed old hover animation |
| `src/components/ui/ProgressBar.tsx` | Animated fill + shimmer overlay |
| `src/styles/globals.css` | Gradient borders, shimmer, ripple, focus rings, tooltip anim, glow, SVG draw |
| `src/components/layout/AppLayout.tsx` | Lenis smooth scroll init |
| `src/components/layout/Sidebar.tsx` | Sliding indicator, active glow, CSS hover |
| `src/components/layout/Header.tsx` | Title slide-in, bell wobble, toggle spin |
| `src/components/features/ProfileCard.tsx` | Depth layers, segment bar animation, NumberFlow |
| `src/components/features/profile/KpiStrip.tsx` | SVG draw-in + NumberFlow |
| `src/components/features/profile/PropensityGauge.tsx` | Pulsing glow + NumberFlow |
| `src/components/features/profile/SegmentDonut.tsx` | NumberFlow on values |
| `src/components/features/profile/AffinitiesRadar.tsx` | Scale-in + glow |
| `src/components/features/profile/SegmentRanking.tsx` | NumberFlow + animated bars |
| `src/components/features/JsonUploadModal.tsx` | Toast on upload success |
| `src/pages/ProfilesListPage.tsx` | Staggered card reveals, shimmer skeletons |
| `src/pages/ProfileDetailPage.tsx` | Stagger, crossfade toggle, NumberFlow, view pill |
| `src/pages/OverviewPage.tsx` | Stagger, NumberFlow, toast |
| `src/pages/ActionsPage.tsx` | Stagger, blur reveal, NumberFlow, toast |
| `src/App.tsx` | Sonner Toaster provider |
| `Karim's edits/CHANGES.md` | This entry |

---

## 06/03/2026 — Actions page: Generate Content -> same email preview experience as Trigger Action

### What changed
"Generate Content" on the Actions page now follows the exact same flow as "Trigger Action" in the Next Best Actions card — 0.6 s loading spinner then an animated email preview inline, with an "Open Catalyst" button. The old "success card swap" is removed.

### Flow
1. Press **Generate Content** (amber) → 0.6 s "Preparing content…" spinner (same duration as Next Best Actions)
2. Email preview slides in below the button (`AnimatePresence`, height 0 → auto, 280 ms ease-out)
3. Button transitions to neutral **Regenerate** — press again to generate a fresh preview
4. Changing the profile selector resets preview and returns button to amber "Generate Content"

### Email preview
- Same visual structure as `NextBestActions`: dark Volvo-branded header, body, greyed-out CTA preview, Catalyst footer strip with **"Open Catalyst ↗"** amber button
- Content built by `buildEmailContent(profile)` — picks the profile's top next best action (sorted by likelihood) and generates matching subject/body/CTA copy, with a generic fallback if no actions exist
- All header text forced white via inline `style={{ color: '#fff' }}` (same light-mode fix already in NextBestActions)

### Files modified
| File | Action |
|------|--------|
| `src/pages/ActionsPage.tsx` | Added `buildEmailContent`, `EmailPreview`, replaced Section 3 generate flow |

---

## 06/03/2026 — Light mode: Psychographics & Channel Consent dark badge fix

### Root cause
`badgeVariants.neutral` in `designTokens.ts` used `bg-neutral-800` — a hardcoded near-black background. This affected every "Opted Out" badge in Channel Consent and every inactive persona flag in Psychographics. Additionally, `ChannelConsentCard` used `text-white` on channel labels and `divide-white/5` for dividers (neither adapted to light mode).

### Fix 1 — `src/constants/designTokens.ts`
- `neutral` badge `bg`: `bg-neutral-800` → `bg-neutral-500/10` (transparent grey, adapts to both themes)
- `neutral` badge `text`: `text-neutral-400` → `text-neutral-500` (readable on both backgrounds)
- `neutral` badge `border`: `border-white/5` → `border-neutral-500/20` (visible in both modes)

### Fix 2 — `src/components/features/profile/ChannelConsentCard.tsx`
- Channel label: `text-white` → `style={{ color: 'var(--van-text-primary)' }}`
- Divider: removed `divide-y divide-white/5` (divide utility ignores parent `style`); replaced with per-row `style={{ borderTop: '1px solid var(--van-border)' }}` on rows after the first

### Files modified
| File | Action |
|------|--------|
| `src/constants/designTokens.ts` | Neutral badge variant fixed |
| `src/components/features/profile/ChannelConsentCard.tsx` | Label colour + divider fixed |
| `Karim's edits/CHANGES.md` | Updated |

---

## 06/03/2026 — Chart tooltips: fix black-on-light-background in light mode

### Root cause
`CustomTooltip` in both `SegmentDonut` and `AffinitiesRadar` used `bg-[#0A0A0A]/90` (near-black) with `text-white`. `globals.css` had a light-mode override for `/50` but not `/90`, so tooltips stayed black in light mode.

### Fix — same CSS-variable pattern used across other components
- `SegmentDonut.tsx` `CustomTooltip`: replaced hardcoded `bg-[#0A0A0A]/90 border-white/10 text-white` with `style={{ background: 'var(--van-surface)', borderColor: 'var(--van-border)' }}` + `color: 'var(--van-text-primary)'`
- `AffinitiesRadar.tsx` `CustomTooltip`: same — background + border via CSS variables; axis label and item text use `var(--van-text-primary/secondary/muted)`; amber score `text-amber-400` unchanged (visible in both themes)

### Files modified
| File | Action |
|------|--------|
| `src/components/features/profile/SegmentDonut.tsx` | CSS-variable tooltip |
| `src/components/features/profile/AffinitiesRadar.tsx` | CSS-variable tooltip |
| `Karim's edits/CHANGES.md` | Updated |

---

## 06/03/2026 — Next Best Actions: Trigger Action → email preview → Open Catalyst

### What changed
Each action in the "Next Best Actions" card now has a **Trigger Action** button that simulates content preparation and reveals a personalised email preview with a one-click path to Catalyst.

### Flow
1. **Trigger Action** button (neutral) → 0.6 s loading state ("Preparing content…" with spinning icon)
2. Button transitions to **"Content Ready — View"** (amber)
3. Email preview animates open below the action (height: 0 → auto, 280 ms ease-out via `AnimatePresence`)
4. Clicking the button again collapses the preview
5. Only one action preview open at a time

### Email preview anatomy
- **Header banner** — dark gradient with diagonal texture, amber glow, VOLVO wordmark, "Personalised for you" label, email subject
- **Body** — greeting + personalised copy paragraph + CTA preview (greyed-out button, non-clickable, labelled "Preview only")
- **Catalyst footer strip** — "Ready to send via Catalyst" label + **"Open Catalyst ↗"** amber pill button

### Personalisation logic (`generateEmailContent`)
Content is generated per action type using:
- First name from `demographics.name`
- Top model from `affinities.models` sorted by strength
- Top powertrain from `affinities.powertrain` sorted by strength
- All 5 action types handled: `bookTestDrive`, `completeConfiguration`, `completeOrder`, `contactDealer`, `viewContent`

### Files modified
| File | Action |
|------|--------|
| `src/components/features/profile/NextBestActions.tsx` | Full rewrite with trigger flow + email preview |

---

## 06/03/2026 — KpiStrip: fix misaligned centre number in Completeness & Confidence donuts

### Root cause
`KpiStrip` used Recharts `<PieChart>` with `cx={39} cy={39}` — 1 px off from the true centre of the 80 × 80 container (40, 40). The absolutely-positioned text overlay was centred at (40, 40), so the number and the ring were visually offset.

### Fix (`src/components/features/profile/KpiStrip.tsx`)
- Replaced `<PieChart>` / `<Pie>` / `<Cell>` (Recharts) with two plain `<circle>` elements inside a raw `<svg width="80" height="80" viewBox="0 0 80 80">`
- Both circles use `cx="40" cy="40"` — the exact geometric centre of the SVG viewport
- Track circle: `stroke="rgba(255,255,255,0.06)"` / Fill circle: `stroke={fillColor}` with `strokeDasharray` + `strokeDashoffset` for the arc
- Text overlay `absolute inset-0 flex items-center justify-center` now perfectly aligns with the SVG centre
- Removed unused Recharts imports (`PieChart`, `Pie`, `Cell`) and `buildDonutData` helper
- Text colour uses `var(--van-text-primary)` so it stays readable in both light and dark mode

### Files modified
| File | Action |
|------|--------|
| `src/components/features/profile/KpiStrip.tsx` | Replace Recharts donut with SVG circles |
| `Karim's edits/CHANGES.md` | Updated |

---

## 06/03/2026 — InsightCard text: CSS-variable fix (root cause of light-mode invisibility)

### Root cause
`tailwind.config.js` has no `darkMode: 'class'` entry — Tailwind defaults to `'media'` (OS preference). This means `dark:` Tailwind variants respond to the **OS dark/light preference**, not the app's theme toggle. The previous fix using `dark:text-amber-200` therefore had no effect when the OS is in light mode but the user toggled to dark in-app, or vice versa.

### Fix (`src/components/ui/InsightCard.tsx`)
- Title: removed `text-amber-800 dark:text-amber-200` → `style={{ color: 'var(--van-text-primary)' }}`
- Body: removed `text-amber-700/80 dark:text-amber-200/70` → `style={{ color: 'var(--van-text-secondary)' }}`
- Same CSS-variable pattern used for the Actions page disclaimer fix (confirmed working)
- Fixes both **Engagement Strategy** and **Profile Summary** cards (both render via `InsightCard`)
- Icon (`text-amber-400`) unchanged — amber-400 is visible on both light and dark backgrounds

### Files modified
| File | Action |
|------|--------|
| `src/components/ui/InsightCard.tsx` | CSS variable text fix |
| `Karim's edits/CHANGES.md` | Updated |

---

## 06/03/2026 — Three bug fixes: likelihood %, SegmentDonut layout, InsightCard light mode

### Fix 1 — Likelihood showing "7700%" (`src/pages/ProfileDetailPage.tsx`)
- `Math.round(topAction.likelihood * 100)` → `Math.round(topAction.likelihood)` in both the label and bar width (real profiles store likelihood as 0–100, not 0–1)

### Fix 2 — SegmentDonut cropped in Advanced View (`src/pages/ProfileDetailPage.tsx`)
- Removed inner `grid-cols-2` that forced SegmentRanking + SegmentDonut side-by-side inside an already-narrow column; both now stack vertically at full width

### Fix 3 — InsightCard unreadable in light mode (`src/components/ui/InsightCard.tsx`)
- Title: `text-amber-200` → `text-amber-800 dark:text-amber-200`
- Body: `text-amber-200/70` → `text-amber-700/80 dark:text-amber-200/70`

---

## 06/03/2026 — Sidebar: Actions icon → bolt-circle

### What changed
- `solar:send-linear` (was not rendering) → `solar:bolt-circle-linear` on the Actions sidebar nav item
- `solar:bolt-circle-linear` is confirmed working in the codebase (used in KpiStrip)

### Files modified
| File | Action |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Icon updated |
| `Karim's edits/CHANGES.md` | Updated |

---

## 06/03/2026 — Sidebar: Actions icon style fix

### What changed
- `solar:send-bold` → `solar:send-linear` on the Actions sidebar nav item
- Now matches the linear icon style used by Profiles (`solar:users-group-rounded-linear`) and Overview (`solar:widget-linear`)

### Files modified
| File | Action |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Icon style fix |
| `Karim's edits/CHANGES.md` | Updated |

---

## 06/03/2026 — Actions page polish + dynamic header title

### What changed
Four polish fixes on top of the Actions page redesign.

#### 1. Dynamic header title (`src/components/layout/AppLayout.tsx`)
- Added `getPageTitle(pathname)` helper that maps `/overview` → "Overview", `/actions` → "Actions", `/settings` → "Settings", `/profiles` → "Profiles"
- `<Header>` now receives `pageTitle={getPageTitle(location.pathname)}` — previously it always showed the default "Profiles"

#### 2. Slower journey flow animation (`src/pages/ActionsPage.tsx`)
- `stepVariants` duration `0.2 → 0.45 s`, per-step delay `i * 0.12 → i * 0.35 s`
- `connectorVariants` duration `0.25 → 0.5 s`, per-connector delay `i * 0.12 → i * 0.35 s`
- Result: steps enter one at a time like a presentation rather than all at once

#### 3. "Monitor Response" → "Track Conversion" (`src/pages/ActionsPage.tsx`)
- Last journey step label updated

#### 4. Disclaimer text readable in light mode (`src/pages/ActionsPage.tsx`)
- Replaced `text-amber-200/80` (invisible on amber background in light mode) with `style={{ color: 'var(--van-text-secondary)' }}` — adapts to both dark and light theme via CSS variable

### Files modified
| File | Action |
|------|--------|
| `src/components/layout/AppLayout.tsx` | Added `getPageTitle` helper; pass dynamic title to `<Header>` |
| `src/pages/ActionsPage.tsx` | Slower animations, label rename, disclaimer text fix |
| `Karim's edits/CHANGES.md` | Updated |

---

## 06/03/2026 — Actions page: Redesign (journey flow + segmentation + content generator)

### What changed
Stripped out the campaign builder (channel picker, template grid, audience filters, preview & send) and replaced the page with three new sections.

### Sections added

#### 1. Volvo AI Journey (animated flow)
- 5-step horizontal flow (stacks vertically on mobile) built with `motion/react` staggered entry animations
- Steps: Client talks to Volvo AI → Profile Saved → Engage by Segment → AI Creates Custom Interaction & Email → Monitor Response
- Each step card uses `stepVariants` (opacity + scale), connectors use `connectorVariants` (scaleX 0→1)
- Animated dashed amber connectors between steps

#### 2. Segmentation grid
- 4-segment cards (one per `SegmentKey`) reusing `SEGMENT_LABELS` and `SEGMENT_COLORS`
- Shows profile count per dominant segment + mini horizontal bar with proportion of total

#### 3. Create Customised Content
- Amber disclaimer box (info icon): personalised email generation warning
- Profile selector dropdown (single profile shows static display; multi-profile shows `<select>`)
- "Generate Content" CTA (amber) — disabled when no profiles; simulates generation with 1.8 s delay → success state
- Success state: check icon, profile name, "Generate for Another Profile" reset button

### What was removed
- `CampaignTemplate`, `CAMPAIGN_TEMPLATES`, `TemplateKey`, `CampaignChannel` types/constants
- Campaign Setup section (channel picker + template grid)
- Audience Targeting section (segment/stage/city/score filters, `toggleFilter` helper)
- Preview & Send section (template preview, recipient list, send button, `isSent` state)
- `STAGE_COLORS`, `STAGE_LABELS` imports (no longer used)
- Filter state: `filterSegments`, `filterStages`, `filterCities`, `filterMinScore`, `filterMaxScore`

### Files modified
| File | Action |
|------|--------|
| `src/pages/ActionsPage.tsx` | Full rewrite |
| `Karim's edits/CHANGES.md` | Updated |

---

## 06/03/2026 — Profile detail page: Quick View + Advanced View toggle inside individual profile

### What changed
Clarified the correct navigation architecture:
- `/profiles` → simple card grid, no tabs
- `/profiles/:userId` → individual profile page with Quick View by default and an Advanced View toggle inside
- Overview "Open" → navigates directly to `/profiles/:userId`

### Files modified

#### `src/pages/ProfileDetailPage.tsx`
- Full rewrite replacing the old bento-grid layout
- Reads `?view=advanced` search param to initialize in Advanced View (for the card's "Advanced View" button)
- Top bar: back link on left, **Quick View / Advanced View pill switcher** on right (amber = active quick, white = active advanced)
- `KpiStrip` always visible below the top bar regardless of view
- **Quick View** (default): hero identity card, persona chips, signal trio, top next best action, strong affinities, content + reachability grid
- **Advanced View**: three-column layout with all detailed profile component cards
- All Quick View constants and helpers moved here (`SEGMENT_COLORS`, `POWERTRAIN_LABELS`, `DRIVER_LABELS`, `ATTRIBUTE_LABELS`, `STAGE_COLORS`, `STRENGTH_ORDER`, `AFFORDABILITY_STYLES`, `contentScoreStyle`)
- Profile resolved from `selectedProfile` store value or falls back to `profiles.find` by userId

#### `src/pages/ProfilesListPage.tsx`
- Reverted to simple grid — no tabs, no Quick/Advanced content
- `onQuickView` navigates to `/profiles/:userId`
- `onAdvancedView` navigates to `/profiles/:userId?view=advanced`

#### `src/pages/OverviewPage.tsx`
- "Open" button now navigates to `/profiles/${p.userId}` (was `/profiles`)

---

## 06/03/2026 — Profile card opens Quick View; Advanced View button added

### What changed
Clicking a profile card in the All Profiles tab no longer navigates to a separate detail page. Instead, the card body opens Quick View for that profile and a second button below each card opens Advanced View.

### Files modified

#### `src/components/features/ProfileCard.tsx`
- Removed `<Link to={/profiles/${profile.userId}}>` wrapper
- Added `onQuickView` and `onAdvancedView` callback props
- Card body is now a `<button>` that calls `onQuickView` on click
- Arrow icon replaced with bolt icon hinting at Quick View
- Added action row below each card with two buttons: **Quick View** (amber) and **Advanced View** (neutral)

#### `src/pages/ProfilesListPage.tsx`
- Passed `onQuickView` and `onAdvancedView` to each `<ProfileCard>`:
  - `onQuickView` → sets `selectedUserId` + switches `activeTab` to `'quick'`
  - `onAdvancedView` → sets `selectedUserId` + switches `activeTab` to `'advanced'`

---

## 06/03/2026 — Move Quick View / Advanced View from Overview → Profiles tab

### What changed
Quick View and Advanced View tabs have been relocated from the Overview page to the Profiles page. Overview now shows only the aggregate "All Profiles" view. The Profiles page gains tab-based navigation that appears only once at least one JSON profile is loaded.

### Files modified

#### `src/pages/ProfilesListPage.tsx`
- Added `activeTab` state (`'all' | 'quick' | 'advanced'`, default `'all'`)
- Added `selectedUserId` state with `selectedProfile` derivation (falls back to first profile)
- Added `nextBestActions` derivation from selected profile
- Added amber-underline tab bar (only rendered when `profiles.length > 0`) with three tabs: All Profiles, Quick View, Advanced View
- Tab resets to `'all'` when all profiles are removed (useEffect guard)
- Moved all Quick View JSX block from OverviewPage (hero card, persona chips, signal trio, next best action, affinity tags, content/channels grid)
- Moved all Advanced View JSX block from OverviewPage (three-column layout with all profile component cards)
- Profile selector dropdown appears in Quick/Advanced tab when `profiles.length > 1`
- `KpiStrip` rendered at top of Quick/Advanced content
- All new imports added (profile components, types, `cn`, constants)
- All Quick View constants moved here: `QUICK_SEGMENT_COLORS`, `QUICK_POWERTRAIN_LABELS`, `QUICK_DRIVER_LABELS`, `QUICK_ATTRIBUTE_LABELS`, `QUICK_STAGE_COLORS`, `QUICK_STRENGTH_ORDER`, `AFFORDABILITY_STYLES`, `contentScoreStyle`

#### `src/pages/OverviewPage.tsx`
- Removed `activeTab` state and all tab-related logic
- Removed tab bar (All Profiles / Quick View / Advanced View)
- Removed `KpiStrip` conditional rendering
- Removed profile selector dropdown (was shown for Quick/Advanced tabs)
- Removed Quick View JSX block entirely
- Removed Advanced View JSX block entirely
- Removed `{activeTab === 'all' && ...}` wrapper — All Profiles content now renders directly
- Removed `selectedUserId` state; `selectedProfile`/`nextBestActions` derivations removed
- Removed `handleModalClose` function; onClose simplified to inline `setIsUploadOpen(false)`
- Removed unused imports: `KpiStrip`, all profile card components, `ACTION_LABELS`, `AffinityStrength`, Quick View constants
- Renamed local `QUICK_SEGMENT_COLORS` → `SEGMENT_COLORS`, `QUICK_STAGE_COLORS` → `STAGE_COLORS` for clarity
- Added `useNavigate` from `react-router-dom`; "Open" button in roster now navigates to `/profiles`
- Added `useNavigate` import from `react-router-dom`

---

## 05/03/2026 — Inline voice on landing page + Dev page architecture graph + scrollability fix

### What changed
Three improvements to the landing experience and the internal Dev page: voice conversation now happens fully in-place on the landing page (no redirect to AudioView), the Dev page has a proper layered architecture diagram sourced directly from the code, and the Dev page is now scrollable.

### Features

#### 1. Inline audio conversation on landing page (`ui/app/pages/index.vue`)
- Removed `navigateTo('/AudioView?autostart=1')` — mic press no longer leaves the landing page
- `handleVoice()` is now an async toggle: first press calls `agent.startAudio()` → opens WebSocket + mic worklets; second press calls `agent.stopAudio()`
- `isListening` reactive ref drives all UI state changes
- **Blur overlay** deepens on mic press: `.landing-blur.deep` → `backdrop-filter: blur(32px)` + `rgba(0,0,0,0.55)` (was 22px / 0.35)
- **Mic button** pulses with white ring animation (`@keyframes mic-pulse`) when active via `.is-listening` class
- **"or type instead"** swaps to `"tap to stop"` via `v-if`/`v-if` toggle on `isListening`
- **`<ChatStream>`** conversation overlay appears centred above the mic, showing only agent responses from last user turn (`filter-from-last="agent"`)
- **`<AudioCaptureWaves>`** rendered inside `.landing` when listening, driven by `agentStore.audioLevel`
- `onUnmounted` now calls `agent.stopAudio()` for cleanup
- New imports: `useAgent`, `useAgentStore`, `AudioCaptureWaves`, `ChatStream`, `AGENT`

#### 2. Suppress amber circles on landing route (`ui/app/views/CaptureView.vue`)
- Added `v-if="!isShellHiddenRoute"` to `<AudioCaptureCircles>` — amber animation circles no longer render on `index` or `Dev` routes
- Previously only `NavigationBar` and `BackgroundImagesCarousel` were gated; `AudioCaptureCircles` was not

#### 3. System architecture diagram (`ui/app/pages/Dev.vue`)
- Replaced the placeholder 1-row pipeline with a proper 5-layer swim-lane diagram sourced from the actual code
- **Layer 1 — Browser**: Landing Page → AudioWorklet (16 kHz PCM) → WebSocket Client ← AudioPlayer + ChatStream (24 kHz)
- **Transport bar**: `WebSocket /ws/{user_id}/{session_id} ↕ bidirectional`
- **Layer 2 — Cloud Run**: upstream_task → LiveRequestQueue ⇄ ADK Runner (volvo_agent, gemini-live-2.5-flash-native-audio, before_callback: preload_memories) → downstream_task; tool chips: `update_car_configuration`, `find_retailer`, `book_test_drive`
- **Phase separator**: session disconnect → `add_session_to_memory()`
- **Layer 3 — Memory Pipeline**: Transcript Builder → Gemini 2.5 Flash (summarize) → Gemini 2.5 Flash (JSON profile, temp 0.2)
- **Layer 4 — Firestore**: `sessions/{session_id}`, `users/{id}/memories/`, `users/{id}` profile
- **Layer 5 — Dashboard**: React CRM reads `users/{id}`
- Color-coded lanes: blue (browser), white (server), amber (AI/memory), green (Firestore), purple (dashboard)

#### 4. Dev page scrollability fix (`ui/app/pages/Dev.vue`)
- Root cause: `CaptureView`'s `.view` shell is `position: fixed; height: 100dvh` — it clips all child content
- Fix: `.dev` now uses `position: fixed; inset: 0; overflow-y: auto; z-index: 100`, same pattern as `index.vue`
- Page is fully scrollable on all viewport sizes

### Files modified
| Action | File |
|--------|------|
| MOD | `ui/app/pages/index.vue` |
| MOD | `ui/app/views/CaptureView.vue` |
| MOD | `ui/app/pages/Dev.vue` |
| MOD | `Karim's edits/CHANGES.md` |

---

## 05/03/2026 — Video Hero Landing Page + Audio Agent Pipeline + Profiling Agent

### What changed
Replaced the placeholder landing page with a cinematic Volvo video hero experience, wired the mic button to the full async audio conversation pipeline, added a session-end profiling agent that generates structured customer profiles, and created an internal Dev changelog page.

### Features

#### 1. Video Hero Landing Page (`ui/app/pages/index.vue`)
- Full-screen `<video>` — Volvo headlight reveal (`/video/volvo-intro.mp4`, 2.1 MB)
- Video autoplays muted + `playsinline` (iOS compliant); loops
- At **t = 5 s**: blur overlay fades in (`backdrop-filter: blur(22px)` over 0.9 s)
- CTA fades up from below: "Find your match" eyebrow + "Talk to Volvo" headline
- **80 px mic button** → navigates to `/AudioView?autostart=1`
- "or type instead" → `/ChatView`
- Volvo logo pinned top-center with `env(safe-area-inset-top)` notch safety
- `clamp(2rem, 6vw, 3.5rem)` responsive title size

#### 2. Global Black Background
- `ui/app/scss/theme.scss`: all gradient stops → `#000000` in both `:root` and `.dark`
- `ui/nuxt.config.ts`: `colorMode.preference/fallback` → `'dark'`; inline head script always adds `.dark` class

#### 3. CaptureView Shell — Hidden on Index + Dev Routes
- `BackgroundImagesCarousel` and `NavigationBar` gated by `isShellHiddenRoute` computed
- `SHELL_HIDDEN_ROUTES = ['index', 'Dev']`
- `.base-view.transparent`: `background: transparent; overflow: visible`

#### 4. Audio Agent Auto-Start
- `AudioView.vue` `onMounted`: if `route.query.autostart === '1'` → emits `BUS.TOGGLE_RECORD`
- Triggers: mic permission → 16 kHz recorder worklet → 24 kHz player worklet → WebSocket `/ws/{userId}/{sessionId}` → Gemini Live 2.5 Flash Native Audio

#### 5. Session-End Profiling Agent (`app/volvo_agent/services/profiling_service.py`)
- Runs inside `FirestoreMemoryService.add_session_to_memory()` after the summary is saved
- Loads existing profile from `users/{userId}` (preserves `channelConsent`, increments `sessionsAnalyzed`)
- Calls `gemini-2.5-flash` with `response_mime_type: application/json` + full response schema
- Outputs: demographics, psychographics, mobilityNeeds, segmentRanking (sums to 100), propensityToBuy, affinities (4 quadrants), engagementStrategy, nextBestActions (×3), contentRecommendations (×3), channelConsent, meta
- Writes to `users/{userId}` — dashboard picks it up automatically on next load
- Isolated: failure never blocks session teardown

#### 6. Dev Page (`ui/app/pages/Dev.vue`)
- Accessible at `/Dev` via direct URL only — hidden from NavigationBar
- Shows: system architecture pipeline, per-change cards (NEW/MOD badges, file tags), all-files summary table
- Black background, Volvo typography, internal-use styling

### Files added / modified
| Action | File |
|--------|------|
| COPY | `ui/public/video/volvo-intro.mp4` |
| REWRITE | `ui/app/pages/index.vue` |
| MOD | `ui/app/pages/AudioView.vue` |
| MOD | `ui/app/views/CaptureView.vue` |
| MOD | `ui/app/scss/theme.scss` |
| MOD | `ui/nuxt.config.ts` |
| NEW | `app/volvo_agent/services/profiling_service.py` |
| MOD | `app/volvo_agent/services/firestore_memory_service.py` |
| NEW | `ui/app/pages/Dev.vue` |
| MOD | `Karim's edits/CHANGES.md` |

---

## 05/03/2026 — Actions page: Campaign Builder

### What changed
Added a new `/actions` route with a full campaign builder page — letting users turn loaded profiles into a targeted audience and simulate sending an Email or SMS campaign.

### Features
- **Sidebar nav item** — "Actions" added after Overview (icon: `solar:send-bold`)
- **Empty state** — shown when no profiles loaded; amber link navigates to `/overview`
- **Section 1 — Campaign Setup:**
  - Channel picker (Email / SMS) with amber-underline tab style
  - 5-template grid: Test Drive Offer, New Car Offer, Event Invitation, Complete Configuration, Re-engagement
  - Each template card shows icon + label + description; selected card has amber glow + border
- **Section 2 — Audience Targeting:**
  - Live count badge: `N profiles matched of M total · channel consent applied`
  - Channel consent gate always applied (email/SMS consent respected)
  - Segment chips (colored dot per segment), Stage chips (awareness/consideration/decision), City chips (derived from loaded profiles)
  - Score range filter (min/max number inputs, 0–100)
  - "Clear all filters" ghost button when any filter is active
- **Section 3 — Preview & Send (2-col grid):**
  - Left card: email preview (subject + mono body) or SMS bubble mock
  - Right card: scrollable recipient list (name + city + stage chip), disabled Send button when audience is empty
- **Sent success state** — replaces Section 3 with centered success card (count + template name + "Start New Campaign" reset)
- All logic is local state; no external API calls

### Files added / modified
| File | Action |
|------|--------|
| `src/pages/ActionsPage.tsx` | Created |
| `src/App.tsx` | Added `/actions` route + `ActionsPage` import |
| `src/components/layout/Sidebar.tsx` | Added "Actions" nav item |
| `Karim's edits/CHANGES.md` | Updated |

---

## 05/03/2026 — Overview: "All Profiles" consolidation tab (3rd tab)

### What changed
Added a fleet-level "All Profiles" tab as the new default landing on the Overview page, giving an instant cross-profile view before drilling into any individual.

### Features
- **New `'all'` tab type** — default tab is now `'all'`; state typed as `'all' | 'quick' | 'advanced'`
- **Aggregate stat tiles** — 4-col grid: Profiles Loaded, Avg Propensity Score (color-coded), Stage Breakdown (pills), Best Reach Channel
- **Profile roster** — one `GlassCard` per loaded profile with colored left accent bar, score ring, stage badge, segment chip, consent dots, and "Open" arrow that jumps to Quick View for that person
- **Segment distribution bar** — full-width bar chart showing dominant-segment counts across all profiles
- **KpiStrip hidden** on All Profiles tab (it's single-profile data); **profile selector dropdown hidden** too
- **JSON Template collapsed by default** (`isTemplateExpanded` initialises to `false`)

### Files modified
| File | Action |
|------|--------|
| `src/pages/OverviewPage.tsx` | Add `'all'` tab, stat tiles, roster, segment bar; collapse template by default |
| `Karim's edits/CHANGES.md` | This entry |

---

## 05/03/2026 — Load Profile modal: Paste JSON tab

### What changed
Added a second input mode to `JsonUploadModal` so users can paste raw JSON directly instead of only uploading a file.

### Features
- **"Upload File / Paste JSON" tab toggle** inside the modal's select step (same amber underline style as the Overview tabs)
- **Paste JSON tab** — monospace textarea, disabled "Parse & Validate" button until text is non-empty; submits on click
- **Shared validation path** — extracted `processJsonText(text, sourceName)` so file uploads and paste go through identical `validateVanProfile` + userId-derivation logic
- Source label in confirm step shows `pasted-json` instead of a filename when pasted
- Modal title updated to "Load Profile"; confirm button updated to "Load Profile" for consistency
- "Try another file" → "Try again" so it works for both modes

### Files modified
| File | Action |
|------|--------|
| `src/components/features/JsonUploadModal.tsx` | Modified — paste tab, shared validate helper, mode state |
| `Karim's edits/CHANGES.md` | Updated |

---

## 05/03/2026 — Overview page: Quick View / Advanced View tabs

### What changed
Added a two-tab experience to the Overview dashboard. Default tab is **Quick View** for a stronger first impression; the existing 3-column bento is preserved as **Advanced View**.

### Features
- **Tab bar** — rendered between the header row and the KPI strip; only shown when a profile is loaded
- **Quick View** — bold, single-page summary layout with 6 inline sections:
  - **Hero Identity Card** — name, city, affordability chip, dominant segment badge (color-coded), profile characteristics pull-quote, propensity score ring with spinning amber accent + stage label
  - **Persona Chips Row** — Family Logistician / Style-Conscious Commuter / High-Mile Cruiser (active = amber, inactive = strikethrough)
  - **Top Signal Trio** — dominant segment, preferred powertrain, top model affinity (2-col if no models)
  - **Top Next Best Action** — amber left accent bar, likelihood progress bar, reasoning text
  - **High-Strength Affinity Tags** — pill cloud filtered to `strength === 'high'` across all 4 quadrants (amber / sky / purple / emerald by category)
  - **Content + Channels** — relevance-scored content recs + consent reachability icons
- **Advanced View** — existing 3-column bento grid, untouched
- **KpiStrip** remains visible in both tabs
- All data sourced inline from `selectedProfile`; no new fetches or component files

### Files modified
| File | Action |
|------|--------|
| `src/pages/OverviewPage.tsx` | Modified — added tab state, tab bar, Quick View layout |
| `Karim's edits/CHANGES.md` | Updated |

---

## 05/03/2026 — Overview page: JSON import → profiling dashboard

### What changed
Activated the previously disabled "Overview" sidebar nav item with a full profiling & prediction dashboard.

### Features
- **JSON template panel** — collapsible, copy-to-clipboard formatted schema so users know the expected upload shape before uploading
- **Empty state** — friendly prompt with an "Upload JSON" CTA when no profiles exist
- **3-column bento dashboard** — rendered after upload using all existing profile components:
  - Left: ProfileCharacteristics, DemographicsCard, PsychographicsCard, MobilityNeedsCard, SegmentRanking + SegmentDonut
  - Center: PropensityGauge, AffinitiesWheel, AffinitiesRadar
  - Right: EngagementStrategyCard, NextBestActions, ContentRecommendations, ChannelConsentCard
- **Profile selector** — dropdown appears automatically when more than one profile is loaded
- **KPI strip** — profileCompleteness, confidenceScore, sessionsAnalyzed, actionsCount
- Reuses `JsonUploadModal` (validation + upload / guest in-memory flow unchanged)

### Files added / modified
| File | Action |
|------|--------|
| `src/pages/OverviewPage.tsx` | Created |
| `src/App.tsx` | Added `/overview` route |
| `src/components/layout/Sidebar.tsx` | Removed `disabled` + `badge` from Overview nav item |
| `Karim's edits/CHANGES.md` | Updated |

---

## 05/03/2026 — Local dev setup for review

### What changed
- Created `.env` at the project root with placeholder Firebase values so the React/Vite dashboard can initialize Firebase without crashing on startup.
- This allows the "Continue as Guest" flow to work fully locally without any real Firebase or GCP credentials.
- No source code was modified.

### Why
The repo ships only `.env.example`. Without a `.env`, the Vite build fails to inject `VITE_FIREBASE_*` variables and Firebase throws on import. Placeholder values satisfy the SDK init step; guest login bypasses all real Firebase calls (pure Zustand state).

### How to run
```bash
npm install
npm run dev
# Open http://localhost:5173 → click "Continue as Guest"
```

### Files added / modified
| File | Action |
|------|--------|
| `.env` | Created (placeholder Firebase config for local guest-mode) |
| `Karim's edits/CHANGES.md` | Created (this file) |
