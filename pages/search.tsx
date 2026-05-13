import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Link from 'next/link';
import { Article } from '@/types/Article';
import NewsList from '@/components/NewsList';
import Seo from '@/components/Seo';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { NEWS_COUNTRIES, normalizeNewsCountry } from '@/apis/countries';
import { searchArticles } from '@/apis/newsService';

export default function SearchPage({
    articles,
    query,
    country,
    error,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const countryLabel =
        NEWS_COUNTRIES.find((c) => c.code === country)?.label ?? '한국';

    return (
        <>
            <Seo title={`"${query}" 검색 결과`} />
            <div className="flex items-center gap-3 py-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/" aria-label="홈으로">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <SearchBar country={country} className="flex-1 max-w-sm" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
                <strong>&ldquo;{query}&rdquo;</strong> {countryLabel} 검색 결과{' '}
                {articles.length}건
            </p>
            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive mb-3">
                    {error}
                </div>
            )}
            <NewsList articles={articles} country={country} />
        </>
    );
}

export const getServerSideProps: GetServerSideProps<{
    articles: Article[];
    query: string;
    country: string;
    error?: string;
}> = async ({ query: qs }) => {
    const q = typeof qs.q === 'string' ? qs.q.trim() : '';
    const country = normalizeNewsCountry(qs.country);

    if (!q) {
        return {
            props: {
                articles: [],
                query: '',
                country,
                error: '검색어를 입력해주세요.',
            },
        };
    }

    try {
        const articles = await searchArticles({
            query: q,
            country,
            translate: country !== 'kr',
        });

        return { props: { articles, query: q, country } };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.';

        return {
            props: {
                articles: [],
                query: q,
                country,
                error: message,
            },
        };
    }
};
