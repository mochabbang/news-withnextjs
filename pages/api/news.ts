import type { NextApiRequest, NextApiResponse } from 'next';
import { Article } from '@/types/Article';
import { getTopArticles } from '@/apis/newsService';

interface NewsResponse {
    articles: Article[];
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<NewsResponse>,
) {
    const { category, country, translate } = req.query;
    const selectedCategory =
        typeof category === 'string' && category.trim() ? category : 'all';

    try {
        const articles = await getTopArticles({
            category: selectedCategory,
            country,
            translate: translate === 'true' || translate === '1',
        });

        res.status(200).json({ articles });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Failed to fetch news';

        res.status(502).json({ articles: [], error: message });
    }
}
