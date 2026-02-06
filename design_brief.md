# Design Brief: Gesundheits- und Ernährungstagebuch

## 1. App Analysis

### What This App Does
This is a personal health and nutrition diary that helps users track their daily wellbeing across four interconnected dimensions: symptoms (throat clearing, lymph swelling, energy, mood), eating habits, medication intake, and a daily combined log. The app enables users to identify correlations between what they eat, medications they take, and how they feel - essential for anyone managing chronic conditions or optimizing their health.

### Who Uses This
The typical user is someone managing their health proactively - perhaps dealing with food sensitivities, tracking energy levels, or monitoring symptoms that might correlate with diet or medication. They're not tech-savvy; they want a simple, calming interface to quickly log entries throughout the day and occasionally review patterns.

### The ONE Thing Users Care About Most
**"How am I feeling today?"** - Users want to see their current wellbeing status at a glance. The most recent symptom ratings (energy, mood) give them immediate feedback on their health trajectory. This is the emotional anchor of the dashboard.

### Primary Actions (IMPORTANT!)
1. **Neuer Eintrag** (New daily entry) → Primary Action Button - Users log their combined daily status most frequently
2. Log a specific symptom
3. Record a meal
4. Log medication intake

---

## 2. What Makes This Design Distinctive

### Visual Identity
A warm, nurturing palette built on soft sage green and cream creates a calm, healing atmosphere that suits a health diary. Unlike clinical health apps with cold blues, this design feels like a personal journal - inviting daily reflection without anxiety. The warmth comes from subtle terracotta accents that highlight important metrics, contrasting with the calming sage base.

### Layout Strategy
- **Hero element emphasis**: The "How I'm Feeling" card dominates the top half of mobile, using generous whitespace and a large circular progress indicator that visualizes today's average symptom rating
- **Asymmetric desktop layout**: Wide left column (2/3) for the hero and chart, narrow right column (1/3) for recent activity timeline - this mirrors how users think (overview first, details second)
- **Visual interest through typography scale**: Hero metric uses 64px bold, secondary KPIs use 24px semibold, creating dramatic hierarchy
- **Breathing room**: Each section has ample padding, with more space between sections than within them

