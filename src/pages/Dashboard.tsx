import { useState, useEffect, useMemo } from 'react';
import type {
  Medikamenteneinnahme,
  Essgewohnheiten,
  Symptomerfassung,
  TaeglicheErfassung
} from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Plus,
  Utensils,
  Pill,
  Activity,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, formatDistance, subDays, startOfDay, isToday, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';

// Symptom rating lookup for display
const SYMPTOM_TYPE_LABELS: Record<string, string> = {
  raeuspern: 'Räuspern',
  lymphschwellung: 'Lymphschwellung',
  energie: 'Energie',
  stimmung: 'Stimmung',
};

const BEWERTUNG_LABELS: Record<string, { label: string; value: number }> = {
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

const BEWERTUNG_GESAMT_LABELS: Record<string, { label: string; value: number }> = {
  sehr_gut: { label: 'Sehr gut', value: 1 },
  gut: { label: 'Gut', value: 2 },
  geht_so: { label: 'Geht so', value: 3 },
  schlecht: { label: 'Schlecht', value: 4 },
  sehr_schlecht: { label: 'Sehr schlecht', value: 5 },
};

const MEDICATION_LABELS: Record<string, string> = {
  ibuprofen_400mg: 'Ibuprofen 400mg',
  vitamin_c_500mg: 'Vitamin C 500mg',
  vitamin_d_2000: 'Vitamin D 2000 Einheiten',
  vitamin_d_4000: 'Vitamin D 4000 Einheiten',
  bitterliebe_1_kapsel: '1 Kapsel Bitterliebe',
  pascoflorin_sensitiv: 'Pascoflorin sensitiv',
};

// Helper to get date string in YYYY-MM-DD format
function getDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Helper to get today's date string
function getTodayString(): string {
  return getDateString(new Date());
}

// Helper to parse datetime from API
function parseDatetime(datetime: string | undefined): Date | null {
  if (!datetime) return null;
  try {
    return parseISO(datetime);
  } catch {
    return null;
  }
}

// Calculate average symptom score for a specific date
function calculateDailySymptomAverage(
  symptoms: Symptomerfassung[],
  dateString: string
): number | null {
  const daySymptoms = symptoms.filter(s => {
    const date = parseDatetime(s.fields.zeitpunkt_symptom);
    return date && getDateString(date) === dateString;
  });

  if (daySymptoms.length === 0) return null;

  const values = daySymptoms
    .map(s => s.fields.bewertung_symptom ? BEWERTUNG_LABELS[s.fields.bewertung_symptom]?.value : null)
    .filter((v): v is number => v !== null);

  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Get wellness score color class based on score (1=best, 10=worst)
function getWellnessColorClass(score: number | null): string {
  if (score === null) return 'bg-muted';
  if (score <= 3) return 'bg-[hsl(152_40%_94%)]';
  if (score <= 6) return 'bg-[hsl(38_50%_94%)]';
  return 'bg-[hsl(0_40%_95%)]';
}

// Get trend icon and text
function getTrendInfo(todayAvg: number | null, yesterdayAvg: number | null): {
  icon: React.ReactNode;
  text: string;
  color: string;
} {
  if (todayAvg === null || yesterdayAvg === null) {
    return {
      icon: <Minus className="h-4 w-4" />,
      text: 'Keine Vergleichsdaten',
      color: 'text-muted-foreground'
    };
  }

  if (todayAvg < yesterdayAvg) {
    return {
      icon: <TrendingUp className="h-4 w-4" />,
      text: 'Besser als gestern',
      color: 'text-green-600'
    };
  }
  if (todayAvg > yesterdayAvg) {
    return {
      icon: <TrendingDown className="h-4 w-4" />,
      text: 'Schlechter als gestern',
      color: 'text-red-500'
    };
  }
  return {
    icon: <Minus className="h-4 w-4" />,
    text: 'Wie gestern',
    color: 'text-muted-foreground'
  };
}

// Combined entry type for recent entries list
interface RecentEntry {
  id: string;
  type: 'meal' | 'medication' | 'symptom' | 'daily';
  title: string;
  subtitle?: string;
  datetime: Date;
  severity?: number;
}

export default function Dashboard() {
  const [medications, setMedications] = useState<Medikamenteneinnahme[]>([]);
  const [meals, setMeals] = useState<Essgewohnheiten[]>([]);
  const [symptoms, setSymptoms] = useState<Symptomerfassung[]>([]);
  const [dailyEntries, setDailyEntries] = useState<TaeglicheErfassung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new entry
  const [formSymptomType, setFormSymptomType] = useState<string>('');
  const [formBewertung, setFormBewertung] = useState<string>('');
  const [formMeal, setFormMeal] = useState<string>('');
  const [formMedication, setFormMedication] = useState<string>('');

  // Fetch all data
  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [meds, mealsData, symptomsData, dailyData] = await Promise.all([
        LivingAppsService.getMedikamenteneinnahme(),
        LivingAppsService.getEssgewohnheiten(),
        LivingAppsService.getSymptomerfassung(),
        LivingAppsService.getTaeglicheErfassung(),
      ]);
      setMedications(meds);
      setMeals(mealsData);
      setSymptoms(symptomsData);
      setDailyEntries(dailyData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate today's stats
  const todayString = getTodayString();
  const yesterdayString = getDateString(subDays(new Date(), 1));

  const todayMeals = useMemo(() => {
    return meals.filter(m => {
      const date = parseDatetime(m.fields.zeitpunkt_mahlzeit);
      return date && getDateString(date) === todayString;
    });
  }, [meals, todayString]);

  const todayMedications = useMemo(() => {
    return medications.filter(m => {
      const date = parseDatetime(m.fields.zeitpunkt_einnahme);
      return date && getDateString(date) === todayString;
    });
  }, [medications, todayString]);

  const todaySymptoms = useMemo(() => {
    return symptoms.filter(s => {
      const date = parseDatetime(s.fields.zeitpunkt_symptom);
      return date && getDateString(date) === todayString;
    });
  }, [symptoms, todayString]);

  // Calculate wellness score
  const todayAvg = useMemo(() => calculateDailySymptomAverage(symptoms, todayString), [symptoms, todayString]);
  const yesterdayAvg = useMemo(() => calculateDailySymptomAverage(symptoms, yesterdayString), [symptoms, yesterdayString]);

  const displayScore = todayAvg ?? yesterdayAvg;
  const scoreLabel = todayAvg === null && yesterdayAvg !== null ? 'Gestern' : 'Heute';
  const trendInfo = getTrendInfo(todayAvg, yesterdayAvg);

  // Prepare chart data for last 7 days
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateString = getDateString(date);
      const avg = calculateDailySymptomAverage(symptoms, dateString);
      data.push({
        date: format(date, 'EEE', { locale: de }),
        fullDate: format(date, 'dd.MM', { locale: de }),
        value: avg,
        displayValue: avg !== null ? (11 - avg) : null, // Invert for display (higher = better)
      });
    }
    return data;
  }, [symptoms]);

  // Combine all entries for recent list
  const recentEntries = useMemo((): RecentEntry[] => {
    const entries: RecentEntry[] = [];

    meals.forEach(m => {
      const datetime = parseDatetime(m.fields.zeitpunkt_mahlzeit);
      if (datetime) {
        entries.push({
          id: `meal-${m.record_id}`,
          type: 'meal',
          title: m.fields.mahlzeit_beschreibung?.slice(0, 50) || 'Mahlzeit',
          subtitle: m.fields.menge_portion || undefined,
          datetime,
        });
      }
    });

    medications.forEach(m => {
      const datetime = parseDatetime(m.fields.zeitpunkt_einnahme);
      if (datetime) {
        entries.push({
          id: `med-${m.record_id}`,
          type: 'medication',
          title: m.fields.medikamentenname ? MEDICATION_LABELS[m.fields.medikamentenname] || m.fields.medikamentenname : 'Medikament',
          datetime,
        });
      }
    });

    symptoms.forEach(s => {
      const datetime = parseDatetime(s.fields.zeitpunkt_symptom);
      if (datetime) {
        const severity = s.fields.bewertung_symptom ? BEWERTUNG_LABELS[s.fields.bewertung_symptom]?.value : undefined;
        entries.push({
          id: `symptom-${s.record_id}`,
          type: 'symptom',
          title: s.fields.symptomtyp ? SYMPTOM_TYPE_LABELS[s.fields.symptomtyp] || s.fields.symptomtyp : 'Symptom',
          subtitle: s.fields.bewertung_symptom ? BEWERTUNG_LABELS[s.fields.bewertung_symptom]?.label : undefined,
          datetime,
          severity,
        });
      }
    });

    dailyEntries.forEach(d => {
      const datetime = parseDatetime(d.fields.zeitpunkt_eintrag);
      if (datetime) {
        entries.push({
          id: `daily-${d.record_id}`,
          type: 'daily',
          title: 'Tageseintrag',
          subtitle: d.fields.symptomtyp_gesamt ? SYMPTOM_TYPE_LABELS[d.fields.symptomtyp_gesamt] : undefined,
          datetime,
        });
      }
    });

    return entries.sort((a, b) => b.datetime.getTime() - a.datetime.getTime());
  }, [meals, medications, symptoms, dailyEntries]);

  // Handle form submission
  async function handleSubmit() {
    if (!formSymptomType || !formBewertung) {
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const dateTime = format(now, "yyyy-MM-dd'T'HH:mm");

      await LivingAppsService.createTaeglicheErfassungEntry({
        zeitpunkt_eintrag: dateTime,
        symptomtyp_gesamt: formSymptomType as 'raeuspern' | 'lymphschwellung' | 'energie' | 'stimmung',
        bewertung_symptom_gesamt: formBewertung,
        mahlzeit_beschreibung_gesamt: formMeal || undefined,
        medikamentenname_gesamt: formMedication ? formMedication as 'ibuprofen_400mg' | 'vitamin_c_500mg' | 'vitamin_d_2000' | 'vitamin_d_4000' | 'bitterliebe_1_kapsel' | 'pascoflorin_sensitiv' : undefined,
      });

      // Reset form and close dialog
      setFormSymptomType('');
      setFormBewertung('');
      setFormMeal('');
      setFormMedication('');
      setDialogOpen(false);

      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Failed to create entry:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Get icon for entry type
  function getEntryIcon(type: RecentEntry['type']) {
    switch (type) {
      case 'meal':
        return <Utensils className="h-4 w-4 text-muted-foreground" />;
      case 'medication':
        return <Pill className="h-4 w-4 text-muted-foreground" />;
      case 'symptom':
        return <Activity className="h-4 w-4 text-muted-foreground" />;
      case 'daily':
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  }

  // Get severity dot color
  function getSeverityDotClass(severity: number | undefined): string {
    if (severity === undefined) return 'bg-muted';
    if (severity <= 3) return 'bg-green-500';
    if (severity <= 6) return 'bg-amber-500';
    return 'bg-red-500';
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-48 w-full rounded-xl mb-6" />
          <div className="flex gap-3 mb-6">
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl mb-6" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler beim Laden</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>{error.message}</span>
              <Button variant="outline" size="sm" onClick={fetchData} className="w-fit">
                <RefreshCw className="h-4 w-4 mr-2" />
                Erneut versuchen
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-6">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-lg font-semibold text-foreground">Mein Gesundheitstagebuch</h1>
        </header>

        {/* Desktop Layout: Two columns */}
        <div className="lg:flex lg:gap-8">
          {/* Left Column (70%) */}
          <div className="lg:w-[70%]">
            {/* Hero Section */}
            <div
              className={`rounded-xl p-6 mb-6 transition-colors ${getWellnessColorClass(displayScore)}`}
              style={{ minHeight: '180px' }}
            >
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="text-sm font-light text-muted-foreground mb-1">
                  Aktuelles Befinden {scoreLabel !== 'Heute' && `(${scoreLabel})`}
                </span>
                {displayScore !== null ? (
                  <>
                    <span className="text-6xl lg:text-7xl font-bold text-foreground">
                      {displayScore.toFixed(1)}
                    </span>
                    <div className={`flex items-center gap-1.5 mt-3 ${trendInfo.color}`}>
                      {trendInfo.icon}
                      <span className="text-sm font-medium">{trendInfo.text}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <span className="text-4xl font-light text-muted-foreground">-</span>
                    <p className="text-sm text-muted-foreground mt-2">Noch keine Symptome erfasst</p>
                  </div>
                )}
              </div>
            </div>

            {/* Today's Summary - Compact badges (Mobile) / Hidden on desktop (shown in sidebar) */}
            <div className="flex gap-3 mb-6 lg:hidden">
              <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 py-2.5">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{todayMeals.length}</span>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 py-2.5">
                <Pill className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{todayMedications.length}</span>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 py-2.5">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{todaySymptoms.length}</span>
              </div>
            </div>

            {/* Symptom Trend Chart */}
            <Card className="mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Symptom-Verlauf (letzte 7 Tage)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[160px] lg:h-[200px]">
                  {chartData.some(d => d.value !== null) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(152 35% 45%)" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="hsl(152 35% 45%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          stroke="hsl(200 10% 50%)"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={[0, 10]}
                          tick={{ fontSize: 12 }}
                          stroke="hsl(200 10% 50%)"
                          tickLine={false}
                          axisLine={false}
                          className="hidden lg:block"
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                                  <p className="text-sm font-medium">{data.fullDate}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Befinden: {data.value !== null ? data.value.toFixed(1) : 'Keine Daten'}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="displayValue"
                          stroke="hsl(152 35% 45%)"
                          strokeWidth={2}
                          fill="url(#colorValue)"
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Noch keine Daten für die letzten 7 Tage
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Entries */}
            <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Letzte Einträge
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentEntries.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Noch keine Einträge vorhanden
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentEntries.slice(0, window.innerWidth >= 1024 ? 10 : 5).map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        {getEntryIcon(entry.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{entry.title}</p>
                          {entry.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{entry.subtitle}</p>
                          )}
                        </div>
                        {entry.type === 'symptom' && entry.severity !== undefined && (
                          <div className={`w-2 h-2 rounded-full ${getSeverityDotClass(entry.severity)}`} />
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistance(entry.datetime, new Date(), { addSuffix: true, locale: de })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar (30%) - Desktop only */}
          <div className="hidden lg:block lg:w-[30%]">
            <div className="sticky top-6 space-y-6">
              {/* Quick Action Card */}
              <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Schnelleintrag
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full mb-3" size="lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Eintrag hinzufügen
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Neuer Eintrag</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {/* Symptom Type */}
                        <div className="space-y-2">
                          <Label>Symptomtyp *</Label>
                          <Select value={formSymptomType} onValueChange={setFormSymptomType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Symptom auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="raeuspern">Räuspern</SelectItem>
                              <SelectItem value="lymphschwellung">Lymphschwellung</SelectItem>
                              <SelectItem value="energie">Energie</SelectItem>
                              <SelectItem value="stimmung">Stimmung</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Rating */}
                        <div className="space-y-2">
                          <Label>Bewertung *</Label>
                          <RadioGroup value={formBewertung} onValueChange={setFormBewertung}>
                            <div className="grid grid-cols-5 gap-2">
                              {Object.entries(BEWERTUNG_GESAMT_LABELS).map(([key, { label }]) => (
                                <div key={key} className="flex flex-col items-center">
                                  <RadioGroupItem value={key} id={key} className="sr-only" />
                                  <label
                                    htmlFor={key}
                                    className={`w-full py-2 px-1 text-xs text-center rounded-lg cursor-pointer transition-colors border ${
                                      formBewertung === key
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-muted border-transparent hover:bg-muted/80'
                                    }`}
                                  >
                                    {label.split(' ')[0]}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Meal (optional) */}
                        <div className="space-y-2">
                          <Label>Mahlzeit (optional)</Label>
                          <Textarea
                            value={formMeal}
                            onChange={(e) => setFormMeal(e.target.value)}
                            placeholder="Was haben Sie gegessen?"
                            rows={2}
                          />
                        </div>

                        {/* Medication (optional) */}
                        <div className="space-y-2">
                          <Label>Medikament (optional)</Label>
                          <Select value={formMedication} onValueChange={setFormMedication}>
                            <SelectTrigger>
                              <SelectValue placeholder="Medikament auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Kein Medikament</SelectItem>
                              <SelectItem value="ibuprofen_400mg">Ibuprofen 400mg</SelectItem>
                              <SelectItem value="vitamin_c_500mg">Vitamin C 500mg</SelectItem>
                              <SelectItem value="vitamin_d_2000">Vitamin D 2000 Einheiten</SelectItem>
                              <SelectItem value="vitamin_d_4000">Vitamin D 4000 Einheiten</SelectItem>
                              <SelectItem value="bitterliebe_1_kapsel">1 Kapsel Bitterliebe</SelectItem>
                              <SelectItem value="pascoflorin_sensitiv">Pascoflorin sensitiv</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={handleSubmit}
                          className="w-full"
                          disabled={!formSymptomType || !formBewertung || submitting}
                        >
                          {submitting ? 'Speichern...' : 'Speichern'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Today's Stats Card */}
              <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Heute
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Utensils className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{todayMeals.length} Mahlzeiten</p>
                      <p className="text-xs text-muted-foreground">erfasst</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Pill className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{todayMedications.length} Medikamente</p>
                      <p className="text-xs text-muted-foreground">eingenommen</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{todaySymptoms.length} Symptome</p>
                      <p className="text-xs text-muted-foreground">dokumentiert</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Button (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border lg:hidden">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-[52px] text-base" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Eintrag hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Neuer Eintrag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Symptom Type */}
              <div className="space-y-2">
                <Label>Symptomtyp *</Label>
                <Select value={formSymptomType} onValueChange={setFormSymptomType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Symptom auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raeuspern">Räuspern</SelectItem>
                    <SelectItem value="lymphschwellung">Lymphschwellung</SelectItem>
                    <SelectItem value="energie">Energie</SelectItem>
                    <SelectItem value="stimmung">Stimmung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label>Bewertung *</Label>
                <RadioGroup value={formBewertung} onValueChange={setFormBewertung}>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(BEWERTUNG_GESAMT_LABELS).map(([key, { label }]) => (
                      <div key={key} className="flex flex-col items-center">
                        <RadioGroupItem value={key} id={`mobile-${key}`} className="sr-only" />
                        <label
                          htmlFor={`mobile-${key}`}
                          className={`w-full py-2 px-1 text-xs text-center rounded-lg cursor-pointer transition-colors border ${
                            formBewertung === key
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted border-transparent hover:bg-muted/80'
                          }`}
                        >
                          {label.split(' ')[0]}
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Meal (optional) */}
              <div className="space-y-2">
                <Label>Mahlzeit (optional)</Label>
                <Textarea
                  value={formMeal}
                  onChange={(e) => setFormMeal(e.target.value)}
                  placeholder="Was haben Sie gegessen?"
                  rows={2}
                />
              </div>

              {/* Medication (optional) */}
              <div className="space-y-2">
                <Label>Medikament (optional)</Label>
                <Select value={formMedication} onValueChange={setFormMedication}>
                  <SelectTrigger>
                    <SelectValue placeholder="Medikament auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Medikament</SelectItem>
                    <SelectItem value="ibuprofen_400mg">Ibuprofen 400mg</SelectItem>
                    <SelectItem value="vitamin_c_500mg">Vitamin C 500mg</SelectItem>
                    <SelectItem value="vitamin_d_2000">Vitamin D 2000 Einheiten</SelectItem>
                    <SelectItem value="vitamin_d_4000">Vitamin D 4000 Einheiten</SelectItem>
                    <SelectItem value="bitterliebe_1_kapsel">1 Kapsel Bitterliebe</SelectItem>
                    <SelectItem value="pascoflorin_sensitiv">Pascoflorin sensitiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={!formSymptomType || !formBewertung || submitting}
              >
                {submitting ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
