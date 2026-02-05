// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Symptomerfassung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zeitpunkt_symptom?: string; // Format: YYYY-MM-DD oder ISO String
    symptomtyp?: 'raeuspern' | 'lymphschwellung' | 'energie' | 'stimmung';
    bewertung_symptom?: 'wert_1' | 'wert_2' | 'wert_3' | 'wert_4' | 'wert_5' | 'wert_6' | 'wert_7' | 'wert_8' | 'wert_9' | 'wert_10';
    notizen_einzelsymptom?: string;
  };
}

export interface Essgewohnheiten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zeitpunkt_mahlzeit?: string; // Format: YYYY-MM-DD oder ISO String
    mahlzeit_beschreibung?: string;
    menge_portion?: string;
    notizen_essen?: string;
  };
}

export interface Medikamenteneinnahme {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zeitpunkt_einnahme?: string; // Format: YYYY-MM-DD oder ISO String
    medikamentenname?: string;
    dosierung?: string;
    notizen_medikamente?: string;
  };
}

export const APP_IDS = {
  SYMPTOMERFASSUNG: '698492d20b8e72c3ec7888b3',
  ESSGEWOHNHEITEN: '698492d748e87e8fa3ef7811',
  MEDIKAMENTENEINNAHME: '698492d7ef06076761e9c8ff',
} as const;

// Helper Types for creating new records
export type CreateSymptomerfassung = Symptomerfassung['fields'];
export type CreateEssgewohnheiten = Essgewohnheiten['fields'];
export type CreateMedikamenteneinnahme = Medikamenteneinnahme['fields'];