import { ARTICLES, type Article } from './articles';

export const isArabic = (s: string) => /[؀-ۿ]/.test(s);

// Light normalisation so Arabic spelling variants still match (أ/إ/آ → ا, ة → ه, ى → ي).
export function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'what', 'how', 'do', 'i', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'can', 'this', 'my', 'me', 'it', 'does', 'why', 'when', 'ما', 'هو', 'هي', 'في', 'من', 'على', 'كيف', 'هل', 'عن', 'الى', 'إلى', 'لماذا', 'متى']);

export interface SearchHit {
  article: Article;
  score: number;
}

/** Keyword search over titles, keywords, summaries and bodies (English and Arabic). */
export function searchArticles(query: string, limit = 5): SearchHit[] {
  const q = normalise(query);
  if (!q) return [];
  const tokens = q.split(' ').filter((t) => t.length > 1 && !STOP.has(t));
  // Whole-word matching (a token also matches as a prefix when it has 4+ letters, e.g. "approv").
  const words = (s: string) => s.split(' ');
  const hit = (t: string, ws: string[]) => ws.some((w) => w === t || (t.length >= 4 && w.startsWith(t)) || (w.length >= 4 && t.startsWith(w)));
  const padded = ` ${q} `;
  const hits = ARTICLES.map((a) => {
    const title = words(normalise(`${a.title} ${a.titleAr}`));
    const kws = a.keywords.map(normalise);
    const kwWords = kws.flatMap(words);
    const text = words(normalise(`${a.summary} ${a.summaryAr} ${a.body.join(' ')}`));
    let score = 0;
    let anchored = false;
    for (const kw of kws) {
      if (kw.length > 2 && padded.includes(` ${kw} `)) {
        score += kw.includes(' ') ? 6 : 4;
        anchored = true;
      }
    }
    for (const t of tokens) {
      if (hit(t, title)) {
        score += 3;
        anchored = true;
      }
      if (hit(t, kwWords)) {
        score += 2;
        anchored = true;
      }
      if (hit(t, text)) score += 1;
    }
    return { article: a, score: anchored ? score : 0 };
  })
    .filter((h) => h.score > 0)
    .sort((x, y) => y.score - x.score);
  return hits.slice(0, limit);
}
