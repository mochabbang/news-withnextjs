/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from './search';
import * as newsService from '@/apis/newsService';
import { Article } from '@/types/Article';

jest.mock('@/apis/newsService');
const mockedSearch = newsService.searchArticles as jest.MockedFunction<
    typeof newsService.searchArticles
>;

function makeRes() {
    const res: Partial<NextApiResponse> & {
        statusCode?: number;
        body?: unknown;
    } = {};
    res.status = jest.fn().mockImplementation((code: number) => {
        res.statusCode = code;
        return res as NextApiResponse;
    });
    res.json = jest.fn().mockImplementation((body: unknown) => {
        res.body = body;
        return res as NextApiResponse;
    });
    return res;
}

function makeReq(query: Record<string, string | string[] | undefined> = {}) {
    return { query } as unknown as NextApiRequest;
}

function makeArticle(overrides: Partial<Article> = {}): Article {
    return {
        author: null,
        title: 't',
        description: null,
        url: 'https://example.com/a',
        urlToImage: null,
        publishedAt: '2026-04-29T00:00:00Z',
        content: null,
        source: { name: 'Example' },
        ...overrides,
    };
}

beforeEach(() => {
    jest.resetAllMocks();
});

describe('GET /api/search', () => {
    it('returns 400 when q is missing', async () => {
        const res = makeRes();
        await handler(makeReq({}), res as NextApiResponse);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ articles: [], error: 'Query is required' });
        expect(mockedSearch).not.toHaveBeenCalled();
    });

    it('returns 400 when q is empty or whitespace only', async () => {
        const res = makeRes();
        await handler(makeReq({ q: '   ' }), res as NextApiResponse);

        expect(res.statusCode).toBe(400);
        expect(mockedSearch).not.toHaveBeenCalled();
    });

    it('returns 400 when q is an array (not a string)', async () => {
        const res = makeRes();
        await handler(makeReq({ q: ['a', 'b'] }), res as NextApiResponse);

        expect(res.statusCode).toBe(400);
        expect(mockedSearch).not.toHaveBeenCalled();
    });

    it('trims q before passing to searchArticles', async () => {
        mockedSearch.mockResolvedValueOnce([]);

        await handler(
            makeReq({ q: '  korea  ', country: 'us', translate: 'true' }),
            makeRes() as NextApiResponse,
        );

        expect(mockedSearch).toHaveBeenCalledWith({
            query: 'korea',
            country: 'us',
            translate: true,
        });
    });

    it('returns 200 with articles on success', async () => {
        const articles = [makeArticle()];
        mockedSearch.mockResolvedValueOnce(articles);

        const res = makeRes();
        await handler(makeReq({ q: 'korea' }), res as NextApiResponse);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ articles });
    });

    it('returns 502 with error message when service throws', async () => {
        mockedSearch.mockRejectedValueOnce(new Error('search failed'));

        const res = makeRes();
        await handler(makeReq({ q: 'korea' }), res as NextApiResponse);

        expect(res.statusCode).toBe(502);
        expect(res.body).toEqual({ articles: [], error: 'search failed' });
    });

    it('uses a default error message when thrown value is not an Error', async () => {
        mockedSearch.mockRejectedValueOnce('boom');

        const res = makeRes();
        await handler(makeReq({ q: 'x' }), res as NextApiResponse);

        expect(res.statusCode).toBe(502);
        expect(res.body).toEqual({ articles: [], error: 'Failed to search news' });
    });
});
