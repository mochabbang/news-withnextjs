import { decodeArticleId, encodeArticleId } from './articleId';

describe('encodeArticleId / decodeArticleId', () => {
    it('round-trips a simple https URL', () => {
        const url = 'https://example.com/article/1';
        expect(decodeArticleId(encodeArticleId(url))).toBe(url);
    });

    it('round-trips a URL with query string and unicode', () => {
        const url = 'https://news.example.com/path?q=한국&id=42#anchor';
        expect(decodeArticleId(encodeArticleId(url))).toBe(url);
    });

    it('produces a URL-safe id (no +, /, or =)', () => {
        const id = encodeArticleId('https://example.com/a?b=c&d=e/f+g');
        expect(id).not.toMatch(/[+/=]/);
    });

    it('returns null when decoding malformed input', () => {
        expect(decodeArticleId('!!!not_base64!!!')).toBeNull();
        expect(decodeArticleId('')).toBeNull();
    });

    it('returns null when decoded content is not a valid http(s) URL', () => {
        const id = encodeArticleId('javascript:alert(1)');
        expect(decodeArticleId(id)).toBeNull();
    });

    it('accepts both http and https schemes', () => {
        const httpUrl = 'http://example.com/x';
        expect(decodeArticleId(encodeArticleId(httpUrl))).toBe(httpUrl);
    });
});
