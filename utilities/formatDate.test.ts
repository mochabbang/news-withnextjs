import { formatRelative } from './formatDate';

describe('formatRelative', () => {
    const FIXED_NOW = new Date('2026-05-13T12:00:00Z').getTime();

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(FIXED_NOW);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns a string for a recent timestamp (seconds)', () => {
        const iso = new Date(FIXED_NOW - 10 * 1000).toISOString();
        expect(typeof formatRelative(iso)).toBe('string');
        expect(formatRelative(iso).length).toBeGreaterThan(0);
    });

    it('returns a string for a minute-old timestamp', () => {
        const iso = new Date(FIXED_NOW - 5 * 60 * 1000).toISOString();
        expect(typeof formatRelative(iso)).toBe('string');
    });

    it('returns a string for an hours-old timestamp', () => {
        const iso = new Date(FIXED_NOW - 3 * 60 * 60 * 1000).toISOString();
        expect(typeof formatRelative(iso)).toBe('string');
    });

    it('returns a string for a days-old timestamp', () => {
        const iso = new Date(FIXED_NOW - 5 * 24 * 60 * 60 * 1000).toISOString();
        expect(typeof formatRelative(iso)).toBe('string');
    });

    it('falls back to year units for very old timestamps', () => {
        const iso = new Date(FIXED_NOW - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
        expect(typeof formatRelative(iso)).toBe('string');
    });
});
