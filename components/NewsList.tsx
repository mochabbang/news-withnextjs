import { Article } from '@/types/Article';
import NewsItem from './NewsItem';
import NewsItemSkeleton from './NewsItemSkeleton';

interface Props {
    articles: Article[];
    loading?: boolean;
}

export default function NewsList({ articles, loading = false }: Props) {
    if (loading) {
        return (
            <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <NewsItemSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-base">표시할 뉴스가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {articles.map((article) => (
                <NewsItem key={article.url} {...article} />
            ))}
        </div>
    );
}
