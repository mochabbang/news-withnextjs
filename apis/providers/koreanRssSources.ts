export type RssCategory =
    | 'all'
    | 'business'
    | 'entertainment'
    | 'health'
    | 'science'
    | 'sports'
    | 'technology';

export type KoreanRssSource = {
    id: string;
    name: string;
    feeds: Partial<Record<RssCategory, string>>;
};

export const KOREAN_RSS_SOURCES: KoreanRssSource[] = [
    {
        id: 'yonhap',
        name: '연합뉴스',
        feeds: {
            all: 'https://www.yna.co.kr/rss/news.xml',
            business: 'https://www.yna.co.kr/rss/economy.xml',
            entertainment: 'https://www.yna.co.kr/rss/entertainment.xml',
            sports: 'https://www.yna.co.kr/rss/sports.xml',
        },
    },
    {
        id: 'hani',
        name: '한겨레',
        feeds: {
            all: 'https://www.hani.co.kr/rss/society/',
            business: 'https://www.hani.co.kr/rss/economy/',
            science: 'https://www.hani.co.kr/rss/science/',
            sports: 'https://www.hani.co.kr/rss/sports/',
        },
    },
    {
        id: 'khan',
        name: '경향신문',
        feeds: {
            all: 'https://www.khan.co.kr/rss/rssdata/total_news.xml',
            business: 'https://www.khan.co.kr/rss/rssdata/economy_news.xml',
            entertainment: 'https://www.khan.co.kr/rss/rssdata/kh_entertainment.xml',
            science: 'https://www.khan.co.kr/rss/rssdata/science_news.xml',
            sports: 'https://www.khan.co.kr/rss/rssdata/kh_sports.xml',
        },
    },
    {
        id: 'chosun',
        name: '조선일보',
        feeds: {
            all: 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml',
        },
    },
    {
        id: 'hankyung',
        name: '한국경제',
        feeds: {
            business: 'https://www.hankyung.com/feed/economy',
            entertainment: 'https://www.hankyung.com/feed/entertainment',
            science: 'https://www.hankyung.com/feed/it',
            sports: 'https://www.hankyung.com/feed/sports',
            technology: 'https://www.hankyung.com/feed/it',
        },
    },
    {
        id: 'donga',
        name: '동아일보',
        feeds: {
            all: 'https://rss.donga.com/total.xml',
        },
    },
    {
        id: 'sbs',
        name: 'SBS 뉴스',
        feeds: {
            all: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=03',
            business: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=02',
            entertainment: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=14',
            health: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=08',
            science: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=08',
            sports: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=09',
        },
    },
    {
        id: 'jtbc',
        name: 'JTBC',
        feeds: {
            all: 'https://fs.jtbc.co.kr/RSS/newsflash.xml',
        },
    },
    {
        id: 'mk',
        name: '매일경제',
        feeds: {
            all: 'https://www.mk.co.kr/rss/30000001/',
            business: 'https://www.mk.co.kr/rss/30100041/',
            technology: 'https://www.mk.co.kr/rss/30000019/',
        },
    },
];

export function resolveFeedsForCategory(
    category: RssCategory,
): Array<{ source: KoreanRssSource; url: string }> {
    return KOREAN_RSS_SOURCES.flatMap((source) => {
        const url = source.feeds[category] ?? source.feeds.all;
        return url ? [{ source, url }] : [];
    });
}

export function resolveAllFeeds(): Array<{ source: KoreanRssSource; url: string }> {
    const seen = new Set<string>();
    return KOREAN_RSS_SOURCES.flatMap((source) =>
        Object.values(source.feeds).flatMap((url) => {
            if (!url || seen.has(url)) return [];
            seen.add(url);
            return [{ source, url }];
        }),
    );
}
