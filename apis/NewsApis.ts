import { Article } from '@/types/Article';
import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import { Result } from '@/utilities/result';

export async function getNews(
    category: string,
    country = 'kr',
): Promise<Result<Article[]>> {
    try {
        const params = new URLSearchParams({
            category,
            country,
        });

        if (country !== 'kr') params.set('translate', 'true');

        const r = await fetch(`/api/news?${params.toString()}`);
        if (!r.ok) return { ok: false, error: '뉴스를 불러오지 못했습니다.' };
        const json = await r.json();
        return { ok: true, data: json.articles ?? [] };
    } catch {
        return { ok: false, error: '네트워크 오류가 발생했습니다.' };
    }
}

export const GetNewsTopHeadLines = async (
    category: string,
    country = 'kr',
): Promise<NewsTopHeadLine> => {
    const result = await getNews(category, country);
    const articles = result.ok ? result.data : [];

    return {
        status: result.ok ? 'ok' : 'error',
        totalResults: articles.length,
        articles,
    };
};
