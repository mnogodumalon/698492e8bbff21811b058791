# Design Brief: Gesundheits- und Ernährungstagebuch

## 1. App Analysis

### What This App Does
This is a personal health and nutrition diary that helps users track four key aspects of their daily wellness: meals/eating habits (Essgewohnheiten), symptoms with severity ratings (Symptomerfassung), medication intake (Medikamenteneinnahme), and daily comprehensive entries (Tägliche Erfassung). The app allows users to identify patterns between what they eat, the medications they take, and how they feel.

### Who Uses This
Health-conscious individuals managing chronic symptoms like throat clearing (Räuspern), lymph node swelling, energy levels, or mood. They want to correlate their dietary choices and supplement intake with how they feel day-to-day. These are non-technical users who need a simple, visual way to see if certain foods trigger symptoms or if supplements improve their wellbeing.

### The ONE Thing Users Care About Most
**"How am I feeling today, and is there a pattern?"** - Users want to see their current symptom status at a glance and understand trends over time. The most recent symptom rating is the hero metric.

### Primary Actions (IMPORTANT!)
1. **Eintrag hinzufügen** → Primary Action Button (Quick entry via Tägliche Erfassung - the all-in-one form)
2. View symptom trends over time
3. Review recent meals and medications

---

## 2. What Makes This Design Distinctive

### Visual Identity
This design uses a **soft sage green palette** that evokes natural healing and wellness without being clinical. The warm cream base combined with muted green accents creates a calming, supportive environment - like a wellness journal you'd want to open daily. Unlike sterile health apps, this feels personal and nurturing.

### Layout Strategy
- **Mobile:** A large, circular "feeling indicator" dominates the first viewport - showing today's average symptom score with a radial progress visualization. This creates an emotional connection immediately. Below it, compact timeline cards show recent entries.
- **Desktop:** Asymmetric two-column layout. Left column (65%) holds the hero feeling indicator and a symptom trend chart. Right column (35%) shows recent activity as a vertical timeline. The asymmetry creates visual flow from the hero to supporting content.
- Size variation is key: Hero element is 3x larger than secondary cards.

