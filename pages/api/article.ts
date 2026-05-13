import type { NextApiRequest, NextApiResponse } from 'next';
import { summarizeArticle } from '@/apis/summarize';
import { translateArticleText } from '@/apis/translation';

type SuccessResponse = {
    summary: string | null;
    displayTitle: string;
    displayDescription: string | null;
    originalTitle: string;
    originalDescription: string | null;
    translated: boolean;
};

type ErrorResponse = { error: string };

const MAX_TITLE = 500;
const MAX_DESCRIPTION = 2000;

function isHttpUrl(value: unknown): value is string {
    if (typeof value !== 'string' || !value) return false;
    try {
        const u = new URL(value);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SuccessResponse | ErrorResponse>,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const body = (req.body ?? {}) as {
        title?: unknown;
        description?: unknown;
        url?: unknown;
        sourceLanguage?: unknown;
    };

    if (typeof body.title !== 'string' || !body.title.trim()) {
        res.status(400).json({ error: 'title is required' });
        return;
    }
    if (!isHttpUrl(body.url)) {
        res.status(400).json({ error: 'valid http(s) url is required' });
        return;
    }

    const originalTitle = body.title.slice(0, MAX_TITLE);
    const originalDescription =
        typeof body.description === 'string'
            ? body.description.slice(0, MAX_DESCRIPTION)
            : null;
    const sourceLanguage =
        typeof body.sourceLanguage === 'string' && body.sourceLanguage
            ? body.sourceLanguage
            : 'ko';

    const displayTitle =
        sourceLanguage === 'ko'
            ? originalTitle
            : (await translateArticleText(originalTitle, sourceLanguage)) || originalTitle;

    const displayDescription =
        sourceLanguage === 'ko'
            ? originalDescription
            : await translateArticleText(originalDescription, sourceLanguage);

    const translated =
        displayTitle !== originalTitle || displayDescription !== originalDescription;

    let summary: string | null = null;
    try {
        summary = await summarizeArticle({
            title: displayTitle,
            description: displayDescription,
            language: 'ko',
        });
    } catch {
        summary = null;
    }

    res.setHeader(
        'Cache-Control',
        'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    );
    res.status(200).json({
        summary,
        displayTitle,
        displayDescription,
        originalTitle,
        originalDescription,
        translated,
    });
}
