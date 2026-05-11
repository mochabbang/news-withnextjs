import type { NextApiRequest, NextApiResponse } from 'next';
import { summarizeArticle } from '@/apis/summarize';

type Response = { summary: string } | { error: string };

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Response>,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { title, description } = (req.body ?? {}) as {
        title?: unknown;
        description?: unknown;
    };

    if (typeof title !== 'string' || !title.trim()) {
        res.status(400).json({ error: 'title is required' });
        return;
    }
    if (title.length > 500) {
        res.status(400).json({ error: 'title too long' });
        return;
    }
    const desc =
        typeof description === 'string' ? description.slice(0, 2000) : null;

    try {
        const summary = await summarizeArticle({ title, description: desc });
        res.setHeader(
            'Cache-Control',
            'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        );
        res.status(200).json({ summary });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'summarization failed';
        res.status(502).json({ error: message });
    }
}
