import axios from 'axios';
import { safeIsoDate, sourceNameFromUrl } from '@/utilities/text';
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

type CurrentsArticle = {
    title: string;
    description: string | null;
    url: string;
    image: string | null;
    published: string;
    author?: string | null;
};

function normalizeArticles(articles: CurrentsArticle[]): NormalizedArticle[] {
    return articles
        .filter((a) => a.title && a.url)
        .map(
            (a): NormalizedArticle => ({
                author: a.author ?? null,
                title: a.title,
                description: a.description ?? null,
                url: a.url,
                urlToImage: a.image ?? null,
                publishedAt: safeIsoDate(a.published),
                content: null,
                source: {
                    name: sourceNameFromUrl(a.url, 'Currents'),
                },
                provider: 'currents',
            }),
        );
}

async function requestCurrents(
    endpoint: 'latest-news' | 'search',
    country: string,
    language: string,
    params: Record<string, string | number>,
) {
    const key = process.env.CURRENTS_API_KEY;
    if (!key) throw new Error('CURRENTS_API_KEY not set');

    const r = await axios.get(`https://api.currentsapi.services/v1/${endpoint}`, {
        params: {
            apiKey: key,
            language,
            country: country.toUpperCase(),
            page_size: 30,
            ...params,
        },
        timeout: 8000,
    });

    return normalizeArticles(r.data.news ?? []);
}

export async function fetchCurrents(
    category: string,
    country = 'kr',
    language = 'ko',
): Promise<NormalizedArticle[]> {
    const cat = CATEGORY_MAP[category] ?? null;
    return requestCurrents('latest-news', country, language, cat ? { category: cat } : {});
}

export async function searchCurrents(
    query: string,
    country = 'kr',
    language = 'ko',
): Promise<NormalizedArticle[]> {
    return requestCurrents('search', country, language, { keywords: query });
}
