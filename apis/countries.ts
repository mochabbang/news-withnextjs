export const NEWS_COUNTRIES = [
    { code: 'kr', label: '한국', language: 'ko' },
    { code: 'us', label: '미국', language: 'en' },
    { code: 'gb', label: '영국', language: 'en' },
    { code: 'jp', label: '일본', language: 'ja' },
    { code: 'cn', label: '중국', language: 'zh' },
    { code: 'de', label: '독일', language: 'de' },
    { code: 'fr', label: '프랑스', language: 'fr' },
    { code: 'au', label: '호주', language: 'en' },
    { code: 'in', label: '인도', language: 'en' },
    { code: 'sg', label: '싱가포르', language: 'en' },
] as const;

export type NewsCountry = (typeof NEWS_COUNTRIES)[number]['code'];

export function normalizeNewsCountry(country: string | string[] | undefined): NewsCountry {
    const value = Array.isArray(country) ? country[0] : country;
    const code = value?.toLowerCase();

    return NEWS_COUNTRIES.some((c) => c.code === code)
        ? (code as NewsCountry)
        : 'kr';
}

export function getCountryLanguage(country: string): string {
    return NEWS_COUNTRIES.find((c) => c.code === country)?.language ?? 'en';
}
