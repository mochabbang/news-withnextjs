import {
    KOREAN_RSS_SOURCES,
    resolveFeedsForCategory,
} from './koreanRssSources';

describe('koreanRssSources', () => {
    it('includes additional Korean news publishers', () => {
        expect(KOREAN_RSS_SOURCES.map((source) => source.id)).toEqual(
            expect.arrayContaining(['donga', 'sbs', 'jtbc', 'mk']),
        );
    });

    it('resolves all category feeds without duplicate URLs', () => {
        const feeds = resolveFeedsForCategory('all');
        const urls = feeds.map((feed) => feed.url);

        expect(feeds.length).toBeGreaterThanOrEqual(8);
        expect(new Set(urls).size).toBe(urls.length);
    });
});
