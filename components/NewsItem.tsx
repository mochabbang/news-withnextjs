import Link from 'next/link';
import { Article } from '@/types/Article';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NewsImage from './NewsImage';
import NewsSummary from './NewsSummary';
import RelativeTime from './RelativeTime';

export default function NewsItem(article: Article) {
    const {
        title,
        description,
        url,
        urlToImage,
        publishedAt,
        source,
        originalTitle,
        translated,
    } = article;

    return (
        <Card className="flex overflow-hidden hover:shadow-md transition-shadow">
            <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`기사 읽기: ${title}`}
                className="relative w-32 sm:w-40 shrink-0 aspect-video"
            >
                <NewsImage src={urlToImage} alt={title} />
            </Link>
            <CardContent className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                    <Link
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                            {title}
                        </h3>
                    </Link>
                    {description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {description}
                        </p>
                    )}
                    {translated && originalTitle && originalTitle !== title && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-1 mt-1">
                            {originalTitle}
                        </p>
                    )}
                    <NewsSummary title={title} description={description} />
                </div>
                <div className="flex items-center justify-between mt-2 gap-2">
                    {source?.name && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                            {source.name}
                        </Badge>
                    )}
                    <RelativeTime
                        iso={publishedAt}
                        className="text-xs text-muted-foreground ml-auto"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
