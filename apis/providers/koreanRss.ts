import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { cleanHtmlText, safeIsoDate, sourceNameFromUrl } from '@/utilities/text';
import { NormalizedArticle } from '../normalize';
import {
    KoreanRssSource,
    RssCategory,
    resolveAllFeeds,
    resolveFeedsForCategory,
} from './koreanRssSources';

const USER_AGENT = 'mochabbang-news/0.1 (+https://github.com/) RSS-aggregator';
const FETCH_TIMEOUT_MS = 8000;
const PER_FEED_LIMIT = 15;
const TOP_LIMIT = 30;
const SEARCH_LIMIT = 20;

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata',
    trimValues: true,
});

type RawItem = {
    title?: unknown;
    link?: unknown;
    description?: unknown;
    pubDate?: unknown;
    author?: unknown;
    'dc:creator'?: unknown;
    'media:content'?: unknown;
    'media:thumbnail'?: unknown;
    enclosure?: unknown;
    guid?: unknown;
};

function asString(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        if (typeof obj.__cdata === 'string') return obj.__cdata;
        if (typeof obj['#text'] === 'string') return obj['#text'];
    }
    return '';
}

function pickAttrUrl(value: unknown): string | null {
    if (!value) return null;
    const list = Array.isArray(value) ? value : [value];
    for (const entry of list) {
        if (typeof entry === 'object' && entry !== null) {
            const obj = entry as Record<string, unknown>;
            const url = obj['@_url'];
            if (typeof url === 'string' && url.startsWith('http')) return url;
        }
    }
    return null;
}

function pickEnclosureImage(value: unknown): string | null {
    if (!value) return null;
    const list = Array.isArray(value) ? value : [value];
    for (const entry of list) {
        if (typeof entry === 'object' && entry !== null) {
            const obj = entry as Record<string, unknown>;
            const url = obj['@_url'];
            const type = obj['@_type'];
            if (
                typeof url === 'string' &&
                url.startsWith('http') &&
                (typeof type !== 'string' || type.startsWith('image'))
            ) {
                return url;
            }
        }
    }
    return null;
}

function extractImageFromHtml(html: string): string | null {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (!match) return null;
    const src = match[1];
    return src.startsWith('http') ? src : null;
}

function extractImage(item: RawItem): string | null {
    return (
        pickAttrUrl(item['media:content']) ||
        pickAttrUrl(item['media:thumbnail']) ||
        pickEnclosureImage(item.enclosure) ||
        extractImageFromHtml(asString(item.description))
    );
}

function extractItems(parsed: unknown): RawItem[] {
    if (!parsed || typeof parsed !== 'object') return [];
    const root = parsed as Record<string, unknown>;
    const rss = root.rss as Record<string, unknown> | undefined;
    const channel = rss?.channel as Record<string, unknown> | undefined;
    const items = channel?.item;
    if (!items) return [];
    return Array.isArray(items) ? (items as RawItem[]) : [items as RawItem];
}

function normalizeItems(
    items: RawItem[],
    source: KoreanRssSource,
): NormalizedArticle[] {
    return items
        .map((item): NormalizedArticle | null => {
            const title = cleanHtmlText(asString(item.title));
            const url = asString(item.link).trim();
            if (!title || !url.startsWith('http')) return null;

            const description = cleanHtmlText(asString(item.description)) || null;
            const author =
                cleanHtmlText(asString(item['dc:creator'] ?? item.author)) || null;

            return {
                author,
                title,
                description,
                url,
                urlToImage: extractImage(item),
                publishedAt: safeIsoDate(asString(item.pubDate)),
                content: null,
                source: {
                    name: source.name || sourceNameFromUrl(url, 'Korean RSS'),
                },
                provider: 'koreanrss',
            };
        })
        .filter((a): a is NormalizedArticle => a !== null);
}

async function fetchOneFeed(
    url: string,
    source: KoreanRssSource,
): Promise<NormalizedArticle[]> {
    const response = await axios.get<string>(url, {
        timeout: FETCH_TIMEOUT_MS,
        responseType: 'text',
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
    });

    const parsed = parser.parse(response.data);
    const items = extractItems(parsed).slice(0, PER_FEED_LIMIT);
    return normalizeItems(items, source);
}

async function fetchFeedsParallel(
    targets: Array<{ source: KoreanRssSource; url: string }>,
): Promise<NormalizedArticle[]> {
    const settled = await Promise.allSettled(
        targets.map(({ source, url }) => fetchOneFeed(url, source)),
    );

    return settled.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : [],
    );
}

function dedupeAndSort(articles: NormalizedArticle[]): NormalizedArticle[] {
    const seen = new Set<string>();
    return articles
        .filter((a) => {
            const key = a.url.split('?')[0].toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

function isRssCategory(value: string): value is RssCategory {
    return [
        'all',
        'business',
        'entertainment',
        'health',
        'science',
        'sports',
        'technology',
    ].includes(value);
}

export async function fetchKoreanRss(
    category: string,
): Promise<NormalizedArticle[]> {
    const cat: RssCategory = isRssCategory(category) ? category : 'all';
    const targets = resolveFeedsForCategory(cat);
    const articles = await fetchFeedsParallel(targets);
    if (articles.length === 0) {
        throw new Error('Korean RSS returned no articles');
    }
    return dedupeAndSort(articles).slice(0, TOP_LIMIT);
}

export async function searchKoreanRss(
    query: string,
): Promise<NormalizedArticle[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const articles = await fetchFeedsParallel(resolveAllFeeds());
    const needle = trimmed.toLowerCase();

    const matched = articles.filter((a) => {
        const haystack = `${a.title} ${a.description ?? ''}`.toLowerCase();
        return haystack.includes(needle);
    });

    if (matched.length === 0) {
        throw new Error('Korean RSS search returned no matches');
    }
    return dedupeAndSort(matched).slice(0, SEARCH_LIMIT);
}
