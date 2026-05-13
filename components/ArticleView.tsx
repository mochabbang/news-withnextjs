import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import NewsImage from './NewsImage';
import RelativeTime from './RelativeTime';

export type ArticleViewData = {
    url: string;
    sourceName: string;
    publishedAt: string;
    author: string | null;
    imageUrl: string | null;
    displayTitle: string;
    displayDescription: string | null;
    originalTitle: string;
    originalDescription: string | null;
    translated: boolean;
    summary: string | null;
    loading: boolean;
};

interface Props {
    data: ArticleViewData;
}

export default function ArticleView({ data }: Props) {
    const {
        url,
        sourceName,
        publishedAt,
        author,
        imageUrl,
        displayTitle,
        displayDescription,
        originalTitle,
        translated,
        summary,
        loading,
    } = data;

    const fallbackOnly = !displayTitle;
    const showOriginalTitle = translated && originalTitle && originalTitle !== displayTitle;

    return (
        <article className="flex flex-col gap-4">
            {imageUrl && (
                <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                    <NewsImage src={imageUrl} alt={displayTitle || '뉴스 이미지'} />
                </div>
            )}

            {!fallbackOnly && (
                <header className="flex flex-col gap-2">
                    <h1 className="text-xl font-bold leading-snug text-foreground">
                        {displayTitle}
                    </h1>
                    {showOriginalTitle && (
                        <p className="text-sm text-muted-foreground/80">{originalTitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {sourceName && (
                            <Badge variant="secondary" className="text-xs">
                                {sourceName}
                            </Badge>
                        )}
                        <RelativeTime iso={publishedAt} />
                        {author && <span>· {author}</span>}
                    </div>
                </header>
            )}

            <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <span>AI 요약</span>
                    </div>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">
                            요약을 불러오는 중…
                        </p>
                    ) : summary ? (
                        <p className="text-sm leading-relaxed text-foreground">{summary}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            요약을 생성하지 못했습니다.
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground/70">
                        이 요약은 AI가 제목·발췌만 보고 생성한 것이며 원문을 대체하지 않습니다.
                    </p>
                </CardContent>
            </Card>

            {displayDescription && (
                <section className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-foreground">원문 발췌</h2>
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {displayDescription}
                    </p>
                </section>
            )}

            <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                원문 보기 →
            </Link>

            <p className="text-xs text-muted-foreground/70 leading-relaxed border-t border-border pt-3">
                ⓘ 원문 저작권은 {sourceName || '해당 매체'}에 있으며, 본 페이지는 메타데이터·AI 요약·원문 발췌만 표시합니다. 원문 전체는 매체 사이트에서 확인해 주세요.
            </p>
        </article>
    );
}
