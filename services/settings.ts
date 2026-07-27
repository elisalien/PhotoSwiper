import AsyncStorage from '@react-native-async-storage/async-storage';

const FOLDERS_KEY = '@photoswiper/folders';

export const DEFAULT_FOLDERS = ['Favoris', 'Voyage', 'À imprimer'];

export async function getFolders(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FOLDERS_KEY);
    if (!raw) return [...DEFAULT_FOLDERS];
    const parsed = JSON.parse(raw) as string[];
    return parsed.length > 0 ? parsed : [...DEFAULT_FOLDERS];
  } catch {
    return [...DEFAULT_FOLDERS];
  }
}

export async function saveFolders(folders: string[]): Promise<void> {
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export async function addFolder(name: string): Promise<string[]> {
  const trimmed = name.trim();
  if (!trimmed) return getFolders();
  const folders = await getFolders();
  if (folders.includes(trimmed)) return folders;
  const updated = [...folders, trimmed];
  await saveFolders(updated);
  return updated;
}

export async function removeFolder(name: string): Promise<string[]> {
  const folders = (await getFolders()).filter((f) => f !== name);
  await saveFolders(folders);
  return folders;
}

export async function renameFolder(oldName: string, newName: string): Promise<string[]> {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return getFolders();
  const folders = await getFolders();
  const updated = folders.map((f) => (f === oldName ? trimmed : f));
  await saveFolders(updated);
  return updated;
}
