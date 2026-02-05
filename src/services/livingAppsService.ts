// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Symptomerfassung, Essgewohnheiten, Medikamenteneinnahme } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- SYMPTOMERFASSUNG ---
  static async getSymptomerfassung(): Promise<Symptomerfassung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SYMPTOMERFASSUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getSymptomerfassungEntry(id: string): Promise<Symptomerfassung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SYMPTOMERFASSUNG}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createSymptomerfassungEntry(fields: Symptomerfassung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SYMPTOMERFASSUNG}/records`, { fields });
  }
  static async updateSymptomerfassungEntry(id: string, fields: Partial<Symptomerfassung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SYMPTOMERFASSUNG}/records/${id}`, { fields });
  }
  static async deleteSymptomerfassungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SYMPTOMERFASSUNG}/records/${id}`);
  }

  // --- ESSGEWOHNHEITEN ---
  static async getEssgewohnheiten(): Promise<Essgewohnheiten[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ESSGEWOHNHEITEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getEssgewohnheitenEntry(id: string): Promise<Essgewohnheiten | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ESSGEWOHNHEITEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createEssgewohnheitenEntry(fields: Essgewohnheiten['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ESSGEWOHNHEITEN}/records`, { fields });
  }
  static async updateEssgewohnheitenEntry(id: string, fields: Partial<Essgewohnheiten['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ESSGEWOHNHEITEN}/records/${id}`, { fields });
  }
  static async deleteEssgewohnheitenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ESSGEWOHNHEITEN}/records/${id}`);
  }

  // --- MEDIKAMENTENEINNAHME ---
  static async getMedikamenteneinnahme(): Promise<Medikamenteneinnahme[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.MEDIKAMENTENEINNAHME}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getMedikamenteneinnahmeEntry(id: string): Promise<Medikamenteneinnahme | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.MEDIKAMENTENEINNAHME}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createMedikamenteneinnahmeEntry(fields: Medikamenteneinnahme['fields']) {
    return callApi('POST', `/apps/${APP_IDS.MEDIKAMENTENEINNAHME}/records`, { fields });
  }
  static async updateMedikamenteneinnahmeEntry(id: string, fields: Partial<Medikamenteneinnahme['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.MEDIKAMENTENEINNAHME}/records/${id}`, { fields });
  }
  static async deleteMedikamenteneinnahmeEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.MEDIKAMENTENEINNAHME}/records/${id}`);
  }

}