// @ts-ignore
import { getIndexData, loadAlphabet } from 'worldalphabets';

export interface IndexEntry {
  language: string;
  'language-name': string;
  scripts?: string[];
  [key: string]: any;
}

export interface Alphabet {
  uppercase: string[];
  lowercase: string[];
  alphabetical: string[];
  frequency?: Record<string, number>;
}

export interface LanguageOption {
  code: string;
  name: string;
  script?: string;
}

export class AlphabetManager {
  private languages: LanguageOption[] = [];
  private initialized = false;
  private currentAlphabet: Alphabet | null = null;

  constructor() {}

  public async init() {
    if (this.initialized) return;

    try {
      const index = await getIndexData();
      console.log('AlphabetManager: Loaded Index Data', index);

      // Filter languages
      // We want to avoid very large character sets (Logographic scripts mostly)
      this.languages = index
        .filter((entry: IndexEntry) => {
          const scripts = entry.scripts || [];
          const isLarge = scripts.some((s: string) => ['Hant', 'Hans', 'Jpan', 'Kore'].includes(s));
          return !isLarge;
        })
        .map((entry: IndexEntry) => ({
          code: entry.language,
          name: entry['language-name'] || entry.language,
          script: entry.scripts?.[0] // Default to first script
        }))
        .sort((a: LanguageOption, b: LanguageOption) => (a.name || '').localeCompare(b.name || ''));

      this.initialized = true;
    } catch (e) {
      console.error("Failed to load language index", e);
      // Fallback
      this.languages = [{ code: 'en', name: 'English', script: 'Latn' }];
    }
  }

  public getLanguages(): LanguageOption[] {
    return this.languages;
  }

  public async loadLanguage(code: string, script?: string): Promise<Alphabet | null> {
    try {
        const alphabet = await loadAlphabet(code, script);
        this.currentAlphabet = alphabet;
        return alphabet;
    } catch (e) {
        console.error(`Failed to load alphabet for ${code}`, e);
        return null;
    }
  }

  public getCharacters(mode: 'alphabetical' | 'frequency' = 'alphabetical'): string[] {
    if (!this.currentAlphabet) return [];

    // Use uppercase by default for the grid
    let chars = [...this.currentAlphabet.uppercase];

    // Fallback if uppercase is empty (some scripts might not have case)
    if (chars.length === 0) {
        chars = [...this.currentAlphabet.alphabetical];
    }

    if (mode === 'frequency') {
        const freqMap = this.currentAlphabet.frequency || {};

        // Create a map of char -> frequency
        // Note: frequency keys are lowercase.
        // We need to map our chars to lowercase to lookup frequency.

        chars.sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            const freqA = freqMap[aLower] || 0;
            const freqB = freqMap[bLower] || 0;
            return freqB - freqA; // Descending frequency
        });
    }

    return chars;
  }
}
