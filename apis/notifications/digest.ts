import { Article } from '@/types/Article';
import { getTopArticles } from '@/apis/newsService';
import { summarizeArticle } from '@/apis/summarize';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { NewsletterSubscription } from './subscriptions';

export type DigestArticle = Article & { summary: string };

const DEFAULT_DIGEST_LIMIT = 5;
const CANDIDATE_POOL_SIZE = 20;
const SENT_WINDOW_HOURS = 24;

function getSiteUrl(): string {
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
}

export async function getActiveEmailSubscriptions(): Promise<NewsletterSubscription[]> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('active', true)
        .eq('channel', 'email');

    if (error) throw new Error(error.message);
    return (data ?? []) as NewsletterSubscription[];
}

async function getRecentlySentUrls(subscriptionId: string): Promise<Set<string>> {
    const since = new Date(Date.now() - SENT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('sent_articles')
        .select('article_url')
        .eq('subscription_id', subscriptionId)
        .gte('sent_at', since);

    if (error) throw new Error(error.message);
    return new Set((data ?? []).map((item: { article_url: string }) => item.article_url));
}

async function summarizeWithCache(article: Article): Promise<string> {
    const supabase = getSupabaseAdmin();
    const { data: cached, error: cacheError } = await supabase
        .from('digest_summaries')
        .select('summary')
        .eq('article_url', article.url)
        .maybeSingle();

    if (cacheError) throw new Error(cacheError.message);
    if (cached?.summary) return cached.summary as string;

    let summary: string;
    try {
        summary = await summarizeArticle({
            title: article.title,
            description: article.description,
            language: 'ko',
        });
    } catch {
        summary = article.description?.trim() || article.title;
    }

    const { error } = await supabase
        .from('digest_summaries')
        .upsert({
            article_url: article.url,
            title: article.title,
            description: article.description,
            summary,
        }, { onConflict: 'article_url' });

    if (error) throw new Error(error.message);
    return summary;
}

export async function getUnsentDigestForSubscription(
    subscription: NewsletterSubscription,
    limit = DEFAULT_DIGEST_LIMIT,
): Promise<DigestArticle[]> {
    const articles = await getTopArticles({
        category: subscription.category,
        country: subscription.country,
        page: 1,
        pageSize: CANDIDATE_POOL_SIZE,
    });
    const sentUrls = await getRecentlySentUrls(subscription.id);
    const unsentArticles = articles.filter((article) => !sentUrls.has(article.url)).slice(0, limit);

    return Promise.all(
        unsentArticles.map(async (article) => ({
            ...article,
            summary: await summarizeWithCache(article),
        })),
    );
}

export function formatDigestText(articles: DigestArticle[], subscription: NewsletterSubscription): string {
    const timestamp = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date());

    const lines = [
        '📰 실시간 Top 5 뉴스',
        '',
        ...articles.flatMap((article, index) => [
            `${index + 1}. [${article.source.name}] ${article.title}`,
            `요약: ${article.summary}`,
            article.url,
            '',
        ]),
        `발송 기준: ${timestamp}`,
        '',
        `구독 해지: ${getSiteUrl()}/api/subscriptions/unsubscribe?token=${subscription.unsubscribe_token}`,
    ];

    return lines.join('\n');
}

export function formatDigestHtml(articles: DigestArticle[], subscription: NewsletterSubscription): string {
    const escape = (value: string) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const items = articles.map((article, index) => `
        <li>
            <strong>${index + 1}. [${escape(article.source.name)}] ${escape(article.title)}</strong><br />
            요약: ${escape(article.summary)}<br />
            <a href="${escape(article.url)}">기사 보기</a>
        </li>
    `).join('');

    return `
        <h1>실시간 Top 5 뉴스</h1>
        <ol>${items}</ol>
        <p><a href="${getSiteUrl()}/api/subscriptions/unsubscribe?token=${subscription.unsubscribe_token}">구독 해지</a></p>
    `;
}

export async function markArticlesAsSent(subscriptionId: string, articles: DigestArticle[]): Promise<void> {
    if (articles.length === 0) return;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('sent_articles')
        .upsert(
            articles.map((article) => ({
                subscription_id: subscriptionId,
                article_url: article.url,
                sent_at: new Date().toISOString(),
            })),
            { onConflict: 'subscription_id,article_url' },
        );

    if (error) throw new Error(error.message);
}
