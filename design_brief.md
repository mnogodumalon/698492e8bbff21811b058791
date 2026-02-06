# Design Brief: Gesundheits- und Ernährungstagebuch

## 1. App Analysis

### What This App Does
This is a personal health and nutrition diary that allows users to track their daily eating habits, symptoms (throat clearing, lymph swelling, energy, mood), and medication intake. The "Tägliche Erfassung" (Daily Entry) app provides an all-in-one form to capture meals, symptoms, and medications in a single entry, while dedicated apps track each category separately.

### Who Uses This
Health-conscious individuals monitoring their wellness, potentially managing chronic conditions or food sensitivities. They want to identify patterns between what they eat and how they feel. These are non-technical users who need a simple, intuitive interface to log daily health data.

### The ONE Thing Users Care About Most
**"How do I feel today?"** - Users want an instant snapshot of their current wellness state. The most recent symptom assessment (energy, mood, physical symptoms) is what they check first to understand their baseline.

### Primary Actions (IMPORTANT!)
1. **Neuen Eintrag erfassen** → Primary Action Button (add daily entry via Tägliche Erfassung)
2. View recent entries to spot patterns
3. Track symptom trends over time

---

## 2. What Makes This Design Distinctive

### Visual Identity
A warm, nurturing aesthetic using soft sage green as the accent color evokes natural health and calm wellbeing. The design feels like a personal wellness journal rather than a clinical medical app - approachable yet trustworthy. Cream-tinted backgrounds create warmth, while the sage green accent adds a touch of organic freshness without being overwhelming.

