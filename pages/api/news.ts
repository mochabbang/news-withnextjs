import type { NextApiRequest, NextApiResponse } from 'next';
import { Article } from '@/types/Article';
import { getTopArticles } from '@/apis/newsService';

interface NewsResponse {
    articles: Article[];
    page: number;
    pageSize: number;
    hasMore: boolean;
    error?: string;
}

function parsePositiveInt(value: string | string[] | undefined, fallback: number) {
    const raw = Array.isArray(value) ? value[0] : value;
    const parsed = Number.parseInt(raw ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<NewsResponse>,
) {
    const { category, country, translate } = req.query;
    const selectedCategory =
        typeof category === 'string' && category.trim() ? category : 'all';
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 15), 30);

    try {
        const articles = await getTopArticles({
            category: selectedCategory,
            country,
            translate: translate === 'true' || translate === '1',
            page,
            pageSize,
        });

        res.status(200).json({
            articles,
            page,
            pageSize,
            hasMore: articles.length === pageSize,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Failed to fetch news';

        res.status(502).json({ articles: [], page, pageSize, hasMore: false, error: message });
    }
}
