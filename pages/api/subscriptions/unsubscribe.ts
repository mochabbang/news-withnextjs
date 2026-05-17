import type { NextApiRequest, NextApiResponse } from 'next';
import { unsubscribeByToken } from '@/apis/notifications/subscriptions';

type UnsubscribeResponse = {
    ok: boolean;
    message?: string;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<UnsubscribeResponse>,
) {
    const token = typeof req.query.token === 'string'
        ? req.query.token
        : typeof req.body?.token === 'string'
          ? req.body.token
          : '';

    if (!token) {
        res.status(400).json({ ok: false, error: 'token is required' });
        return;
    }

    try {
        const updated = await unsubscribeByToken(token);
        if (!updated) {
            res.status(404).json({ ok: false, error: 'Subscription not found' });
            return;
        }
        res.status(200).json({ ok: true, message: '구독이 해지되었습니다.' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to unsubscribe';
        res.status(500).json({ ok: false, error: message });
    }
}