### Layout Strategy
- **Hero element:** The "Heutiges Befinden" (Today's Wellbeing) card dominates with a large circular mood indicator showing the latest symptom assessment
- **Asymmetric layout on desktop:** Wide left column (65%) with hero + timeline, narrow right column (35%) with quick stats
- **Size variation:** Hero card is 2x the height of stat cards, creating clear visual hierarchy
- **Spacing variation:** Generous padding around hero, tighter grouping for secondary metrics

### Unique Element
The circular "Befinden" indicator uses a segmented ring showing all four symptom types (Räuspern, Lymphschwellung, Energie, Stimmung) as colored segments. The ring fills based on today's ratings, creating a quick visual wellness score. The center shows an emoji-style indicator (from happy to concerned face) based on average wellbeing.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap`
- **Why this font:** Professional yet friendly, excellent readability at small sizes, distinctive character without being quirky. The slightly rounded terminals feel approachable for a health app.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(45 30% 97%)` | `--background` |
| Main text | `hsl(150 10% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(150 10% 15%)` | `--card-foreground` |
| Borders | `hsl(45 15% 88%)` | `--border` |
| Primary action (sage) | `hsl(145 35% 42%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(145 40% 92%)` | `--accent` |
| Muted background | `hsl(45 20% 94%)` | `--muted` |
| Muted text | `hsl(150 5% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(145 50% 45%)` | (component use) |
| Error/negative | `hsl(0 65% 55%)` | `--destructive` |

### Why These Colors
The sage green (`hsl(145 35% 42%)`) represents natural health and growth without the clinical coldness of typical medical blues. The warm cream background (`hsl(45 30% 97%)`) feels like quality paper in a personal journal. Together they create a calm, trustworthy environment that encourages daily engagement.

### Background Treatment
Subtle warm cream tint on the page background. Cards are pure white to create gentle contrast and lift. The slight warmth prevents the sterile feeling of pure white interfaces.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
- Hero wellness indicator dominates the first viewport (~50% of screen height)
- Single column vertical flow below
- Clear visual hierarchy through size: hero is 3x larger than stat items
- Bottom fixed action button for easy thumb access

### What Users See (Top to Bottom)

**Header:**
- Simple title "Tagebuch" left-aligned
- Today's date (e.g., "Fr, 6. Feb") right-aligned
- Clean, minimal - no navigation clutter

**Hero Section (The FIRST thing users see):**
- Large circular wellness ring (200px diameter) centered
- Ring shows 4 segments for each symptom type, colored by severity
- Center displays simple face icon (smile/neutral/frown) based on average
- Below ring: "Heutiges Befinden" label with the overall assessment text (e.g., "Gut")
- Below that: timestamp of last entry ("Zuletzt: 14:30 Uhr")
- Why hero: Users want instant "How am I doing?" feedback without scrolling

**Section 2: Quick Stats Row**
- Horizontal scroll of 3 compact stat pills (not full cards)
- Each pill: icon + number + label
- Stats: Mahlzeiten heute (meals), Symptome erfasst (symptoms logged), Medikamente (meds)
- Small, compact - supporting info, not competing with hero

**Section 3: Letzte Einträge (Recent Entries)**
- Simple list of last 5 daily entries
- Each entry shows: Date, meal summary (truncated), symptom indicator dot
- Tappable to expand details
- Card style with subtle shadow

**Section 4: Symptom-Verlauf (7-Day Trend)**
- Small area chart showing average symptom rating over past 7 days
- Simplified for mobile: no axis labels, just the trend line
- Caption: "Letzte 7 Tage"

**Bottom Navigation / Action:**
- Fixed bottom button bar
- Primary: Large sage green "Eintrag hinzufügen" button (full width minus padding)
- Touch-optimized 56px height

### Mobile-Specific Adaptations
- Hero ring shrinks slightly on very small screens (min 160px)
- Quick stats become horizontally scrollable
- Chart simplified to trend line only
- Entry list shows truncated meal description

### Touch Targets
- All interactive elements minimum 44px touch target
- Primary action button 56px height
- List items full-width tappable area

### Interactive Elements
- Tapping an entry in "Letzte Einträge" opens a bottom sheet with full details
- Hero ring segments are NOT interactive (display only)

---

## 5. Desktop Layout

### Overall Structure
- Max-width container: 1200px centered
- Two-column layout: 65% left (main), 35% right (sidebar)
- Clear F-pattern reading flow: hero top-left, then down-left, then right column

### Section Layout

**Top Area (spans full width):**
- Header with "Gesundheits- und Ernährungstagebuch" title
- Date selector/filter on right
- Primary action button "Neuer Eintrag" in header right

**Left Column (65%):**
1. Hero Card: Large wellness ring (280px) with detailed breakdown
   - Ring shows all 4 symptom types as segments
   - Legend below showing each symptom's current value
   - Takes significant vertical space (~400px total)
2. Symptom-Verlauf Chart
   - Full line chart with proper axes
   - Last 14 days of data
   - Hover states showing exact values
   - Multiple lines for different symptom types (toggleable)

**Right Column (35%):**
1. Quick Stats Stack (3 cards vertically)
   - Mahlzeiten heute
   - Symptome erfasst
   - Medikamente eingenommen
   - Each with icon, count, and subtle trend indicator
2. Letzte Einträge List
   - Last 7 entries
   - More detail shown than mobile
   - Includes meal description, symptom summary, medication list

### What Appears on Hover
- Chart data points show tooltip with exact value and date
- Entry items show subtle background highlight and "Details anzeigen" text
- Stat cards show subtle scale increase (1.02)

### Clickable/Interactive Areas
- Entries in list open a side panel/dialog with full entry details
- Chart legend items toggle line visibility
- Date range selector allows filtering

---

## 6. Components

### Hero KPI: Heutiges Befinden (Today's Wellbeing)
The MOST important metric that users see first.

- **Title:** Heutiges Befinden
- **Data source:** symptomerfassung (latest entry from today) or taegliche_erfassung
- **Calculation:** Average of all symptom ratings logged today. Map wert_1 to wert_10 scale (1-10) then average.
- **Display:** Large circular ring with 4 colored segments. Center shows emoji face. Below: textual rating (Sehr gut / Gut / Geht so / Schlecht / Sehr schlecht)
- **Context shown:** Time of last entry, comparison text if notably different from yesterday
- **Why this is the hero:** Users open the app asking "How do I feel?" - this answers instantly

### Secondary KPIs

**Mahlzeiten heute**
- Source: essgewohnheiten + taegliche_erfassung
- Calculation: Count of entries from today
- Format: number
- Display: Stat card with utensil icon

**Symptome erfasst**
- Source: symptomerfassung + taegliche_erfassung
- Calculation: Count of symptom entries today
- Format: number
- Display: Stat card with pulse/heart icon

**Medikamente**
- Source: medikamenteneinnahme + taegliche_erfassung
- Calculation: Count of medication entries today
- Format: number
- Display: Stat card with pill icon

### Chart: Symptom-Verlauf (Symptom Trend)
- **Type:** Line chart - shows trends over time clearly, appropriate for continuous health data
- **Title:** Symptom-Verlauf
- **What question it answers:** "Am I getting better or worse over time?"
- **Data source:** symptomerfassung
- **X-axis:** Date (last 14 days on desktop, 7 on mobile)
- **Y-axis:** Rating (1-10, where 1 is best)
- **Lines:** One line per symptom type (Räuspern, Lymphschwellung, Energie, Stimmung), color-coded
- **Mobile simplification:** Single averaged line, no legend, last 7 days only

### Lists: Letzte Einträge (Recent Entries)
- **Purpose:** Quick reference to recent logs, pattern spotting
- **Source:** taegliche_erfassung (primary), fallback to individual apps
- **Fields shown:**
  - Date/time (formatted: "Mo, 5. Feb · 14:30")
  - Meal summary (first 50 chars)
  - Symptom indicator (colored dot based on average rating)
  - Medication indicator (pill icon if meds logged)
- **Mobile style:** Compact list items with truncation
- **Desktop style:** Card-style list items with more detail
- **Sort:** By date descending (newest first)
- **Limit:** 5 on mobile, 7 on desktop

### Primary Action Button (REQUIRED!)

- **Label:** "Eintrag hinzufügen" (mobile) / "Neuer Eintrag" (desktop)
- **Action:** Opens dialog/drawer to create new TaeglicheErfassung entry
- **Target app:** taegliche_erfassung (69858612b7a952d0ddc01987)
- **What data:** Form with fields:
  - zeitpunkt_eintrag (auto-filled with current datetime)
  - mahlzeit_beschreibung_gesamt (textarea)
  - symptomtyp_gesamt (select)
  - bewertung_symptom_gesamt (radio buttons)
  - medikamentenname_freitext_gesamt (text input)
  - dosierung_gesamt (text input)
- **Mobile position:** bottom_fixed
- **Desktop position:** header (right side)
- **Why this action:** Daily logging is the core purpose - must be frictionless

---

## 7. Visual Details

### Border Radius
rounded (8px) - Friendly but not childish

### Shadows
subtle - Cards use `0 1px 3px rgba(0,0,0,0.08)` - gentle lift without floating feel

### Spacing
spacious - Generous padding (24px in cards, 16px between elements) for calm, uncluttered feel

### Animations
- **Page load:** Staggered fade-in (hero first, then stats, then list)
- **Hover effects:** Subtle scale (1.02) on cards, background color shift on list items
- **Tap feedback:** Quick opacity flash (0.7) on touch

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(45 30% 97%);
  --foreground: hsl(150 10% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(150 10% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(150 10% 15%);
  --primary: hsl(145 35% 42%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(45 20% 94%);
  --secondary-foreground: hsl(150 10% 15%);
  --muted: hsl(45 20% 94%);
  --muted-foreground: hsl(150 5% 50%);
  --accent: hsl(145 40% 92%);
  --accent-foreground: hsl(150 10% 15%);
  --destructive: hsl(0 65% 55%);
  --border: hsl(45 15% 88%);
  --input: hsl(45 15% 88%);
  --ring: hsl(145 35% 42%);
  --chart-1: hsl(145 45% 45%);
  --chart-2: hsl(200 60% 50%);
  --chart-3: hsl(45 80% 55%);
  --chart-4: hsl(280 50% 55%);
  --chart-5: hsl(0 60% 55%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Plus Jakarta Sans font loaded from Google Fonts URL
- [ ] All CSS variables copied exactly as specified
- [ ] Mobile layout: fixed bottom action button, hero ring centered, horizontal scroll stats
- [ ] Desktop layout: 65/35 two-column, hero left, stats stacked right
- [ ] Hero wellness ring is prominently sized (200px mobile, 280px desktop)
- [ ] Sage green accent creates warm, healthy mood
- [ ] Form dialog/drawer for adding new TaeglicheErfassung entries
- [ ] Staggered fade-in animation on load
- [ ] Chart shows symptom trends with multiple colored lines
