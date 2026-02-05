import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, subDays, startOfDay, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Activity, Utensils, Pill, Plus, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import type { Symptomerfassung, Essgewohnheiten, Medikamenteneinnahme } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Symptom type labels
const SYMPTOM_LABELS: Record<string, string> = {
  raeuspern: 'Räuspern',
  lymphschwellung: 'Lymphschwellung',
  energie: 'Energie',
  stimmung: 'Stimmung',
};

// Rating labels (1 = good, 10 = bad in the original scale)
const RATING_LABELS: Record<string, string> = {
  wert_1: '1 - Sehr gut',
  wert_2: '2',
  wert_3: '3',
  wert_4: '4',
  wert_5: '5',
  wert_6: '6',
  wert_7: '7',
  wert_8: '8',
  wert_9: '9',
  wert_10: '10 - Sehr schlecht',
};

// Extract numeric value from rating key (wert_1 -> 1, wert_10 -> 10)
function getRatingValue(rating: string | undefined): number | null {
  if (!rating) return null;
  const match = rating.match(/wert_(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Get wellness score from symptom rating (inverted: 1=bad in original becomes 10=good)
function getWellnessScore(rating: string | undefined): number | null {
  const value = getRatingValue(rating);
  if (value === null) return null;
  return 11 - value; // Invert: wert_1 (good) -> 10, wert_10 (bad) -> 1
}

// Get color for wellness score
function getWellnessColor(score: number): string {
  if (score >= 8) return 'hsl(150 45% 45%)'; // Sage green - good
  if (score >= 4) return 'hsl(40 80% 55%)'; // Warm yellow - moderate
  return 'hsl(10 60% 55%)'; // Soft coral - needs attention
}

// Get message for wellness score
function getWellnessMessage(score: number): string {
  if (score >= 8) return 'Ausgezeichnet!';
  if (score >= 6) return 'Guter Tag';
  if (score >= 4) return 'Geht so';
  return 'Achte auf dich';
}

// Format time from datetime string
function formatTime(datetime: string | undefined): string {
  if (!datetime) return '--:--';
  try {
    return format(parseISO(datetime), 'HH:mm');
  } catch {
    return '--:--';
  }
}

// Check if date is today
function isDateToday(datetime: string | undefined): boolean {
  if (!datetime) return false;
  try {
    return isToday(parseISO(datetime));
  } catch {
    return false;
  }
}

// Combined entry type for list display
type CombinedEntry = {
  id: string;
  type: 'symptom' | 'mahlzeit' | 'medikament';
  time: string;
  datetime: string;
  description: string;
  rating?: string;
  record: Symptomerfassung | Essgewohnheiten | Medikamenteneinnahme;
};

// Wellness Arc Component
function WellnessArc({ score, size = 200 }: { score: number | null; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = score !== null
    ? circumference - (score / 10) * circumference
    : circumference;
  const color = score !== null ? getWellnessColor(score) : 'hsl(150 15% 88%)';

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${10} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke="hsl(150 15% 88%)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={`M ${10} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="animate-arc"
          style={{
            transition: 'stroke 0.3s ease',
          }}
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 text-center" style={{ marginTop: '-10px' }}>
        <span className="text-6xl font-bold" style={{ color: score !== null ? color : undefined }}>
          {score !== null ? score.toFixed(1) : '--'}
        </span>
        <span className="text-muted-foreground text-lg ml-1">von 10</span>
      </div>
    </div>
  );
}

// Quick Stats Row Component
function QuickStats({
  symptomCount,
  mealCount,
  medicationCount
}: {
  symptomCount: number;
  mealCount: number;
  medicationCount: number;
}) {
  return (
    <div className="flex items-center justify-center gap-6 py-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{symptomCount}</span>
        <span className="text-xs text-muted-foreground">Symptome</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Utensils className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium">{mealCount}</span>
        <span className="text-xs text-muted-foreground">Mahlzeiten</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Pill className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">{medicationCount}</span>
        <span className="text-xs text-muted-foreground">Medikamente</span>
      </div>
    </div>
  );
}

// Entry List Item Component
function EntryListItem({
  entry,
  onClick
}: {
  entry: CombinedEntry;
  onClick: () => void;
}) {
  const dotColors = {
    symptom: 'bg-primary',
    mahlzeit: 'bg-amber-500',
    medikament: 'bg-blue-500',
  };

  return (
    <div
      className="flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${dotColors[entry.type]}`} />
      <span className="text-sm text-muted-foreground w-12">{entry.time}</span>
      <span className="text-sm flex-1 truncate">{entry.description}</span>
      {entry.rating && (
        <span className="text-xs text-muted-foreground">{entry.rating}</span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

// Add Entry Form Component
function AddEntryForm({
  type,
  onSuccess,
  onCancel
}: {
  type: 'symptom' | 'mahlzeit' | 'medikament';
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [symptomType, setSymptomType] = useState<string>('');
  const [symptomRating, setSymptomRating] = useState<string>('');
  const [symptomNotes, setSymptomNotes] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [mealPortion, setMealPortion] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [medicationDosage, setMedicationDosage] = useState('');
  const [medicationNotes, setMedicationNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Get current datetime in required format (YYYY-MM-DDTHH:MM)
    const now = new Date();
    const datetime = format(now, "yyyy-MM-dd'T'HH:mm");

    try {
      if (type === 'symptom') {
        if (!symptomType || !symptomRating) {
          setError('Bitte Symptomtyp und Bewertung auswählen');
          setSubmitting(false);
          return;
        }
        await LivingAppsService.createSymptomerfassungEntry({
          zeitpunkt_symptom: datetime,
          symptomtyp: symptomType as Symptomerfassung['fields']['symptomtyp'],
          bewertung_symptom: symptomRating as Symptomerfassung['fields']['bewertung_symptom'],
          notizen_einzelsymptom: symptomNotes || undefined,
        });
      } else if (type === 'mahlzeit') {
        if (!mealDescription) {
          setError('Bitte Mahlzeit beschreiben');
          setSubmitting(false);
          return;
        }
        await LivingAppsService.createEssgewohnheitenEntry({
          zeitpunkt_mahlzeit: datetime,
          mahlzeit_beschreibung: mealDescription,
          menge_portion: mealPortion || undefined,
          notizen_essen: mealNotes || undefined,
        });
      } else if (type === 'medikament') {
        if (!medicationName) {
          setError('Bitte Medikamentenname eingeben');
          setSubmitting(false);
          return;
        }
        await LivingAppsService.createMedikamenteneinnahmeEntry({
          zeitpunkt_einnahme: datetime,
          medikamentenname: medicationName,
          dosierung: medicationDosage || undefined,
          notizen_medikamente: medicationNotes || undefined,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {type === 'symptom' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="symptomType">Symptomtyp</Label>
            <Select value={symptomType} onValueChange={setSymptomType}>
              <SelectTrigger>
                <SelectValue placeholder="Symptom auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SYMPTOM_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="symptomRating">Bewertung (1 = sehr gut, 10 = sehr schlecht)</Label>
            <Select value={symptomRating} onValueChange={setSymptomRating}>
              <SelectTrigger>
                <SelectValue placeholder="Bewertung auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RATING_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="symptomNotes">Notizen (optional)</Label>
            <Textarea
              id="symptomNotes"
              value={symptomNotes}
              onChange={(e) => setSymptomNotes(e.target.value)}
              placeholder="Zusätzliche Notizen..."
            />
          </div>
        </>
      )}

      {type === 'mahlzeit' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="mealDescription">Mahlzeit / Nahrungsmittel</Label>
            <Textarea
              id="mealDescription"
              value={mealDescription}
              onChange={(e) => setMealDescription(e.target.value)}
              placeholder="Was haben Sie gegessen?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mealPortion">Menge / Portionsgröße (optional)</Label>
            <Input
              id="mealPortion"
              value={mealPortion}
              onChange={(e) => setMealPortion(e.target.value)}
              placeholder="z.B. 1 Portion, 200g, ..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mealNotes">Zusätzliche Notizen (optional)</Label>
            <Textarea
              id="mealNotes"
              value={mealNotes}
              onChange={(e) => setMealNotes(e.target.value)}
              placeholder="Zusätzliche Informationen..."
            />
          </div>
        </>
      )}

      {type === 'medikament' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="medicationName">Medikamentenname</Label>
            <Input
              id="medicationName"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              placeholder="Name des Medikaments"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicationDosage">Dosierung (optional)</Label>
            <Input
              id="medicationDosage"
              value={medicationDosage}
              onChange={(e) => setMedicationDosage(e.target.value)}
              placeholder="z.B. 500mg, 1 Tablette, ..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicationNotes">Notizen (optional)</Label>
            <Textarea
              id="medicationNotes"
              value={medicationNotes}
              onChange={(e) => setMedicationNotes(e.target.value)}
              placeholder="Zusätzliche Informationen..."
            />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting} className="flex-1">
          Abbrechen
        </Button>
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? 'Speichern...' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}

// Entry Type Selection Component
function EntryTypeSelection({ onSelect }: { onSelect: (type: 'symptom' | 'mahlzeit' | 'medikament') => void }) {
  return (
    <div className="space-y-3">
      <Button
        variant="default"
        className="w-full h-14 justify-start gap-3 text-left"
        onClick={() => onSelect('symptom')}
      >
        <Activity className="h-5 w-5" />
        <div>
          <div className="font-medium">Symptom erfassen</div>
          <div className="text-xs opacity-80">Energie, Stimmung, Beschwerden</div>
        </div>
      </Button>
      <Button
        variant="outline"
        className="w-full h-14 justify-start gap-3 text-left"
        onClick={() => onSelect('mahlzeit')}
      >
        <Utensils className="h-5 w-5" />
        <div>
          <div className="font-medium">Mahlzeit hinzufügen</div>
          <div className="text-xs text-muted-foreground">Was haben Sie gegessen?</div>
        </div>
      </Button>
      <Button
        variant="outline"
        className="w-full h-14 justify-start gap-3 text-left"
        onClick={() => onSelect('medikament')}
      >
        <Pill className="h-5 w-5" />
        <div>
          <div className="font-medium">Medikament eintragen</div>
          <div className="text-xs text-muted-foreground">Einnahme dokumentieren</div>
        </div>
      </Button>
    </div>
  );
}

// Entry Detail Sheet Component
function EntryDetailSheet({
  entry,
  open,
  onOpenChange,
  onDelete,
  onEdit
}: {
  entry: CombinedEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (entry: CombinedEntry) => Promise<void>;
  onEdit: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  if (!entry) return null;

  const typeLabels = {
    symptom: 'Symptom',
    mahlzeit: 'Mahlzeit',
    medikament: 'Medikament',
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(entry);
    setDeleting(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>{typeLabels[entry.type]}</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Zeitpunkt</div>
            <div className="font-medium">{entry.datetime ? format(parseISO(entry.datetime), 'PPPp', { locale: de }) : '--'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Beschreibung</div>
            <div className="font-medium">{entry.description}</div>
          </div>
          {entry.rating && (
            <div>
              <div className="text-sm text-muted-foreground">Bewertung</div>
              <div className="font-medium">{entry.rating}</div>
            </div>
          )}
          {entry.type === 'symptom' && (entry.record as Symptomerfassung).fields.notizen_einzelsymptom && (
            <div>
              <div className="text-sm text-muted-foreground">Notizen</div>
              <div className="font-medium">{(entry.record as Symptomerfassung).fields.notizen_einzelsymptom}</div>
            </div>
          )}
          {entry.type === 'mahlzeit' && (
            <>
              {(entry.record as Essgewohnheiten).fields.menge_portion && (
                <div>
                  <div className="text-sm text-muted-foreground">Menge</div>
                  <div className="font-medium">{(entry.record as Essgewohnheiten).fields.menge_portion}</div>
                </div>
              )}
              {(entry.record as Essgewohnheiten).fields.notizen_essen && (
                <div>
                  <div className="text-sm text-muted-foreground">Notizen</div>
                  <div className="font-medium">{(entry.record as Essgewohnheiten).fields.notizen_essen}</div>
                </div>
              )}
            </>
          )}
          {entry.type === 'medikament' && (
            <>
              {(entry.record as Medikamenteneinnahme).fields.dosierung && (
                <div>
                  <div className="text-sm text-muted-foreground">Dosierung</div>
                  <div className="font-medium">{(entry.record as Medikamenteneinnahme).fields.dosierung}</div>
                </div>
              )}
              {(entry.record as Medikamenteneinnahme).fields.notizen_medikamente && (
                <div>
                  <div className="text-sm text-muted-foreground">Notizen</div>
                  <div className="font-medium">{(entry.record as Medikamenteneinnahme).fields.notizen_medikamente}</div>
                </div>
              )}
            </>
          )}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1 gap-2" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              Bearbeiten
            </Button>
            <Button variant="destructive" className="flex-1 gap-2" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Löschen...' : 'Löschen'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-32 w-64 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTitle>Fehler beim Laden</AlertTitle>
            <AlertDescription className="mt-2">
              {error.message}
            </AlertDescription>
          </Alert>
          <Button onClick={onRetry} className="w-full mt-4">
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const [symptoms, setSymptoms] = useState<Symptomerfassung[]>([]);
  const [meals, setMeals] = useState<Essgewohnheiten[]>([]);
  const [medications, setMedications] = useState<Medikamenteneinnahme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Dialog/Sheet state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedEntryType, setSelectedEntryType] = useState<'symptom' | 'mahlzeit' | 'medikament' | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CombinedEntry | null>(null);
  const [entryDetailOpen, setEntryDetailOpen] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [symptomsData, mealsData, medicationsData] = await Promise.all([
        LivingAppsService.getSymptomerfassung(),
        LivingAppsService.getEssgewohnheiten(),
        LivingAppsService.getMedikamenteneinnahme(),
      ]);
      setSymptoms(symptomsData);
      setMeals(mealsData);
      setMedications(medicationsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate today's data
  const todaysSymptoms = useMemo(() =>
    symptoms.filter(s => isDateToday(s.fields.zeitpunkt_symptom)),
    [symptoms]
  );

  const todaysMeals = useMemo(() =>
    meals.filter(m => isDateToday(m.fields.zeitpunkt_mahlzeit)),
    [meals]
  );

  const todaysMedications = useMemo(() =>
    medications.filter(m => isDateToday(m.fields.zeitpunkt_einnahme)),
    [medications]
  );

  // Calculate wellness score (average of today's symptoms, inverted)
  const wellnessScore = useMemo(() => {
    if (todaysSymptoms.length === 0) return null;
    const scores = todaysSymptoms
      .map(s => getWellnessScore(s.fields.bewertung_symptom))
      .filter((s): s is number => s !== null);
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [todaysSymptoms]);

  // Calculate 7-day trend data
  const trendData = useMemo(() => {
    const days = [];
    const today = startOfDay(new Date());

    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLabel = format(day, 'EEE', { locale: de });

      const daySymptoms = symptoms.filter(s => {
        const symptomDate = s.fields.zeitpunkt_symptom?.split('T')[0];
        return symptomDate === dayStr;
      });

      const scores = daySymptoms
        .map(s => getWellnessScore(s.fields.bewertung_symptom))
        .filter((s): s is number => s !== null);

      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;

      days.push({
        day: dayLabel,
        date: dayStr,
        score: avgScore,
        fullDate: format(day, 'PPP', { locale: de }),
      });
    }

    return days;
  }, [symptoms]);

  // Calculate symptom type distribution for donut chart
  const symptomDistribution = useMemo(() => {
    const last7Days = symptoms.filter(s => {
      const date = s.fields.zeitpunkt_symptom?.split('T')[0];
      if (!date) return false;
      const symptomDate = parseISO(date);
      const weekAgo = subDays(new Date(), 7);
      return symptomDate >= weekAgo;
    });

    const counts: Record<string, number> = {};
    last7Days.forEach(s => {
      const type = s.fields.symptomtyp;
      if (type) {
        counts[type] = (counts[type] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([key, value]) => ({
      name: SYMPTOM_LABELS[key] || key,
      value,
      key,
    }));
  }, [symptoms]);

  // Combined entries for today (sorted by time, newest first)
  const combinedEntries = useMemo((): CombinedEntry[] => {
    const entries: CombinedEntry[] = [];

    todaysSymptoms.forEach(s => {
      const ratingValue = getRatingValue(s.fields.bewertung_symptom);
      entries.push({
        id: s.record_id,
        type: 'symptom',
        time: formatTime(s.fields.zeitpunkt_symptom),
        datetime: s.fields.zeitpunkt_symptom || '',
        description: SYMPTOM_LABELS[s.fields.symptomtyp || ''] || s.fields.symptomtyp || 'Symptom',
        rating: ratingValue !== null ? `${ratingValue} von 10` : undefined,
        record: s,
      });
    });

    todaysMeals.forEach(m => {
      entries.push({
        id: m.record_id,
        type: 'mahlzeit',
        time: formatTime(m.fields.zeitpunkt_mahlzeit),
        datetime: m.fields.zeitpunkt_mahlzeit || '',
        description: m.fields.mahlzeit_beschreibung || 'Mahlzeit',
        record: m,
      });
    });

    todaysMedications.forEach(m => {
      entries.push({
        id: m.record_id,
        type: 'medikament',
        time: formatTime(m.fields.zeitpunkt_einnahme),
        datetime: m.fields.zeitpunkt_einnahme || '',
        description: m.fields.medikamentenname || 'Medikament',
        record: m,
      });
    });

    // Sort by time descending
    return entries.sort((a, b) => b.datetime.localeCompare(a.datetime));
  }, [todaysSymptoms, todaysMeals, todaysMedications]);

  // Handle entry deletion
  const handleDeleteEntry = async (entry: CombinedEntry) => {
    try {
      if (entry.type === 'symptom') {
        await LivingAppsService.deleteSymptomerfassungEntry(entry.id);
      } else if (entry.type === 'mahlzeit') {
        await LivingAppsService.deleteEssgewohnheitenEntry(entry.id);
      } else if (entry.type === 'medikament') {
        await LivingAppsService.deleteMedikamenteneinnahmeEntry(entry.id);
      }
      await fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Handle add entry success
  const handleAddSuccess = () => {
    setSelectedEntryType(null);
    setAddDialogOpen(false);
    fetchData();
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  const today = new Date();
  const formattedDate = format(today, 'EEEE, d. MMMM', { locale: de });

  const CHART_COLORS = ['hsl(150 45% 45%)', 'hsl(40 80% 55%)', 'hsl(200 70% 50%)', 'hsl(10 60% 55%)'];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Header */}
        <header className="p-4 pt-6 animate-fade-up">
          <h1 className="text-xl font-semibold">Mein Tagebuch</h1>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </header>

        {/* Hero Section - Wellness Indicator */}
        <section className="px-4 py-6 animate-fade-up">
          <div className="flex flex-col items-center">
            <WellnessArc score={wellnessScore} size={240} />
            <p className="mt-2 text-lg font-medium" style={{ color: wellnessScore ? getWellnessColor(wellnessScore) : undefined }}>
              {wellnessScore !== null ? getWellnessMessage(wellnessScore) : 'Noch keine Daten'}
            </p>
            <p className="text-sm text-muted-foreground">
              {todaysSymptoms.length > 0
                ? `${todaysSymptoms.length} Symptom${todaysSymptoms.length > 1 ? 'e' : ''} heute erfasst`
                : 'Erfasse dein erstes Symptom'}
            </p>
          </div>
        </section>

        {/* Quick Stats Row */}
        <section className="px-4 animate-fade-up animation-delay-100">
          <QuickStats
            symptomCount={todaysSymptoms.length}
            mealCount={todaysMeals.length}
            medicationCount={todaysMedications.length}
          />
        </section>

        {/* Trend Chart */}
        <section className="px-4 py-6 animate-fade-up animation-delay-200">
          <h2 className="text-base font-medium mb-3">Letzte 7 Tage</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(150 45% 45%)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(150 45% 45%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(150 10% 45%)' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                          <p className="text-xs text-muted-foreground">{data.fullDate}</p>
                          <p className="font-medium">
                            {data.score !== null ? `${data.score.toFixed(1)} / 10` : 'Keine Daten'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(150 45% 45%)"
                  strokeWidth={2}
                  fill="url(#colorScore)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Today's Entries */}
        <section className="px-4 pb-24 animate-fade-up animation-delay-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium">Heutige Einträge</h2>
          </div>
          {combinedEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Noch keine Einträge heute.</p>
              <p className="text-sm mt-1">Starte mit deinem ersten Eintrag!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {combinedEntries.slice(0, 5).map(entry => (
                <EntryListItem
                  key={entry.id}
                  entry={entry}
                  onClick={() => {
                    setSelectedEntry(entry);
                    setEntryDetailOpen(true);
                  }}
                />
              ))}
              {combinedEntries.length > 5 && (
                <Button variant="ghost" className="w-full text-muted-foreground">
                  Alle {combinedEntries.length} Einträge anzeigen
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Fixed Bottom Action Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
          <Dialog open={addDialogOpen} onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) setSelectedEntryType(null);
          }}>
            <DialogTrigger asChild>
              <Button className="w-full h-14 text-base gap-2">
                <Plus className="h-5 w-5" />
                Eintrag hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedEntryType === 'symptom' && 'Symptom erfassen'}
                  {selectedEntryType === 'mahlzeit' && 'Mahlzeit hinzufügen'}
                  {selectedEntryType === 'medikament' && 'Medikament eintragen'}
                  {!selectedEntryType && 'Neuer Eintrag'}
                </DialogTitle>
              </DialogHeader>
              {selectedEntryType ? (
                <AddEntryForm
                  type={selectedEntryType}
                  onSuccess={handleAddSuccess}
                  onCancel={() => setSelectedEntryType(null)}
                />
              ) : (
                <EntryTypeSelection onSelect={setSelectedEntryType} />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Entry Detail Sheet */}
        <EntryDetailSheet
          entry={selectedEntry}
          open={entryDetailOpen}
          onOpenChange={setEntryDetailOpen}
          onDelete={handleDeleteEntry}
          onEdit={() => {
            // For simplicity, close and reopen add dialog
            setEntryDetailOpen(false);
          }}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-6xl mx-auto px-8 py-10">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 animate-fade-up">
            <div>
              <h1 className="text-2xl font-semibold">Mein Gesundheitstagebuch</h1>
              <p className="text-muted-foreground">{formattedDate}</p>
            </div>
          </header>

          {/* Main Content */}
          <div className="grid grid-cols-5 gap-8">
            {/* Left Column - 60% (3/5) */}
            <div className="col-span-3 space-y-8">
              {/* Hero Wellness Indicator */}
              <Card className="animate-fade-up">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <WellnessArc score={wellnessScore} size={280} />
                    <p className="mt-4 text-xl font-medium" style={{ color: wellnessScore ? getWellnessColor(wellnessScore) : undefined }}>
                      {wellnessScore !== null ? getWellnessMessage(wellnessScore) : 'Noch keine Daten'}
                    </p>
                    <p className="text-muted-foreground">
                      {todaysSymptoms.length > 0
                        ? `${todaysSymptoms.length} Symptom${todaysSymptoms.length > 1 ? 'e' : ''} heute erfasst`
                        : 'Erfasse dein erstes Symptom'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card className="animate-fade-up animation-delay-100">
                <CardHeader>
                  <CardTitle className="text-base">Letzte 7 Tage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorScoreDesktop" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(150 45% 45%)" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="hsl(150 45% 45%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: 'hsl(150 10% 45%)' }}
                        />
                        <YAxis
                          domain={[0, 10]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: 'hsl(150 10% 45%)' }}
                          width={30}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                                  <p className="text-sm text-muted-foreground">{data.fullDate}</p>
                                  <p className="text-lg font-medium">
                                    {data.score !== null ? `${data.score.toFixed(1)} / 10` : 'Keine Daten'}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(150 45% 45%)"
                          strokeWidth={2}
                          fill="url(#colorScoreDesktop)"
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Entries Table */}
              <Card className="animate-fade-up animation-delay-200">
                <CardHeader>
                  <CardTitle className="text-base">Heutige Einträge</CardTitle>
                </CardHeader>
                <CardContent>
                  {combinedEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Noch keine Einträge heute.</p>
                      <p className="text-sm mt-1">Starte mit deinem ersten Eintrag!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Zeit</TableHead>
                          <TableHead className="w-28">Typ</TableHead>
                          <TableHead>Beschreibung</TableHead>
                          <TableHead className="w-28">Bewertung</TableHead>
                          <TableHead className="w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {combinedEntries.slice(0, 10).map(entry => (
                          <TableRow
                            key={entry.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setEntryDetailOpen(true);
                            }}
                          >
                            <TableCell className="text-muted-foreground">{entry.time}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  entry.type === 'symptom' ? 'bg-primary' :
                                  entry.type === 'mahlzeit' ? 'bg-amber-500' : 'bg-blue-500'
                                }`} />
                                {entry.type === 'symptom' ? 'Symptom' :
                                 entry.type === 'mahlzeit' ? 'Mahlzeit' : 'Medikament'}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{entry.description}</TableCell>
                            <TableCell className="text-muted-foreground">{entry.rating || '-'}</TableCell>
                            <TableCell>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - 40% (2/5) */}
            <div className="col-span-2 space-y-6">
              {/* Quick Add Panel */}
              <Card className="animate-fade-up animation-delay-100">
                <CardHeader>
                  <CardTitle className="text-base">Schnelleintrag</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Dialog open={addDialogOpen} onOpenChange={(open) => {
                    setAddDialogOpen(open);
                    if (!open) setSelectedEntryType(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full h-12 justify-start gap-3"
                        onClick={() => setSelectedEntryType('symptom')}
                      >
                        <Activity className="h-5 w-5" />
                        Symptom erfassen
                      </Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-12 justify-start gap-3"
                        onClick={() => setSelectedEntryType('mahlzeit')}
                      >
                        <Utensils className="h-5 w-5" />
                        Mahlzeit hinzufügen
                      </Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-12 justify-start gap-3"
                        onClick={() => setSelectedEntryType('medikament')}
                      >
                        <Pill className="h-5 w-5" />
                        Medikament eintragen
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {selectedEntryType === 'symptom' && 'Symptom erfassen'}
                          {selectedEntryType === 'mahlzeit' && 'Mahlzeit hinzufügen'}
                          {selectedEntryType === 'medikament' && 'Medikament eintragen'}
                          {!selectedEntryType && 'Neuer Eintrag'}
                        </DialogTitle>
                      </DialogHeader>
                      {selectedEntryType ? (
                        <AddEntryForm
                          type={selectedEntryType}
                          onSuccess={handleAddSuccess}
                          onCancel={() => setSelectedEntryType(null)}
                        />
                      ) : (
                        <EntryTypeSelection onSelect={setSelectedEntryType} />
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Today's Overview Stats */}
              <Card className="animate-fade-up animation-delay-200">
                <CardHeader>
                  <CardTitle className="text-base">Tagesübersicht</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm">Symptome erfasst</span>
                    </div>
                    <span className="font-medium">{todaysSymptoms.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 flex items-center justify-center text-primary text-xs">Ø</div>
                      <span className="text-sm">Durchschnittliche Bewertung</span>
                    </div>
                    <span className="font-medium">
                      {wellnessScore !== null ? `${wellnessScore.toFixed(1)} / 10` : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Mahlzeiten</span>
                    </div>
                    <span className="font-medium">{todaysMeals.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Medikamente</span>
                    </div>
                    <span className="font-medium">{todaysMedications.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Symptom Distribution */}
              {symptomDistribution.length > 0 && (
                <Card className="animate-fade-up animation-delay-300">
                  <CardHeader>
                    <CardTitle className="text-base">Symptom-Verteilung (7 Tage)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={symptomDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                          >
                            {symptomDistribution.map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                                    <p className="font-medium">{data.name}</p>
                                    <p className="text-sm text-muted-foreground">{data.value} Einträge</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                      {symptomDistribution.map((item, index) => (
                        <div key={item.key} className="flex items-center gap-1.5 text-sm">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Entry Detail Sheet for Desktop */}
        <EntryDetailSheet
          entry={selectedEntry}
          open={entryDetailOpen}
          onOpenChange={setEntryDetailOpen}
          onDelete={handleDeleteEntry}
          onEdit={() => {
            setEntryDetailOpen(false);
          }}
        />
      </div>
    </div>
  );
}
