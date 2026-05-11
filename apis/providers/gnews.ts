import axios from 'axios';
import { NormalizedArticle } from '../normalize';

const CATEGORY_MAP: Record<string, string> = {
    all: 'general',
    business: 'business',
    entertainment: 'entertainment',
    health: 'health',
    science: 'science',
    sports: 'sports',
    technology: 'technology',
};

type GNewsArticle = {
    title: string;
    description: string | null;
    content?: string | null;
    url: string;
    image: string | null;
    publishedAt: string;
    source: { name?: string | null };
};

function normalizeArticles(articles: GNewsArticle[]): NormalizedArticle[] {
    return articles
        .filter((a) => a.title && a.url)
        .map(
            (a): NormalizedArticle => ({
                author: null,
                title: a.title,
                description: a.description ?? null,
                url: a.url,
                urlToImage: a.image ?? null,
                publishedAt: a.publishedAt,
                content: a.content ?? null,
                source: {
                    name: a.source?.name ?? 'GNews',
                },
                provider: 'gnews',
            }),
        );
}

export async function fetchGNews(
    category: string,
    country = 'kr',
    language = 'ko',
): Promise<NormalizedArticle[]> {
    const key = process.env.GNEWS_API_KEY;
    if (!key) throw new Error('GNEWS_API_KEY not set');

    const cat = CATEGORY_MAP[category] ?? 'general';

    const r = await axios.get('https://gnews.io/api/v4/top-headlines', {
        params: {
            lang: language,
            country,
            category: cat,
            max: 10,
            apikey: key,
        },
        timeout: 8000,
    });

    return normalizeArticles(r.data.articles ?? []);
}

export async function searchGNews(
    query: string,
    country = 'kr',
    language = 'ko',
): Promise<NormalizedArticle[]> {
    const key = process.env.GNEWS_API_KEY;
    if (!key) throw new Error('GNEWS_API_KEY not set');

    const r = await axios.get('https://gnews.io/api/v4/search', {
        params: {
            q: query,
            lang: language,
            country,
            max: 10,
            apikey: key,
        },
        timeout: 8000,
    });

    return normalizeArticles(r.data.articles ?? []);
}
