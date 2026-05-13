import { NormalizedArticle, deduplicateByTitle, toNewsTopHeadLine } from './normalize';

function makeArticle(overrides: Partial<NormalizedArticle> = {}): NormalizedArticle {
    return {
        author: null,
        title: 'title',
        description: null,
        url: 'https://example.com/a',
        urlToImage: null,
        publishedAt: '2026-05-01T00:00:00Z',
        content: null,
        source: { name: 'Example' },
        provider: 'newsapi',
        ...overrides,
    };
}

describe('deduplicateByTitle', () => {
    it('removes duplicates by url (case-insensitive, trimmed, prefix 100)', () => {
        const a = makeArticle({ url: 'https://example.com/x', title: 'one' });
        const b = makeArticle({ url: '  https://EXAMPLE.com/x  ', title: 'two' });
        expect(deduplicateByTitle([a, b])).toHaveLength(1);
    });

    it('uses title when url is empty', () => {
        const a = makeArticle({ url: '', title: 'same title' });
        const b = makeArticle({ url: '', title: 'same title' });
        expect(deduplicateByTitle([a, b])).toHaveLength(1);
    });

    it('keeps distinct articles', () => {
        const a = makeArticle({ url: 'https://example.com/1' });
        const b = makeArticle({ url: 'https://example.com/2' });
        expect(deduplicateByTitle([a, b])).toHaveLength(2);
    });

    it('sorts results by publishedAt descending', () => {
        const older = makeArticle({
            url: 'https://example.com/older',
            publishedAt: '2026-01-01T00:00:00Z',
        });
        const newer = makeArticle({
            url: 'https://example.com/newer',
            publishedAt: '2026-05-01T00:00:00Z',
        });
        const result = deduplicateByTitle([older, newer]);
        expect(result.map((a) => a.url)).toEqual([
            'https://example.com/newer',
            'https://example.com/older',
        ]);
    });
});

describe('toNewsTopHeadLine', () => {
    it('wraps articles array with status ok and totalResults count', () => {
        const articles = [makeArticle(), makeArticle({ url: 'https://example.com/b' })];
        expect(toNewsTopHeadLine(articles)).toEqual({
            status: 'ok',
            totalResults: 2,
            articles,
        });
    });

    it('handles empty array', () => {
        expect(toNewsTopHeadLine([])).toEqual({
            status: 'ok',
            totalResults: 0,
            articles: [],
        });
    });
});
