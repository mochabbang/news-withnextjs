import type { NextApiRequest, NextApiResponse } from 'next';
import { Article } from '@/types/Article';
import { searchArticles } from '@/apis/newsService';

interface SearchResponse {
    articles: Article[];
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SearchResponse>,
) {
    const { q, country, translate } = req.query;

    if (!q || typeof q !== 'string' || !q.trim()) {
        return res.status(400).json({ articles: [], error: 'Query is required' });
    }

    try {
        const articles = await searchArticles({
            query: q.trim(),
            country,
            translate: translate === 'true' || translate === '1',
        });

        res.status(200).json({ articles });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Failed to search news';

        res.status(502).json({ articles: [], error: message });
    }
}
