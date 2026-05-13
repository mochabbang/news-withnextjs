import { cleanHtmlText, safeIsoDate, sourceNameFromUrl } from './text';

describe('cleanHtmlText', () => {
    it('returns empty string for null or undefined', () => {
        expect(cleanHtmlText(null)).toBe('');
        expect(cleanHtmlText(undefined)).toBe('');
        expect(cleanHtmlText('')).toBe('');
    });

    it('strips HTML tags', () => {
        expect(cleanHtmlText('<p>hello <b>world</b></p>')).toBe('hello world');
    });

    it('decodes named HTML entities', () => {
        expect(cleanHtmlText('Tom &amp; Jerry')).toBe('Tom & Jerry');
        expect(cleanHtmlText('&quot;quoted&quot;')).toBe('"quoted"');
        expect(cleanHtmlText('it&#39;s')).toBe("it's");
    });

    it('decodes numeric HTML entities (decimal and hex)', () => {
        expect(cleanHtmlText('&#65;&#66;')).toBe('AB');
        expect(cleanHtmlText('&#x41;&#x42;')).toBe('AB');
    });

    it('collapses whitespace and trims', () => {
        expect(cleanHtmlText('  a   b\n\tc  ')).toBe('a b c');
    });

    it('keeps unknown entities literal', () => {
        expect(cleanHtmlText('&unknown;')).toBe('&unknown;');
    });
});

describe('safeIsoDate', () => {
    it('returns ISO of the given valid date', () => {
        expect(safeIsoDate('2026-04-29T00:00:00Z')).toBe('2026-04-29T00:00:00.000Z');
    });

    it('returns current ISO when input is invalid', () => {
        const before = Date.now();
        const result = safeIsoDate('not-a-date');
        const after = Date.now();
        const ts = new Date(result).getTime();
        expect(ts).toBeGreaterThanOrEqual(before);
        expect(ts).toBeLessThanOrEqual(after);
    });

    it('returns current ISO when input is null or undefined', () => {
        expect(typeof safeIsoDate(null)).toBe('string');
        expect(typeof safeIsoDate(undefined)).toBe('string');
    });
});

describe('sourceNameFromUrl', () => {
    it('returns hostname without leading www.', () => {
        expect(sourceNameFromUrl('https://www.example.com/path', 'fallback')).toBe('example.com');
        expect(sourceNameFromUrl('https://news.example.com/x', 'fallback')).toBe('news.example.com');
    });

    it('returns fallback for null, undefined, or invalid URL', () => {
        expect(sourceNameFromUrl(null, 'fb')).toBe('fb');
        expect(sourceNameFromUrl(undefined, 'fb')).toBe('fb');
        expect(sourceNameFromUrl('not a url', 'fb')).toBe('fb');
    });
});
