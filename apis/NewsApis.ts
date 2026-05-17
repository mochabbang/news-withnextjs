import { Article } from '@/types/Article';
import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import { Result } from '@/utilities/result';

export interface NewsPageResult {
    articles: Article[];
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export async function getNews(
    category: string,
    country = 'kr',
    page = 1,
    pageSize = 15,
): Promise<Result<NewsPageResult>> {
    try {
        const params = new URLSearchParams({
            category,
            country,
            page: String(page),
            pageSize: String(pageSize),
        });

        if (country !== 'kr') params.set('translate', 'true');

        const r = await fetch(`/api/news?${params.toString()}`);
        if (!r.ok) return { ok: false, error: '뉴스를 불러오지 못했습니다.' };
        const json = await r.json();
        return {
            ok: true,
            data: {
                articles: json.articles ?? [],
                page: json.page ?? page,
                pageSize: json.pageSize ?? pageSize,
                hasMore: Boolean(json.hasMore),
            },
        };
    } catch {
        return { ok: false, error: '네트워크 오류가 발생했습니다.' };
    }
}

export const GetNewsTopHeadLines = async (
    category: string,
    country = 'kr',
): Promise<NewsTopHeadLine> => {
    const result = await getNews(category, country);
    const articles = result.ok ? result.data.articles : [];

    return {
        status: result.ok ? 'ok' : 'error',
        totalResults: articles.length,
        articles,
    };
};
