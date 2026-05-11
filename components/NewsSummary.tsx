import { useEffect, useRef, useState } from 'react';

type Props = {
    title: string;
    description: string | null;
};

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function NewsSummary({ title, description }: Props) {
    const [status, setStatus] = useState<Status>('idle');
    const [summary, setSummary] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let cancelled = false;

        const fetchSummary = async () => {
            setStatus('loading');
            try {
                const r = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description }),
                });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const json = (await r.json()) as { summary?: string };
                if (cancelled) return;
                if (!json.summary) throw new Error('empty summary');
                setSummary(json.summary);
                setStatus('done');
            } catch {
                if (!cancelled) setStatus('error');
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        observer.disconnect();
                        void fetchSummary();
                        return;
                    }
                }
            },
            { rootMargin: '100px' },
        );
        observer.observe(el);

        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [title, description]);

    if (status === 'error') return null;

    return (
        <div
            ref={ref}
            className="text-xs text-foreground/80 mt-1 leading-relaxed border-l-2 border-primary/40 pl-2"
        >
            {status === 'done' ? (
                <span>AI 요약: {summary}</span>
            ) : (
                <span className="opacity-60">AI 요약 생성 중…</span>
            )}
        </div>
    );
}
