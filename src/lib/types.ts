export enum GraphCMSStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
}

export interface Artist {
  documentInStages: Array<{ stage: GraphCMSStatus }>;
  stage: GraphCMSStatus;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  metaDescription: string;
  metaKeywords: string;
  repertoire: string;
  price: string;
  priceVenue: string;
  priceFestival: string;
  info: string;
  youTube: string[];
  references: string;
  tags: { tag: string; slug: string }[];
  banner: { handle: string };
  images: { handle: string }[];
  thumbnail?: { handle: string };
  categories: { slug: string; name: string }[];
}

export interface Category {
  slug: string;
  name: string;
  artists: Artist[];
}
