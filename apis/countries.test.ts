import { NEWS_COUNTRIES, getCountryLanguage, normalizeNewsCountry } from './countries';

describe('normalizeNewsCountry', () => {
    it('returns the matched country code in lowercase', () => {
        expect(normalizeNewsCountry('US')).toBe('us');
        expect(normalizeNewsCountry('kr')).toBe('kr');
    });

    it('takes the first element of an array input', () => {
        expect(normalizeNewsCountry(['jp', 'us'])).toBe('jp');
    });

    it('falls back to "kr" for undefined, unknown, or empty input', () => {
        expect(normalizeNewsCountry(undefined)).toBe('kr');
        expect(normalizeNewsCountry('zz')).toBe('kr');
        expect(normalizeNewsCountry('')).toBe('kr');
    });
});

describe('getCountryLanguage', () => {
    it('returns the language for known country codes', () => {
        expect(getCountryLanguage('kr')).toBe('ko');
        expect(getCountryLanguage('jp')).toBe('ja');
        expect(getCountryLanguage('cn')).toBe('zh');
        expect(getCountryLanguage('us')).toBe('en');
    });

    it('returns "en" for unknown country codes', () => {
        expect(getCountryLanguage('zz')).toBe('en');
    });

    it('matches every NEWS_COUNTRIES entry', () => {
        for (const c of NEWS_COUNTRIES) {
            expect(getCountryLanguage(c.code)).toBe(c.language);
        }
    });
});
