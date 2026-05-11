import { Article } from '@/types/Article';

export type NormalizedArticle = Article & {
    provider: NonNullable<Article['provider']>;
};

export function deduplicateByTitle(articles: NormalizedArticle[]): NormalizedArticle[] {
    const seen = new Set<string>();
    return articles
        .filter((a) => {
            const key = (a.url || a.title).trim().toLowerCase().slice(0, 100);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export function toNewsTopHeadLine(articles: Article[]) {
    return {
        status: 'ok',
        totalResults: articles.length,
        articles,
    };
}
