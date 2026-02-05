# Design Brief: Gesundheits- und Ernährungstagebuch

## 1. App Analysis

### What This App Does
This is a personal health and nutrition diary that helps users track three interconnected aspects of their wellbeing: symptoms (like energy levels, mood, throat clearing, lymph swelling), eating habits, and medication intake. The core purpose is to help users identify patterns and correlations between what they eat, their medications, and how they feel.

### Who Uses This
Health-conscious individuals managing chronic conditions, food sensitivities, or anyone wanting to understand how their diet and medications affect their symptoms. They're likely tracking this data to share with doctors or to identify triggers for symptoms. They're not tech-savvy - they just want a simple way to log their daily health data.

### The ONE Thing Users Care About Most
**"Wie fühle ich mich heute?"** (How am I feeling today?) - Users want to see their current symptom status at a glance, especially energy and mood levels, and quickly understand if today is a good or bad day compared to recent trends.

### Primary Actions (IMPORTANT!)
1. **Symptom erfassen** → Primary Action Button (most frequent action - users log symptoms multiple times daily)
2. Mahlzeit hinzufügen (secondary - tracked at mealtimes)
3. Medikament eintragen (less frequent - usually scheduled)

---

## 2. What Makes This Design Distinctive

### Visual Identity
This design uses a **soft sage green and warm cream palette** that evokes healing, nature, and wellness. Unlike clinical health apps that feel sterile with blues and whites, this feels like a personal wellness journal - calming and encouraging. The warm cream background with subtle sage accents creates a nurturing environment that makes daily health tracking feel like self-care rather than a medical chore.

### Layout Strategy
The layout is **asymmetric on desktop** with a dominant left column (60%) for the hero wellness score and symptom trends, and a narrower right column (40%) for recent activity. This creates visual hierarchy where wellness state is clearly primary.

On mobile, the layout uses **vertical stacking with dramatic size variation**: the hero section takes nearly 50% of the initial viewport with an oversized wellness indicator, making the most important information impossible to miss. Secondary stats are presented in a compact horizontal row, NOT as equal cards - they're supporting info, not competing heroes.

### Unique Element
The **Wellness-Indikator** (Wellness Indicator) at the top uses a unique gradient arc that visualizes the average symptom score for today. The arc progresses from sage green (good) through warm yellow to a soft coral (needs attention). This arc wraps around a large number showing today's average score, making it feel almost game-like - encouraging users to "improve their score" by taking care of themselves.

---

## 3. Theme & Colors

### Font
- **Family:** DM Sans
- **URL:** `https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap`
- **Why this font:** DM Sans has a warm, friendly personality that doesn't feel clinical. Its soft letter shapes with slightly rounded terminals feel approachable and caring - perfect for a personal health journal. The variable weight range allows for dramatic hierarchy between the large wellness number and smaller labels.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(45 30% 97%)` | `--background` |
| Main text | `hsl(150 15% 20%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(150 15% 20%)` | `--card-foreground` |
| Borders | `hsl(150 15% 88%)` | `--border` |
| Primary action (sage green) | `hsl(150 35% 45%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(150 30% 92%)` | `--accent` |
| Muted background | `hsl(45 20% 94%)` | `--muted` |
| Muted text | `hsl(150 10% 45%)` | `--muted-foreground` |
| Success/positive (good symptoms) | `hsl(150 45% 45%)` | (component use) |
| Warning (moderate symptoms) | `hsl(40 80% 55%)` | (component use) |
| Error/negative (bad symptoms) | `hsl(10 60% 55%)` | `--destructive` |

### Why These Colors
The sage green primary evokes natural healing and wellness without feeling clinical like medical blue. The warm cream background (not pure white) creates a cozy, journal-like feel. The color system for symptoms creates intuitive feedback: green is "I feel good", yellow is "okay", coral is "needs attention" - natural associations that require no learning.

### Background Treatment
The background uses a very subtle warm cream (`hsl(45 30% 97%)`) rather than pure white, giving the entire app a gentle warmth. This is intentional - pure white can feel cold and clinical, while the warm cream feels like a wellness journal or spa environment.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
The mobile layout creates visual hierarchy through dramatic size variation. The wellness indicator hero dominates the top, with supporting metrics presented as compact inline elements rather than equal cards. This prevents the "AI slop" look of identical same-size boxes.

### What Users See (Top to Bottom)

