import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Article } from '@/types/Article';
import { NewsTopHeadLine } from '@/types/NewsTopHeadLine';
import { getNews } from '@/apis/NewsApis';
import Categories from '@/components/Categories';
import CountrySelector from '@/components/CountrySelector';
import NewsList from '@/components/NewsList';
import Seo from '@/components/Seo';
import { articlesToTopHeadline, getTopArticles } from '@/apis/newsService';

const PAGE_SIZE = 15;

function mergeArticles(current: Article[], next: Article[]) {
    const seen = new Set(current.map((article) => article.url));
    return [
        ...current,
        ...next.filter((article) => {
            if (seen.has(article.url)) return false;
            seen.add(article.url);
            return true;
        }),
    ];
}

export default function Home({
    newsTopHeadLines,
}: InferGetStaticPropsType<typeof getStaticProps>) {
    const [category, setCategory] = useState('all');
    const [country, setCountry] = useState('kr');
    const [articles, setArticles] = useState<Article[]>(
        newsTopHeadLines.articles ?? [],
    );
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(
        (newsTopHeadLines.articles ?? []).length === PAGE_SIZE,
    );
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const loadFirstPage = useCallback(async (cat: string, selectedCountry: string) => {
        setLoading(true);
        setError(null);
        setPage(1);
        setHasMore(false);

        const result = await getNews(cat, selectedCountry, 1, PAGE_SIZE);
        setLoading(false);

        if (!result.ok) {
            setError(result.error);
            setArticles([]);
            return;
        }

        setArticles(result.data.articles);
        setHasMore(result.data.hasMore);
    }, []);

    const onSelectCategory = useCallback(
        async (cat: string) => {
            if (cat === category) return;
            setCategory(cat);
            await loadFirstPage(cat, country);
        },
        [category, country, loadFirstPage],
    );

    const onSelectCountry = useCallback(
        async (selectedCountry: string) => {
            if (selectedCountry === country) return;
            setCountry(selectedCountry);
            await loadFirstPage(category, selectedCountry);
        },
        [category, country, loadFirstPage],
    );

    const loadNextPage = useCallback(async () => {
        if (loading || loadingMore || !hasMore) return;

        const nextPage = page + 1;
        setLoadingMore(true);
        setError(null);

        const result = await getNews(category, country, nextPage, PAGE_SIZE);
        setLoadingMore(false);

        if (!result.ok) {
            setError(result.error);
            return;
        }

        setArticles((current) => mergeArticles(current, result.data.articles));
        setPage(nextPage);
        setHasMore(result.data.hasMore && result.data.articles.length > 0);
    }, [category, country, hasMore, loading, loadingMore, page]);

    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target || !hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    void loadNextPage();
                }
            },
            { rootMargin: '300px 0px' },
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [hasMore, loadNextPage]);

    return (
        <>
            <Seo />
            <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Categories
                    category={category}
                    onSelectCategory={onSelectCategory}
                />
                <CountrySelector
                    country={country}
                    onSelectCountry={onSelectCountry}
                    disabled={loading}
                />
            </div>
            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive mb-3">
                    {error}
                </div>
            )}
            <NewsList articles={articles} loading={loading} country={country} />
            {!loading && hasMore && (
                <div ref={loadMoreRef} className="py-4 text-center text-sm text-muted-foreground">
                    {loadingMore ? '뉴스를 더 불러오는 중입니다...' : '스크롤하면 뉴스를 더 불러옵니다.'}
                </div>
            )}
        </>
    );
}

export const getStaticProps: GetStaticProps<{
    newsTopHeadLines: NewsTopHeadLine;
}> = async () => {
    try {
        const articles = await getTopArticles({
            category: 'all',
            country: 'kr',
            page: 1,
            pageSize: PAGE_SIZE,
        });

        return {
            props: { newsTopHeadLines: articlesToTopHeadline(articles) },
            revalidate: 600,
        };
    } catch {
        return {
            props: {
                newsTopHeadLines: {
                    status: 'ok',
                    totalResults: 0,
                    articles: [],
                },
            },
            revalidate: 60,
        };
    }
};
