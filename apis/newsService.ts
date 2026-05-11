import { Article } from '@/types/Article';
import {
    getCountryLanguage,
    NewsCountry,
    normalizeNewsCountry,
} from './countries';
import { deduplicateByTitle, NormalizedArticle, toNewsTopHeadLine } from './normalize';
import { fetchCurrents, searchCurrents } from './providers/currents';
import { fetchGNews, searchGNews } from './providers/gnews';
import { fetchKoreanRss, searchKoreanRss } from './providers/koreanRss';
import {
    fetchNewsAPI,
    fetchNewsAPIEverything,
    searchNewsAPI,
    searchNewsAPIEverything,
} from './providers/newsApi';
import { fetchNewsData, searchNewsData } from './providers/newsData';
import { fetchNaverNews } from './providers/naver';
import { translateArticlesToKorean } from './translation';

type ProviderFetcher = () => Promise<NormalizedArticle[]>;

export { NEWS_COUNTRIES, normalizeNewsCountry } from './countries';

async function firstWorkingProvider(fetchers: ProviderFetcher[]): Promise<NormalizedArticle[]> {
    const errors: string[] = [];

    for (const fetcher of fetchers) {
        try {
            const articles = deduplicateByTitle(await fetcher());
            if (articles.length > 0) return articles;
        } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown provider error');
        }
    }

    throw new Error(errors[0] ?? 'No news provider returned articles');
}

async function fetchKoreanTopNews(category: string) {
    return firstWorkingProvider([
        () => fetchKoreanRss(category),
        () => fetchNaverNews(category),
        () => fetchGNews(category, 'kr', 'ko'),
        () => fetchNewsData(category, 'kr', 'ko'),
        () => fetchCurrents(category, 'kr', 'ko'),
        () => fetchNewsAPI(category, 'kr'),
    ]);
}

async function searchKoreanNews(query: string) {
    return firstWorkingProvider([
        () => searchKoreanRss(query),
    ]);
}

async function fetchInternationalTopNews(category: string, country: NewsCountry) {
    const language = getCountryLanguage(country);
    return firstWorkingProvider([
        () => fetchNewsAPI(category, country),
        () => fetchNewsAPIEverything(category, language),
        () => fetchGNews(category, country, language),
        () => fetchNewsData(category, country, language),
        () => fetchCurrents(category, country, language),
    ]);
}

async function searchInternationalNews(query: string, country: NewsCountry) {
    const language = getCountryLanguage(country);
    return firstWorkingProvider([
        () => searchNewsAPI(query, country),
        () => searchNewsAPIEverything(query, language),
        () => searchGNews(query, country, language),
        () => searchNewsData(query, country, language),
        () => searchCurrents(query, country, language),
    ]);
}

async function translateIfNeeded(
    articles: NormalizedArticle[],
    country: NewsCountry,
    translate: boolean,
) {
    if (!translate || country === 'kr') return articles;

    return translateArticlesToKorean(articles, getCountryLanguage(country));
}

export async function getTopArticles({
    category = 'all',
    country = 'kr',
    translate = false,
}: {
    category?: string;
    country?: string | string[];
    translate?: boolean;
}): Promise<Article[]> {
    const normalizedCountry = normalizeNewsCountry(country);
    const articles =
        normalizedCountry === 'kr'
            ? await fetchKoreanTopNews(category)
            : await fetchInternationalTopNews(category, normalizedCountry);

    return translateIfNeeded(articles.slice(0, 30), normalizedCountry, translate);
}

export async function searchArticles({
    query,
    country = 'kr',
    translate = false,
}: {
    query: string;
    country?: string | string[];
    translate?: boolean;
}): Promise<Article[]> {
    const normalizedCountry = normalizeNewsCountry(country);
    const articles =
        normalizedCountry === 'kr'
            ? await searchKoreanNews(query)
            : await searchInternationalNews(query, normalizedCountry);

    return translateIfNeeded(articles.slice(0, 20), normalizedCountry, translate);
}

export function articlesToTopHeadline(articles: Article[]) {
    return toNewsTopHeadLine(articles);
}
