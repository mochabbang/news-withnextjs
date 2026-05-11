import axios from 'axios';
import { safeIsoDate } from '@/utilities/text';
import { NormalizedArticle } from '../normalize';

const CATEGORY_MAP: Record<string, string | null> = {
    all: null,
    business: 'business',
    entertainment: 'entertainment',
    health: 'health',
    science: 'science',
    sports: 'sports',
    technology: 'technology',
};

type NewsDataArticle = {
    title: string | null;
    link: string | null;
    description: string | null;
    content?: string | null;
    image_url: string | null;
    pubDate: string | null;
    source_id?: string | null;
    source_name?: string | null;
    creator?: string[] | null;
};

function normalizeArticles(articles: NewsDataArticle[]): NormalizedArticle[] {
    return articles
        .filter((a) => a.title && a.link)
        .map(
            (a): NormalizedArticle => ({
                author: a.creator?.[0] ?? null,
                title: a.title ?? '',
                description: a.description ?? null,
                url: a.link ?? '',
                urlToImage: a.image_url ?? null,
                publishedAt: safeIsoDate(a.pubDate),
                content: a.content ?? null,
                source: {
                    id: a.source_id ?? null,
                    name: a.source_name ?? a.source_id ?? 'NewsData.io',
                },
                provider: 'newsdata',
            }),
        );
}

async function requestNewsData(
    country: string,
    language: string,
    params: Record<string, string | number>,
) {
    const key = process.env.NEWSDATA_API_KEY;
    if (!key) throw new Error('NEWSDATA_API_KEY not set');

    const r = await axios.get('https://newsdata.io/api/1/latest', {
        params: {
            apikey: key,
            country,
            language,
            size: 10,
            removeduplicate: 1,
            ...params,
        },
        timeout: 8000,
    });

    return normalizeArticles(r.data.results ?? []);
}

export async function fetchNewsData(
    category: string,
    country = 'kr',
    language = 'ko',
): Promise<NormalizedArticle[]> {
    const cat = CATEGORY_MAP[category] ?? null;
    return requestNewsData(country, language, cat ? { category: cat } : {});
}

export async function searchNewsData(
    query: string,
    country = 'kr',
    language = 'ko',
): Promise<NormalizedArticle[]> {
    return requestNewsData(country, language, { q: query });
}
