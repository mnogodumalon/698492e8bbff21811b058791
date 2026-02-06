import { useState, useEffect, useMemo } from 'react';
import type { Symptomerfassung, Essgewohnheiten, Medikamenteneinnahme, TaeglicheErfassung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, formatDistance, subDays, startOfDay, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, Utensils, Activity, Pill, AlertCircle, Calendar } from 'lucide-react';

// Lookup data for symptoms and ratings
const SYMPTOM_TYPES: Record<string, string> = {
  raeuspern: 'Räuspern',
  lymphschwellung: 'Lymphschwellung',
  energie: 'Energie',
  stimmung: 'Stimmung',
};

const SYMPTOM_RATINGS: Record<string, { label: string; value: number }> = {
  wert_1: { label: '1 - Sehr gut', value: 1 },
  wert_2: { label: '2', value: 2 },
  wert_3: { label: '3', value: 3 },
  wert_4: { label: '4', value: 4 },
  wert_5: { label: '5', value: 5 },
  wert_6: { label: '6', value: 6 },
  wert_7: { label: '7', value: 7 },
  wert_8: { label: '8', value: 8 },
  wert_9: { label: '9', value: 9 },
  wert_10: { label: '10 - Sehr schlecht', value: 10 },
};

const DAILY_RATINGS: Record<string, { label: string; value: number }> = {
  sehr_gut: { label: 'Sehr gut', value: 1 },
  gut: { label: 'Gut', value: 3 },
  geht_so: { label: 'Geht so', value: 5 },
  schlecht: { label: 'Schlecht', value: 7 },
  sehr_schlecht: { label: 'Sehr schlecht', value: 10 },
};

const MEDICATION_NAMES: Record<string, string> = {
  ibuprofen_400mg: 'Ibuprofen 400mg',
  vitamin_c_500mg: 'Vitamin C 500mg',
  vitamin_d_2000: 'Vitamin D 2000 Einheiten',
  vitamin_d_4000: 'Vitamin D 4000 Einheiten',
  bitterliebe_1_kapsel: '1 Kapsel Bitterliebe',
  pascoflorin_sensitiv: 'Pascoflorin sensitiv',
};

// Types for unified entries
type EntryType = 'symptom' | 'mahlzeit' | 'medikament' | 'tagebuch';

interface UnifiedEntry {
  id: string;
  type: EntryType;
  timestamp: string;
  title: string;
  subtitle?: string;
}

// Helper to get today's date string
function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// Helper to format current datetime for API
function getCurrentDateTimeForAPI(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm");
}

// WellnessRing Component
function WellnessRing({ score, entriesCount }: { score: number | null; entriesCount: number }) {
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate fill percentage (score of 1 = full ring = best, score of 10 = empty = worst)
  const fillPercentage = score !== null ? ((10 - score) / 9) * 100 : 0;
  const strokeDashoffset = circumference - (fillPercentage / 100) * circumference;

  // Determine color based on score
  const getColor = () => {
    if (score === null) return 'hsl(90 15% 88%)';
    if (score <= 3) return 'hsl(152 50% 40%)'; // Good - green
    if (score <= 6) return 'hsl(40 70% 50%)'; // Moderate - amber
    return 'hsl(0 65% 50%)'; // Poor - red
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(90 15% 88%)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: score !== null && score <= 3 ? 'drop-shadow(0 0 8px hsl(152 50% 40% / 0.4))' : undefined,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-7xl font-bold text-foreground">
          {score !== null ? score.toFixed(1) : '--'}
        </span>
        <span className="text-sm text-muted-foreground mt-1">
          {entriesCount > 0 ? `${entriesCount} Einträge` : 'Noch keine Einträge'}
        </span>
      </div>
    </div>
  );
}

