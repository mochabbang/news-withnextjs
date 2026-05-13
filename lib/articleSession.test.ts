/**
 * @jest-environment jsdom
 */
import {
    loadArticleSnapshot,
    saveArticleSnapshot,
    type ArticleSnapshot,
} from './articleSession';

function makeSnapshot(overrides: Partial<ArticleSnapshot> = {}): ArticleSnapshot {
    return {
        url: 'https://example.com/article',
        title: '제목',
        description: '설명',
        urlToImage: 'https://example.com/img.png',
        publishedAt: '2026-04-29T00:00:00Z',
        author: '작성자',
        sourceName: 'Example',
        sourceLanguage: 'ko',
        ...overrides,
    };
}

beforeEach(() => {
    sessionStorage.clear();
});

describe('saveArticleSnapshot / loadArticleSnapshot', () => {
    it('round-trips a snapshot keyed by id', () => {
        const snap = makeSnapshot();
        saveArticleSnapshot('id-1', snap);
        expect(loadArticleSnapshot('id-1')).toEqual(snap);
    });

    it('returns null for missing id', () => {
        expect(loadArticleSnapshot('absent')).toBeNull();
    });

    it('returns null when stored value is malformed JSON', () => {
        sessionStorage.setItem('article:bad', 'not-json');
        expect(loadArticleSnapshot('bad')).toBeNull();
    });

    it('returns null when stored object is missing required fields', () => {
        sessionStorage.setItem('article:bad', JSON.stringify({ url: 'https://x' }));
        expect(loadArticleSnapshot('bad')).toBeNull();
    });

    it('stores under a namespaced key to avoid collisions', () => {
        saveArticleSnapshot('abc', makeSnapshot());
        expect(sessionStorage.getItem('article:abc')).not.toBeNull();
        expect(sessionStorage.getItem('abc')).toBeNull();
    });
});