**Header:**
- Simple title "Mein Tagebuch" left-aligned
- Small date "Donnerstag, 5. Februar" below in muted text
- Clean, minimal - no icons or clutter

**Hero Section (The FIRST thing users see):**
- **What:** Today's average wellness score (calculated from symptom ratings, inverted so higher is better)
- **How big:** Takes approximately 45% of the viewport height
- **Styling:**
  - Large circular progress arc (semi-circle, 180°) showing the wellness score
  - Arc is 10px thick with rounded caps
  - Color gradient from sage green (good, score 8-10) through warm yellow (moderate, 4-7) to soft coral (poor, 1-3)
  - Inside the arc: the score number in 64px bold weight
  - Below the number: small text "von 10" in muted color
  - Beneath the arc: contextual text like "Guter Tag!" or "Achte auf dich" based on score
- **Why this is the hero:** Users open the app to answer one question: "How am I doing?" This answers it instantly with a clear visual that requires no interpretation.

**Section 2: Quick Stats Row**
- A single horizontal row (not cards!) with 3 inline stats:
  - Symptome heute: count of symptoms logged today
  - Mahlzeiten: count of meals logged today
  - Medikamente: count of medications logged today
- Displayed as: icon + number + label, all inline, separated by subtle dividers
- Small size (14px numbers, 12px labels) - these are supporting context, not competing heroes
- This row answers "What have I tracked today?" at a glance

**Section 3: Symptom-Trend (Chart)**
- Title: "Letzte 7 Tage" in 16px medium weight
- Area chart showing daily average symptom scores over the past week
- Chart height: approximately 160px
- X-axis: Day abbreviations (Mo, Di, Mi, Do, Fr, Sa, So)
- Y-axis: hidden (implied 1-10 scale)
- Fill: Soft sage green gradient with 20% opacity
- Line: Solid sage green, 2px
- This shows users their trend at a glance - are they improving or getting worse?

