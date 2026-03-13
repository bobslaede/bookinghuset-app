import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateStatus {
  available: boolean;
  version?: string;
  error?: string;
}

export async function checkForUpdate(): Promise<UpdateStatus> {
  try {
    const update = await check();
    if (update) {
      return { available: true, version: update.version };
    }
    return { available: false };
  } catch (e) {
    return { available: false, error: e instanceof Error ? e.message : 'Update check failed' };
  }
}

export async function installUpdate(): Promise<void> {
  const update = await check();
  if (!update) return;

  await update.downloadAndInstall();
  await relaunch();
}
