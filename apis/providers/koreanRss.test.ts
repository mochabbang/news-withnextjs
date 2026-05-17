import { extractMetaImageFromHtml, sortByPublishedAt } from './koreanRss';

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

describe('koreanRss published order', () => {
    it('sorts articles by published time instead of interleaving publishers', () => {
        const articles = [
            makeArticle('한겨레 1', '한겨레', '2026-05-17T10:00:00Z'),
            makeArticle('한겨레 2', '한겨레', '2026-05-17T09:59:00Z'),
            makeArticle('한겨레 3', '한겨레', '2026-05-17T09:58:00Z'),
            makeArticle('SBS 1', 'SBS 뉴스', '2026-05-17T09:57:00Z'),
            makeArticle('JTBC 1', 'JTBC', '2026-05-17T09:56:00Z'),
        ];

        expect(
            sortByPublishedAt(articles)
                .slice(0, 3)
                .map((article) => article.title),
        ).toEqual(['한겨레 1', '한겨레 2', '한겨레 3']);
    });

    it('deduplicates articles by canonical URL before sorting', () => {
        const first = makeArticle(
            '중복 원본',
            '한겨레',
            '2026-05-17T10:00:00Z',
        );
        const duplicate = {
            ...makeArticle('중복 사본', 'SBS 뉴스', '2026-05-17T10:01:00Z'),
            url: `${first.url}?utm_source=test`,
        };
        const older = makeArticle('이전 기사', 'JTBC', '2026-05-17T09:00:00Z');

        expect(
            sortByPublishedAt([first, duplicate, older]).map(
                (article) => article.title,
            ),
        ).toEqual(['중복 원본', '이전 기사']);
    });
});
