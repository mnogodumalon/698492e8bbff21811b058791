import { useState, useEffect, useMemo } from 'react';
import type { Essgewohnheiten, Symptomerfassung, Medikamenteneinnahme, TaeglicheErfassung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { format, parseISO, startOfDay, subDays, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Utensils,
  Activity,
  Pill,
  Plus,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Symptom type labels
const SYMPTOM_LABELS: Record<string, string> = {
  raeuspern: 'Räuspern',
  lymphschwellung: 'Lymphschwellung',
  energie: 'Energie',
  stimmung: 'Stimmung',
};

// Rating labels
const RATING_LABELS: Record<string, string> = {
  sehr_gut: 'Sehr gut',
  gut: 'Gut',
  geht_so: 'Geht so',
  schlecht: 'Schlecht',
  sehr_schlecht: 'Sehr schlecht',
};

// Map rating to numeric value (1 = best, 5 = worst)
const RATING_VALUES: Record<string, number> = {
  sehr_gut: 1,
  gut: 2,
  geht_so: 3,
  schlecht: 4,
  sehr_schlecht: 5,
};

// Map wert_X to numeric value (1-10 scale, 1 = best)
const WERT_VALUES: Record<string, number> = {
  wert_1: 1,
  wert_2: 2,
  wert_3: 3,
  wert_4: 4,
  wert_5: 5,
  wert_6: 6,
  wert_7: 7,
  wert_8: 8,
  wert_9: 9,
  wert_10: 10,
};

// Symptom colors for chart
const SYMPTOM_COLORS: Record<string, string> = {
  raeuspern: 'hsl(145 45% 45%)',
  lymphschwellung: 'hsl(200 60% 50%)',
  energie: 'hsl(45 80% 55%)',
  stimmung: 'hsl(280 50% 55%)',
};

interface DashboardData {
  essgewohnheiten: Essgewohnheiten[];
  symptomerfassung: Symptomerfassung[];
  medikamenteneinnahme: Medikamenteneinnahme[];
  taeglicheErfassung: TaeglicheErfassung[];
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [essgewohnheiten, symptomerfassung, medikamenteneinnahme, taeglicheErfassung] = await Promise.all([
        LivingAppsService.getEssgewohnheiten(),
        LivingAppsService.getSymptomerfassung(),
        LivingAppsService.getMedikamenteneinnahme(),
        LivingAppsService.getTaeglicheErfassung(),
      ]);
      setData({ essgewohnheiten, symptomerfassung, medikamenteneinnahme, taeglicheErfassung });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

// Get today's date at start of day for comparisons
function getTodayStart(): Date {
  return startOfDay(new Date());
}

// Check if a date string is from today
function isDateToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

// Calculate today's stats
function calculateTodayStats(data: DashboardData) {
  const todayMeals = data.essgewohnheiten.filter(e => isDateToday(e.fields.zeitpunkt_mahlzeit)).length +
    data.taeglicheErfassung.filter(e => isDateToday(e.fields.zeitpunkt_eintrag) && e.fields.mahlzeit_beschreibung_gesamt).length;

  const todaySymptoms = data.symptomerfassung.filter(e => isDateToday(e.fields.zeitpunkt_symptom)).length +
    data.taeglicheErfassung.filter(e => isDateToday(e.fields.zeitpunkt_eintrag) && e.fields.symptomtyp_gesamt).length;

  const todayMeds = data.medikamenteneinnahme.filter(e => isDateToday(e.fields.zeitpunkt_einnahme)).length +
    data.taeglicheErfassung.filter(e => isDateToday(e.fields.zeitpunkt_eintrag) && e.fields.medikamentenname_freitext_gesamt).length;

  return { todayMeals, todaySymptoms, todayMeds };
}

// Calculate today's wellbeing from symptoms
function calculateTodayWellbeing(data: DashboardData): { rating: string; numericValue: number; lastEntry: string | null } {
  const todaySymptoms = data.symptomerfassung.filter(e => isDateToday(e.fields.zeitpunkt_symptom));
  const todayEntries = data.taeglicheErfassung.filter(e => isDateToday(e.fields.zeitpunkt_eintrag) && e.fields.bewertung_symptom_gesamt);

  let totalValue = 0;
  let count = 0;
  let lastEntry: string | null = null;

  // From Symptomerfassung (1-10 scale)
  todaySymptoms.forEach(s => {
    if (s.fields.bewertung_symptom) {
      const val = WERT_VALUES[s.fields.bewertung_symptom];
      if (val) {
        totalValue += val;
        count++;
        if (!lastEntry || (s.fields.zeitpunkt_symptom && s.fields.zeitpunkt_symptom > lastEntry)) {
          lastEntry = s.fields.zeitpunkt_symptom || null;
        }
      }
    }
  });

  // From TaeglicheErfassung (1-5 scale, convert to 1-10)
  todayEntries.forEach(e => {
    if (e.fields.bewertung_symptom_gesamt) {
      const val = RATING_VALUES[e.fields.bewertung_symptom_gesamt];
      if (val) {
        totalValue += val * 2; // Convert 1-5 to 2-10 scale
        count++;
        if (!lastEntry || (e.fields.zeitpunkt_eintrag && e.fields.zeitpunkt_eintrag > lastEntry)) {
          lastEntry = e.fields.zeitpunkt_eintrag || null;
        }
      }
    }
  });

  if (count === 0) {
    return { rating: 'keine', numericValue: 0, lastEntry: null };
  }

  const avgValue = totalValue / count;

  // Convert average to rating text
  let rating: string;
  if (avgValue <= 2) rating = 'Sehr gut';
  else if (avgValue <= 4) rating = 'Gut';
  else if (avgValue <= 6) rating = 'Geht so';
  else if (avgValue <= 8) rating = 'Schlecht';
  else rating = 'Sehr schlecht';

  return { rating, numericValue: avgValue, lastEntry };
}

// Get recent entries for the list
function getRecentEntries(data: DashboardData, limit: number = 5) {
  const entries: Array<{
    id: string;
    date: string;
    meal?: string;
    symptomRating?: string;
    hasMeds: boolean;
    source: 'taegliche' | 'individual';
  }> = [];

  // From TaeglicheErfassung
  data.taeglicheErfassung.forEach(e => {
    if (e.fields.zeitpunkt_eintrag) {
      entries.push({
        id: e.record_id,
        date: e.fields.zeitpunkt_eintrag,
        meal: e.fields.mahlzeit_beschreibung_gesamt,
        symptomRating: e.fields.bewertung_symptom_gesamt ? RATING_LABELS[e.fields.bewertung_symptom_gesamt] : undefined,
        hasMeds: !!e.fields.medikamentenname_freitext_gesamt,
        source: 'taegliche',
      });
    }
  });

  // Sort by date descending and limit
  return entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

// Prepare chart data for symptom trends
function prepareChartData(data: DashboardData, days: number = 14) {
  const today = getTodayStart();
  const dateMap = new Map<string, Record<string, number[]>>();

  // Initialize date map for last N days
  for (let i = 0; i < days; i++) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    dateMap.set(date, {
      raeuspern: [],
      lymphschwellung: [],
      energie: [],
      stimmung: [],
    });
  }

  // Collect symptom data
  data.symptomerfassung.forEach(s => {
    if (!s.fields.zeitpunkt_symptom || !s.fields.symptomtyp || !s.fields.bewertung_symptom) return;
    const date = s.fields.zeitpunkt_symptom.split('T')[0];
    const dayData = dateMap.get(date);
    if (dayData && s.fields.symptomtyp in dayData) {
      const val = WERT_VALUES[s.fields.bewertung_symptom];
      if (val) dayData[s.fields.symptomtyp].push(val);
    }
  });

  // From TaeglicheErfassung
  data.taeglicheErfassung.forEach(e => {
    if (!e.fields.zeitpunkt_eintrag || !e.fields.symptomtyp_gesamt || !e.fields.bewertung_symptom_gesamt) return;
    const date = e.fields.zeitpunkt_eintrag.split('T')[0];
    const dayData = dateMap.get(date);
    if (dayData && e.fields.symptomtyp_gesamt in dayData) {
      const val = RATING_VALUES[e.fields.bewertung_symptom_gesamt];
      if (val) dayData[e.fields.symptomtyp_gesamt].push(val * 2); // Scale to 1-10
    }
  });

  // Convert to chart format
  const chartData = Array.from(dateMap.entries())
    .map(([date, symptoms]) => {
      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
      return {
        date,
        dateLabel: format(parseISO(date), 'dd.MM', { locale: de }),
        raeuspern: avg(symptoms.raeuspern),
        lymphschwellung: avg(symptoms.lymphschwellung),
        energie: avg(symptoms.energie),
        stimmung: avg(symptoms.stimmung),
      };
    })
    .reverse(); // Oldest first

  return chartData;
}

// Wellness Ring SVG Component
function WellnessRing({ value, size = 200 }: { value: number; size?: number }) {
  const strokeWidth = size * 0.04;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Value is 1-10 scale, convert to percentage (10 = 0%, 1 = 100%)
  const percentage = value === 0 ? 0 : Math.max(0, Math.min(100, ((10 - value) / 9) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on value
  let strokeColor = 'hsl(145 45% 45%)'; // Green for good
  if (value > 6) strokeColor = 'hsl(0 65% 55%)'; // Red for bad
  else if (value > 3) strokeColor = 'hsl(45 80% 55%)'; // Yellow for medium

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(45 20% 94%)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

// Mood icon based on rating
function MoodIcon({ value, className = '' }: { value: number; className?: string }) {
  if (value === 0) return <Meh className={`${className} text-muted-foreground`} />;
  if (value <= 3) return <Smile className={`${className} text-green-600`} />;
  if (value <= 6) return <Meh className={`${className} text-yellow-600`} />;
  return <Frown className={`${className} text-red-600`} />;
}

// Stat Pill Component for mobile
function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-sm border min-w-[120px]">
      <Icon className="h-4 w-4 text-primary" />
      <span className="font-semibold">{value}</span>
      <span className="text-muted-foreground text-sm truncate">{label}</span>
    </div>
  );
}

// Stat Card Component for desktop
function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// Entry item for recent entries list
function EntryItem({ entry, onClick }: {
  entry: ReturnType<typeof getRecentEntries>[0];
  onClick?: () => void;
}) {
  const dateStr = format(parseISO(entry.date), 'EEE, d. MMM', { locale: de });
  const timeStr = format(parseISO(entry.date), 'HH:mm', { locale: de });

  // Color dot based on symptom rating
  let dotColor = 'bg-muted';
  if (entry.symptomRating === 'Sehr gut' || entry.symptomRating === 'Gut') dotColor = 'bg-green-500';
  else if (entry.symptomRating === 'Geht so') dotColor = 'bg-yellow-500';
  else if (entry.symptomRating === 'Schlecht' || entry.symptomRating === 'Sehr schlecht') dotColor = 'bg-red-500';

  return (
    <div
      className="p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border bg-card"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{dateStr}</span>
            <span className="text-muted-foreground text-xs">{timeStr}</span>
          </div>
          {entry.meal && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {entry.meal.slice(0, 50)}{entry.meal.length > 50 ? '...' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {entry.hasMeds && <Pill className="h-3 w-3 text-muted-foreground" />}
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        </div>
      </div>
    </div>
  );
}

// Add Entry Form
function AddEntryForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    mahlzeit: '',
    symptomtyp: '',
    bewertung: '',
    medikament: '',
    dosierung: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const now = new Date();
      const zeitpunkt = format(now, "yyyy-MM-dd'T'HH:mm");

      await LivingAppsService.createTaeglicheErfassungEntry({
        zeitpunkt_eintrag: zeitpunkt,
        mahlzeit_beschreibung_gesamt: formData.mahlzeit || undefined,
        symptomtyp_gesamt: formData.symptomtyp as TaeglicheErfassung['fields']['symptomtyp_gesamt'] || undefined,
        bewertung_symptom_gesamt: formData.bewertung || undefined,
        medikamentenname_freitext_gesamt: formData.medikament || undefined,
        dosierung_gesamt: formData.dosierung || undefined,
      });

      onSuccess();
    } catch (err) {
      console.error('Failed to create entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mahlzeit">Mahlzeit / Nahrungsmittel</Label>
        <Textarea
          id="mahlzeit"
          placeholder="Was hast du gegessen?"
          value={formData.mahlzeit}
          onChange={(e) => setFormData(prev => ({ ...prev, mahlzeit: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="symptomtyp">Symptomtyp</Label>
        <Select
          value={formData.symptomtyp || "none"}
          onValueChange={(v) => setFormData(prev => ({ ...prev, symptomtyp: v === "none" ? "" : v }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Symptom auswählen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Kein Symptom</SelectItem>
            <SelectItem value="raeuspern">Räuspern</SelectItem>
            <SelectItem value="lymphschwellung">Lymphschwellung</SelectItem>
            <SelectItem value="energie">Energie</SelectItem>
            <SelectItem value="stimmung">Stimmung</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.symptomtyp && formData.symptomtyp !== "none" && (
        <div className="space-y-2">
          <Label>Bewertung</Label>
          <RadioGroup
            value={formData.bewertung}
            onValueChange={(v) => setFormData(prev => ({ ...prev, bewertung: v }))}
            className="grid grid-cols-5 gap-2"
          >
            {Object.entries(RATING_LABELS).map(([key, label]) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <RadioGroupItem value={key} id={key} />
                <Label htmlFor={key} className="text-xs text-center cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="medikament">Medikament</Label>
        <Input
          id="medikament"
          placeholder="Medikamentenname"
          value={formData.medikament}
          onChange={(e) => setFormData(prev => ({ ...prev, medikament: e.target.value }))}
        />
      </div>

      {formData.medikament && (
        <div className="space-y-2">
          <Label htmlFor="dosierung">Dosierung</Label>
          <Input
            id="dosierung"
            placeholder="z.B. 500mg"
            value={formData.dosierung}
            onChange={(e) => setFormData(prev => ({ ...prev, dosierung: e.target.value }))}
          />
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? 'Speichern...' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex justify-center py-8">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

// Error State
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{error.message}</p>
          <Button variant="outline" onClick={onRetry} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Empty State
function EmptyState({ onAddEntry }: { onAddEntry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
        <Activity className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">Noch keine Einträge</h3>
      <p className="text-muted-foreground mb-4">
        Beginne mit deinem ersten Tagebucheintrag
      </p>
      <Button onClick={onAddEntry}>
        <Plus className="h-4 w-4 mr-2" />
        Ersten Eintrag erstellen
      </Button>
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const { data, loading, error, refetch } = useDashboardData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const todayStats = useMemo(() => {
    if (!data) return { todayMeals: 0, todaySymptoms: 0, todayMeds: 0 };
    return calculateTodayStats(data);
  }, [data]);

  const todayWellbeing = useMemo(() => {
    if (!data) return { rating: 'keine', numericValue: 0, lastEntry: null };
    return calculateTodayWellbeing(data);
  }, [data]);

  const recentEntries = useMemo(() => {
    if (!data) return [];
    return getRecentEntries(data, isDesktop ? 7 : 5);
  }, [data, isDesktop]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return prepareChartData(data, isDesktop ? 14 : 7);
  }, [data, isDesktop]);

  const handleAddSuccess = () => {
    setDialogOpen(false);
    setDrawerOpen(false);
    refetch();
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return null;

  const hasNoData = data.taeglicheErfassung.length === 0 &&
    data.essgewohnheiten.length === 0 &&
    data.symptomerfassung.length === 0 &&
    data.medikamenteneinnahme.length === 0;

  // Mobile Layout
  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-3 border-b">
          <div className="flex justify-between items-center">
            <h1 className="font-semibold text-lg">Tagebuch</h1>
            <span className="text-sm text-muted-foreground">
              {format(new Date(), 'EEE, d. MMM', { locale: de })}
            </span>
          </div>
        </header>

        {hasNoData ? (
          <div className="p-4">
            <EmptyState onAddEntry={() => setDrawerOpen(true)} />
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Hero: Wellness Ring */}
            <div className="flex flex-col items-center py-6 animate-in fade-in duration-500">
              <div className="relative">
                <WellnessRing value={todayWellbeing.numericValue} size={200} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <MoodIcon value={todayWellbeing.numericValue} className="h-12 w-12" />
                </div>
              </div>
              <div className="text-center mt-4">
                <h2 className="text-lg font-medium text-muted-foreground">Heutiges Befinden</h2>
                <p className="text-2xl font-bold mt-1">{todayWellbeing.rating}</p>
                {todayWellbeing.lastEntry && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Zuletzt: {format(parseISO(todayWellbeing.lastEntry), 'HH:mm', { locale: de })} Uhr
                  </p>
                )}
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 animate-in fade-in duration-500 delay-100">
              <StatPill icon={Utensils} value={todayStats.todayMeals} label="Mahlzeiten" />
              <StatPill icon={Activity} value={todayStats.todaySymptoms} label="Symptome" />
              <StatPill icon={Pill} value={todayStats.todayMeds} label="Medikamente" />
            </div>

            {/* Recent Entries */}
            <div className="space-y-3 animate-in fade-in duration-500 delay-200">
              <h3 className="font-semibold">Letzte Einträge</h3>
              {recentEntries.length === 0 ? (
                <p className="text-muted-foreground text-sm">Noch keine Einträge vorhanden</p>
              ) : (
                <div className="space-y-2">
                  {recentEntries.map(entry => (
                    <EntryItem key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </div>

            {/* Symptom Trend Chart */}
            {chartData.some(d => d.raeuspern || d.lymphschwellung || d.energie || d.stimmung) && (
              <div className="space-y-3 animate-in fade-in duration-500 delay-300">
                <h3 className="font-semibold">Symptom-Verlauf</h3>
                <Card>
                  <CardContent className="pt-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 10 }}
                            stroke="hsl(150 5% 50%)"
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(0 0% 100%)',
                              border: '1px solid hsl(45 15% 88%)',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                            formatter={(value: number, name: string) => [
                              value?.toFixed(1) || '-',
                              SYMPTOM_LABELS[name] || name
                            ]}
                          />
                          {Object.keys(SYMPTOM_COLORS).map(key => (
                            <Line
                              key={key}
                              type="monotone"
                              dataKey={key}
                              stroke={SYMPTOM_COLORS[key]}
                              strokeWidth={2}
                              dot={false}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">Letzte 7 Tage</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Fixed Bottom Action Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button className="w-full h-14 text-base" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Eintrag hinzufügen
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Neuer Eintrag</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <AddEntryForm
                  onSuccess={handleAddSuccess}
                  onCancel={() => setDrawerOpen(false)}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="font-bold text-xl">Gesundheits- und Ernährungstagebuch</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
            </span>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Eintrag
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Neuer Eintrag</DialogTitle>
                </DialogHeader>
                <AddEntryForm
                  onSuccess={handleAddSuccess}
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {hasNoData ? (
        <div className="max-w-6xl mx-auto px-6 py-12">
          <EmptyState onAddEntry={() => setDialogOpen(true)} />
        </div>
      ) : (
        <main className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-[1fr_320px] gap-6">
            {/* Left Column (65%) */}
            <div className="space-y-6">
              {/* Hero Card: Wellness Ring */}
              <Card className="animate-in fade-in duration-500">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <WellnessRing value={todayWellbeing.numericValue} size={280} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MoodIcon value={todayWellbeing.numericValue} className="h-16 w-16" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-medium text-muted-foreground">Heutiges Befinden</h2>
                      <p className="text-4xl font-bold mt-2">{todayWellbeing.rating}</p>
                      {todayWellbeing.lastEntry && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Letzter Eintrag: {format(parseISO(todayWellbeing.lastEntry), 'HH:mm', { locale: de })} Uhr
                        </p>
                      )}

                      {/* Symptom Legend */}
                      <div className="grid grid-cols-2 gap-2 mt-6">
                        {Object.entries(SYMPTOM_LABELS).map(([key, label]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: SYMPTOM_COLORS[key] }}
                            />
                            <span className="text-muted-foreground">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Symptom Trend Chart */}
              <Card className="animate-in fade-in duration-500 delay-100">
                <CardHeader>
                  <CardTitle>Symptom-Verlauf</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis
                          dataKey="dateLabel"
                          tick={{ fontSize: 12 }}
                          stroke="hsl(150 5% 50%)"
                        />
                        <YAxis
                          domain={[1, 10]}
                          tick={{ fontSize: 12 }}
                          stroke="hsl(150 5% 50%)"
                          tickCount={5}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(0 0% 100%)',
                            border: '1px solid hsl(45 15% 88%)',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number, name: string) => [
                            value?.toFixed(1) || '-',
                            SYMPTOM_LABELS[name] || name
                          ]}
                        />
                        <Legend
                          formatter={(value) => SYMPTOM_LABELS[value] || value}
                          iconType="circle"
                        />
                        {Object.keys(SYMPTOM_COLORS).map(key => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={SYMPTOM_COLORS[key]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Letzte 14 Tage (1 = Sehr gut, 10 = Sehr schlecht)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (35%) */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="space-y-4 animate-in fade-in duration-500 delay-150">
                <StatCard icon={Utensils} value={todayStats.todayMeals} label="Mahlzeiten heute" />
                <StatCard icon={Activity} value={todayStats.todaySymptoms} label="Symptome erfasst" />
                <StatCard icon={Pill} value={todayStats.todayMeds} label="Medikamente" />
              </div>

              {/* Recent Entries */}
              <Card className="animate-in fade-in duration-500 delay-200">
                <CardHeader>
                  <CardTitle>Letzte Einträge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentEntries.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Noch keine Einträge vorhanden</p>
                  ) : (
                    recentEntries.map(entry => (
                      <EntryItem key={entry.id} entry={entry} />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
