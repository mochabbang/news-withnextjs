import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabasePublic } from '@/lib/supabase/public';

export default function SubscriptionConfirmedPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('이메일 인증을 확인하는 중입니다.');

    useEffect(() => {
        let mounted = true;

        async function activate() {
            try {
                const supabase = getSupabasePublic();
                const { data, error } = await supabase.auth.getSession();
                if (error) throw new Error(error.message);
                const accessToken = data.session?.access_token;
                if (!accessToken) {
                    throw new Error('인증 세션을 찾을 수 없습니다. 인증 링크를 다시 열어 주세요.');
                }

                const response = await fetch('/api/subscriptions/email/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken }),
                });
                const body = await response.json();
                if (!response.ok || !body.ok) {
                    throw new Error(body.error ?? '구독 활성화에 실패했습니다.');
                }

                if (mounted) {
                    setStatus('success');
                    setMessage('이메일 구독 인증이 완료되었습니다. 이제 Top 뉴스 요약을 받을 수 있습니다.');
                }
            } catch (error) {
                if (mounted) {
                    setStatus('error');
                    setMessage(error instanceof Error ? error.message : '구독 인증에 실패했습니다.');
                }
            }
        }

        activate();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
            <h1 className="mb-4 text-2xl font-bold">
                {status === 'success' ? '구독 인증 완료' : status === 'error' ? '구독 인증 실패' : '구독 인증 중'}
            </h1>
            <p className="mb-6 text-muted-foreground">{message}</p>
            <Link className="rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/">
                뉴스로 돌아가기
            </Link>
        </main>
    );
}
