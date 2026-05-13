import axios from 'axios';
import { fetchGNews, searchGNews } from './gnews';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ORIGINAL_ENV = process.env;

beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...ORIGINAL_ENV, GNEWS_API_KEY: 'test-key' };
});

afterAll(() => {
    process.env = ORIGINAL_ENV;
});

describe('fetchGNews', () => {
    it('throws when GNEWS_API_KEY is missing', async () => {
        delete process.env.GNEWS_API_KEY;
        await expect(fetchGNews('all')).rejects.toThrow('GNEWS_API_KEY not set');
    });

    it('passes category, country, language, and apikey', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { articles: [] } });
        await fetchGNews('business', 'jp', 'ja');

        const [url, opts] = mockedAxios.get.mock.calls[0];
        expect(url).toBe('https://gnews.io/api/v4/top-headlines');
        expect(opts?.params).toMatchObject({
            lang: 'ja',
            country: 'jp',
            category: 'business',
            max: 10,
            apikey: 'test-key',
        });
    });

    it('maps unknown category to "general"', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { articles: [] } });
        await fetchGNews('unknown', 'kr', 'ko');
        expect(mockedAxios.get.mock.calls[0][1]?.params).toMatchObject({
            category: 'general',
        });
    });

    it('normalizes articles, maps "image" to urlToImage, tags provider=gnews', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                articles: [
                    {
                        title: 'T',
                        description: 'D',
                        url: 'https://example.com/1',
                        image: 'https://example.com/i.png',
                        publishedAt: '2026-04-29T00:00:00Z',
                        source: { name: 'Src' },
                    },
                ],
            },
        });

        const result = await fetchGNews('all');
        expect(result[0]).toMatchObject({
            title: 'T',
            description: 'D',
            url: 'https://example.com/1',
            urlToImage: 'https://example.com/i.png',
            provider: 'gnews',
            source: { name: 'Src' },
        });
    });

    it('drops items without title or url', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                articles: [
                    { title: '', url: 'https://example.com/a', image: null, description: null, publishedAt: '', source: {} },
                    { title: 'ok', url: '', image: null, description: null, publishedAt: '', source: {} },
                    { title: 'keep', url: 'https://example.com/keep', image: null, description: null, publishedAt: '', source: {} },
                ],
            },
        });

        const result = await fetchGNews('all');
        expect(result.map((a) => a.title)).toEqual(['keep']);
    });

    it('falls back source name to "GNews" when missing', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                articles: [
                    { title: 'T', url: 'https://example.com/1', image: null, description: null, publishedAt: '', source: {} },
                ],
            },
        });
        const result = await fetchGNews('all');
        expect(result[0].source.name).toBe('GNews');
    });
});

describe('searchGNews', () => {
    it('calls /search with q, country, language', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { articles: [] } });
        await searchGNews('korea', 'us', 'en');

        const [url, opts] = mockedAxios.get.mock.calls[0];
        expect(url).toBe('https://gnews.io/api/v4/search');
        expect(opts?.params).toMatchObject({
            q: 'korea',
            lang: 'en',
            country: 'us',
            max: 10,
            apikey: 'test-key',
        });
    });
});