### Unique Element
The **"Wellness Ring"** - a large circular progress indicator that shows today's average symptom score (1-10) as a filled arc. The ring uses a gradient from sage green (good) to muted amber (bad), with the numeric score displayed prominently in the center using extra-large typography. The ring has a subtle pulse animation when loaded, making it feel alive.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap`
- **Why this font:** Plus Jakarta Sans has a friendly, rounded quality that feels approachable for health tracking, while maintaining excellent readability for numbers and data. Its geometric foundation works well for both large display numbers and small UI text.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(90 20% 97%)` | `--background` |
| Main text | `hsl(150 20% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(150 20% 15%)` | `--card-foreground` |
| Borders | `hsl(90 15% 88%)` | `--border` |
| Primary action | `hsl(152 35% 45%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(152 40% 92%)` | `--accent` |
| Muted background | `hsl(90 15% 94%)` | `--muted` |
| Muted text | `hsl(150 10% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(152 50% 40%)` | (component use) |
| Error/negative | `hsl(0 65% 50%)` | `--destructive` |

### Why These Colors
The sage green palette (`hsl(152, ...)`) creates a sense of natural wellness and growth - appropriate for a health diary. The warm cream background (`hsl(90 20% 97%)`) prevents the sterile feeling of pure white. Green is associated with healing and balance across cultures, making users feel supported rather than clinical.

### Background Treatment
The background uses a subtle warm cream (`hsl(90 20% 97%)`) with a barely perceptible gradient toward slightly cooler sage at the bottom. This creates depth without distraction.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
The hero Wellness Ring dominates the first viewport (60% of screen height), creating immediate emotional impact. Below it, content flows as compact horizontal-scrolling cards for recent entries, then a simplified line chart. Visual interest comes from the massive size difference between the hero and secondary elements.

### What Users See (Top to Bottom)

**Header:**
- Simple, left-aligned greeting: "Dein Tagebuch" in 18px semibold
- Current date in muted text below
- No competing elements - hero needs attention

**Hero Section (The FIRST thing users see):**
- **Wellness Ring** - circular progress visualization
- Takes 50% of viewport height
- Large circle (280px diameter) with 12px stroke width
- Center displays: Today's average symptom score as massive 72px bold number
- Below number: "Heute" label in 14px muted text
- Ring fill color: gradient based on score (green = good, amber = moderate, red = poor)
- Subtle drop shadow on the ring creates depth
- If no entries today: shows "--" with "Noch keine Einträge" below
- **Why hero:** Users want instant emotional read on their day

**Section 2: Letzte Einträge (Recent Entries)**
- Horizontal scrolling row of compact cards
- Each card: 140px wide, shows entry type icon + time + brief summary
- Entry types color-coded:
  - Mahlzeit = sage icon
  - Symptom = amber icon
  - Medikament = blue icon
- Maximum 6 most recent entries visible
- Tapping card could expand to show details (optional)

**Section 3: Symptom-Verlauf (7-Day Trend)**
- Simple area chart showing symptom scores over past 7 days
- Height: 180px
- Y-axis: 1-10 (inverted: 1 at top = good, 10 at bottom = bad)
- X-axis: Day abbreviations (Mo, Di, Mi, Do, Fr, Sa, So)
- Fill color: sage green with transparency
- Single line, no legend needed

**Section 4: Medikamente heute (Today's Medications)**
- Compact list of medications taken today
- Each row: Pill icon + medication name + time taken
- If none: "Noch keine Medikamente eingetragen"
- Light card background with subtle border

**Bottom Navigation / Action:**
- Fixed bottom button bar (80px height, safe area padding)
- Large primary button: "Eintrag hinzufügen" spanning full width minus 32px margins
- Button has subtle shadow for elevation

### Mobile-Specific Adaptations
- Chart is simplified: only 7 days, no hover states
- Recent entries use horizontal scroll instead of vertical list
- All touch targets minimum 44px
- Bottom action stays visible while scrolling

### Touch Targets
- Primary action button: 56px height
- Card tap areas: full card surface (140px × 100px minimum)
- Adequate spacing between tappable elements (12px minimum)

### Interactive Elements
- Tapping the Wellness Ring shows a bottom sheet with today's symptom breakdown by type
- Tapping a recent entry card expands it in-place with full details

---

## 5. Desktop Layout

### Overall Structure
Two-column asymmetric layout:
- **Left column (60%):** Hero Wellness Ring + Symptom Trend Chart (stacked vertically)
- **Right column (40%):** Recent Activity Timeline + Today's Summary

Eye flow: Hero ring (top-left) → Trend chart (below hero) → Activity timeline (right side)

### Section Layout

**Top Area:**
- Header spanning full width: "Gesundheits- und Ernährungstagebuch" title (24px semibold) with current date
- Primary action button "Eintrag hinzufügen" positioned at top-right of header

**Left Column (Main Content):**
- Wellness Ring: 320px diameter, centered in a card with generous padding (48px)
- Below: Symptom Trend Chart in separate card
  - Height: 280px
  - Shows 14 days of data
  - Multiple symptom types as separate lines with legend
  - Hover reveals exact values

**Right Column (Supporting Content):**
- "Letzte Einträge" card: Vertical timeline of recent entries
  - Shows last 10 entries
  - Each entry: timestamp, type badge, brief content
  - Color-coded by entry type
- "Heute im Überblick" card below:
  - Count of meals logged
  - Count of symptoms recorded
  - List of medications taken

### What Appears on Hover
- Trend chart: tooltip with exact date, score, and notes excerpt
- Timeline entries: full content preview in tooltip
- Cards: subtle elevation increase (shadow grows)

### Clickable/Interactive Areas
- Timeline entries expand inline when clicked to show full details
- Chart data points are clickable to see the full entry for that day

---

## 6. Components

### Hero KPI: Wellness Ring
The MOST important metric that users see first.

- **Title:** Heutiges Befinden
- **Data source:** Symptomerfassung (for today's entries)
- **Calculation:** Average of today's symptom ratings. Convert lookup values (wert_1 through wert_10) to numbers 1-10, calculate mean. If multiple symptom types, average all ratings.
- **Display:** Large circular progress ring with numeric center
  - Ring shows percentage fill (10 = full, 1 = nearly empty, inverted so lower is better)
  - Actually: ring fills based on "wellness" (10 - score) / 9, so score of 1 = full ring (best)
  - Number in center: the average score to 1 decimal (e.g., "3.5")
  - Label below number: "Heute" or symptom count "3 Einträge"
- **Context shown:** Ring color shifts from green (good: 1-3) → amber (moderate: 4-6) → red (poor: 7-10)
- **Why this is the hero:** Users want instant emotional read on how they're doing today. A number alone is cold; the ring visualization creates an immediate gut feeling.

### Secondary KPIs

**Einträge heute (Entries Today)**
- Source: All apps, filter by today's date
- Calculation: Count of records where date field = today
- Format: Integer with label ("5 Einträge")
- Display: Inline text in hero card, below ring

**Mahlzeiten heute (Meals Today)**
- Source: Essgewohnheiten + TaeglicheErfassung (where mahlzeit_beschreibung_gesamt exists)
- Calculation: Count of today's meal entries
- Format: Integer
- Display: Small card in "Heute im Überblick" section

**Medikamente heute (Medications Today)**
- Source: Medikamenteneinnahme
- Calculation: Count of today's medication entries
- Format: List of medication names taken today
- Display: Compact list in sidebar card

### Chart: Symptom Trend

- **Type:** Area chart - shows trends over time smoothly, the filled area creates visual weight showing "accumulation" of symptoms
- **Title:** Symptom-Verlauf (letzte 14 Tage)
- **What question it answers:** "Are my symptoms getting better or worse over time?"
- **Data source:** Symptomerfassung
- **X-axis:** Date (last 14 days), formatted as "DD.MM"
- **Y-axis:** Symptom score (1-10), labeled "Bewertung" - note: 1 = best, 10 = worst
- **Lines:** One line per symptom type if multiple tracked, or single aggregate line
- **Colors:** Use muted versions of primary color for fills
- **Mobile simplification:** 7 days only, single aggregate line, no legend

### Lists/Tables

**Letzte Einträge (Recent Activity Timeline)**
- Purpose: Users need context of what they've logged recently to identify patterns
- Source: All apps, merged and sorted by timestamp
- Fields shown:
  - Entry type (icon + colored badge)
  - Timestamp (relative: "vor 2 Stunden" or time if today)
  - Brief content (first 50 chars of description/name)
- Mobile style: Horizontal scrolling cards
- Desktop style: Vertical timeline with colored left border per type
- Sort: Most recent first
- Limit: 6 on mobile, 10 on desktop

**Medikamente heute (Today's Medications)**
- Purpose: Quick reference of what's been taken today
- Source: Medikamenteneinnahme filtered to today
- Fields shown: Medication name (from lookup), time taken
- Mobile style: Simple list rows
- Desktop style: Compact list in card
- Sort: Chronological (earliest first)
- Limit: All of today

### Primary Action Button (REQUIRED!)

- **Label:** "Eintrag hinzufügen"
- **Action:** add_record
- **Target app:** TaeglicheErfassung (the unified entry form)
- **What data:** Form opens with:
  - zeitpunkt_eintrag: pre-filled with current datetime
  - mahlzeit_beschreibung_gesamt: textarea
  - symptomtyp_gesamt: select dropdown
  - bewertung_symptom_gesamt: radio buttons (Sehr gut → Sehr schlecht)
  - medikamentenname_freitext_gesamt: optional text input
- **Mobile position:** bottom_fixed (persistent sticky button at bottom)
- **Desktop position:** header (top-right corner of page header)
- **Why this action:** The daily entry form captures everything in one place - meals, symptoms, medications. Users are more likely to log consistently if there's one unified entry point rather than navigating to different forms.

---

## 7. Visual Details

### Border Radius
Rounded (12px) for cards, pill (24px) for buttons and badges. The rounded corners feel soft and approachable, matching the wellness theme.

### Shadows
Subtle - cards have `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)). On hover, elevate to `shadow-md`. The Wellness Ring card has slightly more shadow to create depth hierarchy.

### Spacing
Spacious - generous padding inside cards (24px), comfortable gaps between sections (24px). The hero section has extra breathing room (48px padding on desktop). Mobile uses 16px standard padding.

### Animations
- **Page load:** Stagger fade-in for cards (100ms delay between each)
- **Wellness Ring:** On load, ring fills from 0 to current value over 800ms with ease-out curve
- **Hover effects:** Cards lift slightly (translateY -2px) with shadow increase
- **Tap feedback:** Brief scale to 0.98 on buttons

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(90 20% 97%);
  --foreground: hsl(150 20% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(150 20% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(150 20% 15%);
  --primary: hsl(152 35% 45%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(90 15% 94%);
  --secondary-foreground: hsl(150 20% 20%);
  --muted: hsl(90 15% 94%);
  --muted-foreground: hsl(150 10% 45%);
  --accent: hsl(152 40% 92%);
  --accent-foreground: hsl(152 35% 25%);
  --destructive: hsl(0 65% 50%);
  --border: hsl(90 15% 88%);
  --input: hsl(90 15% 88%);
  --ring: hsl(152 35% 45%);
  --radius: 0.75rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap`
- [ ] All CSS variables copied exactly to `src/index.css`
- [ ] Mobile layout: Wellness Ring dominates top 50% of viewport
- [ ] Desktop layout: 60/40 two-column asymmetric
- [ ] Hero Wellness Ring is prominently sized (280px mobile, 320px desktop)
- [ ] Ring color reflects score (green/amber/red gradient)
- [ ] Symptom scores correctly inverted (1 = best = full ring)
- [ ] Primary action "Eintrag hinzufügen" is fixed at bottom on mobile
- [ ] Chart shows 7 days mobile, 14 days desktop
- [ ] Entry type color coding consistent throughout
- [ ] Animations: Ring fill animation on load
- [ ] Lookup values converted to display names (e.g., "wert_1" → "1 - Sehr gut")
