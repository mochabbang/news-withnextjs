/**
 * @jest-environment node
 */
const mockCreate = jest.fn();

jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
    }));
});

import { __resetSummarizeCacheForTests, summarizeArticle } from './summarize';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, OPENAI_API_KEY: 'test-key' };
    __resetSummarizeCacheForTests();
});

afterAll(() => {
    process.env = ORIGINAL_ENV;
});

function mockSummary(text: string) {
    mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: text } }],
    });
}

describe('summarizeArticle', () => {
    it('throws when title is empty', async () => {
        await expect(summarizeArticle({ title: '   ' })).rejects.toThrow('title required');
    });

    it('throws when OPENAI_API_KEY is missing', async () => {
        delete process.env.OPENAI_API_KEY;
        await expect(summarizeArticle({ title: 't' })).rejects.toThrow('OPENAI_API_KEY not set');
    });

    it('returns trimmed summary from the model', async () => {
        mockSummary('  핵심 요약  ');
        const result = await summarizeArticle({ title: '제목', description: '설명' });
        expect(result).toBe('핵심 요약');
    });

    it('throws when model returns empty content', async () => {
        mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: '' } }] });
        await expect(summarizeArticle({ title: '제목' })).rejects.toThrow('Empty summary from model');
    });

    it('caches by (title, description, language) and reuses', async () => {
        mockSummary('한 번만');
        const first = await summarizeArticle({ title: '제목', description: '설명' });
        const second = await summarizeArticle({ title: '제목', description: '설명' });

        expect(first).toBe('한 번만');
        expect(second).toBe('한 번만');
        expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('does not collide across different languages', async () => {
        mockSummary('ko 결과');
        mockSummary('en result');

        const ko = await summarizeArticle({ title: 'X', description: 'Y', language: 'ko' });
        const en = await summarizeArticle({ title: 'X', description: 'Y', language: 'en' });

        expect(ko).toBe('ko 결과');
        expect(en).toBe('en result');
        expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('treats missing language as default cache slot', async () => {
        mockSummary('default');
        const a = await summarizeArticle({ title: 'X' });
        const b = await summarizeArticle({ title: 'X' });
        expect(a).toBe('default');
        expect(b).toBe('default');
        expect(mockCreate).toHaveBeenCalledTimes(1);
    });
});
