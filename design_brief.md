# Design Brief: Gesundheits- und Ernährungstagebuch

## 1. App Analysis

### What This App Does
This is a personal health and nutrition diary that helps users track three interconnected aspects of their daily wellness: what they eat (Essgewohnheiten), symptoms they experience (Symptomerfassung), and medications they take (Medikamenteneinnahme). The app enables users to identify correlations between diet, symptoms, and medication effectiveness over time. The "Tägliche Erfassung" app serves as a combined daily entry point.

### Who Uses This
Health-conscious individuals tracking their wellness journey - likely someone managing a chronic condition, food sensitivities, or working with a healthcare provider to understand symptom patterns. They want quick daily logging and the ability to spot trends.

### The ONE Thing Users Care About Most
**"How am I feeling today compared to recent days?"** - Users want an immediate snapshot of their current symptom status and whether things are improving or worsening. The symptom trend is the hero.

### Primary Actions (IMPORTANT!)
1. **Quick daily entry** → Primary Action Button (using Tägliche Erfassung)
2. Log a specific symptom
3. Record medication intake
4. Add a meal entry

---

## 2. What Makes This Design Distinctive

### Visual Identity
A calming, wellness-focused aesthetic with a soft sage green accent on a warm off-white canvas. The design feels like a premium wellness app - serene but not clinical, personal but not juvenile. The green evokes natural health and balance without being cliché. Generous whitespace creates breathing room that reflects the app's purpose of mindful self-tracking.

### Layout Strategy
- **Hero element:** A large symptom wellness score/indicator that dominates the top of the viewport. This uses size (large typography), prominent positioning (top center), and ample whitespace to create clear visual hierarchy.
- **Asymmetric layout on desktop:** Wide left column (70%) for primary content (hero + symptom chart), narrow right sidebar (30%) for quick actions and recent activity.
- **Size variation:** The hero wellness indicator is dramatically larger than secondary KPIs (48px vs 14px supporting text). Secondary stats are compact inline badges, not cards.
- **Typography creates rhythm:** Bold 600-weight numbers with light 300-weight labels creates visual interest without clutter.

### Unique Element
The hero "Wellness Score" is displayed as a large number with a subtle colored background pill that shifts color based on the average symptom rating (green for good, amber for moderate, soft red for concerning). This creates an instant emotional read without requiring users to interpret numbers.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap`
- **Why this font:** Plus Jakarta Sans has a warm, approachable character with excellent readability. It's professional enough for health data but friendly enough for daily personal use. The font has distinctive letter shapes that prevent it from feeling generic.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(45 30% 97%)` | `--background` |
| Main text | `hsl(200 15% 20%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(200 15% 20%)` | `--card-foreground` |
| Borders | `hsl(45 15% 88%)` | `--border` |
| Primary action | `hsl(152 35% 45%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(152 25% 94%)` | `--accent` |
| Muted background | `hsl(45 20% 94%)` | `--muted` |
| Muted text | `hsl(200 10% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 45% 42%)` | (component use) |
| Warning/moderate | `hsl(38 70% 55%)` | (component use) |
| Error/negative | `hsl(0 55% 55%)` | `--destructive` |

### Why These Colors
The warm off-white background (slight cream undertone) creates a soft, inviting canvas that feels personal rather than clinical. The sage green primary evokes natural health and wellness without being the typical "medical blue." The muted text color has a slight blue-gray that creates calm contrast. The warning amber and soft red are intentionally muted to avoid alarming users.

### Background Treatment
The page background uses a warm off-white (`hsl(45 30% 97%)`) that gives the interface warmth. Cards are pure white to create subtle depth without heavy shadows. This creates a layered, calm aesthetic.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
The hero wellness indicator dominates the first viewport, creating an immediate emotional connection. Secondary stats are presented as a compact horizontal row of badges (not cards) to preserve vertical space. Visual interest comes from the dramatic size difference between the hero (large) and supporting elements (compact).

### What Users See (Top to Bottom)

**Header:**
- App title "Mein Gesundheitstagebuch" left-aligned, 18px semi-bold
- No navigation icons in header (action is fixed at bottom)

**Hero Section (The FIRST thing users see):**
- Takes approximately 35% of viewport height
- Large wellness indicator in center: the average symptom score displayed as a number (64px bold) with a label "Aktuelles Befinden" (14px light) above it
- Below the number: a subtle pill badge showing trend ("Besser als gestern" / "Wie gestern" / "Schlechter als gestern") with appropriate icon
- The entire hero section has a subtle rounded background color that reflects the score:
  - Score 1-3: light green tint (`hsl(152 40% 94%)`)
  - Score 4-6: light amber tint (`hsl(38 50% 94%)`)
  - Score 7-10: light coral tint (`hsl(0 40% 95%)`)
- Why hero: This immediately answers "How am I doing?" which is the primary user question

