import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabasePublic } from '@/lib/supabase/public';
import { activateEmailSubscription } from '@/apis/notifications/subscriptions';

function redirect(res: NextApiResponse, path: string) {
    res.writeHead(302, { Location: path });
    res.end();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const next = typeof req.query.next === 'string' ? req.query.next : '/?subscription=confirmed';

    if (!code) {
        redirect(res, '/?subscription=invalid');
        return;
    }

    try {
        const { data, error } = await getSupabasePublic().auth.exchangeCodeForSession(code);
        if (error) throw new Error(error.message);
        const user = data.user;
        const email = user?.email;
        if (!user || !email) throw new Error('Email verification did not return a user');

        await activateEmailSubscription({ email, userId: user.id });
        redirect(res, next);
    } catch {
        redirect(res, '/?subscription=failed');
    }
}
