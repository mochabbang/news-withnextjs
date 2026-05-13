/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from './news';
import * as newsService from '@/apis/newsService';
import { Article } from '@/types/Article';

jest.mock('@/apis/newsService');
const mockedGetTop = newsService.getTopArticles as jest.MockedFunction<
    typeof newsService.getTopArticles
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

describe('GET /api/news', () => {
    it('returns 200 with articles on success', async () => {
        const articles = [makeArticle()];
        mockedGetTop.mockResolvedValueOnce(articles);

        const req = makeReq({ category: 'business', country: 'kr' });
        const res = makeRes();
        await handler(req, res as NextApiResponse);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ articles });
    });

    it('defaults category to "all" when missing or empty', async () => {
        mockedGetTop.mockResolvedValue([]);

        await handler(makeReq({}), makeRes() as NextApiResponse);
        expect(mockedGetTop).toHaveBeenLastCalledWith(
            expect.objectContaining({ category: 'all' }),
        );

        await handler(makeReq({ category: '   ' }), makeRes() as NextApiResponse);
        expect(mockedGetTop).toHaveBeenLastCalledWith(
            expect.objectContaining({ category: 'all' }),
        );
    });

    it('passes country and translate flag through', async () => {
        mockedGetTop.mockResolvedValueOnce([]);

        await handler(
            makeReq({ category: 'all', country: 'us', translate: 'true' }),
            makeRes() as NextApiResponse,
        );

        expect(mockedGetTop).toHaveBeenCalledWith({
            category: 'all',
            country: 'us',
            translate: true,
        });
    });

    it('treats translate="1" as true and other values as false', async () => {
        mockedGetTop.mockResolvedValue([]);

        await handler(
            makeReq({ translate: '1' }),
            makeRes() as NextApiResponse,
        );
        expect(mockedGetTop).toHaveBeenLastCalledWith(
            expect.objectContaining({ translate: true }),
        );

        await handler(
            makeReq({ translate: 'yes' }),
            makeRes() as NextApiResponse,
        );
        expect(mockedGetTop).toHaveBeenLastCalledWith(
            expect.objectContaining({ translate: false }),
        );
    });

    it('returns 502 with empty articles and error message when service throws', async () => {
        mockedGetTop.mockRejectedValueOnce(new Error('upstream down'));

        const res = makeRes();
        await handler(makeReq({ category: 'all' }), res as NextApiResponse);

        expect(res.statusCode).toBe(502);
        expect(res.body).toEqual({ articles: [], error: 'upstream down' });
    });

    it('uses a default error message when thrown value is not an Error', async () => {
        mockedGetTop.mockRejectedValueOnce('boom');

        const res = makeRes();
        await handler(makeReq({}), res as NextApiResponse);

        expect(res.statusCode).toBe(502);
        expect(res.body).toEqual({ articles: [], error: 'Failed to fetch news' });
    });
});
