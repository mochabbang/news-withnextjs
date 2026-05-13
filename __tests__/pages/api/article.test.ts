/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/article';
import * as summarize from '@/apis/summarize';
import * as translation from '@/apis/translation';

jest.mock('@/apis/summarize');
jest.mock('@/apis/translation');

const mockedSummarize = summarize.summarizeArticle as jest.MockedFunction<
    typeof summarize.summarizeArticle
>;
const mockedTranslate = translation.translateArticleText as jest.MockedFunction<
    typeof translation.translateArticleText
>;

function makeRes() {
    const res: Partial<NextApiResponse> & {
        statusCode?: number;
        body?: unknown;
        headers: Record<string, string>;
    } = { headers: {} };
    res.status = jest.fn().mockImplementation((code: number) => {
        res.statusCode = code;
        return res as NextApiResponse;
    });
    res.json = jest.fn().mockImplementation((body: unknown) => {
        res.body = body;
        return res as NextApiResponse;
    });
    res.setHeader = jest.fn().mockImplementation((k: string, v: string) => {
        res.headers[k] = v;
        return res as NextApiResponse;
    });
    return res;
}

function makeReq(
    method: string,
    body: Record<string, unknown> = {},
): NextApiRequest {
    return { method, body } as unknown as NextApiRequest;
}

beforeEach(() => {
    jest.resetAllMocks();
});

describe('POST /api/article', () => {
    it('rejects non-POST with 405', async () => {
        const res = makeRes();
        await handler(makeReq('GET'), res as NextApiResponse);
        expect(res.statusCode).toBe(405);
    });

    it('returns 400 when title is missing or not a string', async () => {
        const res = makeRes();
        await handler(
            makeReq('POST', { url: 'https://example.com/a' }),
            res as NextApiResponse,
        );
        expect(res.statusCode).toBe(400);
    });

    it('returns 400 when url is missing or not http(s)', async () => {
        const res = makeRes();
        await handler(
            makeReq('POST', { title: 't', url: 'javascript:alert(1)' }),
            res as NextApiResponse,
        );
        expect(res.statusCode).toBe(400);
    });

    it('returns summary and originals when sourceLanguage is "ko" (no translation)', async () => {
        mockedSummarize.mockResolvedValueOnce('요약입니다');
        mockedTranslate.mockImplementation(async (text) => text as never);

        const res = makeRes();
        await handler(
            makeReq('POST', {
                title: '제목',
                description: '설명',
                url: 'https://example.com/a',
                sourceLanguage: 'ko',
            }),
            res as NextApiResponse,
        );

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            summary: '요약입니다',
            displayTitle: '제목',
            displayDescription: '설명',
            originalTitle: '제목',
            originalDescription: '설명',
            translated: false,
        });
    });

    it('translates title/description when sourceLanguage is non-ko', async () => {
        mockedTranslate
            .mockResolvedValueOnce('번역된 제목')
            .mockResolvedValueOnce('번역된 설명');
        mockedSummarize.mockResolvedValueOnce('요약');

        const res = makeRes();
        await handler(
            makeReq('POST', {
                title: 'English Title',
                description: 'English desc',
                url: 'https://example.com/a',
                sourceLanguage: 'en',
            }),
            res as NextApiResponse,
        );

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            displayTitle: '번역된 제목',
            displayDescription: '번역된 설명',
            originalTitle: 'English Title',
            originalDescription: 'English desc',
            translated: true,
        });
        expect(mockedSummarize).toHaveBeenCalledWith(
            expect.objectContaining({
                title: '번역된 제목',
                description: '번역된 설명',
                language: 'ko',
            }),
        );
    });

    it('sets translated=false when translation returns the same text', async () => {
        mockedTranslate
            .mockResolvedValueOnce('same title')
            .mockResolvedValueOnce('same desc');
        mockedSummarize.mockResolvedValueOnce('s');

        const res = makeRes();
        await handler(
            makeReq('POST', {
                title: 'same title',
                description: 'same desc',
                url: 'https://example.com/a',
                sourceLanguage: 'en',
            }),
            res as NextApiResponse,
        );

        expect((res.body as { translated: boolean }).translated).toBe(false);
    });

    it('does not fail the request when summarization throws — returns null summary', async () => {
        mockedSummarize.mockRejectedValueOnce(new Error('openai down'));
        mockedTranslate.mockImplementation(async (text) => text as never);

        const res = makeRes();
        await handler(
            makeReq('POST', {
                title: 't',
                description: 'd',
                url: 'https://example.com/a',
                sourceLanguage: 'ko',
            }),
            res as NextApiResponse,
        );

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ summary: null });
    });

    it('truncates very long title/description before processing', async () => {
        mockedTranslate.mockImplementation(async (text) => text as never);
        mockedSummarize.mockResolvedValueOnce('s');

        const longTitle = 'a'.repeat(1000);
        const longDesc = 'b'.repeat(5000);

        const res = makeRes();
        await handler(
            makeReq('POST', {
                title: longTitle,
                description: longDesc,
                url: 'https://example.com/a',
                sourceLanguage: 'ko',
            }),
            res as NextApiResponse,
        );

        expect(res.statusCode).toBe(200);
        const body = res.body as { displayTitle: string; displayDescription: string };
        expect(body.displayTitle.length).toBeLessThanOrEqual(500);
        expect(body.displayDescription.length).toBeLessThanOrEqual(2000);
    });
});
