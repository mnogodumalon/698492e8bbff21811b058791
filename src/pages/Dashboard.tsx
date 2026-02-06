import { useState, useEffect, useMemo } from 'react';
import type { Symptomerfassung, Essgewohnheiten, TaeglicheErfassung, Medikamenteneinnahme } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format, parseISO, formatDistance, subDays, startOfDay, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, Settings, ClipboardList, Utensils, Pill, Activity, TrendingUp, TrendingDown, AlertCircle, Heart } from 'lucide-react';

// Types for combined data
interface CombinedEntry {
  id: string;
  type: 'symptom' | 'meal' | 'medication' | 'daily';
  timestamp: string;
  description: string;
  source: string;
}

// Wellbeing Ring Component
function WellbeingRing({ value, size = 200 }: { value: number; size?: number }) {
  const strokeWidth = size === 200 ? 12 : 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Invert: 1 = 100% filled (best), 10 = 10% filled (worst)
  const fillPercent = Math.max(0, Math.min(100, ((10 - value + 1) / 10) * 100));
  const strokeDashoffset = circumference - (fillPercent / 100) * circumference;

  // Gradient based on value: 1-3 sage, 4-6 amber, 7-10 terracotta
  const getColor = () => {
    if (value <= 3) return 'hsl(150 35% 45%)'; // sage
    if (value <= 6) return 'hsl(45 70% 55%)'; // amber
    return 'hsl(15 60% 55%)'; // terracotta
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(45 20% 90%)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.1))',
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-extrabold text-foreground" style={{ fontSize: size === 200 ? '64px' : '72px' }}>
          {value.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground mt-1">von 10</span>
      </div>
    </div>
  );
}

// Quick Stat Pill Component
function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
      <Icon className="h-4 w-4 text-primary" />
      <span className="font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>
    </div>
  );
}

// Entry Type Badge
function EntryBadge({ type }: { type: CombinedEntry['type'] }) {
  const config = {
    symptom: { color: 'bg-primary', label: 'Symptom' },
    meal: { color: 'bg-chart-4', label: 'Mahlzeit' },
    medication: { color: 'bg-chart-5', label: 'Medikament' },
    daily: { color: 'bg-accent', label: 'Tageseintrag' },
  };
  const { color, label } = config[type];
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={label} />
  );
}

