import { Store } from '@tauri-apps/plugin-store';

export interface AppSettings {
  graphqlEndpoint: string;
  graphqlToken: string;
  imageBaseUrl: string;
  userName: string;
  userEmail: string;
  theme: 'light' | 'dark' | 'system';
}

const STORE_PATH = 'settings.json';

const defaultSettings: AppSettings = {
  graphqlEndpoint: '',
  graphqlToken: '',
  imageBaseUrl: '',
  userName: '',
  userEmail: '',
  theme: 'system',
};

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load(STORE_PATH);
  }
  return store;
}

export async function getSettings(): Promise<AppSettings> {
  const s = await getStore();
  const settings: Partial<AppSettings> = {};

  for (const key of Object.keys(defaultSettings) as (keyof AppSettings)[]) {
    const value = await s.get<AppSettings[typeof key]>(key);
    if (value !== null && value !== undefined) {
      (settings as Record<string, unknown>)[key] = value;
    }
  }

  return { ...defaultSettings, ...settings };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const s = await getStore();
  for (const [key, value] of Object.entries(settings)) {
    await s.set(key, value);
  }
  await s.save();
}

const requiredFields: (keyof AppSettings)[] = ['graphqlEndpoint', 'graphqlToken', 'imageBaseUrl', 'userName', 'userEmail'];

export function getMissingSettings(settings: AppSettings): string[] {
  return requiredFields.filter((key) => !settings[key]);
}

