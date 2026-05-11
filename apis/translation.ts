import axios from 'axios';
import { NormalizedArticle } from './normalize';

type TranslateProvider = 'none' | 'mymemory' | 'libretranslate';

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

async function translateText(text: string | null, sourceLanguage: string): Promise<string | null> {
    if (!text?.trim() || sourceLanguage === 'ko') return text;

    const provider = getTranslateProvider();
    if (provider === 'none') return text;

    try {
        if (provider === 'libretranslate') {
            return await translateWithLibreTranslate(text, sourceLanguage);
        }

        return await translateWithMyMemory(text, sourceLanguage);
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
        const title = await translateText(article.title, sourceLanguage);
        const description = await translateText(article.description, sourceLanguage);

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