// New Entry Form Component
function NewEntryForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    zeitpunkt_eintrag: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    mahlzeit_beschreibung_gesamt: '',
    menge_portion_gesamt: '',
    notizen_essen_gesamt: '',
    symptomtyp_gesamt: '',
    bewertung_symptom_gesamt: '',
    notizen_symptom_gesamt: '',
    medikamentenname_gesamt: '',
    notizen_medikament_gesamt: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Check that at least one section is filled
    const hasMeal = formData.mahlzeit_beschreibung_gesamt.trim() !== '';
    const hasSymptom = formData.symptomtyp_gesamt !== '' && formData.bewertung_symptom_gesamt !== '';
    const hasMedication = formData.medikamentenname_gesamt !== '';

    if (!hasMeal && !hasSymptom && !hasMedication) {
      setError('Bitte füllen Sie mindestens einen Bereich aus (Mahlzeit, Symptom oder Medikament).');
      setSubmitting(false);
      return;
    }

    try {
      const apiData: TaeglicheErfassung['fields'] = {
        zeitpunkt_eintrag: formData.zeitpunkt_eintrag.slice(0, 16), // YYYY-MM-DDTHH:MM
      };

      if (hasMeal) {
        apiData.mahlzeit_beschreibung_gesamt = formData.mahlzeit_beschreibung_gesamt;
        if (formData.menge_portion_gesamt) apiData.menge_portion_gesamt = formData.menge_portion_gesamt;
        if (formData.notizen_essen_gesamt) apiData.notizen_essen_gesamt = formData.notizen_essen_gesamt;
      }

      if (hasSymptom) {
        apiData.symptomtyp_gesamt = formData.symptomtyp_gesamt as TaeglicheErfassung['fields']['symptomtyp_gesamt'];
        apiData.bewertung_symptom_gesamt = formData.bewertung_symptom_gesamt;
        if (formData.notizen_symptom_gesamt) apiData.notizen_symptom_gesamt = formData.notizen_symptom_gesamt;
      }

      if (hasMedication) {
        apiData.medikamentenname_gesamt = formData.medikamentenname_gesamt as TaeglicheErfassung['fields']['medikamentenname_gesamt'];
        if (formData.notizen_medikament_gesamt) apiData.notizen_medikament_gesamt = formData.notizen_medikament_gesamt;
      }

      await LivingAppsService.createTaeglicheErfassungEntry(apiData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date/Time */}
      <div className="space-y-2">
        <Label htmlFor="zeitpunkt">Datum und Uhrzeit</Label>
        <Input
          id="zeitpunkt"
          type="datetime-local"
          value={formData.zeitpunkt_eintrag}
          onChange={(e) => setFormData({ ...formData, zeitpunkt_eintrag: e.target.value })}
        />
      </div>

      {/* Meal Section */}
      <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
        <h4 className="font-semibold flex items-center gap-2">
          <Utensils className="h-4 w-4 text-chart-4" />
          Mahlzeit (optional)
        </h4>
        <div className="space-y-2">
          <Label htmlFor="mahlzeit">Mahlzeit / Nahrungsmittel</Label>
          <Textarea
            id="mahlzeit"
            placeholder="Was haben Sie gegessen?"
            value={formData.mahlzeit_beschreibung_gesamt}
            onChange={(e) => setFormData({ ...formData, mahlzeit_beschreibung_gesamt: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="menge">Menge / Portionsgröße</Label>
          <Input
            id="menge"
            placeholder="z.B. 1 Portion, 200g"
            value={formData.menge_portion_gesamt}
            onChange={(e) => setFormData({ ...formData, menge_portion_gesamt: e.target.value })}
          />
        </div>
      </div>

      {/* Symptom Section */}
      <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
        <h4 className="font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Symptom (optional)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Symptomtyp</Label>
            <Select
              value={formData.symptomtyp_gesamt || 'none'}
              onValueChange={(v) => setFormData({ ...formData, symptomtyp_gesamt: v === 'none' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nicht auswählen</SelectItem>
                <SelectItem value="raeuspern">Räuspern</SelectItem>
                <SelectItem value="lymphschwellung">Lymphschwellung</SelectItem>
                <SelectItem value="energie">Energie</SelectItem>
                <SelectItem value="stimmung">Stimmung</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bewertung</Label>
            <Select
              value={formData.bewertung_symptom_gesamt || 'none'}
              onValueChange={(v) => setFormData({ ...formData, bewertung_symptom_gesamt: v === 'none' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nicht auswählen</SelectItem>
                <SelectItem value="sehr_gut">Sehr gut</SelectItem>
                <SelectItem value="gut">Gut</SelectItem>
                <SelectItem value="geht_so">Geht so</SelectItem>
                <SelectItem value="schlecht">Schlecht</SelectItem>
                <SelectItem value="sehr_schlecht">Sehr schlecht</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="symptom_notes">Notizen zu Symptomen</Label>
          <Textarea
            id="symptom_notes"
            placeholder="Weitere Beobachtungen..."
            value={formData.notizen_symptom_gesamt}
            onChange={(e) => setFormData({ ...formData, notizen_symptom_gesamt: e.target.value })}
          />
        </div>
      </div>

      {/* Medication Section */}
      <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
        <h4 className="font-semibold flex items-center gap-2">
          <Pill className="h-4 w-4 text-chart-5" />
          Medikament (optional)
        </h4>
        <div className="space-y-2">
          <Label>Medikamentenname</Label>
          <Select
            value={formData.medikamentenname_gesamt || 'none'}
            onValueChange={(v) => setFormData({ ...formData, medikamentenname_gesamt: v === 'none' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Auswählen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nicht auswählen</SelectItem>
              <SelectItem value="ibuprofen_400mg">Ibuprofen 400mg</SelectItem>
              <SelectItem value="vitamin_c_500mg">Vitamin C 500mg</SelectItem>
              <SelectItem value="vitamin_d_2000">Vitamin D 2000 Einheiten</SelectItem>
              <SelectItem value="vitamin_d_4000">Vitamin D 4000 Einheiten</SelectItem>
              <SelectItem value="bitterliebe_1_kapsel">1 Kapsel Bitterliebe</SelectItem>
              <SelectItem value="pascoflorin_sensitiv">Pascoflorin sensitiv</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="med_notes">Notizen zu Medikamenten</Label>
          <Textarea
            id="med_notes"
            placeholder="Weitere Informationen..."
            value={formData.notizen_medikament_gesamt}
            onChange={(e) => setFormData({ ...formData, notizen_medikament_gesamt: e.target.value })}
          />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Speichern...' : 'Eintrag speichern'}
        </Button>
      </div>
    </form>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Hero Skeleton */}
      <div className="flex flex-col items-center mb-8">
        <Skeleton className="h-[200px] w-[200px] rounded-full mb-4" />
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats Skeleton */}
      <div className="flex justify-center gap-3 mb-6">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>

      {/* Chart Skeleton */}
      <Skeleton className="h-[200px] w-full rounded-xl mb-6" />

      {/* List Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 mb-3" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ onAddEntry }: { onAddEntry: () => void }) {
  return (
    <Empty className="min-h-[60vh]">
      <EmptyMedia variant="icon">
        <Heart className="h-6 w-6" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>Willkommen in Ihrem Gesundheitstagebuch</EmptyTitle>
        <EmptyDescription>
          Beginnen Sie mit Ihrem ersten Eintrag, um Ihre Gesundheit zu verfolgen.
        </EmptyDescription>
      </EmptyHeader>
      <Button onClick={onAddEntry}>
        <Plus className="h-4 w-4 mr-2" />
        Ersten Eintrag erstellen
      </Button>
    </Empty>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const [symptoms, setSymptoms] = useState<Symptomerfassung[]>([]);
  const [meals, setMeals] = useState<Essgewohnheiten[]>([]);
  const [dailyEntries, setDailyEntries] = useState<TaeglicheErfassung[]>([]);
  const [medications, setMedications] = useState<Medikamenteneinnahme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [s, m, d, med] = await Promise.all([
        LivingAppsService.getSymptomerfassung(),
        LivingAppsService.getEssgewohnheiten(),
        LivingAppsService.getTaeglicheErfassung(),
        LivingAppsService.getMedikamenteneinnahme(),
      ]);
      setSymptoms(s);
      setMeals(m);
      setDailyEntries(d);
      setMedications(med);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const today = startOfDay(new Date());

    const todaySymptoms = symptoms.filter(s => {
      if (!s.fields.zeitpunkt_symptom) return false;
      return isToday(parseISO(s.fields.zeitpunkt_symptom));
    });

    const todayMeals = meals.filter(m => {
      if (!m.fields.zeitpunkt_mahlzeit) return false;
      return isToday(parseISO(m.fields.zeitpunkt_mahlzeit));
    });

    const todayMedications = medications.filter(m => {
      if (!m.fields.zeitpunkt_einnahme) return false;
      return isToday(parseISO(m.fields.zeitpunkt_einnahme));
    });

    const todayDaily = dailyEntries.filter(d => {
      if (!d.fields.zeitpunkt_eintrag) return false;
      return isToday(parseISO(d.fields.zeitpunkt_eintrag));
    });

    // Count meals from both sources
    const mealCount = todayMeals.length + todayDaily.filter(d => d.fields.mahlzeit_beschreibung_gesamt).length;

    // Count medications from both sources
    const medCount = todayMedications.length + todayDaily.filter(d => d.fields.medikamentenname_gesamt).length;

    // Total entries today
    const totalEntries = todaySymptoms.length + todayMeals.length + todayMedications.length + todayDaily.length;

    return { todaySymptoms, todayMeals, todayMedications, todayDaily, mealCount, medCount, totalEntries };
  }, [symptoms, meals, medications, dailyEntries]);

  // Calculate wellbeing value
  const wellbeingValue = useMemo(() => {
    // Convert symptom ratings to numeric values
    const ratingToNumber = (rating: string | undefined): number | null => {
      if (!rating) return null;
      // For Symptomerfassung: wert_1 to wert_10
      if (rating.startsWith('wert_')) {
        return parseInt(rating.replace('wert_', ''));
      }
      // For TaeglicheErfassung: sehr_gut, gut, geht_so, schlecht, sehr_schlecht
      const dailyMap: Record<string, number> = {
        'sehr_gut': 1,
        'gut': 3,
        'geht_so': 5,
        'schlecht': 7,
        'sehr_schlecht': 10,
      };
      return dailyMap[rating] ?? null;
    };

    // Get today's symptom ratings
    const todayRatings: number[] = [];

    todayStats.todaySymptoms.forEach(s => {
      const num = ratingToNumber(s.fields.bewertung_symptom);
      if (num !== null) todayRatings.push(num);
    });

    todayStats.todayDaily.forEach(d => {
      const num = ratingToNumber(d.fields.bewertung_symptom_gesamt);
      if (num !== null) todayRatings.push(num);
    });

    if (todayRatings.length === 0) {
      // If no entries today, get the most recent rating
      const allSymptomsWithRating = symptoms
        .filter(s => s.fields.bewertung_symptom && s.fields.zeitpunkt_symptom)
        .sort((a, b) => (b.fields.zeitpunkt_symptom || '').localeCompare(a.fields.zeitpunkt_symptom || ''));

      const allDailyWithRating = dailyEntries
        .filter(d => d.fields.bewertung_symptom_gesamt && d.fields.zeitpunkt_eintrag)
        .sort((a, b) => (b.fields.zeitpunkt_eintrag || '').localeCompare(a.fields.zeitpunkt_eintrag || ''));

      if (allSymptomsWithRating.length > 0) {
        const num = ratingToNumber(allSymptomsWithRating[0].fields.bewertung_symptom);
        if (num !== null) return { value: num, isToday: false };
      }
      if (allDailyWithRating.length > 0) {
        const num = ratingToNumber(allDailyWithRating[0].fields.bewertung_symptom_gesamt);
        if (num !== null) return { value: num, isToday: false };
      }
      return { value: 5, isToday: false }; // Default
    }

    const avg = todayRatings.reduce((a, b) => a + b, 0) / todayRatings.length;
    return { value: avg, isToday: true };
  }, [symptoms, dailyEntries, todayStats]);

  // Calculate yesterday's wellbeing for comparison
  const yesterdayWellbeing = useMemo(() => {
    const yesterday = subDays(new Date(), 1);
    const ratingToNumber = (rating: string | undefined): number | null => {
      if (!rating) return null;
      if (rating.startsWith('wert_')) return parseInt(rating.replace('wert_', ''));
      const dailyMap: Record<string, number> = { 'sehr_gut': 1, 'gut': 3, 'geht_so': 5, 'schlecht': 7, 'sehr_schlecht': 10 };
      return dailyMap[rating] ?? null;
    };

    const yesterdayRatings: number[] = [];

    symptoms.forEach(s => {
      if (!s.fields.zeitpunkt_symptom) return;
      const date = parseISO(s.fields.zeitpunkt_symptom);
      if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
        const num = ratingToNumber(s.fields.bewertung_symptom);
        if (num !== null) yesterdayRatings.push(num);
      }
    });

    dailyEntries.forEach(d => {
      if (!d.fields.zeitpunkt_eintrag) return;
      const date = parseISO(d.fields.zeitpunkt_eintrag);
      if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
        const num = ratingToNumber(d.fields.bewertung_symptom_gesamt);
        if (num !== null) yesterdayRatings.push(num);
      }
    });

    if (yesterdayRatings.length === 0) return null;
    return yesterdayRatings.reduce((a, b) => a + b, 0) / yesterdayRatings.length;
  }, [symptoms, dailyEntries]);

  // Chart data: last 7 days
  const chartData = useMemo(() => {
    const days: { date: string; label: string; avgRating: number | null }[] = [];
    const ratingToNumber = (rating: string | undefined): number | null => {
      if (!rating) return null;
      if (rating.startsWith('wert_')) return parseInt(rating.replace('wert_', ''));
      const dailyMap: Record<string, number> = { 'sehr_gut': 1, 'gut': 3, 'geht_so': 5, 'schlecht': 7, 'sehr_schlecht': 10 };
      return dailyMap[rating] ?? null;
    };

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = format(date, 'EEE', { locale: de });

      const dayRatings: number[] = [];

      symptoms.forEach(s => {
        if (!s.fields.zeitpunkt_symptom) return;
        if (s.fields.zeitpunkt_symptom.startsWith(dateStr)) {
          const num = ratingToNumber(s.fields.bewertung_symptom);
          if (num !== null) dayRatings.push(num);
        }
      });

      dailyEntries.forEach(d => {
        if (!d.fields.zeitpunkt_eintrag) return;
        if (d.fields.zeitpunkt_eintrag.startsWith(dateStr)) {
          const num = ratingToNumber(d.fields.bewertung_symptom_gesamt);
          if (num !== null) dayRatings.push(num);
        }
      });

      days.push({
        date: dateStr,
        label,
        avgRating: dayRatings.length > 0 ? dayRatings.reduce((a, b) => a + b, 0) / dayRatings.length : null,
      });
    }

    return days;
  }, [symptoms, dailyEntries]);

  // Combined recent entries
  const recentEntries = useMemo(() => {
    const entries: CombinedEntry[] = [];

    symptoms.forEach(s => {
      if (!s.fields.zeitpunkt_symptom) return;
      const symptomLabels: Record<string, string> = {
        'raeuspern': 'Räuspern',
        'lymphschwellung': 'Lymphschwellung',
        'energie': 'Energie',
        'stimmung': 'Stimmung',
      };
      entries.push({
        id: `symptom-${s.record_id}`,
        type: 'symptom',
        timestamp: s.fields.zeitpunkt_symptom,
        description: symptomLabels[s.fields.symptomtyp || ''] || 'Symptom erfasst',
        source: 'Symptomerfassung',
      });
    });

    meals.forEach(m => {
      if (!m.fields.zeitpunkt_mahlzeit) return;
      entries.push({
        id: `meal-${m.record_id}`,
        type: 'meal',
        timestamp: m.fields.zeitpunkt_mahlzeit,
        description: m.fields.mahlzeit_beschreibung?.slice(0, 50) || 'Mahlzeit erfasst',
        source: 'Essgewohnheiten',
      });
    });

    medications.forEach(m => {
      if (!m.fields.zeitpunkt_einnahme) return;
      const medLabels: Record<string, string> = {
        'ibuprofen_400mg': 'Ibuprofen 400mg',
        'vitamin_c_500mg': 'Vitamin C 500mg',
        'vitamin_d_2000': 'Vitamin D 2000',
        'vitamin_d_4000': 'Vitamin D 4000',
        'bitterliebe_1_kapsel': 'Bitterliebe',
        'pascoflorin_sensitiv': 'Pascoflorin',
      };
      entries.push({
        id: `med-${m.record_id}`,
        type: 'medication',
        timestamp: m.fields.zeitpunkt_einnahme,
        description: medLabels[m.fields.medikamentenname || ''] || 'Medikament eingenommen',
        source: 'Medikamenteneinnahme',
      });
    });

    dailyEntries.forEach(d => {
      if (!d.fields.zeitpunkt_eintrag) return;
      let desc = 'Tageseintrag';
      if (d.fields.mahlzeit_beschreibung_gesamt) desc = d.fields.mahlzeit_beschreibung_gesamt.slice(0, 50);
      else if (d.fields.symptomtyp_gesamt) {
        const symptomLabels: Record<string, string> = {
          'raeuspern': 'Räuspern',
          'lymphschwellung': 'Lymphschwellung',
          'energie': 'Energie',
          'stimmung': 'Stimmung',
        };
        desc = symptomLabels[d.fields.symptomtyp_gesamt] || 'Symptom';
      }
      entries.push({
        id: `daily-${d.record_id}`,
        type: 'daily',
        timestamp: d.fields.zeitpunkt_eintrag,
        description: desc,
        source: 'Tägliche Erfassung',
      });
    });

    return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);
  }, [symptoms, meals, medications, dailyEntries]);

  const handleFormSuccess = () => {
    setDialogOpen(false);
    fetchData();
  };

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message}
            <Button variant="outline" className="mt-3 w-full" onClick={() => fetchData()}>
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasAnyData = symptoms.length > 0 || meals.length > 0 || dailyEntries.length > 0 || medications.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="hidden md:flex justify-between items-center px-6 py-4 border-b border-border bg-card">
        <h1 className="text-xl font-semibold text-foreground">Mein Gesundheitstagebuch</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Eintrag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuer Eintrag</DialogTitle>
            </DialogHeader>
            <NewEntryForm onSuccess={handleFormSuccess} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center px-4 py-3">
        <h1 className="text-lg font-semibold text-primary">Mein Tagebuch</h1>
        <button className="p-2 rounded-full hover:bg-muted transition-colors">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      {!hasAnyData ? (
        <EmptyState onAddEntry={() => setDialogOpen(true)} />
      ) : (
        <>
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
            {/* Left Column (2/3) */}
            <div className="md:col-span-2 space-y-6">
              {/* Hero Card */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-8">
                    {/* Wellbeing Ring */}
                    <WellbeingRing value={wellbeingValue.value} size={240} />

                    {/* Right side info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Heutiges Wohlbefinden</p>
                        <h2 className="text-2xl font-bold text-foreground">
                          {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
                        </h2>
                      </div>

                      {!wellbeingValue.isToday && (
                        <p className="text-sm text-muted-foreground italic">Letzter erfasster Wert</p>
                      )}

                      {yesterdayWellbeing !== null && wellbeingValue.isToday && (
                        <div className="flex items-center gap-2">
                          {wellbeingValue.value < yesterdayWellbeing ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="text-sm text-primary">Besser als gestern</span>
                            </>
                          ) : wellbeingValue.value > yesterdayWellbeing ? (
                            <>
                              <TrendingDown className="h-4 w-4 text-accent" />
                              <span className="text-sm text-accent">Schlechter als gestern</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Wie gestern</span>
                          )}
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="flex gap-3 pt-2">
                        <StatPill icon={ClipboardList} value={todayStats.totalEntries} label="Einträge" />
                        <StatPill icon={Utensils} value={todayStats.mealCount} label="Mahlzeiten" />
                        <StatPill icon={Pill} value={todayStats.medCount} label="Medikamente" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Wochen-Verlauf</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(150 35% 45%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(150 35% 45%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12, fill: 'hsl(150 10% 45%)' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[1, 10]}
                          reversed
                          tick={{ fontSize: 12, fill: 'hsl(150 10% 45%)' }}
                          axisLine={false}
                          tickLine={false}
                          width={30}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(0 0% 100%)',
                            border: '1px solid hsl(45 20% 88%)',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                          formatter={(value: number) => [value ? value.toFixed(1) : '-', 'Bewertung']}
                          labelFormatter={(label) => `Tag: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="avgRating"
                          stroke="hsl(150 35% 45%)"
                          strokeWidth={2}
                          fill="url(#colorRating)"
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Niedrigere Werte = besseres Wohlbefinden (1 = sehr gut, 10 = sehr schlecht)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (1/3) */}
            <div className="space-y-6">
              {/* Quick Stats Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Heute</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        <span className="text-sm">Einträge gesamt</span>
                      </div>
                      <span className="font-semibold">{todayStats.totalEntries}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-chart-4" />
                        <span className="text-sm">Mahlzeiten</span>
                      </div>
                      <span className="font-semibold">{todayStats.mealCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-chart-5" />
                        <span className="text-sm">Medikamente</span>
                      </div>
                      <span className="font-semibold">{todayStats.medCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Letzte Einträge</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Keine Einträge vorhanden</p>
                  ) : (
                    <div className="space-y-1 max-h-[400px] overflow-y-auto">
                      {recentEntries.map((entry, index) => (
                        <div
                          key={entry.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          {/* Timeline connector */}
                          <div className="flex flex-col items-center">
                            <EntryBadge type={entry.type} />
                            {index < recentEntries.length - 1 && (
                              <div className="w-px h-8 bg-border mt-1" />
                            )}
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {entry.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistance(parseISO(entry.timestamp), new Date(), { addSuffix: true, locale: de })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden px-4 pb-24">
            {/* Hero Section */}
            <div className="flex flex-col items-center py-6">
              <WellbeingRing value={wellbeingValue.value} size={200} />
              <p className="text-sm text-muted-foreground mt-4">Heutiges Wohlbefinden</p>
              <h2 className="text-lg font-semibold text-foreground">
                {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
              </h2>

              {!wellbeingValue.isToday && (
                <p className="text-xs text-muted-foreground mt-1 italic">Letzter erfasster Wert</p>
              )}

              {yesterdayWellbeing !== null && wellbeingValue.isToday && (
                <div className="flex items-center gap-2 mt-2">
                  {wellbeingValue.value < yesterdayWellbeing ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm text-primary">Besser als gestern</span>
                    </>
                  ) : wellbeingValue.value > yesterdayWellbeing ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-accent" />
                      <span className="text-sm text-accent">Schlechter als gestern</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Wie gestern</span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              <StatPill icon={ClipboardList} value={todayStats.totalEntries} label="Einträge" />
              <StatPill icon={Utensils} value={todayStats.mealCount} label="Mahlzeiten" />
              <StatPill icon={Pill} value={todayStats.medCount} label="Medikamente" />
            </div>

            {/* Chart Card */}
            <Card className="mb-6 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Wochen-Verlauf</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRatingMobile" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(150 35% 45%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(150 35% 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: 'hsl(150 10% 45%)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide domain={[1, 10]} reversed />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0 0% 100%)',
                          border: '1px solid hsl(45 20% 88%)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [value ? value.toFixed(1) : '-', 'Bewertung']}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgRating"
                        stroke="hsl(150 35% 45%)"
                        strokeWidth={2}
                        fill="url(#colorRatingMobile)"
                        connectNulls
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Entries */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3 text-foreground">Letzte Einträge</h3>
              {recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Keine Einträge vorhanden</p>
              ) : (
                <div className="space-y-2">
                  {recentEntries.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border shadow-sm"
                    >
                      <div className={`w-1 h-10 rounded-full ${
                        entry.type === 'symptom' ? 'bg-primary' :
                        entry.type === 'meal' ? 'bg-chart-4' :
                        entry.type === 'medication' ? 'bg-chart-5' : 'bg-accent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistance(parseISO(entry.timestamp), new Date(), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile FAB */}
          <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-16 w-16 rounded-full shadow-lg">
                  <Plus className="h-7 w-7" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Neuer Eintrag</DialogTitle>
                </DialogHeader>
                <NewEntryForm onSuccess={handleFormSuccess} onCancel={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            <p className="text-xs text-center text-muted-foreground mt-1">Neuer Eintrag</p>
          </div>
        </>
      )}
    </div>
  );
}
