import Link from 'next/link';
import { Article } from '@/types/Article';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NewsImage from './NewsImage';
import NewsSummary from './NewsSummary';
import RelativeTime from './RelativeTime';
import { encodeArticleId } from '@/lib/articleId';
import { saveArticleSnapshot } from '@/lib/articleSession';
import { getCountryLanguage } from '@/apis/countries';

type Props = Article & {
    country?: string;
};

export default function NewsItem(props: Props) {
    const {
        title,
        description,
        url,
        urlToImage,
        publishedAt,
        source,
        author,
        originalTitle,
        translated,
        country,
    } = props;

    const id = encodeArticleId(url);
    const href = `/articles/${id}`;

    const handleNavigate = () => {
        saveArticleSnapshot(id, {
            url,
            title,
            description: description ?? null,
            urlToImage: urlToImage ?? null,
            publishedAt,
            author: author ?? null,
            sourceName: source?.name ?? '',
            sourceLanguage: getCountryLanguage(country ?? 'kr'),
        });
    };

    return (
        <Card className="flex overflow-hidden hover:shadow-md transition-shadow">
            <Link
                href={href}
                onClick={handleNavigate}
                aria-label={`기사 읽기: ${title}`}
                className="relative h-[72px] w-32 shrink-0 overflow-hidden bg-muted sm:h-[90px] sm:w-40"
            >
                <NewsImage src={urlToImage} alt={title} />
            </Link>
            <CardContent className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                    <Link
                        href={href}
                        onClick={handleNavigate}
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
