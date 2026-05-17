import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabasePublic } from '@/lib/supabase/public';
import { upsertPendingEmailSubscription } from '@/apis/notifications/subscriptions';

type SubscribeResponse = {
    ok: boolean;
    message?: string;
    error?: string;
};

function getSiteUrl(req: NextApiRequest): string {
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    const protocol = req.headers['x-forwarded-proto'] ?? 'http';
    return `${protocol}://${req.headers.host}`;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SubscribeResponse>,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ ok: false, error: 'Method not allowed' });
        return;
    }

    const { email, country = 'kr', category = 'all' } = req.body ?? {};
    if (typeof email !== 'string') {
        res.status(400).json({ ok: false, error: 'email is required' });
        return;
    }

    try {
        const subscription = await upsertPendingEmailSubscription({
            email,
            country: typeof country === 'string' ? country : 'kr',
            category: typeof category === 'string' ? category : 'all',
        });

        const siteUrl = getSiteUrl(req);
        const confirmUrl = `${siteUrl}/subscriptions/confirmed`;
        const { error } = await getSupabasePublic().auth.signInWithOtp({
            email: subscription.email,
            options: {
                emailRedirectTo: confirmUrl,
                shouldCreateUser: true,
            },
        });

        if (error) throw new Error(error.message);

        res.status(200).json({
            ok: true,
            message: '인증 메일을 보냈습니다. 이메일의 링크를 눌러 구독을 완료해 주세요.',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to subscribe';
        res.status(500).json({ ok: false, error: message });
    }
}