// Entry Card for recent entries
function EntryCard({ entry }: { entry: UnifiedEntry }) {
  const getIcon = () => {
    switch (entry.type) {
      case 'mahlzeit':
        return <Utensils className="h-4 w-4" />;
      case 'symptom':
        return <Activity className="h-4 w-4" />;
      case 'medikament':
        return <Pill className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getBadgeColor = () => {
    switch (entry.type) {
      case 'mahlzeit':
        return 'bg-accent text-accent-foreground';
      case 'symptom':
        return 'bg-amber-100 text-amber-800';
      case 'medikament':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTimeDisplay = () => {
    try {
      const date = parseISO(entry.timestamp);
      if (isToday(date)) {
        return format(date, 'HH:mm');
      }
      return formatDistance(date, new Date(), { addSuffix: true, locale: de });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-shrink-0 w-[140px] p-3 bg-card border border-border rounded-xl hover:shadow-md transition-shadow cursor-pointer">
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${getBadgeColor()}`}>
        {getIcon()}
        <span className="capitalize">{entry.type === 'mahlzeit' ? 'Essen' : entry.type === 'medikament' ? 'Medikament' : entry.type}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{getTimeDisplay()}</p>
      <p className="mt-1 text-sm font-medium truncate">{entry.title}</p>
      {entry.subtitle && (
        <p className="text-xs text-muted-foreground truncate">{entry.subtitle}</p>
      )}
    </div>
  );
}

// Add Entry Dialog
function AddEntryDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    mahlzeit_beschreibung_gesamt: '',
    menge_portion_gesamt: '',
    symptomtyp_gesamt: '',
    bewertung_symptom_gesamt: '',
    notizen_symptom_gesamt: '',
    medikamentenname_freitext_gesamt: '',
    dosierung_gesamt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await LivingAppsService.createTaeglicheErfassungEntry({
        zeitpunkt_eintrag: getCurrentDateTimeForAPI(),
        mahlzeit_beschreibung_gesamt: formData.mahlzeit_beschreibung_gesamt || undefined,
        menge_portion_gesamt: formData.menge_portion_gesamt || undefined,
        symptomtyp_gesamt: formData.symptomtyp_gesamt as TaeglicheErfassung['fields']['symptomtyp_gesamt'] || undefined,
        bewertung_symptom_gesamt: formData.bewertung_symptom_gesamt || undefined,
        notizen_symptom_gesamt: formData.notizen_symptom_gesamt || undefined,
        medikamentenname_freitext_gesamt: formData.medikamentenname_freitext_gesamt || undefined,
        dosierung_gesamt: formData.dosierung_gesamt || undefined,
      });

      setFormData({
        mahlzeit_beschreibung_gesamt: '',
        menge_portion_gesamt: '',
        symptomtyp_gesamt: '',
        bewertung_symptom_gesamt: '',
        notizen_symptom_gesamt: '',
        medikamentenname_freitext_gesamt: '',
        dosierung_gesamt: '',
      });
      setOpen(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to create entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-14 text-base font-semibold shadow-md">
          <Plus className="h-5 w-5 mr-2" />
          Eintrag hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuer Tageseintrag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Meal Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              Mahlzeit (optional)
            </h3>
            <div className="space-y-2">
              <Label htmlFor="mahlzeit">Was hast du gegessen?</Label>
              <Textarea
                id="mahlzeit"
                placeholder="z.B. Haferflocken mit Beeren..."
                value={formData.mahlzeit_beschreibung_gesamt}
                onChange={(e) => setFormData(prev => ({ ...prev, mahlzeit_beschreibung_gesamt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menge">Menge / Portion</Label>
              <Input
                id="menge"
                placeholder="z.B. 1 Portion, 200g..."
                value={formData.menge_portion_gesamt}
                onChange={(e) => setFormData(prev => ({ ...prev, menge_portion_gesamt: e.target.value }))}
              />
            </div>
          </div>

          {/* Symptom Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-600" />
              Symptom (optional)
            </h3>
            <div className="space-y-2">
              <Label>Symptomtyp</Label>
              <Select
                value={formData.symptomtyp_gesamt || 'none'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, symptomtyp_gesamt: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wähle einen Symptomtyp..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Symptom</SelectItem>
                  {Object.entries(SYMPTOM_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.symptomtyp_gesamt && (
              <div className="space-y-2">
                <Label>Bewertung</Label>
                <RadioGroup
                  value={formData.bewertung_symptom_gesamt}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, bewertung_symptom_gesamt: v }))}
                  className="grid grid-cols-5 gap-2"
                >
                  {Object.entries(DAILY_RATINGS).map(([key, { label }]) => (
                    <div key={key} className="flex items-center space-x-1">
                      <RadioGroupItem value={key} id={key} />
                      <Label htmlFor={key} className="text-xs cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notizen_symptom">Notizen zum Symptom</Label>
              <Textarea
                id="notizen_symptom"
                placeholder="Weitere Beobachtungen..."
                value={formData.notizen_symptom_gesamt}
                onChange={(e) => setFormData(prev => ({ ...prev, notizen_symptom_gesamt: e.target.value }))}
              />
            </div>
          </div>

          {/* Medication Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Pill className="h-4 w-4 text-blue-600" />
              Medikament (optional)
            </h3>
            <div className="space-y-2">
              <Label htmlFor="medikament">Medikamentenname</Label>
              <Input
                id="medikament"
                placeholder="z.B. Vitamin D..."
                value={formData.medikamentenname_freitext_gesamt}
                onChange={(e) => setFormData(prev => ({ ...prev, medikamentenname_freitext_gesamt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosierung">Dosierung</Label>
              <Input
                id="dosierung"
                placeholder="z.B. 1 Tablette, 500mg..."
                value={formData.dosierung_gesamt}
                onChange={(e) => setFormData(prev => ({ ...prev, dosierung_gesamt: e.target.value }))}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Speichere...' : 'Eintrag speichern'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-center py-12">
          <Skeleton className="h-[280px] w-[280px] rounded-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ onAddEntry }: { onAddEntry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-4">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Noch keine Einträge</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Beginne damit, deine Mahlzeiten, Symptome und Medikamente zu erfassen, um Muster zu erkennen.
      </p>
      <Button onClick={onAddEntry}>
        <Plus className="h-4 w-4 mr-2" />
        Ersten Eintrag hinzufügen
      </Button>
    </div>
  );
}

// Error State
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Ein Fehler ist aufgetreten</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {error.message}
      </p>
      <Button variant="outline" onClick={onRetry}>
        Erneut versuchen
      </Button>
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const [symptoms, setSymptoms] = useState<Symptomerfassung[]>([]);
  const [meals, setMeals] = useState<Essgewohnheiten[]>([]);
  const [medications, setMedications] = useState<Medikamenteneinnahme[]>([]);
  const [dailyEntries, setDailyEntries] = useState<TaeglicheErfassung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [symptomsData, mealsData, medicationsData, dailyData] = await Promise.all([
        LivingAppsService.getSymptomerfassung(),
        LivingAppsService.getEssgewohnheiten(),
        LivingAppsService.getMedikamenteneinnahme(),
        LivingAppsService.getTaeglicheErfassung(),
      ]);
      setSymptoms(symptomsData);
      setMeals(mealsData);
      setMedications(medicationsData);
      setDailyEntries(dailyData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate today's symptom score
  const todayStats = useMemo(() => {
    const today = getTodayString();

    // Get today's symptom entries
    const todaySymptoms = symptoms.filter(s => s.fields.zeitpunkt_symptom?.startsWith(today));
    const todayDailyWithSymptoms = dailyEntries.filter(
      d => d.fields.zeitpunkt_eintrag?.startsWith(today) && d.fields.bewertung_symptom_gesamt
    );

    // Calculate average score from all sources
    const scores: number[] = [];

    todaySymptoms.forEach(s => {
      const rating = s.fields.bewertung_symptom;
      if (rating && SYMPTOM_RATINGS[rating]) {
        scores.push(SYMPTOM_RATINGS[rating].value);
      }
    });

    todayDailyWithSymptoms.forEach(d => {
      const rating = d.fields.bewertung_symptom_gesamt;
      if (rating && DAILY_RATINGS[rating]) {
        scores.push(DAILY_RATINGS[rating].value);
      }
    });

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    // Count today's entries by type
    const todayMeals = meals.filter(m => m.fields.zeitpunkt_mahlzeit?.startsWith(today));
    const todayMedications = medications.filter(m => m.fields.zeitpunkt_einnahme?.startsWith(today));
    const todayDaily = dailyEntries.filter(d => d.fields.zeitpunkt_eintrag?.startsWith(today));

    return {
      avgScore,
      symptomCount: todaySymptoms.length + todayDailyWithSymptoms.length,
      mealCount: todayMeals.length + todayDaily.filter(d => d.fields.mahlzeit_beschreibung_gesamt).length,
      medicationCount: todayMedications.length + todayDaily.filter(d => d.fields.medikamentenname_freitext_gesamt).length,
      totalEntries: scores.length,
    };
  }, [symptoms, meals, medications, dailyEntries]);

  // Create unified entries list for timeline
  const recentEntries = useMemo(() => {
    const entries: UnifiedEntry[] = [];

    symptoms.forEach(s => {
      if (s.fields.zeitpunkt_symptom) {
        entries.push({
          id: `symptom-${s.record_id}`,
          type: 'symptom',
          timestamp: s.fields.zeitpunkt_symptom,
          title: SYMPTOM_TYPES[s.fields.symptomtyp || ''] || 'Symptom',
          subtitle: s.fields.bewertung_symptom ? SYMPTOM_RATINGS[s.fields.bewertung_symptom]?.label : undefined,
        });
      }
    });

    meals.forEach(m => {
      if (m.fields.zeitpunkt_mahlzeit) {
        entries.push({
          id: `meal-${m.record_id}`,
          type: 'mahlzeit',
          timestamp: m.fields.zeitpunkt_mahlzeit,
          title: m.fields.mahlzeit_beschreibung?.substring(0, 30) || 'Mahlzeit',
          subtitle: m.fields.menge_portion,
        });
      }
    });

    medications.forEach(m => {
      if (m.fields.zeitpunkt_einnahme) {
        entries.push({
          id: `med-${m.record_id}`,
          type: 'medikament',
          timestamp: m.fields.zeitpunkt_einnahme,
          title: m.fields.medikamentenname ? MEDICATION_NAMES[m.fields.medikamentenname] : 'Medikament',
        });
      }
    });

    dailyEntries.forEach(d => {
      if (d.fields.zeitpunkt_eintrag) {
        entries.push({
          id: `daily-${d.record_id}`,
          type: 'tagebuch',
          timestamp: d.fields.zeitpunkt_eintrag,
          title: d.fields.mahlzeit_beschreibung_gesamt?.substring(0, 30) ||
                 (d.fields.symptomtyp_gesamt ? SYMPTOM_TYPES[d.fields.symptomtyp_gesamt] : '') ||
                 d.fields.medikamentenname_freitext_gesamt ||
                 'Tageseintrag',
          subtitle: d.fields.menge_portion_gesamt || d.fields.dosierung_gesamt,
        });
      }
    });

    // Sort by timestamp descending and limit
    return entries
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10);
  }, [symptoms, meals, medications, dailyEntries]);

  // Chart data for symptom trends (last 14 days for desktop, 7 for mobile)
  const chartData = useMemo(() => {
    const days = 14;
    const data: { date: string; label: string; score: number | null }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateString = format(date, 'yyyy-MM-dd');
      const label = format(date, 'dd.MM');

      // Get all scores for this day
      const dayScores: number[] = [];

      symptoms.forEach(s => {
        if (s.fields.zeitpunkt_symptom?.startsWith(dateString) && s.fields.bewertung_symptom) {
          const rating = SYMPTOM_RATINGS[s.fields.bewertung_symptom];
          if (rating) dayScores.push(rating.value);
        }
      });

      dailyEntries.forEach(d => {
        if (d.fields.zeitpunkt_eintrag?.startsWith(dateString) && d.fields.bewertung_symptom_gesamt) {
          const rating = DAILY_RATINGS[d.fields.bewertung_symptom_gesamt];
          if (rating) dayScores.push(rating.value);
        }
      });

      const avgScore = dayScores.length > 0
        ? dayScores.reduce((a, b) => a + b, 0) / dayScores.length
        : null;

      data.push({ date: dateString, label, score: avgScore });
    }

    return data;
  }, [symptoms, dailyEntries]);

  // Today's medications list
  const todayMedications = useMemo(() => {
    const today = getTodayString();
    const meds: { name: string; time: string }[] = [];

    medications.forEach(m => {
      if (m.fields.zeitpunkt_einnahme?.startsWith(today)) {
        meds.push({
          name: m.fields.medikamentenname ? MEDICATION_NAMES[m.fields.medikamentenname] : 'Unbekannt',
          time: m.fields.zeitpunkt_einnahme ? format(parseISO(m.fields.zeitpunkt_einnahme), 'HH:mm') : '',
        });
      }
    });

    dailyEntries.forEach(d => {
      if (d.fields.zeitpunkt_eintrag?.startsWith(today) && d.fields.medikamentenname_freitext_gesamt) {
        meds.push({
          name: d.fields.medikamentenname_freitext_gesamt,
          time: d.fields.zeitpunkt_eintrag ? format(parseISO(d.fields.zeitpunkt_eintrag), 'HH:mm') : '',
        });
      }
    });

    return meds.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, dailyEntries]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  const hasAnyData = symptoms.length > 0 || meals.length > 0 || medications.length > 0 || dailyEntries.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <header className="p-4 pb-0">
          <h1 className="text-lg font-semibold">Dein Tagebuch</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
          </p>
        </header>

        {/* Hero: Wellness Ring */}
        <div className="relative flex items-center justify-center min-h-[50vh]">
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur mx-4">
            <CardContent className="p-6">
              <WellnessRing score={todayStats.avgScore} entriesCount={todayStats.totalEntries} />
              <p className="text-center text-sm text-muted-foreground mt-2">Heutiges Befinden</p>
            </CardContent>
          </Card>
        </div>

        {!hasAnyData ? (
          <EmptyState onAddEntry={() => {}} />
        ) : (
          <>
            {/* Recent Entries - Horizontal Scroll */}
            {recentEntries.length > 0 && (
              <section className="px-4 pb-4">
                <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Letzte Einträge</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {recentEntries.slice(0, 6).map(entry => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            )}

            {/* Symptom Trend Chart */}
            <section className="px-4 pb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">
                    Symptom-Verlauf (7 Tage)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.slice(-7)}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(152 35% 45%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(152 35% 45%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11 }}
                          stroke="hsl(150 10% 45%)"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[1, 10]}
                          reversed
                          tick={{ fontSize: 11 }}
                          stroke="hsl(150 10% 45%)"
                          axisLine={false}
                          tickLine={false}
                          width={24}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(0 0% 100%)',
                            border: '1px solid hsl(90 15% 88%)',
                            borderRadius: '8px',
                          }}
                          formatter={(value) => [
                            typeof value === 'number' ? value.toFixed(1) : '-',
                            'Bewertung'
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(152 35% 45%)"
                          strokeWidth={2}
                          fill="url(#colorScore)"
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Today's Medications */}
            <section className="px-4 pb-32">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Medikamente heute
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayMedications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Noch keine Medikamente eingetragen</p>
                  ) : (
                    <ul className="space-y-2">
                      {todayMedications.map((med, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">{med.time}</Badge>
                          <span className="text-sm">{med.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {/* Fixed Bottom Action */}
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-background via-background to-transparent">
          <AddEntryDialog onSuccess={fetchData} />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-6xl mx-auto p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Gesundheits- und Ernährungstagebuch</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </div>
          <AddEntryDialog onSuccess={fetchData} />
        </header>

        {!hasAnyData ? (
          <EmptyState onAddEntry={() => {}} />
        ) : (
          <div className="grid grid-cols-5 gap-6">
            {/* Left Column (60%) */}
            <div className="col-span-3 space-y-6">
              {/* Hero: Wellness Ring */}
              <Card className="shadow-md">
                <CardContent className="p-12">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <WellnessRing score={todayStats.avgScore} entriesCount={todayStats.totalEntries} />
                    </div>
                  </div>
                  <p className="text-center text-muted-foreground mt-4">Heutiges Befinden</p>
                </CardContent>
              </Card>

              {/* Symptom Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Symptom-Verlauf (letzte 14 Tage)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorScoreDesktop" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(152 35% 45%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(152 35% 45%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12 }}
                          stroke="hsl(150 10% 45%)"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[1, 10]}
                          reversed
                          tick={{ fontSize: 12 }}
                          stroke="hsl(150 10% 45%)"
                          axisLine={false}
                          tickLine={false}
                          label={{
                            value: 'Bewertung',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize: 12, fill: 'hsl(150 10% 45%)' }
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(0 0% 100%)',
                            border: '1px solid hsl(90 15% 88%)',
                            borderRadius: '8px',
                          }}
                          formatter={(value) => [
                            typeof value === 'number' ? value.toFixed(1) : '-',
                            'Bewertung'
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(152 35% 45%)"
                          strokeWidth={2}
                          fill="url(#colorScoreDesktop)"
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (40%) */}
            <div className="col-span-2 space-y-6">
              {/* Recent Entries Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Letzte Einträge</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Noch keine Einträge vorhanden</p>
                  ) : (
                    <div className="space-y-3">
                      {recentEntries.map(entry => {
                        const getBorderColor = () => {
                          switch (entry.type) {
                            case 'mahlzeit': return 'border-l-primary';
                            case 'symptom': return 'border-l-amber-500';
                            case 'medikament': return 'border-l-blue-500';
                            default: return 'border-l-muted';
                          }
                        };

                        return (
                          <div
                            key={entry.id}
                            className={`pl-3 border-l-2 ${getBorderColor()} hover:bg-muted/50 rounded-r-lg p-2 transition-colors cursor-pointer`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{entry.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {(() => {
                                  try {
                                    const date = parseISO(entry.timestamp);
                                    if (isToday(date)) return format(date, 'HH:mm');
                                    return format(date, 'dd.MM HH:mm');
                                  } catch {
                                    return '';
                                  }
                                })()}
                              </span>
                            </div>
                            {entry.subtitle && (
                              <p className="text-xs text-muted-foreground mt-0.5">{entry.subtitle}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Today's Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Heute im Überblick</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-primary" />
                      <span className="text-sm">Mahlzeiten</span>
                    </div>
                    <Badge variant="secondary">{todayStats.mealCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Symptome erfasst</span>
                    </div>
                    <Badge variant="secondary">{todayStats.symptomCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Medikamente</span>
                    </div>
                    <Badge variant="secondary">{todayStats.medicationCount}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="h-4 w-4 text-blue-500" />
                    Medikamente heute
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayMedications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Noch keine Medikamente eingetragen</p>
                  ) : (
                    <ul className="space-y-2">
                      {todayMedications.map((med, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs font-mono">{med.time}</Badge>
                          <span className="text-sm">{med.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
