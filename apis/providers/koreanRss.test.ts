import { diversifyBySource, extractMetaImageFromHtml } from './koreanRss';

function makeArticle(title: string, sourceName: string, publishedAt: string) {
    return {
        author: null,
        title,
        description: null,
        url: `https://example.com/${encodeURIComponent(title)}`,
        urlToImage: null,
        publishedAt,
        content: null,
        source: { name: sourceName },
        provider: 'koreanrss' as const,
    };
}

describe('koreanRss image extraction', () => {
    it('extracts og:image when property comes before content', () => {
        const html =
            '<meta property="og:image" content="https://example.com/news.jpg" />';

        expect(extractMetaImageFromHtml(html)).toBe(
            'https://example.com/news.jpg',
        );
    });

    it('extracts og:image when content comes before property', () => {
        const html =
            '<meta content="https://example.com/news.jpg" property="og:image" />';

        expect(extractMetaImageFromHtml(html)).toBe(
            'https://example.com/news.jpg',
        );
    });

    it('normalizes protocol-relative image URLs', () => {
        const html =
            '<meta name="twitter:image" content="//cdn.example.com/news.jpg" />';

        expect(extractMetaImageFromHtml(html)).toBe(
            'https://cdn.example.com/news.jpg',
        );
    });

    it('ignores non-http image URLs', () => {
        const html =
            '<meta property="og:image" content="data:image/png;base64,abc" />';

        expect(extractMetaImageFromHtml(html)).toBeNull();
    });
});

describe('koreanRss source diversity', () => {
    it('interleaves articles from different publishers instead of letting one source dominate', () => {
        const articles = [
            makeArticle('한겨레 1', '한겨레', '2026-05-17T10:00:00Z'),
            makeArticle('한겨레 2', '한겨레', '2026-05-17T09:59:00Z'),
            makeArticle('한겨레 3', '한겨레', '2026-05-17T09:58:00Z'),
            makeArticle('SBS 1', 'SBS 뉴스', '2026-05-17T09:57:00Z'),
            makeArticle('JTBC 1', 'JTBC', '2026-05-17T09:56:00Z'),
        ];

        expect(
            diversifyBySource(articles)
                .slice(0, 3)
                .map((article) => article.source.name),
        ).toEqual(['한겨레', 'SBS 뉴스', 'JTBC']);
    });
});
