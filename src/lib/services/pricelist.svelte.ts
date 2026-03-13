import { Store } from '@tauri-apps/plugin-store';
import type { Artist } from '../types';

const STORE_PATH = 'pricelist.json';
const STORE_KEY = 'artists';

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load(STORE_PATH);
  }
  return store;
}

async function persist(artists: Artist[]): Promise<void> {
  const s = await getStore();
  await s.set(STORE_KEY, artists);
  await s.save();
}

let artists = $state<Artist[]>([]);

export function getPricelistArtists(): Artist[] {
  return artists;
}

export async function loadPricelist(): Promise<void> {
  const s = await getStore();
  const stored = await s.get<Artist[]>(STORE_KEY);
  artists = stored ?? [];
}

export async function setArtists(newList: Artist[]): Promise<void> {
  artists = newList;
  await persist(artists);
}

export async function addArtist(artist: Artist): Promise<void> {
  if (!artist || artists.find((a) => a.slug === artist.slug)) return;
  artists = [...artists, { ...artist }];
  await persist(artists);
}

export async function addArtists(newArtists: Artist[]): Promise<void> {
  const sorted = sortByName(newArtists);
  const filtered = sorted.filter(
    (a) => !artists.find((b) => b.slug === a.slug),
  );
  artists = [...artists, ...filtered];
  await persist(artists);
}

export async function removeArtist(artist: Artist): Promise<void> {
  artists = artists.filter((a) => a.slug !== artist.slug);
  await persist(artists);
}

export async function removeAll(): Promise<void> {
  artists = [];
  await persist(artists);
}

export async function moveArtist(
  fromIndex: number,
  toIndex: number,
): Promise<void> {
  if (fromIndex === toIndex) return;
  const list = [...artists];
  const [item] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, item);
  artists = list;
  await persist(artists);
}

export async function updateArtist(
  slug: string,
  data: Partial<Artist>,
): Promise<void> {
  artists = artists.map((a) => (a.slug === slug ? { ...a, ...data } : a));
  await persist(artists);
}

export async function sortAllByName(desc: boolean = false): Promise<void> {
  artists = sortByName(artists, desc);
  await persist(artists);
}

function sortByName(list: Artist[], desc: boolean = false): Artist[] {
  const fixName = (name: string) =>
    name.substring(0, 4).toLowerCase() === 'the '
      ? name.substring(4)
      : name;

  const sorted = [...list].sort((a, b) =>
    fixName(a.name).localeCompare(fixName(b.name)),
  );
  return desc ? sorted.reverse() : sorted;
}
