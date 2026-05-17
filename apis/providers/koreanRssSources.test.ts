import {
    KOREAN_RSS_SOURCES,
    resolveFeedsForCategory,
} from './koreanRssSources';

describe('koreanRssSources', () => {
    it('includes additional Korean news publishers', () => {
        expect(KOREAN_RSS_SOURCES.map((source) => source.id)).toEqual(
            expect.arrayContaining(['donga', 'sbs', 'jtbc', 'mk', 'hankyung']),
        );
    });

    it('resolves all category feeds without duplicate URLs', () => {
        const feeds = resolveFeedsForCategory('all');
        const urls = feeds.map((feed) => feed.url);

        expect(feeds.length).toBeGreaterThanOrEqual(9);
        expect(feeds.map((feed) => feed.source.id)).toEqual(
            expect.arrayContaining(['hankyung', 'mk']),
        );
        expect(new Set(urls).size).toBe(urls.length);
    });
});
