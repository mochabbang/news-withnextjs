import axios from 'axios';
import { fetchNaverNews, searchNaverNews } from './naver';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ORIGINAL_ENV = process.env;

beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
        ...ORIGINAL_ENV,
        NAVER_CLIENT_ID: 'cid',
        NAVER_CLIENT_SECRET: 'csec',
    };
});

afterAll(() => {
    process.env = ORIGINAL_ENV;
});

describe('fetchNaverNews', () => {
    it('throws when Naver credentials are missing', async () => {
        delete process.env.NAVER_CLIENT_ID;
        await expect(fetchNaverNews('all')).rejects.toThrow(
            'NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not set',
        );
    });

    it('sends auth headers and category-mapped query', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });
        await fetchNaverNews('business');

        const [url, opts] = mockedAxios.get.mock.calls[0];
        expect(url).toBe('https://openapi.naver.com/v1/search/news.json');
        expect(opts?.headers).toMatchObject({
            'X-Naver-Client-Id': 'cid',
            'X-Naver-Client-Secret': 'csec',
        });
        expect(opts?.params).toMatchObject({
            query: '경제 금융 산업',
            display: 30,
            sort: 'date',
        });
    });

    it('falls back to "all" query for unknown category', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });
        await fetchNaverNews('unknown-cat');

        expect(mockedAxios.get.mock.calls[0][1]?.params).toMatchObject({
            query: '오늘 주요 뉴스',
        });
    });

    it('strips HTML, uses originallink when present, derives source from URL', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                items: [
                    {
                        title: '<b>제목</b>',
                        originallink: 'https://www.news.example.com/a',
                        link: 'https://n.example.com/b',
                        description: 'desc <strong>hi</strong>',
                        pubDate: 'Wed, 29 Apr 2026 00:00:00 +0900',
                    },
                ],
            },
        });

        const result = await fetchNaverNews('all');
        expect(result[0]).toMatchObject({
            title: '제목',
            description: 'desc hi',
            url: 'https://www.news.example.com/a',
            source: { name: 'news.example.com' },
            provider: 'naver',
            urlToImage: null,
        });
        expect(typeof result[0].publishedAt).toBe('string');
        expect(result[0].publishedAt.length).toBeGreaterThan(0);
    });

    it('uses link when originallink is missing', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                items: [
                    {
                        title: 't',
                        link: 'https://fallback.example.com/x',
                        description: '',
                        pubDate: '',
                    },
                ],
            },
        });

        const result = await fetchNaverNews('all');
        expect(result[0].url).toBe('https://fallback.example.com/x');
    });

    it('drops items missing title or url', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                items: [
                    { title: '', link: 'https://example.com/a', description: '', pubDate: '' },
                    { title: 'ok', link: '', description: '', pubDate: '' },
                    { title: 'keep', link: 'https://example.com/k', description: '', pubDate: '' },
                ],
            },
        });
        const result = await fetchNaverNews('all');
        expect(result.map((a) => a.title)).toEqual(['keep']);
    });
});

describe('searchNaverNews', () => {
    it('uses the provided query directly', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });
        await searchNaverNews('손흥민');

        expect(mockedAxios.get.mock.calls[0][1]?.params).toMatchObject({
            query: '손흥민',
            display: 30,
            sort: 'date',
        });
    });
});
