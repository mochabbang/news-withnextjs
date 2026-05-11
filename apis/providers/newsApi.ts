import axios from 'axios';
import { NormalizedArticle } from '../normalize';
import { NewsCountry } from '../countries';

const CATEGORY_MAP: Record<string, string> = {
    all: 'general',
    business: 'business',
    entertainment: 'entertainment',
    health: 'health',
    science: 'science',
    sports: 'sports',
    technology: 'technology',
};

const CATEGORY_QUERY: Record<string, string> = {
    all: 'news',
    business: 'business',
    entertainment: 'entertainment',
    health: 'health',
    science: 'science',
    sports: 'sports',
    technology: 'technology',
};

function normalizeArticles(articles: NewsApiArticle[]): NormalizedArticle[] {
    return articles
        .filter((a) => a.title && a.url)
        .map(
            (a): NormalizedArticle => ({
                author: a.author ?? null,
                title: a.title,
                description: a.description ?? null,
                url: a.url,
                urlToImage: a.urlToImage ?? null,
                publishedAt: a.publishedAt,
                content: a.content ?? null,
                source: {
                    id: a.source?.id ?? null,
                    name: a.source?.name ?? 'NewsAPI',
                },
                provider: 'newsapi',
            }),
        );
}

type NewsApiArticle = {
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
    source: { id?: string | null; name?: string | null } | null;
};

export async function fetchNewsAPI(
    category: string,
    country: NewsCountry = 'kr',
): Promise<NormalizedArticle[]> {
    const key = process.env.NEWS_API_KEY;
    if (!key) throw new Error('NEWS_API_KEY not set');

    const cat = CATEGORY_MAP[category] ?? 'general';
    const params: Record<string, string | number> = {
        country,
        pageSize: 30,
        apiKey: key,
    };

    if (cat !== 'general') params.category = cat;

    const r = await axios.get('https://newsapi.org/v2/top-headlines', {
        params,
        timeout: 8000,
    });

    return normalizeArticles(r.data.articles ?? []);
}

export async function fetchNewsAPIEverything(
    category: string,
    language: string,
): Promise<NormalizedArticle[]> {
    const key = process.env.NEWS_API_KEY;
    if (!key) throw new Error('NEWS_API_KEY not set');

    const q = CATEGORY_QUERY[category] ?? 'news';

    const r = await axios.get('https://newsapi.org/v2/everything', {
        params: {
            q,
            language,
            sortBy: 'publishedAt',
            pageSize: 30,
            apiKey: key,
        },
        timeout: 8000,
    });

    return normalizeArticles(r.data.articles ?? []);
}

export async function searchNewsAPI(
    query: string,
    country: NewsCountry = 'us',
): Promise<NormalizedArticle[]> {
    const key = process.env.NEWS_API_KEY;
    if (!key) throw new Error('NEWS_API_KEY not set');

    const r = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
            q: query,
            country,
            pageSize: 20,
            apiKey: key,
        },
        timeout: 8000,
    });

    return normalizeArticles(r.data.articles ?? []);
}

export async function searchNewsAPIEverything(
    query: string,
    language: string,
): Promise<NormalizedArticle[]> {
    const key = process.env.NEWS_API_KEY;
    if (!key) throw new Error('NEWS_API_KEY not set');

    const r = await axios.get('https://newsapi.org/v2/everything', {
        params: {
            q: query,
            language,
            sortBy: 'publishedAt',
            pageSize: 20,
            apiKey: key,
        },
        timeout: 8000,
    });

    return normalizeArticles(r.data.articles ?? []);
}
