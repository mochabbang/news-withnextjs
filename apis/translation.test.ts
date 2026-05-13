import axios from 'axios';
import {
    __resetTranslationCacheForTests,
    translateArticleText,
} from './translation';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ORIGINAL_ENV = process.env;

beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    __resetTranslationCacheForTests();
});

afterAll(() => {
    process.env = ORIGINAL_ENV;
});

describe('translateArticleText', () => {
    it('returns the original text when sourceLanguage is "ko"', async () => {
        const result = await translateArticleText('안녕', 'ko');
        expect(result).toBe('안녕');
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('returns the original text when text is null/empty/whitespace', async () => {
        process.env.NEWS_TRANSLATE_PROVIDER = 'mymemory';
        expect(await translateArticleText(null, 'en')).toBeNull();
        expect(await translateArticleText('', 'en')).toBe('');
        expect(await translateArticleText('   ', 'en')).toBe('   ');
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('returns the original text when provider is "none"', async () => {
        process.env.NEWS_TRANSLATE_PROVIDER = 'none';
        const result = await translateArticleText('hello', 'en');
        expect(result).toBe('hello');
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('calls MyMemory and returns translated text', async () => {
        process.env.NEWS_TRANSLATE_PROVIDER = 'mymemory';
        mockedAxios.get.mockResolvedValueOnce({
            data: { responseData: { translatedText: '안녕' } },
        });

        const result = await translateArticleText('hello', 'en');
        expect(result).toBe('안녕');
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://api.mymemory.translated.net/get',
            expect.objectContaining({
                params: expect.objectContaining({ langpair: 'en|ko' }),
            }),
        );
    });

    it('calls LibreTranslate when configured', async () => {
        process.env.NEWS_TRANSLATE_PROVIDER = 'libretranslate';
        process.env.LIBRETRANSLATE_URL = 'https://libre.example.com';
        mockedAxios.post.mockResolvedValueOnce({ data: { translatedText: '번역됨' } });

        const result = await translateArticleText('hi', 'en');
        expect(result).toBe('번역됨');
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://libre.example.com/translate',
            expect.objectContaining({ q: 'hi', source: 'en', target: 'ko' }),
            expect.any(Object),
        );
    });

    it('returns the original text on provider error', async () => {
        process.env.NEWS_TRANSLATE_PROVIDER = 'mymemory';
        mockedAxios.get.mockRejectedValueOnce(new Error('boom'));

        const result = await translateArticleText('hello', 'en');
        expect(result).toBe('hello');
    });

    it('caches per (text, sourceLanguage) — repeated calls hit cache', async () => {
        process.env.NEWS_TRANSLATE_PROVIDER = 'mymemory';
        mockedAxios.get.mockResolvedValueOnce({
            data: { responseData: { translatedText: '안녕' } },
        });

        const r1 = await translateArticleText('hello', 'en');
        const r2 = await translateArticleText('hello', 'en');

        expect(r1).toBe('안녕');
        expect(r2).toBe('안녕');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('does not collide across different source languages', async () => {
        process.env.NEWS_TRANSLATE_PROVIDER = 'mymemory';
        mockedAxios.get
            .mockResolvedValueOnce({ data: { responseData: { translatedText: '안녕(en)' } } })
            .mockResolvedValueOnce({ data: { responseData: { translatedText: '안녕(ja)' } } });

        const en = await translateArticleText('hello', 'en');
        const ja = await translateArticleText('hello', 'ja');

        expect(en).toBe('안녕(en)');
        expect(ja).toBe('안녕(ja)');
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
});