**Section 4: Heutige Einträge (Today's Entries)**
- Section title with a subtle "Alle anzeigen" text link on the right
- Combined list of today's symptoms, meals, and medications
- Each entry as a compact list item (NOT cards):
  - Small colored dot on the left indicating type (sage=symptom, amber=meal, blue=medication)
  - Time in muted text (e.g., "14:30")
  - Description (e.g., "Energie - Bewertung: 3" or "Mittagessen: Salat")
- Maximum 5 most recent entries shown
- If empty: friendly message "Noch keine Einträge heute. Starte mit deinem ersten Eintrag!"

**Bottom Navigation / Action:**
- Fixed bottom bar with Primary Action Button
- Button: Full-width sage green, rounded (12px radius), 56px tall
- Label: "Eintrag hinzufügen" with a subtle + icon
- Tapping opens a bottom sheet with 3 options: Symptom, Mahlzeit, Medikament
- This ensures the primary action is always one tap away, in the thumb zone

### Mobile-Specific Adaptations
- Chart is simplified: no axis labels, just the visual trend line
- Entry list shows abbreviated content to fit in single lines
- Quick stats row uses icons prominently to save space
- All touch targets are at least 44px

### Touch Targets
- Primary action button: 56px tall, full width
- List items: 52px tall minimum
- Quick stat items: tappable with 44px height

### Interactive Elements
- Tapping an entry in "Heutige Einträge" opens a detail sheet showing full entry with edit/delete options
- Tapping the wellness indicator area scrolls to the trend chart
- Tapping "Alle anzeigen" navigates to a full entry list

---

## 5. Desktop Layout

### Overall Structure
Two-column asymmetric layout with a 60/40 split:
- **Left column (60%):** Hero wellness indicator + trend chart + recent entries list
- **Right column (40%):** Quick add panel + stats breakdown + tips

The eye naturally flows: Wellness score (hero) → Trend chart → Recent activity, with the right column providing supporting context and quick actions.

### Section Layout

**Top Area (Spanning full width):**
- Header bar with "Mein Gesundheitstagebuch" title on left
- Date display on right
- 80px padding top, 32px padding sides

**Left Column - Main Content (60%):**

1. **Hero Wellness Indicator:**
   - Same semi-circle arc as mobile but larger (240px diameter)
   - Score number in 72px bold
   - Positioned top-left of the column with generous whitespace around it
   - Contextual message beneath

2. **Trend Chart:**
   - Below the hero, full width of the column
   - 200px height
   - Shows 7-day trend with day labels visible
   - Y-axis shows scale (1-10)
   - Hover states show exact values per day

3. **Recent Entries:**
   - Table-style list with columns: Zeit | Typ | Beschreibung | Bewertung
   - Shows last 10 entries across all types
   - Alternating subtle row backgrounds for readability
   - Sortable by clicking column headers

**Right Column - Supporting Content (40%):**

1. **Schnelleintrag Panel (Quick Add):**
   - Card with three large buttons stacked vertically:
     - "Symptom erfassen" (primary sage color)
     - "Mahlzeit hinzufügen" (outlined)
     - "Medikament eintragen" (outlined)
   - Each button 52px tall with icon + label
   - This puts actions always visible, not hidden in a FAB

2. **Tagesübersicht Stats:**
   - Card showing today's breakdown:
     - Symptoms logged: X
     - Durchschnittliche Bewertung: X.X
     - Mahlzeiten: X
     - Medikamente: X
   - Each stat as a row with icon, label, and value

3. **Symptom-Verteilung:**
   - Small donut chart showing distribution of symptom types logged this week
   - Legend showing: Energie, Stimmung, Räuspern, Lymphschwellung
   - Helps users see what they track most

### What Appears on Hover
- Chart data points show tooltip with exact value and date
- Entry rows highlight with slightly darker background
- Entry rows show "Bearbeiten" and "Löschen" action icons on far right when hovered
- Quick add buttons show subtle lift shadow

### Clickable/Interactive Areas
- Clicking an entry row opens an inline expansion showing full details and edit form
- Clicking a symptom type in the donut chart filters the entry list to that type
- Chart is interactive: clicking a day shows entries from that day

---

## 6. Components

### Hero KPI: Wellness-Indikator
The MOST important metric that users see first.

- **Title:** Wellness-Score
- **Data source:** Symptomerfassung app
- **Calculation:**
  1. Get all symptoms logged today
  2. Extract numeric value from bewertung_symptom (wert_1=1, wert_10=10)
  3. Calculate average
  4. Invert the scale (11 - average) so that higher = better (original scale: 1=good, 10=bad)
  5. If no symptoms today, show "--" or last known value with "zuletzt" label
- **Display:** Semi-circular arc progress indicator with large number inside
- **Context shown:**
  - Contextual text based on score: 8-10="Ausgezeichnet!", 6-7="Guter Tag", 4-5="Geht so", 1-3="Achte auf dich"
  - Small text showing "X Symptome heute erfasst"
- **Why this is the hero:** The inverted wellness score instantly answers "How am I feeling?" - the core question users have when opening the app

### Secondary KPIs

**Symptome heute**
- Source: Symptomerfassung
- Calculation: Count of records where zeitpunkt_symptom is today
- Format: integer
- Display: Inline stat with icon (Activity/pulse icon)

**Mahlzeiten heute**
- Source: Essgewohnheiten
- Calculation: Count of records where zeitpunkt_mahlzeit is today
- Format: integer
- Display: Inline stat with icon (Utensils icon)

**Medikamente heute**
- Source: Medikamenteneinnahme
- Calculation: Count of records where zeitpunkt_einnahme is today
- Format: integer
- Display: Inline stat with icon (Pill icon)

**Durchschnittliche Bewertung (7 Tage)**
- Source: Symptomerfassung
- Calculation: Average of all bewertung_symptom values from last 7 days, inverted (11-avg)
- Format: decimal with 1 place (e.g., "7.2")
- Display: Small stat in stats card (desktop only)

### Chart: 7-Tage Symptom-Trend
- **Type:** Area chart - area fill shows the "weight" of the wellness over time, creating a calming visual that's easier to read than bare lines
- **Title:** Letzte 7 Tage
- **What question it answers:** "Am I getting better or worse this week?"
- **Data source:** Symptomerfassung
- **X-axis:** Date (last 7 days), formatted as day abbreviations (Mo, Di, Mi...)
- **Y-axis:** Wellness score (1-10, inverted from symptom ratings)
- **Calculation:** For each day, average all symptom bewertung values, then invert (11-avg)
- **Mobile simplification:** Hide Y-axis labels, smaller height (160px vs 200px), no hover states

### Lists/Tables

**Heutige Einträge (Today's Combined Entry List)**
- Purpose: Shows users what they've logged today across all three categories, so they know what's tracked
- Source: All three apps (Symptomerfassung, Essgewohnheiten, Medikamenteneinnahme)
- Fields shown:
  - Zeit (extracted from respective zeitpunkt fields)
  - Typ (derived from which app: "Symptom", "Mahlzeit", "Medikament")
  - Beschreibung (symptomtyp display name, mahlzeit_beschreibung, or medikamentenname)
  - Bewertung (only for symptoms, using display label like "3 von 10")
- Mobile style: Compact list items with dot indicator, time, and description
- Desktop style: Table with columns, hover actions
- Sort: By time, newest first
- Limit: 5 on mobile, 10 on desktop

### Primary Action Button (REQUIRED!)

- **Label:** "Eintrag hinzufügen" (with + icon)
- **Action:** Opens selection sheet/menu to choose entry type, then opens add form
- **Target app:** Depends on user selection (Symptomerfassung, Essgewohnheiten, or Medikamenteneinnahme)
- **What data:**
  - Symptom form: zeitpunkt_symptom (auto-filled with now), symptomtyp (select), bewertung_symptom (select 1-10), notizen_einzelsymptom (optional textarea)
  - Mahlzeit form: zeitpunkt_mahlzeit (auto-filled), mahlzeit_beschreibung (textarea), menge_portion (text), notizen_essen (optional)
  - Medikament form: zeitpunkt_einnahme (auto-filled), medikamentenname (text), dosierung (text), notizen_medikamente (optional)
- **Mobile position:** bottom_fixed - full-width button always visible at bottom of screen
- **Desktop position:** sidebar - prominently placed in the right column as stacked buttons for each type
- **Why this action:** Users open this app specifically to log health data. Making it one tap to start logging removes friction and encourages consistent tracking habits.

---

## 7. Visual Details

### Border Radius
rounded (8px) - Soft enough to feel friendly and modern, but not so rounded it feels childish. Applied to cards, buttons, and input fields consistently.

### Shadows
subtle - Cards use `0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)` - barely visible but provides enough lift to distinguish cards from the warm background without looking heavy.

### Spacing
spacious - Generous whitespace throughout, especially around the hero element. This creates a calm, uncluttered feel appropriate for a wellness app. Card padding: 20px mobile, 24px desktop. Section gaps: 24px mobile, 32px desktop.

### Animations
- **Page load:** Subtle fade-in with stagger - hero appears first (0ms), then stats (100ms), then chart (200ms), then list (300ms). Each element fades and slides up slightly (8px). Duration: 300ms ease-out.
- **Hover effects:** Cards lift slightly with enhanced shadow. Buttons brighten 5%. List items show subtle background highlight.
- **Tap feedback:** Buttons scale to 0.98 on press, return on release. Ripple effect not needed - keep it subtle.
- **Arc animation:** On page load, the wellness arc animates from 0 to the current value over 800ms with an ease-out curve - makes the score feel dynamic and earned.

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(45 30% 97%);
  --foreground: hsl(150 15% 20%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(150 15% 20%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(150 15% 20%);
  --primary: hsl(150 35% 45%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(45 20% 94%);
  --secondary-foreground: hsl(150 15% 30%);
  --muted: hsl(45 20% 94%);
  --muted-foreground: hsl(150 10% 45%);
  --accent: hsl(150 30% 92%);
  --accent-foreground: hsl(150 35% 30%);
  --destructive: hsl(10 60% 55%);
  --border: hsl(150 15% 88%);
  --input: hsl(150 15% 88%);
  --ring: hsl(150 35% 45%);
  --radius: 0.5rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] DM Sans font loaded from Google Fonts URL
- [ ] All CSS variables copied exactly to src/index.css
- [ ] Mobile layout matches Section 4 - hero dominates, stats are inline row
- [ ] Desktop layout matches Section 5 - 60/40 column split
- [ ] Hero wellness indicator shows semi-circle arc with score inside
- [ ] Arc color reflects score (green=good, yellow=moderate, coral=poor)
- [ ] Colors create the warm, calming wellness journal mood
- [ ] Primary action button is fixed at bottom on mobile
- [ ] Desktop has quick-add buttons prominently in sidebar
- [ ] 7-day trend chart uses area chart with sage green fill
- [ ] Entry list combines all three data types with type indicators
- [ ] Empty states have friendly encouraging messages
- [ ] Page load animation staggers elements as described
- [ ] Arc animates from 0 to value on load
