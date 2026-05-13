import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ArticleView, { ArticleViewData } from '@/components/ArticleView';
import Seo from '@/components/Seo';
import { decodeArticleId } from '@/lib/articleId';
import { loadArticleSnapshot } from '@/lib/articleSession';

type ApiResponse = {
    summary: string | null;
    displayTitle: string;
    displayDescription: string | null;
    originalTitle: string;
    originalDescription: string | null;
    translated: boolean;
};

export default function ArticlePage() {
    const router = useRouter();
    const id = typeof router.query.id === 'string' ? router.query.id : '';
    const url = id ? decodeArticleId(id) : null;

    const [data, setData] = useState<ArticleViewData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!router.isReady || !id) return;

        if (!url) {
            setError('잘못된 기사 링크입니다.');
            return;
        }

        const snap = loadArticleSnapshot(id);

        if (!snap) {
            setData({
                url,
                sourceName: '',
                publishedAt: new Date().toISOString(),
                author: null,
                imageUrl: null,
                displayTitle: '',
                displayDescription: null,
                originalTitle: '',
                originalDescription: null,
                translated: false,
                summary: null,
                loading: false,
            });
            return;
        }

        const initial: ArticleViewData = {
            url: snap.url,
            sourceName: snap.sourceName,
            publishedAt: snap.publishedAt,
            author: snap.author,
            imageUrl: snap.urlToImage,
            displayTitle: snap.title,
            displayDescription: snap.description,
            originalTitle: snap.title,
            originalDescription: snap.description,
            translated: false,
            summary: null,
            loading: true,
        };
        setData(initial);

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch('/api/article', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: snap.title,
                        description: snap.description,
                        url: snap.url,
                        sourceLanguage: snap.sourceLanguage,
                    }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = (await res.json()) as ApiResponse;
                if (cancelled) return;

                setData({
                    ...initial,
                    displayTitle: json.displayTitle,
                    displayDescription: json.displayDescription,
                    originalTitle: json.originalTitle,
                    originalDescription: json.originalDescription,
                    translated: json.translated,
                    summary: json.summary,
                    loading: false,
                });
            } catch {
                if (cancelled) return;
                setData({ ...initial, loading: false });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [router.isReady, id, url]);

    if (error) {
        return (
            <div className="flex flex-col gap-4 py-6">
                <p className="text-sm text-destructive">{error}</p>
                <Link href="/" className="text-sm text-primary underline">
                    뉴스 목록으로 돌아가기
                </Link>
            </div>
        );
    }

    if (!data) {
        return <p className="py-6 text-sm text-muted-foreground">기사를 불러오는 중…</p>;
    }

    return (
        <>
            <Seo title={data.displayTitle || '기사 보기'} />
            <div className="flex flex-col gap-4 py-4">
                <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← 목록으로
                </Link>
                <ArticleView data={data} />
            </div>
        </>
    );
}
