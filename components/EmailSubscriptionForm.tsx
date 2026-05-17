import { FormEvent, useState } from 'react';

type EmailSubscriptionFormProps = {
    category: string;
    country: string;
};

export default function EmailSubscriptionForm({ category, country }: EmailSubscriptionFormProps) {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch('/api/subscriptions/email/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, category, country }),
            });
            const body = await response.json();
            if (!response.ok || !body.ok) throw new Error(body.error ?? '구독 요청에 실패했습니다.');
            setMessage(body.message ?? '인증 메일을 보냈습니다.');
            setEmail('');
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : '구독 요청에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="mb-4 rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-3">
                <h2 className="text-lg font-semibold">이메일로 Top 5 뉴스 받기</h2>
                <p className="text-sm text-muted-foreground">
                    현재 선택한 국가/카테고리 기준으로 2시간마다 최신 뉴스 요약을 보내드립니다. 이메일 인증 후 구독이 활성화됩니다.
                </p>
            </div>
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onSubmit}>
                <input
                    aria-label="이메일 주소"
                    className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    disabled={submitting}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@example.com"
                    required
                    type="email"
                    value={email}
                />
                <button
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                    disabled={submitting}
                    type="submit"
                >
                    {submitting ? '보내는 중...' : '인증 메일 받기'}
                </button>
            </form>
            {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <p className="mt-2 text-xs text-muted-foreground">
                구독 신청 시 뉴스 알림 수신에 동의한 것으로 처리되며, 모든 메일 하단의 링크로 언제든 해지할 수 있습니다.
            </p>
        </section>
    );
}
