export type ArticleSnapshot = {
    url: string;
    title: string;
    description: string | null;
    urlToImage: string | null;
    publishedAt: string;
    author: string | null;
    sourceName: string;
    sourceLanguage: string;
};

const PREFIX = 'article:';

function isSnapshot(value: unknown): value is ArticleSnapshot {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.url === 'string' &&
        typeof v.title === 'string' &&
        typeof v.publishedAt === 'string' &&
        typeof v.sourceName === 'string' &&
        typeof v.sourceLanguage === 'string'
    );
}

export function saveArticleSnapshot(id: string, snapshot: ArticleSnapshot): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(PREFIX + id, JSON.stringify(snapshot));
    } catch {
        // sessionStorage may be unavailable (private mode, quota) — fail silent
    }
}

export function loadArticleSnapshot(id: string): ArticleSnapshot | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(PREFIX + id);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return isSnapshot(parsed) ? parsed : null;
    } catch {
        return null;
    }
}