### Unique Element
The "Wellbeing Ring" - a circular progress visualization around the hero metric showing today's average symptom rating on a 1-10 scale. The ring fills clockwise with a gradient from sage (good) to terracotta (needs attention), with the numeric value prominently displayed in the center. The ring has a thick 12px stroke with rounded caps and a subtle inner glow, making the daily health status feel approachable and almost game-like.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
- **Why this font:** Professional yet friendly, with slightly rounded terminals that soften the clinical feel of a health app. The variable weights allow dramatic size hierarchy while maintaining visual cohesion.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(45 30% 97%)` | `--background` |
| Main text | `hsl(150 15% 20%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(150 15% 20%)` | `--card-foreground` |
| Borders | `hsl(45 20% 88%)` | `--border` |
| Primary action | `hsl(150 35% 45%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(15 60% 55%)` | `--accent` |
| Muted background | `hsl(45 20% 93%)` | `--muted` |
| Muted text | `hsl(150 10% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(150 45% 40%)` | (component use) |
| Error/negative | `hsl(0 65% 50%)` | `--destructive` |

### Why These Colors
The sage green primary evokes growth, healing, and balance - perfect for a health journal. The warm cream background (slight yellow undertone) prevents the sterile feeling of pure white while complementing the sage. Terracotta accent adds warmth and draws attention to key metrics and actions without feeling alarming like red would. Together they create a "wellness journal" aesthetic that feels personal, not clinical.

### Background Treatment
The background uses a warm cream (`hsl(45 30% 97%)`) with a subtle noise texture applied via CSS (very subtle, 2% opacity) to add organic warmth. Cards sit on pure white to create gentle lift without harsh shadows.

---

## 4. Mobile Layout (Phone)

### Layout Approach
The hero section commands attention by taking the entire first viewport. Secondary content reveals through scrolling, creating a focused, calming experience. Size variation is dramatic - the wellbeing ring and number dominate, while supporting metrics appear as compact inline elements below.

### What Users See (Top to Bottom)

**Header:**
- Left: "Mein Tagebuch" (My Diary) in 20px semibold, sage green
- Right: Settings icon (subtle, muted color)
- Clean, minimal, 56px height

**Hero Section (The FIRST thing users see):**
- **The Wellbeing Ring**: Large circular progress indicator (200px diameter) centered
- Inside the ring: Today's average symptom rating as large number (64px, 800 weight)
- Below number: "Heutiges Wohlbefinden" label (14px, muted)
- Ring gradient: sage green (good, 1-3) → amber (moderate, 4-6) → terracotta (poor, 7-10)
- Below ring: Current date formatted as "Freitag, 6. Februar"
- This section takes ~50% of viewport height
- Generous whitespace around the ring creates calm, focused attention
- **Why this is the hero**: It immediately answers "How am I doing?" - the user's primary concern

**Section 2: Quick Stats Row**
- Horizontal row of 3 compact stat pills (not cards)
- Each pill: icon + number + tiny label
- Stats: "Einträge heute" (entries today), "Mahlzeiten" (meals logged), "Medikamente" (medications taken)
- Subtle background, no shadows, inline styling
- Creates visual relief between hero and list

**Section 3: Symptom Trend Chart**
- Card with title "Wochen-Verlauf" (Weekly Trend)
- Simplified area chart showing last 7 days of average symptom ratings
- Sage green fill with darker stroke
- X-axis: Day abbreviations (Mo, Di, Mi...)
- Y-axis: hidden on mobile, values 1-10 implied
- Touch any point to see that day's value
- ~180px height, compact but readable

**Section 4: Recent Activity**
- Title "Letzte Einträge" (Recent Entries)
- Simple list (not cards) showing last 5 entries across all types
- Each row: colored dot (by type), time, brief description
- Color coding: Sage = symptom, Amber = meal, Blue = medication
- Subtle dividers between items

**Bottom Navigation / Action:**
- Fixed bottom bar with centered FAB
- FAB: Large (64px) sage green circle with "+" icon
- Label below FAB: "Neuer Eintrag"
- Tapping opens bottom sheet with entry type selection

### Mobile-Specific Adaptations
- Hero ring scales to fit width with padding
- Chart simplified to area only, no legends
- Recent activity as simple list, not cards
- All tap targets minimum 44px
- Bottom action bar always visible

### Touch Targets
- FAB: 64px diameter (comfortable thumb target)
- List items: 48px minimum height
- Settings icon: 44x44px touch area

### Interactive Elements
- Chart points: tap to show value tooltip
- Recent entries: tap to expand inline and show full notes
- Wellbeing ring: animated on load (fills up to current value)

---

## 5. Desktop Layout

### Overall Structure
Two-column asymmetric layout (2:1 ratio):
- **Left column (66%)**: Hero card (wellbeing ring + today's summary) stacked above trend chart
- **Right column (33%)**: Quick stats at top, recent activity timeline below
- Maximum content width: 1200px, centered
- Eye flow: Hero ring → chart → recent activity (F-pattern)

### Section Layout

**Top Area (Full Width):**
- Header bar: "Mein Gesundheitstagebuch" left, "Neuer Eintrag" button right
- Primary action button: Sage green, prominent, always visible

**Left Column:**
- Hero Card (top): Wellbeing ring (240px) with today's stats beside it
  - Ring on left side of card
  - Right side: Date, symptom breakdown (4 mini bars for each type), quick notes preview
  - Creates asymmetry within the card itself
- Trend Chart (below hero): Full 7-day view with all symptom types
  - Line chart with 4 colored lines (one per symptom type)
  - Hover to see values
  - Time filter: 7D | 14D | 30D toggle

**Right Column:**
- Quick Stats Card: 3 metrics in horizontal arrangement
  - Entries today, Meals logged, Medications taken
  - Compact card, no excessive styling
- Activity Timeline (below):
  - Vertical timeline style with colored dots
  - Shows last 10 entries
  - Each entry: time, type badge, description snippet
  - Subtle connector lines between entries
  - Scrollable if needed (max-height with overflow)

### What Appears on Hover
- Chart lines: highlight active line, show tooltip with date + value
- Timeline entries: subtle background highlight, full description preview
- Quick stats: subtle lift (2px shadow increase)

### Clickable/Interactive Areas
- Timeline entries: click to open detail modal
- Chart: click any data point to scroll timeline to that day's entries
- Symptom breakdown bars in hero: click to filter chart by that type

---

## 6. Components

### Hero KPI: Wellbeing Ring
The MOST important metric that users see first.

- **Title:** Heutiges Wohlbefinden (Today's Wellbeing)
- **Data source:** Symptomerfassung app (for dedicated entries) + TaeglicheErfassung (for combined logs)
- **Calculation:** Average of today's symptom ratings (bewertung_symptom field, convert wert_1 to 1, wert_10 to 10). If no entries today, show last entry's value with "Letzter Eintrag" label
- **Display:** Large circular progress ring (200px mobile, 240px desktop) with numeric value centered inside. Ring fills based on inverted scale (10 = empty/red, 1 = full/green) so fuller ring = better feeling
- **Context shown:** Below the ring show "besser als gestern" or "schlechter als gestern" comparison with small arrow indicator
- **Why this is the hero:** Immediately answers the user's core question: "How am I feeling?" Provides emotional anchor and motivation for logging

### Secondary KPIs

**Einträge heute (Entries Today)**
- Source: Count across all 4 apps where date = today
- Calculation: Count of records where zeitpunkt_* date matches today
- Format: number
- Display: Compact pill with icon (clipboard), number prominent

**Mahlzeiten heute (Meals Today)**
- Source: Essgewohnheiten + TaeglicheErfassung (where mahlzeit_beschreibung exists)
- Calculation: Count
- Format: number
- Display: Compact pill with icon (utensils), number prominent

**Medikamente heute (Medications Today)**
- Source: Medikamenteneinnahme + TaeglicheErfassung (where medikamentenname exists)
- Calculation: Count
- Format: number
- Display: Compact pill with icon (pill), number prominent

### Chart: Weekly Symptom Trend
- **Type:** Area chart (single line) on mobile, Multi-line chart on desktop
- **Why this type:** Area charts are calming and show trends clearly; multiple lines on desktop allow symptom comparison
- **Title:** Wochen-Verlauf (Weekly Trend)
- **What question it answers:** "Is my wellbeing improving or declining over time?"
- **Data source:** Symptomerfassung (bewertung_symptom by day)
- **X-axis:** Last 7 days, formatted as day abbreviations (Mo, Di, Mi, Do, Fr, Sa, So)
- **Y-axis:** 1-10 scale (1 = best, 10 = worst), inverted visually so higher on chart = better
- **Mobile simplification:** Single aggregated line (average of all symptoms), no legend, minimal axis labels
- **Desktop enhancement:** 4 separate lines (one per symptomtyp), legend below chart, hover tooltips

### Lists/Tables: Recent Activity

**Letzte Einträge (Recent Entries)**
- Purpose: Give users context on recent logging activity, easy reference to past entries
- Source: All 4 apps, merged and sorted by date
- Fields shown: Time (relative: "vor 2 Stunden"), type badge, description (truncated)
- Mobile style: Simple list with colored left border per type
- Desktop style: Timeline with vertical connector, more detail visible
- Sort: Most recent first
- Limit: 5 on mobile, 10 on desktop

### Primary Action Button (REQUIRED!)

- **Label:** "Neuer Eintrag" (New Entry)
- **Action:** Opens entry form dialog/bottom sheet
- **Target app:** TaeglicheErfassung (the combined daily log - most flexible)
- **What data:**
  - zeitpunkt_eintrag: auto-filled with current datetime
  - Form sections for: Mahlzeit (optional), Symptom (optional), Medikament (optional)
  - At least one section must be filled
- **Mobile position:** bottom_fixed (FAB style, 64px, centered)
- **Desktop position:** header (right side, prominent button)
- **Why this action:** The combined daily entry is the most flexible - users can log any combination of data without navigating to specific apps. This matches how people naturally think: "Let me quickly note what I ate and how I'm feeling" rather than "Let me open the meals app, then the symptoms app..."

---

## 7. Visual Details

### Border Radius
Rounded (12px for cards, 8px for buttons, 24px for pills/badges)
- Creates soft, approachable feeling
- Consistent across all elements

### Shadows
Subtle, warm-tinted shadows:
- Cards: `0 2px 8px hsl(45 20% 70% / 0.15)`
- Elevated (hover): `0 4px 12px hsl(45 20% 70% / 0.2)`
- No harsh black shadows - keeps the warm aesthetic

### Spacing
Spacious - generous padding creates calm:
- Card padding: 24px
- Section gaps: 24px mobile, 32px desktop
- Component internal spacing: 16px
- Breathing room around hero: 32px all sides

### Animations
- **Page load:** Wellbeing ring fills with smooth easing (800ms), stats fade in staggered (200ms delay each)
- **Hover effects:** Cards lift 2px with shadow increase (150ms ease)
- **Tap feedback:** Scale to 0.98 then back (100ms)
- **Chart:** Lines draw in from left on load (600ms)

---

## 8. CSS Variables (Copy Exactly!)

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

:root {
  --background: hsl(45 30% 97%);
  --foreground: hsl(150 15% 20%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(150 15% 20%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(150 15% 20%);
  --primary: hsl(150 35% 45%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(45 25% 92%);
  --secondary-foreground: hsl(150 15% 25%);
  --muted: hsl(45 20% 93%);
  --muted-foreground: hsl(150 10% 45%);
  --accent: hsl(15 60% 55%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 65% 50%);
  --border: hsl(45 20% 88%);
  --input: hsl(45 20% 88%);
  --ring: hsl(150 35% 45%);
  --radius: 0.75rem;
}

body {
  font-family: 'Plus Jakarta Sans', sans-serif;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Plus Jakarta Sans with weights 300-800)
- [ ] All CSS variables copied exactly to src/index.css
- [ ] Mobile layout matches Section 4 (hero ring dominant, bottom FAB)
- [ ] Desktop layout matches Section 5 (2:1 columns, header action button)
- [ ] Hero element is prominent as described (200px ring mobile, 240px desktop)
- [ ] Colors create the warm, nurturing mood described in Section 2
- [ ] Wellbeing ring animates on load
- [ ] Chart shows weekly symptom trend with proper colors
- [ ] Recent activity list is functional with correct color coding
- [ ] Primary action button opens form for TaeglicheErfassung
- [ ] Ring gradient uses sage → terracotta based on symptom value
- [ ] All date fields use YYYY-MM-DDTHH:MM format (no seconds!)
- [ ] Symptom ratings converted correctly (wert_1 = 1, wert_10 = 10)
