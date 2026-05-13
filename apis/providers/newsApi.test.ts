import axios from 'axios';
import {
    fetchNewsAPI,
    fetchNewsAPIEverything,
    searchNewsAPI,
    searchNewsAPIEverything,
} from './newsApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ORIGINAL_ENV = process.env;

beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...ORIGINAL_ENV, NEWS_API_KEY: 'test-key' };
});

afterAll(() => {
    process.env = ORIGINAL_ENV;
});

function makeApiArticle(overrides: Partial<{
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
    source: { id?: string | null; name?: string | null } | null;
}> = {}) {
    return {
        author: 'A',
        title: 'T',
        description: 'D',
        url: 'https://example.com/1',
        urlToImage: 'https://example.com/i.png',
        publishedAt: '2026-04-29T00:00:00Z',
        content: 'C',
        source: { id: 's', name: 'Source' },
        ...overrides,
    };
}

describe('fetchNewsAPI', () => {
    it('throws when NEWS_API_KEY is missing', async () => {
        delete process.env.NEWS_API_KEY;
        await expect(fetchNewsAPI('all', 'kr')).rejects.toThrow('NEWS_API_KEY not set');
    });

    it('calls /v2/top-headlines without category param for "all"', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { articles: [] } });
        await fetchNewsAPI('all', 'us');

        const [url, opts] = mockedAxios.get.mock.calls[0];
        expect(url).toBe('https://newsapi.org/v2/top-headlines');
        expect(opts?.params).toMatchObject({
            country: 'us',
            pageSize: 30,
            apiKey: 'test-key',
        });
        expect((opts?.params as Record<string, unknown>).category).toBeUndefined();
    });

    it('passes mapped category for non-all categories', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { articles: [] } });
        await fetchNewsAPI('business', 'kr');

        const [, opts] = mockedAxios.get.mock.calls[0];
        expect(opts?.params).toMatchObject({ category: 'business' });
    });

    it('normalizes articles and tags provider=newsapi', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { articles: [makeApiArticle()] },
        });

        const result = await fetchNewsAPI('all', 'kr');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            title: 'T',
            url: 'https://example.com/1',
            provider: 'newsapi',
            source: { id: 's', name: 'Source' },
        });
    });

    it('drops articles missing title or url', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                articles: [
                    makeApiArticle({ title: '', url: 'https://example.com/x' }),
                    makeApiArticle({ title: 'ok', url: '' }),
                    makeApiArticle({ url: 'https://example.com/keep' }),
                ],
            },
        });

        const result = await fetchNewsAPI('all', 'kr');
        expect(result.map((a) => a.url)).toEqual(['https://example.com/keep']);
    });

    it('falls back source name to "NewsAPI" when missing', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { articles: [makeApiArticle({ source: null })] },
        });
        const result = await fetchNewsAPI('all', 'kr');
        expect(result[0].source.name).toBe('NewsAPI');
    });
});

describe('fetchNewsAPIEverything', () => {
    it('calls /v2/everything with sortBy=publishedAt and language', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { articles: [] } });
        await fetchNewsAPIEverything('business', 'en');

        const [url, opts] = mockedAxios.get.mock.calls[0];
        expect(url).toBe('https://newsapi.org/v2/everything');
        expect(opts?.params).toMatchObject({
            q: 'business',
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 30,
            apiKey: 'test-key',
        });
    });

    it('uses query "news" when category is "all" or unknown', async () => {
        mockedAxios.get.mockResolvedValue({ data: { articles: [] } });

        await fetchNewsAPIEverything('all', 'en');
        expect(mockedAxios.get.mock.calls[0][1]?.params).toMatchObject({ q: 'news' });

        await fetchNewsAPIEverything('unknown-cat', 'en');
        expect(mockedAxios.get.mock.calls[1][1]?.params).toMatchObject({ q: 'news' });
    });
});

describe('searchNewsAPI', () => {
    it('calls /v2/top-headlines with q and country', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { articles: [] } });
        await searchNewsAPI('korea', 'us');

        const [url, opts] = mockedAxios.get.mock.calls[0];
        expect(url).toBe('https://newsapi.org/v2/top-headlines');
        expect(opts?.params).toMatchObject({
            q: 'korea',
            country: 'us',
            pageSize: 20,
            apiKey: 'test-key',
        });
    });
});

describe('searchNewsAPIEverything', () => {
    it('calls /v2/everything with q, language, and sortBy=publishedAt', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { articles: [] } });
        await searchNewsAPIEverything('korea', 'en');

        const [url, opts] = mockedAxios.get.mock.calls[0];
        expect(url).toBe('https://newsapi.org/v2/everything');
        expect(opts?.params).toMatchObject({
            q: 'korea',
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 20,
            apiKey: 'test-key',
        });
    });
});