**Section 2: Heute auf einen Blick (Today's Summary)**
- Horizontal row of 3 compact stat badges (not cards):
  - Mahlzeiten: count icon + number
  - Medikamente: pill icon + number
  - Symptome: heart icon + number logged today
- Each badge: subtle muted background, 12px text, icon 16px
- Total row height: ~48px with padding

**Section 3: Symptom-Verlauf (7-Tage)**
- Section title "Letzte 7 Tage" with muted text, 14px
- Simple area chart showing daily average symptom scores
- Chart height: ~160px
- Minimal styling: single sage green line/area, light grid, date labels on x-axis
- Touch: tap on a point shows tooltip with that day's details

**Section 4: Letzte Einträge**
- Section title "Letzte Einträge"
- Vertical list of last 5 entries across all apps
- Each entry: icon (meal/pill/symptom), description truncated, time "vor 2 Std"
- Simple dividers between entries, no cards
- If tapped: expands to show full details inline

**Bottom Navigation / Action:**
- Fixed bottom bar with prominent primary action button
- Button: "Eintrag hinzufügen" with + icon
- Full-width minus padding, 52px height
- Sage green background, white text, rounded-lg corners

### Mobile-Specific Adaptations
- Chart simplified: only 7 data points, no hover states
- Recent entries list limited to 5 items
- All cards replaced with lightweight divider-separated rows
- Hero dominates first fold, everything else requires scroll

### Touch Targets
- Primary action button: 52px height minimum
- List items: 48px minimum tap height
- Chart data points: 44px touch target around each point

### Interactive Elements
- Chart points: tap to reveal daily detail tooltip
- Recent entry items: tap to expand and show full entry details
- Wellness pill badge: tap to see breakdown of symptoms contributing to score

---

## 5. Desktop Layout

### Overall Structure
Two-column asymmetric layout:
- **Left column (70%):** Hero wellness indicator + symptom trend chart + recent entries
- **Right sidebar (30%):** Quick action buttons + today's summary stats + medication reminder

Eye flow: Hero (top-left) → Chart (below hero) → Sidebar quick actions (right) → Recent entries (scroll)

Visual interest comes from the asymmetric split and the hero's dominant sizing within the left column.

### Section Layout

**Top Area (Hero Row):**
- Left: Large wellness indicator (same as mobile but larger - 72px number)
- Trend badge below the number
- Total hero section: ~200px height with generous whitespace

**Main Content Area (Left Column, Below Hero):**
- Symptom trend chart: full width of left column, 280px height
- Title "Symptom-Verlauf" above chart
- Below chart: "Letzte Einträge" section as a compact table-like list

**Right Sidebar:**
- Sticky when scrolling
- Quick Action Card: "Schnelleintrag" with 3 icon buttons stacked:
  - Mahlzeit erfassen
  - Symptom erfassen
  - Medikament erfassen
- Below: Today's Stats card showing same 3 metrics as mobile but vertical
- Below: If any medications due, show reminder card

### What Appears on Hover
- Chart line points: detailed tooltip with exact values and notes
- Recent entry rows: subtle background highlight, shows "Details anzeigen" text
- Quick action buttons: slight scale up (1.02) and shadow increase

### Clickable/Interactive Areas
- Each recent entry row: click opens a slide-over panel with full details
- Chart: click on data point shows that day's full log
- Wellness score: click shows breakdown modal of contributing symptoms

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Aktuelles Befinden
- **Data source:** Symptomerfassung (symptom tracking app)
- **Calculation:** Average of `bewertung_symptom` values from today's entries. Score is inverted for display: 1 (Sehr gut) = best, 10 (Sehr schlecht) = worst. Calculate average, then display. If no entries today, show yesterday's average with "Gestern:" prefix.
- **Display:** Large centered number (64px mobile, 72px desktop, font-weight 700). Colored background pill behind the entire hero section. Subtle trend indicator below.
- **Context shown:** Comparison text: "Besser als gestern" (if today avg < yesterday avg), "Wie gestern" (same), "Schlechter als gestern" (if worse). Show with small arrow icon.
- **Why this is the hero:** Users open the app to answer "How am I feeling?" - this answers it instantly with both a number and emotional color coding.

### Secondary KPIs

**Mahlzeiten heute**
- Source: Essgewohnheiten (filtered to today)
- Calculation: Count of records where `zeitpunkt_mahlzeit` is today
- Format: number
- Display: Compact inline badge with utensil icon, muted background

**Medikamente heute**
- Source: Medikamenteneinnahme (filtered to today)
- Calculation: Count of records where `zeitpunkt_einnahme` is today
- Format: number
- Display: Compact inline badge with pill icon, muted background

**Symptome erfasst**
- Source: Symptomerfassung (filtered to today)
- Calculation: Count of records where `zeitpunkt_symptom` is today
- Format: number
- Display: Compact inline badge with activity/pulse icon, muted background

### Chart

- **Type:** Area chart (soft filled area under line) - chosen because it shows trend progression smoothly and the filled area creates visual weight that emphasizes the wellness journey over time. Line-only would feel too clinical.
- **Title:** Symptom-Verlauf (letzte 7 Tage)
- **What question it answers:** "Is my condition improving, stable, or worsening over the past week?"
- **Data source:** Symptomerfassung
- **X-axis:** Date (last 7 days), formatted as weekday abbreviation (Mo, Di, Mi, Do, Fr, Sa, So)
- **Y-axis:** Average symptom score (1-10 scale, but inverted visually: 1 at top = good, 10 at bottom = bad). Label: "Befinden"
- **Mobile simplification:** Same chart, but remove y-axis labels, only show gridlines. Touch points for tooltips.
- **Colors:** Sage green fill with 20% opacity, solid sage green line

### Lists/Tables

**Letzte Einträge (Recent Entries)**
- Purpose: Quick review of what was logged recently, helps users remember if they logged something
- Source: Combined from all apps (Essgewohnheiten, Medikamenteneinnahme, Symptomerfassung, TaeglicheErfassung)
- Fields shown:
  - Icon (varies by type: utensils for meals, pill for meds, activity for symptoms, calendar for daily)
  - Primary text: meal description, medication name, or symptom type
  - Secondary text: time ago (vor X Min/Std/Tagen)
  - For symptoms: small colored dot indicating severity
- Mobile style: Simple list with subtle dividers, no cards
- Desktop style: Compact table-like rows with hover state
- Sort: By datetime descending (most recent first)
- Limit: 5 on mobile, 10 on desktop

### Primary Action Button (REQUIRED!)

- **Label:** "Eintrag hinzufügen" (with + icon)
- **Action:** Opens a modal/sheet with quick entry form for Tägliche Erfassung
- **Target app:** Tägliche Erfassung (69858612b7a952d0ddc01987)
- **What data:** The form includes:
  - Datum und Uhrzeit (auto-filled to now)
  - Symptom quick-select (dropdown: Räuspern, Lymphschwellung, Energie, Stimmung)
  - Bewertung (1-5 scale radio: Sehr gut → Sehr schlecht)
  - Optional: Mahlzeit description (textarea)
  - Optional: Medikament (dropdown from list)
  - Submit button: "Speichern"
- **Mobile position:** bottom_fixed - full-width button in a fixed bottom bar
- **Desktop position:** Prominent in right sidebar, top of sidebar
- **Why this action:** Daily tracking is the core workflow. Users need to log multiple data points (symptom + meal + meds) quickly. The Tägliche Erfassung app combines all three, making it the most efficient single action.

---

## 7. Visual Details

### Border Radius
- Cards: 12px (rounded-xl)
- Buttons: 10px (rounded-lg)
- Badges/pills: 9999px (full pill shape)
- Input fields: 8px (rounded-md)

### Shadows
- Cards: Subtle shadow `0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)`
- Elevated elements (modals, dropdowns): `0 4px 12px rgba(0,0,0,0.08)`
- Buttons on hover: `0 2px 8px rgba(0,0,0,0.08)`

### Spacing
- Spacious - generous padding throughout
- Card internal padding: 20px (mobile), 24px (desktop)
- Section gaps: 24px (mobile), 32px (desktop)
- Element gaps within sections: 12px

### Animations
- **Page load:** Subtle stagger fade-in. Hero fades in first (0ms), then stats (100ms), then chart (200ms), then list (300ms). Each fade takes 300ms with ease-out.
- **Hover effects:** Cards lift slightly (translateY -2px) with shadow increase. Buttons scale to 1.02. Transitions: 150ms ease.
- **Tap feedback:** Brief scale down to 0.98 then back. 100ms duration.

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(45 30% 97%);
  --foreground: hsl(200 15% 20%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(200 15% 20%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(200 15% 20%);
  --primary: hsl(152 35% 45%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(45 20% 94%);
  --secondary-foreground: hsl(200 15% 25%);
  --muted: hsl(45 20% 94%);
  --muted-foreground: hsl(200 10% 50%);
  --accent: hsl(152 25% 94%);
  --accent-foreground: hsl(152 35% 30%);
  --destructive: hsl(0 55% 55%);
  --border: hsl(45 15% 88%);
  --input: hsl(45 15% 88%);
  --ring: hsl(152 35% 45%);
  --radius: 0.75rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Plus Jakarta Sans with weights 300,400,500,600,700)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4 (hero dominant, compact badges, fixed bottom button)
- [ ] Desktop layout matches Section 5 (70/30 split, sticky sidebar)
- [ ] Hero element is prominent as described (large number, colored background based on score)
- [ ] Colors create the calm, wellness mood described in Section 2
- [ ] Chart uses area fill with sage green color
- [ ] Primary action button is always visible and prominent
- [ ] Recent entries combine all data sources
- [ ] Animations are subtle and performant
