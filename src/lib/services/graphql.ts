import { getSettings } from './settings';
import { GraphCMSStatus, type Artist, type Category } from '../types';

export interface GraphCmsImageOptions {
  width?: number;
  height?: number;
  fit?: 'clip' | 'crop' | 'scale' | 'max';
  align?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'faces';
  format?: 'webp' | 'jpg' | 'png' | 'gif' | 'avif';
  quality?: number;
}

export function resizeImage(
  handle: string,
  opts: GraphCmsImageOptions,
  baseUrl: string,
): string {
  const { height, width, fit, align, format = 'webp', quality = 100 } = opts;

  const parts: string[] = [];
  if (width) parts.push(`width:${width}`);
  if (height) parts.push(`height:${height}`);
  if (fit) parts.push(`fit:${fit}`);
  if (align) parts.push(`align:${align}`);

  const transform = `resize=${parts.join(',')}`;
  const output = `output=format:${format}`;
  const qualityProp = `quality=value:${quality}`;

  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  return base + [output, qualityProp, transform, handle]
    .filter(Boolean)
    .join('/');
}

const ARTIST_FRAGMENT = `
fragment ArtistFragment on Artist {
  documentInStages(includeCurrent: true, stages: [PUBLISHED, DRAFT]) {
    stage
  }
  stage
  slug
  name
  subtitle
  description
  metaDescription
  metaKeywords
  repertoire
  info
  youTube
  references
  price
  priceVenue
  priceFestival
  tags { tag, slug }
  banner { handle }
  images { handle }
  thumbnail { handle }
  contact { name }
  categories { slug, name }
}`;

const ARTISTS_QUERY = `
query {
  artists(first: 1000, stage: DRAFT) {
    ...ArtistFragment
  }
}
${ARTIST_FRAGMENT}`;

const CATEGORIES_QUERY = `
query {
  categories(first: 1000, stage: DRAFT) {
    documentInStages(includeCurrent: true, stages: [PUBLISHED, DRAFT]) {
      stage
    }
    ...CategoryFragment
    children {
      ...CategoryFragment
      children {
        ...CategoryFragment
      }
    }
  }
}

fragment CategoryFragment on Category {
  slug
  name
  artists {
    ...ArtistFragment
  }
}
${ARTIST_FRAGMENT}`;

function mapArtistsDraftStatus(artists: Artist[]): Artist[] {
  return artists.map((artist) => {
    const stage = artist.documentInStages.find(
      (s) => s.stage === GraphCMSStatus.PUBLISHED,
    )
      ? GraphCMSStatus.PUBLISHED
      : GraphCMSStatus.DRAFT;
    return { ...artist, stage };
  });
}

async function graphqlFetch<T>(query: string): Promise<T> {
  const settings = await getSettings();
  const { graphqlEndpoint, graphqlToken } = settings;

  if (!graphqlToken) {
    throw new Error('GraphQL token not configured. Please set it in Settings.');
  }

  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${graphqlToken}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join(', '));
  }

  return json.data;
}

export async function fetchArtists(): Promise<Artist[]> {
  const data = await graphqlFetch<{ artists: Artist[] }>(ARTISTS_QUERY);
  return mapArtistsDraftStatus(data.artists);
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await graphqlFetch<{ categories: Category[] }>(CATEGORIES_QUERY);
  return data.categories
    .filter((category) => category.artists.length > 0)
    .map((category) => ({
      ...category,
      artists: mapArtistsDraftStatus(category.artists),
    }));
}
