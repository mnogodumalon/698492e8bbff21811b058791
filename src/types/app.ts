// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Medikamenteneinnahme {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zeitpunkt_einnahme?: string; // Format: YYYY-MM-DD oder ISO String
    medikamentenname?: 'ibuprofen_400mg' | 'vitamin_c_500mg' | 'vitamin_d_2000' | 'vitamin_d_4000' | 'bitterliebe_1_kapsel' | 'pascoflorin_sensitiv';
    notizen_medikamente?: string;
  };
}

export interface TaeglicheErfassung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zeitpunkt_eintrag?: string; // Format: YYYY-MM-DD oder ISO String
    mahlzeit_beschreibung_gesamt?: string;
    menge_portion_gesamt?: string;
    notizen_essen_gesamt?: string;
    symptomtyp_gesamt?: 'raeuspern' | 'lymphschwellung' | 'energie' | 'stimmung';
    bewertung_symptom_gesamt?: string;
    notizen_symptom_gesamt?: string;
    medikamentenname_freitext_gesamt?: string;
    dosierung_gesamt?: string;
    notizen_medikament_gesamt?: string;
  };
}

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

export const APP_IDS = {
  MEDIKAMENTENEINNAHME: '698492d7ef06076761e9c8ff',
  TAEGLICHE_ERFASSUNG: '69858612b7a952d0ddc01987',
  SYMPTOMERFASSUNG: '698492d20b8e72c3ec7888b3',
  ESSGEWOHNHEITEN: '698492d748e87e8fa3ef7811',
} as const;

// Helper Types for creating new records
export type CreateMedikamenteneinnahme = Medikamenteneinnahme['fields'];
export type CreateTaeglicheErfassung = TaeglicheErfassung['fields'];
export type CreateSymptomerfassung = Symptomerfassung['fields'];
export type CreateEssgewohnheiten = Essgewohnheiten['fields'];