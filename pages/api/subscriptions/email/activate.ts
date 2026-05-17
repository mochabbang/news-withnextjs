import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabasePublic } from '@/lib/supabase/public';
import { activateEmailSubscription } from '@/apis/notifications/subscriptions';

type ActivateResponse = {
    ok: boolean;
    message?: string;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ActivateResponse>,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ ok: false, error: 'Method not allowed' });
        return;
    }

    const accessToken = typeof req.body?.accessToken === 'string' ? req.body.accessToken : '';
    if (!accessToken) {
        res.status(400).json({ ok: false, error: 'accessToken is required' });
        return;
    }

    try {
        const { data, error } = await getSupabasePublic().auth.getUser(accessToken);
        if (error) throw new Error(error.message);
        const user = data.user;
        if (!user?.email) throw new Error('Verified email user not found');

        await activateEmailSubscription({ email: user.email, userId: user.id });
        res.status(200).json({ ok: true, message: '이메일 구독 인증이 완료되었습니다.' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to activate subscription';
        res.status(500).json({ ok: false, error: message });
    }
}
