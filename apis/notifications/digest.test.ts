import { formatDigestText, formatDigestHtml, DigestArticle } from './digest';
import { NewsletterSubscription } from './subscriptions';

const subscription = {
    id: 'sub-1',
    user_id: 'user-1',
    email: 'test@example.com',
    channel: 'email',
    destination: 'test@example.com',
    country: 'kr',
    category: 'all',
    active: true,
    consented_at: '2026-05-17T00:00:00.000Z',
    email_verified_at: '2026-05-17T00:01:00.000Z',
    unsubscribed_at: null,
    unsubscribe_token: '00000000-0000-0000-0000-000000000000',
    created_at: '2026-05-17T00:00:00.000Z',
    updated_at: '2026-05-17T00:00:00.000Z',
} as NewsletterSubscription;

const article = {
    author: null,
    title: '테스트 뉴스',
    description: '테스트 설명',
    url: 'https://example.com/news',
    urlToImage: null,
    publishedAt: '2026-05-17T00:00:00.000Z',
    content: null,
    source: { id: null, name: '테스트신문' },
    summary: '핵심 요약입니다.',
} as DigestArticle;

describe('digest formatting', () => {
    it('formats text digest with unsubscribe link', () => {
        const text = formatDigestText([article], subscription);

        expect(text).toContain('실시간 Top 5 뉴스');
        expect(text).toContain('[테스트신문] 테스트 뉴스');
        expect(text).toContain('핵심 요약입니다.');
        expect(text).toContain('/api/subscriptions/unsubscribe?token=00000000-0000-0000-0000-000000000000');
    });

    it('escapes html digest content', () => {
        const html = formatDigestHtml([{ ...article, title: '<script>alert(1)</script>' }], subscription);

        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).not.toContain('<script>alert(1)</script>');
    });
});
