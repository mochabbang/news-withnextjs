import axios from 'axios';
import { NormalizedArticle } from './normalize';

type TranslateProvider = 'none' | 'mymemory' | 'libretranslate';

const CACHE_MAX = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry = { value: string; createdAt: number };

const cache = new Map<string, CacheEntry>();

function cacheKey(text: string, sourceLanguage: string): string {
    return `${sourceLanguage}::${text}`;
}

function readCache(key: string): string | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.value;
}

function writeCache(key: string, value: string): void {
    if (cache.size >= CACHE_MAX) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
    }
    cache.set(key, { value, createdAt: Date.now() });
}

export function __resetTranslationCacheForTests(): void {
    cache.clear();
}

function getTranslateProvider(): TranslateProvider {
    const configured = process.env.NEWS_TRANSLATE_PROVIDER as TranslateProvider | undefined;
    if (configured === 'mymemory' || configured === 'libretranslate' || configured === 'none') {
        return configured;
    }

    if (process.env.LIBRETRANSLATE_URL) return 'libretranslate';
    if (process.env.MYMEMORY_EMAIL) return 'mymemory';

    return 'none';
}

function truncateForProvider(text: string) {
    return text.length > 450 ? `${text.slice(0, 447)}...` : text;
}

async function translateWithMyMemory(text: string, sourceLanguage: string): Promise<string> {
    const r = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
            q: truncateForProvider(text),
            langpair: `${sourceLanguage}|ko`,
            de: process.env.MYMEMORY_EMAIL,
        },
        timeout: 5000,
    });

    return r.data.responseData?.translatedText ?? text;
}

async function translateWithLibreTranslate(
    text: string,
    sourceLanguage: string,
): Promise<string> {
    const baseUrl = process.env.LIBRETRANSLATE_URL;
    if (!baseUrl) throw new Error('LIBRETRANSLATE_URL not set');

    const r = await axios.post(`${baseUrl.replace(/\/$/, '')}/translate`, {
        q: text,
        source: sourceLanguage,
        target: 'ko',
        format: 'text',
        api_key: process.env.LIBRETRANSLATE_API_KEY,
    }, {
        timeout: 5000,
    });

    return r.data.translatedText ?? text;
}

export async function translateArticleText<T extends string | null>(
    text: T,
    sourceLanguage: string,
): Promise<T> {
    if (text === null) return text;
    if (!text.trim() || sourceLanguage === 'ko') return text;

    const provider = getTranslateProvider();
    if (provider === 'none') return text;

    const key = cacheKey(text, sourceLanguage);
    const cached = readCache(key);
    if (cached !== null) return cached as T;

    try {
        const translated =
            provider === 'libretranslate'
                ? await translateWithLibreTranslate(text, sourceLanguage)
                : await translateWithMyMemory(text, sourceLanguage);

        writeCache(key, translated);
        return translated as T;
    } catch {
        return text;
    }
}

export async function translateArticlesToKorean(
    articles: NormalizedArticle[],
    sourceLanguage: string,
): Promise<NormalizedArticle[]> {
    if (sourceLanguage === 'ko' || getTranslateProvider() === 'none') return articles;

    const maxArticles = Number(process.env.TRANSLATE_MAX_ARTICLES ?? 5);
    const translated: NormalizedArticle[] = [];

    for (const article of articles.slice(0, maxArticles)) {
        const title = await translateArticleText(article.title, sourceLanguage);
        const description = await translateArticleText(article.description, sourceLanguage);

        translated.push({
            ...article,
            title: title ?? article.title,
            description,
            originalTitle: article.title,
            originalDescription: article.description,
            translated: title !== article.title || description !== article.description,
        });
    }

    return [...translated, ...articles.slice(maxArticles)];
}
