export interface Lead {
  id: string;
  name: string;
  query: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewsCount: number;
  googleUrl: string;
  language: string;
  timestamp: string;
  email?: string;
  // Social media
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  // AI score & notes if enriched
  aiScore?: 'A' | 'B' | 'C' | 'Unrated';
  aiScoreExplanation?: string;
  aiSuggestedApproach?: string;
  coldEmailDraft?: string;
}

export interface ScraperConfig {
  queries: string[];
  minDelay: number; // in ms
  maxDelay: number; // in ms
  maxResultsPerQuery: number;
  hlLanguage: string; // hl param (e.g. 'en', 'es', 'fr', 'de')
  glRegion: string;    // gl param (e.g. 'US', 'ES', 'FR', 'DE')
  customAutoUpdateUrl: string;
  currentVersion: string;
  proxyList: string[]; // IP:Port or User:Pass@IP:Port strings
  rotateProxyPerNQueriesOrPages: number;
  fieldsToExtract: {
    name: boolean;
    address: boolean;
    phone: boolean;
    website: boolean;
    email: boolean;
    rating: boolean;
    reviewsCount: boolean;
    googleUrl: boolean;
  };
}

export interface CustomFormatConfig {
  delimiter: ',' | ';' | '|' | '\\t';
  addColumnQuote: boolean;
  headerCasing: 'original' | 'upper' | 'lower' | 'camel' | 'title';
  customHeaders: { [key: string]: string };
}

export interface ScraperLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'proxy' | 'scraper';
  message: string;
}
