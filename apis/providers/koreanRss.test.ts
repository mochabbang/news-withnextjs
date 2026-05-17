import { extractMetaImageFromHtml } from './koreanRss';

describe('koreanRss image extraction', () => {
    it('extracts og:image when property comes before content', () => {
        const html =
            '<meta property="og:image" content="https://example.com/news.jpg" />';

        expect(extractMetaImageFromHtml(html)).toBe(
            'https://example.com/news.jpg',
        );
    });

    it('extracts og:image when content comes before property', () => {
        const html =
            '<meta content="https://example.com/news.jpg" property="og:image" />';

        expect(extractMetaImageFromHtml(html)).toBe(
            'https://example.com/news.jpg',
        );
    });

    it('normalizes protocol-relative image URLs', () => {
        const html =
            '<meta name="twitter:image" content="//cdn.example.com/news.jpg" />';

        expect(extractMetaImageFromHtml(html)).toBe(
            'https://cdn.example.com/news.jpg',
        );
    });

    it('ignores non-http image URLs', () => {
        const html =
            '<meta property="og:image" content="data:image/png;base64,abc" />';

        expect(extractMetaImageFromHtml(html)).toBeNull();
    });
});
