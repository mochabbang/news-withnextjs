import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
    formatDigestHtml,
    formatDigestText,
    getActiveEmailSubscriptions,
    getUnsentDigestForSubscription,
    markArticlesAsSent,
} from '@/apis/notifications/digest';
import { sendEmail } from '@/apis/messaging/email';

type CronResponse = {
    ok: boolean;
    runId?: string;
    totalSubscribers?: number;
    sent?: number;
    skipped?: number;
    failed?: number;
    error?: string;
};

function isAuthorized(req: NextApiRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    return req.headers.authorization === `Bearer ${secret}` || req.query.secret === secret;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<CronResponse>,
) {
    if (!isAuthorized(req)) {
        res.status(401).json({ ok: false, error: 'Unauthorized' });
        return;
    }

    const supabase = getSupabaseAdmin();
    const { data: run, error: runError } = await supabase
        .from('notification_runs')
        .insert({ status: 'running' })
        .select('id')
        .single();

    if (runError || !run) {
        res.status(500).json({ ok: false, error: runError?.message ?? 'Failed to create run' });
        return;
    }

    const runId = run.id as string;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    try {
        const subscriptions = await getActiveEmailSubscriptions();

        for (const subscription of subscriptions) {
            try {
                const articles = await getUnsentDigestForSubscription(subscription);
                if (articles.length === 0) {
                    skipped += 1;
                    await supabase.from('notification_deliveries').insert({
                        run_id: runId,
                        subscription_id: subscription.id,
                        channel: 'email',
                        status: 'skipped',
                        error: 'No new articles to send',
                    });
                    continue;
                }

                const result = await sendEmail({
                    to: subscription.email,
                    subject: '📰 실시간 Top 5 뉴스 요약',
                    text: formatDigestText(articles, subscription),
                    html: formatDigestHtml(articles, subscription),
                });

                if (!result.ok) throw new Error(result.error ?? 'Failed to send email');

                await markArticlesAsSent(subscription.id, articles);
                sent += 1;

                await supabase.from('notification_deliveries').insert(
                    articles.map((article) => ({
                        run_id: runId,
                        subscription_id: subscription.id,
                        channel: 'email',
                        article_url: article.url,
                        status: 'success',
                    })),
                );
            } catch (error) {
                failed += 1;
                await supabase.from('notification_deliveries').insert({
                    run_id: runId,
                    subscription_id: subscription.id,
                    channel: 'email',
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown delivery error',
                });
            }
        }

        const status = failed === 0 ? 'success' : sent > 0 || skipped > 0 ? 'partial_failure' : 'failed';
        await supabase
            .from('notification_runs')
            .update({ status, finished_at: new Date().toISOString() })
            .eq('id', runId);

        res.status(200).json({
            ok: failed === 0,
            runId,
            totalSubscribers: subscriptions.length,
            sent,
            skipped,
            failed,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Cron failed';
        await supabase
            .from('notification_runs')
            .update({ status: 'failed', finished_at: new Date().toISOString(), error: message })
            .eq('id', runId);
        res.status(500).json({ ok: false, runId, sent, skipped, failed, error: message });
    }
}
